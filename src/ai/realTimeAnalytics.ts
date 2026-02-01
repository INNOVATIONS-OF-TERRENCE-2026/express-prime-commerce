/**
 * Real-Time Analytics Engine with Live Supabase Subscriptions
 * 
 * Live dashboard metrics with real-time updates using
 * Supabase Realtime subscriptions and presence.
 * 
 * FEATURES:
 * - Live visitor tracking
 * - Real-time sales notifications
 * - Live inventory alerts
 * - Active cart monitoring
 * - Conversion funnel tracking
 * 
 * @module ai/realTimeAnalytics
 * @version 1.0.0
 */

import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// ============================================================================
// TYPES
// ============================================================================

export type EventType = 
  | 'page_view'
  | 'product_view'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'checkout_start'
  | 'checkout_complete'
  | 'order_placed'
  | 'order_fulfilled'
  | 'inventory_low'
  | 'inventory_out'
  | 'customer_signup'
  | 'customer_login';

export type MetricPeriod = '1h' | '24h' | '7d' | '30d' | 'all';

export interface LiveVisitor {
  id: string;
  sessionId: string;
  userId?: string;
  email?: string;
  // Location
  page: string;
  referrer?: string;
  country?: string;
  city?: string;
  // Device
  device: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
  // Timing
  enteredAt: Date;
  lastActivityAt: Date;
  pagesViewed: number;
  // Cart
  cartValue: number;
  cartItems: number;
  // Status
  isActive: boolean;
  hasAccount: boolean;
}

export interface RealTimeEvent {
  id: string;
  type: EventType;
  timestamp: Date;
  // Context
  sessionId: string;
  userId?: string;
  // Data
  data: Record<string, unknown>;
  // Metadata
  page?: string;
  productId?: string;
  orderId?: string;
  value?: number;
}

export interface LiveMetrics {
  // Visitors
  activeVisitors: number;
  totalVisitorsToday: number;
  newVisitorsToday: number;
  returningVisitorsToday: number;
  // Traffic
  pageViewsPerMinute: number;
  bounceRate: number;
  avgSessionDuration: number; // seconds
  // Sales
  ordersToday: number;
  revenueToday: number;
  avgOrderValue: number;
  conversionRate: number;
  // Carts
  activeCarts: number;
  activeCartValue: number;
  cartAbandonmentRate: number;
  // Funnel
  funnelMetrics: FunnelMetrics;
  // Trends
  visitorTrend: 'up' | 'down' | 'stable';
  revenueTrend: 'up' | 'down' | 'stable';
  // Top items
  topProducts: Array<{ productId: string; title: string; views: number; sales: number }>;
  topPages: Array<{ page: string; views: number }>;
  topReferrers: Array<{ source: string; visitors: number }>;
}

export interface FunnelMetrics {
  productViews: number;
  addToCarts: number;
  checkoutStarts: number;
  checkoutCompletes: number;
  // Conversion rates
  viewToCart: number;
  cartToCheckout: number;
  checkoutToComplete: number;
  overallConversion: number;
}

export interface RealtimeAlert {
  id: string;
  type: 'sale' | 'low_stock' | 'out_of_stock' | 'high_traffic' | 'abandoned_cart' | 'vip_activity';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  data?: Record<string, unknown>;
  dismissed: boolean;
}

export interface AnalyticsSubscription {
  channel: RealtimeChannel | null;
  unsubscribe: () => void;
}

type EventCallback = (event: RealTimeEvent) => void;
type MetricsCallback = (metrics: LiveMetrics) => void;
type AlertCallback = (alert: RealtimeAlert) => void;
type VisitorCallback = (visitors: LiveVisitor[]) => void;

// ============================================================================
// STATE
// ============================================================================

let mainChannel: RealtimeChannel | null = null;
const liveVisitors: Map<string, LiveVisitor> = new Map();
const recentEvents: RealTimeEvent[] = [];
const activeAlerts: Map<string, RealtimeAlert> = new Map();

// Callbacks
const eventCallbacks: Set<EventCallback> = new Set();
const metricsCallbacks: Set<MetricsCallback> = new Set();
const alertCallbacks: Set<AlertCallback> = new Set();
const visitorCallbacks: Set<VisitorCallback> = new Set();

// Metrics aggregation
let metricsCache: LiveMetrics | null = null;
let lastMetricsUpdate = 0;
const METRICS_UPDATE_INTERVAL = 5000; // 5 seconds

// Daily counters (reset at midnight)
let dailyCounters = {
  date: new Date().toDateString(),
  totalVisitors: 0,
  newVisitors: 0,
  returningVisitors: 0,
  orders: 0,
  revenue: 0,
  productViews: 0,
  addToCarts: 0,
  checkoutStarts: 0,
  checkoutCompletes: 0,
};

// ============================================================================
// REALTIME SUBSCRIPTIONS
// ============================================================================

/**
 * Initialize real-time analytics
 */
export function initializeRealTimeAnalytics(): AnalyticsSubscription {
  // Create main analytics channel
  mainChannel = supabase.channel('analytics_realtime', {
    config: {
      presence: { key: 'analytics' },
      broadcast: { self: true },
    },
  });

  // Subscribe to orders table changes
  mainChannel
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'orders' },
      (payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>) => {
        handleOrderCreated(payload.new as Record<string, unknown>);
      }
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'orders' },
      (payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>) => {
        handleOrderUpdated(payload.new as Record<string, unknown>);
      }
    )
    // Subscribe to inventory changes
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'inventory' },
      (payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>) => {
        handleInventoryChanged(payload.new as Record<string, unknown>);
      }
    )
    // Track presence for active admins
    .on('presence', { event: 'sync' }, () => {
      // Presence synced
    })
    // Handle broadcast events
    .on('broadcast', { event: 'analytics_event' }, ({ payload }) => {
      handleAnalyticsEvent(payload as RealTimeEvent);
    })
    .subscribe();

  // Start metrics refresh interval
  const metricsInterval = setInterval(() => {
    refreshMetrics();
  }, METRICS_UPDATE_INTERVAL);

  // Clean up stale visitors every minute
  const cleanupInterval = setInterval(() => {
    cleanupStaleVisitors();
  }, 60000);

  return {
    channel: mainChannel,
    unsubscribe: () => {
      clearInterval(metricsInterval);
      clearInterval(cleanupInterval);
      if (mainChannel) {
        supabase.removeChannel(mainChannel);
        mainChannel = null;
      }
    },
  };
}

/**
 * Track a page view event
 */
export async function trackPageView(
  sessionId: string,
  page: string,
  userId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const event: RealTimeEvent = {
    id: generateEventId(),
    type: 'page_view',
    timestamp: new Date(),
    sessionId,
    userId,
    page,
    data: metadata || {},
  };

  await broadcastEvent(event);
  updateVisitor(sessionId, { page, userId });
}

/**
 * Track a product view
 */
export async function trackProductView(
  sessionId: string,
  productId: string,
  productTitle: string,
  price: number,
  userId?: string
): Promise<void> {
  const event: RealTimeEvent = {
    id: generateEventId(),
    type: 'product_view',
    timestamp: new Date(),
    sessionId,
    userId,
    productId,
    data: { productTitle, price },
  };

  await broadcastEvent(event);
  dailyCounters.productViews++;
}

/**
 * Track add to cart
 */
export async function trackAddToCart(
  sessionId: string,
  productId: string,
  productTitle: string,
  price: number,
  quantity: number,
  userId?: string
): Promise<void> {
  const event: RealTimeEvent = {
    id: generateEventId(),
    type: 'add_to_cart',
    timestamp: new Date(),
    sessionId,
    userId,
    productId,
    value: price * quantity,
    data: { productTitle, price, quantity },
  };

  await broadcastEvent(event);
  dailyCounters.addToCarts++;
  
  // Update visitor cart
  const visitor = liveVisitors.get(sessionId);
  if (visitor) {
    visitor.cartItems += quantity;
    visitor.cartValue += price * quantity;
    liveVisitors.set(sessionId, visitor);
  }
}

/**
 * Track checkout start
 */
export async function trackCheckoutStart(
  sessionId: string,
  cartValue: number,
  cartItems: number,
  userId?: string
): Promise<void> {
  const event: RealTimeEvent = {
    id: generateEventId(),
    type: 'checkout_start',
    timestamp: new Date(),
    sessionId,
    userId,
    value: cartValue,
    data: { cartItems },
  };

  await broadcastEvent(event);
  dailyCounters.checkoutStarts++;
}

/**
 * Track order completed
 */
export async function trackOrderCompleted(
  sessionId: string,
  orderId: string,
  orderTotal: number,
  itemCount: number,
  userId?: string
): Promise<void> {
  const event: RealTimeEvent = {
    id: generateEventId(),
    type: 'order_placed',
    timestamp: new Date(),
    sessionId,
    userId,
    orderId,
    value: orderTotal,
    data: { itemCount },
  };

  await broadcastEvent(event);
  dailyCounters.checkoutCompletes++;
  dailyCounters.orders++;
  dailyCounters.revenue += orderTotal;
  
  // Clear visitor cart
  const visitor = liveVisitors.get(sessionId);
  if (visitor) {
    visitor.cartItems = 0;
    visitor.cartValue = 0;
    liveVisitors.set(sessionId, visitor);
  }
  
  // Create sale alert
  createAlert({
    type: 'sale',
    severity: 'info',
    title: 'New Order!',
    message: `Order #${orderId.substring(0, 8)} for $${orderTotal.toFixed(2)}`,
    data: { orderId, orderTotal, itemCount },
  });
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

function handleOrderCreated(order: Record<string, unknown>): void {
  const event: RealTimeEvent = {
    id: generateEventId(),
    type: 'order_placed',
    timestamp: new Date(),
    sessionId: order.session_id as string || '',
    userId: order.customer_id as string,
    orderId: order.id as string,
    value: order.total_amount as number || 0,
    data: order,
  };

  processEvent(event);
  
  // Create sale alert
  createAlert({
    type: 'sale',
    severity: 'info',
    title: '🎉 New Sale!',
    message: `Order for $${(order.total_amount as number || 0).toFixed(2)}`,
    data: { orderId: order.id, total: order.total_amount },
  });
}

function handleOrderUpdated(order: Record<string, unknown>): void {
  if (order.status === 'fulfilled') {
    const event: RealTimeEvent = {
      id: generateEventId(),
      type: 'order_fulfilled',
      timestamp: new Date(),
      sessionId: '',
      orderId: order.id as string,
      data: order,
    };
    processEvent(event);
  }
}

function handleInventoryChanged(inventory: Record<string, unknown>): void {
  const quantity = inventory.quantity as number || 0;
  const threshold = inventory.low_stock_threshold as number || 10;
  const productId = inventory.product_id as string;

  if (quantity === 0) {
    const event: RealTimeEvent = {
      id: generateEventId(),
      type: 'inventory_out',
      timestamp: new Date(),
      sessionId: '',
      productId,
      data: inventory,
    };
    processEvent(event);
    
    createAlert({
      type: 'out_of_stock',
      severity: 'critical',
      title: '🚨 Out of Stock!',
      message: `Product ${productId} is out of stock`,
      data: { productId, quantity },
    });
  } else if (quantity <= threshold) {
    const event: RealTimeEvent = {
      id: generateEventId(),
      type: 'inventory_low',
      timestamp: new Date(),
      sessionId: '',
      productId,
      data: inventory,
    };
    processEvent(event);
    
    createAlert({
      type: 'low_stock',
      severity: 'warning',
      title: '⚠️ Low Stock',
      message: `Product ${productId} only has ${quantity} units left`,
      data: { productId, quantity },
    });
  }
}

function handleAnalyticsEvent(event: RealTimeEvent): void {
  processEvent(event);
}

function processEvent(event: RealTimeEvent): void {
  // Add to recent events
  recentEvents.unshift(event);
  if (recentEvents.length > 1000) recentEvents.pop();
  
  // Notify callbacks
  eventCallbacks.forEach(cb => cb(event));
  
  // Update metrics
  refreshMetrics();
}

async function broadcastEvent(event: RealTimeEvent): Promise<void> {
  processEvent(event);
  
  if (mainChannel) {
    await mainChannel.send({
      type: 'broadcast',
      event: 'analytics_event',
      payload: event,
    });
  }
}

// ============================================================================
// VISITOR TRACKING
// ============================================================================

/**
 * Register a new visitor
 */
export function registerVisitor(
  sessionId: string,
  metadata: Partial<LiveVisitor>
): LiveVisitor {
  const isNew = !liveVisitors.has(sessionId);
  const existing = liveVisitors.get(sessionId);
  
  const visitor: LiveVisitor = {
    id: sessionId,
    sessionId,
    page: metadata.page || '/',
    device: metadata.device || 'desktop',
    browser: metadata.browser || 'Unknown',
    os: metadata.os || 'Unknown',
    enteredAt: existing?.enteredAt || new Date(),
    lastActivityAt: new Date(),
    pagesViewed: (existing?.pagesViewed || 0) + 1,
    cartValue: existing?.cartValue || 0,
    cartItems: existing?.cartItems || 0,
    isActive: true,
    hasAccount: metadata.hasAccount || false,
    ...metadata,
  };
  
  liveVisitors.set(sessionId, visitor);
  
  // Update counters
  if (isNew) {
    dailyCounters.totalVisitors++;
    if (visitor.hasAccount) {
      dailyCounters.returningVisitors++;
    } else {
      dailyCounters.newVisitors++;
    }
  }
  
  // Notify callbacks
  visitorCallbacks.forEach(cb => cb(Array.from(liveVisitors.values())));
  
  return visitor;
}

/**
 * Update visitor data
 */
export function updateVisitor(sessionId: string, updates: Partial<LiveVisitor>): void {
  const visitor = liveVisitors.get(sessionId);
  if (visitor) {
    Object.assign(visitor, updates, { lastActivityAt: new Date() });
    liveVisitors.set(sessionId, visitor);
    visitorCallbacks.forEach(cb => cb(Array.from(liveVisitors.values())));
  } else {
    registerVisitor(sessionId, updates);
  }
}

/**
 * Remove visitor (left site)
 */
export function removeVisitor(sessionId: string): void {
  liveVisitors.delete(sessionId);
  visitorCallbacks.forEach(cb => cb(Array.from(liveVisitors.values())));
}

/**
 * Clean up stale visitors (no activity for 5 minutes)
 */
function cleanupStaleVisitors(): void {
  const staleThreshold = Date.now() - 5 * 60 * 1000;
  
  for (const [sessionId, visitor] of liveVisitors) {
    if (visitor.lastActivityAt.getTime() < staleThreshold) {
      visitor.isActive = false;
      liveVisitors.delete(sessionId);
    }
  }
  
  visitorCallbacks.forEach(cb => cb(Array.from(liveVisitors.values())));
}

// ============================================================================
// METRICS
// ============================================================================

/**
 * Get current live metrics
 */
export function getLiveMetrics(): LiveMetrics {
  if (metricsCache && Date.now() - lastMetricsUpdate < METRICS_UPDATE_INTERVAL) {
    return metricsCache;
  }
  
  return refreshMetrics();
}

/**
 * Refresh metrics calculation
 */
function refreshMetrics(): LiveMetrics {
  // Reset daily counters if new day
  const today = new Date().toDateString();
  if (dailyCounters.date !== today) {
    dailyCounters = {
      date: today,
      totalVisitors: 0,
      newVisitors: 0,
      returningVisitors: 0,
      orders: 0,
      revenue: 0,
      productViews: 0,
      addToCarts: 0,
      checkoutStarts: 0,
      checkoutCompletes: 0,
    };
  }
  
  const visitors = Array.from(liveVisitors.values());
  const activeVisitors = visitors.filter(v => v.isActive).length;
  
  // Calculate page views per minute (last 5 minutes)
  const fiveMinAgo = Date.now() - 5 * 60 * 1000;
  const recentPageViews = recentEvents.filter(
    e => e.type === 'page_view' && e.timestamp.getTime() > fiveMinAgo
  ).length;
  const pageViewsPerMinute = recentPageViews / 5;
  
  // Calculate active carts
  const activeCarts = visitors.filter(v => v.cartItems > 0).length;
  const activeCartValue = visitors.reduce((sum, v) => sum + v.cartValue, 0);
  
  // Calculate funnel
  const funnelMetrics: FunnelMetrics = {
    productViews: dailyCounters.productViews || 1,
    addToCarts: dailyCounters.addToCarts,
    checkoutStarts: dailyCounters.checkoutStarts,
    checkoutCompletes: dailyCounters.checkoutCompletes,
    viewToCart: dailyCounters.addToCarts / Math.max(dailyCounters.productViews, 1),
    cartToCheckout: dailyCounters.checkoutStarts / Math.max(dailyCounters.addToCarts, 1),
    checkoutToComplete: dailyCounters.checkoutCompletes / Math.max(dailyCounters.checkoutStarts, 1),
    overallConversion: dailyCounters.checkoutCompletes / Math.max(dailyCounters.productViews, 1),
  };
  
  // Calculate trends
  const visitorTrend: 'up' | 'down' | 'stable' = activeVisitors > 10 ? 'up' : activeVisitors < 3 ? 'down' : 'stable';
  const revenueTrend: 'up' | 'down' | 'stable' = dailyCounters.revenue > 1000 ? 'up' : dailyCounters.revenue < 100 ? 'down' : 'stable';
  
  // Get top products from recent events
  const productViews = new Map<string, { title: string; views: number; sales: number }>();
  recentEvents
    .filter(e => e.type === 'product_view' || e.type === 'order_placed')
    .forEach(e => {
      const productId = e.productId || '';
      const existing = productViews.get(productId) || { title: e.data.productTitle as string || productId, views: 0, sales: 0 };
      if (e.type === 'product_view') existing.views++;
      if (e.type === 'order_placed') existing.sales++;
      productViews.set(productId, existing);
    });
  
  const topProducts = Array.from(productViews.entries())
    .map(([productId, data]) => ({ productId, ...data }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);
  
  // Get top pages
  const pageCounts = new Map<string, number>();
  recentEvents
    .filter(e => e.type === 'page_view')
    .forEach(e => {
      const page = e.page || '/';
      pageCounts.set(page, (pageCounts.get(page) || 0) + 1);
    });
  
  const topPages = Array.from(pageCounts.entries())
    .map(([page, views]) => ({ page, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);
  
  // Get top referrers
  const referrerCounts = new Map<string, number>();
  visitors.forEach(v => {
    const source = v.referrer || 'Direct';
    referrerCounts.set(source, (referrerCounts.get(source) || 0) + 1);
  });
  
  const topReferrers = Array.from(referrerCounts.entries())
    .map(([source, visitors]) => ({ source, visitors }))
    .sort((a, b) => b.visitors - a.visitors)
    .slice(0, 5);
  
  const metrics: LiveMetrics = {
    activeVisitors,
    totalVisitorsToday: dailyCounters.totalVisitors,
    newVisitorsToday: dailyCounters.newVisitors,
    returningVisitorsToday: dailyCounters.returningVisitors,
    pageViewsPerMinute,
    bounceRate: 0.35, // Would calculate from session data
    avgSessionDuration: 180, // Would calculate from session data
    ordersToday: dailyCounters.orders,
    revenueToday: dailyCounters.revenue,
    avgOrderValue: dailyCounters.orders > 0 ? dailyCounters.revenue / dailyCounters.orders : 0,
    conversionRate: funnelMetrics.overallConversion,
    activeCarts,
    activeCartValue,
    cartAbandonmentRate: 0.7, // Would calculate from cart data
    funnelMetrics,
    visitorTrend,
    revenueTrend,
    topProducts,
    topPages,
    topReferrers,
  };
  
  metricsCache = metrics;
  lastMetricsUpdate = Date.now();
  
  // Notify callbacks
  metricsCallbacks.forEach(cb => cb(metrics));
  
  return metrics;
}

// ============================================================================
// ALERTS
// ============================================================================

function createAlert(alert: Omit<RealtimeAlert, 'id' | 'timestamp' | 'dismissed'>): void {
  const newAlert: RealtimeAlert = {
    id: generateEventId(),
    timestamp: new Date(),
    dismissed: false,
    ...alert,
  };
  
  activeAlerts.set(newAlert.id, newAlert);
  alertCallbacks.forEach(cb => cb(newAlert));
  
  // Auto-dismiss info alerts after 30 seconds
  if (alert.severity === 'info') {
    setTimeout(() => dismissAlert(newAlert.id), 30000);
  }
}

export function dismissAlert(alertId: string): void {
  const alert = activeAlerts.get(alertId);
  if (alert) {
    alert.dismissed = true;
    activeAlerts.delete(alertId);
  }
}

export function getActiveAlerts(): RealtimeAlert[] {
  return Array.from(activeAlerts.values()).filter(a => !a.dismissed);
}

// ============================================================================
// SUBSCRIPTIONS
// ============================================================================

export function subscribeToEvents(callback: EventCallback): () => void {
  eventCallbacks.add(callback);
  return () => eventCallbacks.delete(callback);
}

export function subscribeToMetrics(callback: MetricsCallback): () => void {
  metricsCallbacks.add(callback);
  // Immediately call with current metrics
  callback(getLiveMetrics());
  return () => metricsCallbacks.delete(callback);
}

export function subscribeToAlerts(callback: AlertCallback): () => void {
  alertCallbacks.add(callback);
  return () => alertCallbacks.delete(callback);
}

export function subscribeToVisitors(callback: VisitorCallback): () => void {
  visitorCallbacks.add(callback);
  // Immediately call with current visitors
  callback(Array.from(liveVisitors.values()));
  return () => visitorCallbacks.delete(callback);
}

// ============================================================================
// HELPERS
// ============================================================================

function generateEventId(): string {
  return `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// DATA ACCESS
// ============================================================================

export function getRecentEvents(limit: number = 100): RealTimeEvent[] {
  return recentEvents.slice(0, limit);
}

export function getLiveVisitors(): LiveVisitor[] {
  return Array.from(liveVisitors.values()).filter(v => v.isActive);
}

export function getVisitorCount(): number {
  return liveVisitors.size;
}

// ============================================================================
// MOCK DATA
// ============================================================================

export function generateMockRealTimeData(): {
  metrics: LiveMetrics;
  visitors: LiveVisitor[];
  events: RealTimeEvent[];
  alerts: RealtimeAlert[];
} {
  // Generate mock visitors
  const devices: Array<'desktop' | 'mobile' | 'tablet'> = ['desktop', 'mobile', 'tablet'];
  const pages = ['/', '/collections', '/products/premium-headphones', '/cart', '/checkout'];
  const referrers = ['google.com', 'facebook.com', 'instagram.com', 'Direct', 'twitter.com'];
  
  for (let i = 0; i < 25; i++) {
    const sessionId = `session-${Math.random().toString(36).substr(2, 12)}`;
    registerVisitor(sessionId, {
      userId: i % 3 === 0 ? `user-${i}` : undefined,
      email: i % 4 === 0 ? `visitor${i}@example.com` : undefined,
      page: pages[Math.floor(Math.random() * pages.length)],
      referrer: referrers[Math.floor(Math.random() * referrers.length)],
      country: ['US', 'UK', 'CA', 'AU', 'DE'][Math.floor(Math.random() * 5)],
      city: ['New York', 'London', 'Toronto', 'Sydney', 'Berlin'][Math.floor(Math.random() * 5)],
      device: devices[Math.floor(Math.random() * devices.length)],
      browser: ['Chrome', 'Safari', 'Firefox', 'Edge'][Math.floor(Math.random() * 4)],
      os: ['Windows', 'macOS', 'iOS', 'Android'][Math.floor(Math.random() * 4)],
      cartValue: Math.random() > 0.6 ? Math.random() * 200 : 0,
      cartItems: Math.random() > 0.6 ? Math.floor(Math.random() * 5) : 0,
      hasAccount: Math.random() > 0.7,
    });
  }
  
  // Generate mock events
  const eventTypes: EventType[] = ['page_view', 'product_view', 'add_to_cart', 'checkout_start', 'order_placed'];
  for (let i = 0; i < 50; i++) {
    const event: RealTimeEvent = {
      id: generateEventId(),
      type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
      timestamp: new Date(Date.now() - Math.random() * 60 * 60 * 1000),
      sessionId: `session-${Math.random().toString(36).substr(2, 12)}`,
      userId: Math.random() > 0.5 ? `user-${Math.floor(Math.random() * 100)}` : undefined,
      page: pages[Math.floor(Math.random() * pages.length)],
      productId: `prod-${Math.floor(Math.random() * 20)}`,
      value: Math.random() * 200,
      data: {},
    };
    recentEvents.push(event);
  }
  
  // Update daily counters for mock data
  dailyCounters.totalVisitors = 150;
  dailyCounters.newVisitors = 85;
  dailyCounters.returningVisitors = 65;
  dailyCounters.orders = 12;
  dailyCounters.revenue = 1847.50;
  dailyCounters.productViews = 420;
  dailyCounters.addToCarts = 68;
  dailyCounters.checkoutStarts = 25;
  dailyCounters.checkoutCompletes = 12;
  
  // Generate mock alerts
  const mockAlerts: Omit<RealtimeAlert, 'id' | 'timestamp' | 'dismissed'>[] = [
    { type: 'sale', severity: 'info', title: '🎉 New Sale!', message: 'Order #ABC123 for $149.99', data: { orderId: 'ABC123' } },
    { type: 'low_stock', severity: 'warning', title: '⚠️ Low Stock', message: 'Premium Headphones: Only 3 left', data: { productId: 'prod-1' } },
    { type: 'high_traffic', severity: 'info', title: '📈 Traffic Spike', message: '25 active visitors', data: {} },
  ];
  
  mockAlerts.forEach(a => createAlert(a));
  
  return {
    metrics: getLiveMetrics(),
    visitors: getLiveVisitors(),
    events: getRecentEvents(),
    alerts: getActiveAlerts(),
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Initialization
  initializeRealTimeAnalytics,
  // Tracking
  trackPageView,
  trackProductView,
  trackAddToCart,
  trackCheckoutStart,
  trackOrderCompleted,
  // Visitors
  registerVisitor,
  updateVisitor,
  removeVisitor,
  getLiveVisitors,
  getVisitorCount,
  // Metrics
  getLiveMetrics,
  // Events
  getRecentEvents,
  // Alerts
  getActiveAlerts,
  dismissAlert,
  // Subscriptions
  subscribeToEvents,
  subscribeToMetrics,
  subscribeToAlerts,
  subscribeToVisitors,
  // Mock
  generateMockRealTimeData,
};
