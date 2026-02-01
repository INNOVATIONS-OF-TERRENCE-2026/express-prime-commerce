/**
 * AI-Powered Dynamic Pricing Engine
 * 
 * Real-time price optimization based on demand, inventory,
 * competitor analysis, and customer behavior patterns.
 * 
 * CORE PRINCIPLES:
 * - Maximize revenue without sacrificing trust
 * - Never price below minimum margin threshold
 * - Transparent pricing (no dark patterns)
 * - Self-learning from conversion data
 * 
 * @module ai/dynamicPricing
 * @version 1.0.0
 */

// ============================================================================
// TYPES
// ============================================================================

export type PricingStrategy = 
  | 'maximize_revenue'
  | 'maximize_volume'
  | 'maximize_margin'
  | 'competitive_match'
  | 'penetration'
  | 'premium';

export type DemandLevel = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';

export type PriceChangeReason =
  | 'demand_surge'
  | 'demand_drop'
  | 'inventory_low'
  | 'inventory_high'
  | 'competitor_undercut'
  | 'time_decay'
  | 'seasonal'
  | 'conversion_optimization'
  | 'margin_protection'
  | 'promotional';

export interface PricingContext {
  productId: string;
  currentPrice: number;
  costPrice: number;
  compareAtPrice?: number;
  inventoryLevel: number;
  inventoryVelocity: number; // units per day
  daysOfInventory: number;
  // Demand signals
  viewsLast24h: number;
  viewsLast7d: number;
  addToCartsLast24h: number;
  purchasesLast24h: number;
  purchasesLast7d: number;
  // Conversion data
  conversionRate: number;
  cartAbandonmentRate: number;
  // Competitor data
  competitorPrices?: number[];
  marketAveragePrice?: number;
  // Time context
  dayOfWeek: number;
  hourOfDay: number;
  isHoliday: boolean;
  seasonalFactor: number;
}

export interface PricingDecision {
  id: string;
  timestamp: Date;
  productId: string;
  // Prices
  originalPrice: number;
  recommendedPrice: number;
  priceChange: number;
  priceChangePercent: number;
  // Reasoning
  strategy: PricingStrategy;
  reason: PriceChangeReason;
  explanation: string;
  confidenceScore: number;
  // Projections
  expectedRevenueImpact: number;
  expectedVolumeImpact: number;
  expectedMarginImpact: number;
  // Constraints
  minAllowedPrice: number;
  maxAllowedPrice: number;
  // Status
  approved: boolean;
  autoApply: boolean;
}

export interface PricingRule {
  id: string;
  name: string;
  priority: number;
  condition: (ctx: PricingContext) => boolean;
  adjustment: (ctx: PricingContext) => number;
  maxAdjustmentPercent: number;
  reason: PriceChangeReason;
}

export interface DemandForecast {
  productId: string;
  forecastDate: Date;
  expectedDemand: number;
  demandLevel: DemandLevel;
  confidence: number;
  factors: string[];
}

export interface PricingConfig {
  // Margin constraints
  minMarginPercent: number;
  targetMarginPercent: number;
  maxMarginPercent: number;
  // Price change limits
  maxDailyChangePercent: number;
  maxWeeklyChangePercent: number;
  // Rounding
  roundToNearest: number;
  psychologicalPricing: boolean;
  // Auto-apply
  autoApplyThreshold: number;
  requireApprovalAbove: number;
}

// ============================================================================
// STATE
// ============================================================================

let config: PricingConfig = {
  minMarginPercent: 15,
  targetMarginPercent: 35,
  maxMarginPercent: 70,
  maxDailyChangePercent: 10,
  maxWeeklyChangePercent: 25,
  roundToNearest: 0.99,
  psychologicalPricing: true,
  autoApplyThreshold: 0.85,
  requireApprovalAbove: 20,
};

const pricingHistory: Map<string, PricingDecision[]> = new Map();
const demandForecasts: Map<string, DemandForecast> = new Map();
const priceElasticity: Map<string, number> = new Map(); // -1 to -3 typical

// ============================================================================
// PRICING RULES ENGINE
// ============================================================================

const pricingRules: PricingRule[] = [
  // Rule 1: Low inventory surge pricing
  {
    id: 'low_inventory_surge',
    name: 'Low Inventory Price Increase',
    priority: 1,
    condition: (ctx) => ctx.daysOfInventory < 7 && ctx.conversionRate > 0.03,
    adjustment: (ctx) => {
      const urgencyFactor = Math.max(0, (7 - ctx.daysOfInventory) / 7);
      return ctx.currentPrice * (1 + urgencyFactor * 0.15);
    },
    maxAdjustmentPercent: 15,
    reason: 'inventory_low',
  },
  // Rule 2: High inventory clearance
  {
    id: 'high_inventory_clearance',
    name: 'High Inventory Discount',
    priority: 2,
    condition: (ctx) => ctx.daysOfInventory > 60 && ctx.inventoryVelocity < 1,
    adjustment: (ctx) => {
      const excessDays = ctx.daysOfInventory - 60;
      const discountFactor = Math.min(excessDays / 60, 0.25);
      return ctx.currentPrice * (1 - discountFactor);
    },
    maxAdjustmentPercent: 25,
    reason: 'inventory_high',
  },
  // Rule 3: Demand surge pricing
  {
    id: 'demand_surge',
    name: 'High Demand Premium',
    priority: 3,
    condition: (ctx) => {
      const viewGrowth = ctx.viewsLast24h / (ctx.viewsLast7d / 7);
      return viewGrowth > 2 && ctx.conversionRate > 0.04;
    },
    adjustment: (ctx) => {
      const viewGrowth = ctx.viewsLast24h / (ctx.viewsLast7d / 7);
      const premium = Math.min((viewGrowth - 1) * 0.05, 0.12);
      return ctx.currentPrice * (1 + premium);
    },
    maxAdjustmentPercent: 12,
    reason: 'demand_surge',
  },
  // Rule 4: Demand drop recovery
  {
    id: 'demand_drop',
    name: 'Low Demand Discount',
    priority: 4,
    condition: (ctx) => {
      const viewGrowth = ctx.viewsLast24h / (ctx.viewsLast7d / 7);
      return viewGrowth < 0.5 && ctx.purchasesLast24h === 0;
    },
    adjustment: (ctx) => {
      return ctx.currentPrice * 0.92; // 8% discount
    },
    maxAdjustmentPercent: 15,
    reason: 'demand_drop',
  },
  // Rule 5: Conversion optimization
  {
    id: 'conversion_optimization',
    name: 'Cart Abandonment Recovery',
    priority: 5,
    condition: (ctx) => ctx.cartAbandonmentRate > 0.75 && ctx.addToCartsLast24h > 5,
    adjustment: (ctx) => {
      const abandonmentPremium = (ctx.cartAbandonmentRate - 0.5) * 0.1;
      return ctx.currentPrice * (1 - abandonmentPremium);
    },
    maxAdjustmentPercent: 10,
    reason: 'conversion_optimization',
  },
  // Rule 6: Competitive matching
  {
    id: 'competitive_match',
    name: 'Competitor Price Match',
    priority: 6,
    condition: (ctx) => {
      if (!ctx.competitorPrices?.length) return false;
      const minCompetitor = Math.min(...ctx.competitorPrices);
      return ctx.currentPrice > minCompetitor * 1.1;
    },
    adjustment: (ctx) => {
      const minCompetitor = Math.min(...ctx.competitorPrices!);
      return Math.max(minCompetitor * 1.02, ctx.costPrice * 1.2);
    },
    maxAdjustmentPercent: 20,
    reason: 'competitor_undercut',
  },
  // Rule 7: Weekend premium
  {
    id: 'weekend_premium',
    name: 'Weekend Shopping Premium',
    priority: 7,
    condition: (ctx) => ctx.dayOfWeek === 0 || ctx.dayOfWeek === 6,
    adjustment: (ctx) => ctx.currentPrice * 1.03,
    maxAdjustmentPercent: 5,
    reason: 'time_decay',
  },
  // Rule 8: Seasonal adjustment
  {
    id: 'seasonal_adjustment',
    name: 'Seasonal Price Adjustment',
    priority: 8,
    condition: (ctx) => ctx.seasonalFactor !== 1,
    adjustment: (ctx) => ctx.currentPrice * ctx.seasonalFactor,
    maxAdjustmentPercent: 20,
    reason: 'seasonal',
  },
];

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Calculate optimal price for a product
 */
export function calculateOptimalPrice(context: PricingContext): PricingDecision {
  const id = `price-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Calculate constraints
  const minAllowedPrice = context.costPrice * (1 + config.minMarginPercent / 100);
  const maxAllowedPrice = context.compareAtPrice || context.currentPrice * 1.5;
  
  // Get applicable rules
  const applicableRules = pricingRules
    .filter(rule => rule.condition(context))
    .sort((a, b) => a.priority - b.priority);
  
  let recommendedPrice = context.currentPrice;
  let primaryReason: PriceChangeReason = 'conversion_optimization';
  let strategy: PricingStrategy = 'maximize_revenue';
  const factors: string[] = [];
  
  // Apply rules in priority order
  for (const rule of applicableRules) {
    const adjustedPrice = rule.adjustment(context);
    const changePercent = Math.abs((adjustedPrice - context.currentPrice) / context.currentPrice * 100);
    
    if (changePercent <= rule.maxAdjustmentPercent) {
      recommendedPrice = adjustedPrice;
      primaryReason = rule.reason;
      factors.push(rule.name);
      break; // Apply highest priority rule only
    }
  }
  
  // Apply psychological pricing
  if (config.psychologicalPricing) {
    recommendedPrice = applyPsychologicalPricing(recommendedPrice);
  }
  
  // Enforce constraints
  recommendedPrice = Math.max(minAllowedPrice, Math.min(maxAllowedPrice, recommendedPrice));
  
  // Calculate change
  const priceChange = recommendedPrice - context.currentPrice;
  const priceChangePercent = (priceChange / context.currentPrice) * 100;
  
  // Enforce daily change limit
  if (Math.abs(priceChangePercent) > config.maxDailyChangePercent) {
    const direction = priceChange > 0 ? 1 : -1;
    recommendedPrice = context.currentPrice * (1 + direction * config.maxDailyChangePercent / 100);
  }
  
  // Calculate expected impacts
  const elasticity = priceElasticity.get(context.productId) || -1.5;
  const expectedVolumeChange = priceChangePercent * elasticity / 100;
  const expectedVolumeImpact = context.purchasesLast7d * expectedVolumeChange;
  const expectedRevenueImpact = (recommendedPrice * (1 + expectedVolumeChange) - context.currentPrice) * context.purchasesLast7d;
  const expectedMarginImpact = ((recommendedPrice - context.costPrice) / recommendedPrice - 
                                (context.currentPrice - context.costPrice) / context.currentPrice) * 100;
  
  // Calculate confidence
  const confidenceScore = calculateConfidence(context, applicableRules.length);
  
  // Determine approval status
  const autoApply = confidenceScore >= config.autoApplyThreshold && 
                    Math.abs(priceChangePercent) < config.requireApprovalAbove;
  
  // Generate explanation
  const explanation = generatePriceExplanation(context, recommendedPrice, primaryReason, factors);
  
  const decision: PricingDecision = {
    id,
    timestamp: new Date(),
    productId: context.productId,
    originalPrice: context.currentPrice,
    recommendedPrice,
    priceChange,
    priceChangePercent,
    strategy,
    reason: primaryReason,
    explanation,
    confidenceScore,
    expectedRevenueImpact,
    expectedVolumeImpact,
    expectedMarginImpact,
    minAllowedPrice,
    maxAllowedPrice,
    approved: autoApply,
    autoApply,
  };
  
  // Store in history
  const history = pricingHistory.get(context.productId) || [];
  history.unshift(decision);
  if (history.length > 100) history.pop();
  pricingHistory.set(context.productId, history);
  
  return decision;
}

/**
 * Forecast demand for a product
 */
export function forecastDemand(
  productId: string,
  historicalData: { date: Date; units: number }[],
  daysAhead: number = 7
): DemandForecast {
  // Simple moving average with trend
  const recentSales = historicalData.slice(-14);
  const avgDailySales = recentSales.reduce((sum, d) => sum + d.units, 0) / recentSales.length || 0;
  
  // Calculate trend
  const firstHalf = recentSales.slice(0, 7).reduce((sum, d) => sum + d.units, 0) / 7;
  const secondHalf = recentSales.slice(7).reduce((sum, d) => sum + d.units, 0) / 7;
  const trendFactor = secondHalf > 0 ? firstHalf / secondHalf : 1;
  
  const expectedDemand = avgDailySales * daysAhead * trendFactor;
  
  // Determine demand level
  let demandLevel: DemandLevel = 'medium';
  if (avgDailySales < 0.5) demandLevel = 'very_low';
  else if (avgDailySales < 2) demandLevel = 'low';
  else if (avgDailySales < 5) demandLevel = 'medium';
  else if (avgDailySales < 10) demandLevel = 'high';
  else demandLevel = 'very_high';
  
  const factors: string[] = [];
  if (trendFactor > 1.2) factors.push('Upward trend detected');
  if (trendFactor < 0.8) factors.push('Downward trend detected');
  
  const forecast: DemandForecast = {
    productId,
    forecastDate: new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000),
    expectedDemand,
    demandLevel,
    confidence: Math.min(0.95, 0.5 + recentSales.length * 0.03),
    factors,
  };
  
  demandForecasts.set(productId, forecast);
  return forecast;
}

/**
 * Update price elasticity based on actual conversion data
 */
export function updateElasticity(
  productId: string,
  priceChange: number,
  demandChange: number
): void {
  if (priceChange === 0) return;
  
  const observedElasticity = (demandChange / priceChange);
  const currentElasticity = priceElasticity.get(productId) || -1.5;
  
  // Exponential moving average
  const alpha = 0.2;
  const newElasticity = alpha * observedElasticity + (1 - alpha) * currentElasticity;
  
  // Clamp to reasonable range
  priceElasticity.set(productId, Math.max(-4, Math.min(-0.5, newElasticity)));
}

/**
 * Get pricing recommendations for multiple products
 */
export function batchPricingAnalysis(
  products: Array<{
    productId: string;
    currentPrice: number;
    costPrice: number;
    inventoryLevel: number;
    salesData: { views: number; addToCarts: number; purchases: number };
  }>
): PricingDecision[] {
  return products.map(product => {
    const context: PricingContext = {
      productId: product.productId,
      currentPrice: product.currentPrice,
      costPrice: product.costPrice,
      inventoryLevel: product.inventoryLevel,
      inventoryVelocity: product.salesData.purchases / 7,
      daysOfInventory: product.inventoryLevel / Math.max(product.salesData.purchases / 7, 0.1),
      viewsLast24h: product.salesData.views / 7,
      viewsLast7d: product.salesData.views,
      addToCartsLast24h: product.salesData.addToCarts / 7,
      purchasesLast24h: product.salesData.purchases / 7,
      purchasesLast7d: product.salesData.purchases,
      conversionRate: product.salesData.purchases / Math.max(product.salesData.views, 1),
      cartAbandonmentRate: 1 - (product.salesData.purchases / Math.max(product.salesData.addToCarts, 1)),
      dayOfWeek: new Date().getDay(),
      hourOfDay: new Date().getHours(),
      isHoliday: false,
      seasonalFactor: 1,
    };
    
    return calculateOptimalPrice(context);
  });
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function applyPsychologicalPricing(price: number): number {
  // Round to .99 or .95
  const wholePart = Math.floor(price);
  const decimal = price - wholePart;
  
  if (price < 10) {
    return wholePart + 0.99;
  } else if (price < 100) {
    return decimal > 0.5 ? wholePart + 0.99 : wholePart - 0.01;
  } else {
    return Math.round(price / 5) * 5 - 1;
  }
}

function calculateConfidence(context: PricingContext, rulesApplied: number): number {
  let confidence = 0.5;
  
  // More data = more confidence
  if (context.viewsLast7d > 100) confidence += 0.1;
  if (context.purchasesLast7d > 10) confidence += 0.15;
  if (context.conversionRate > 0) confidence += 0.1;
  
  // Rules applied = more confidence
  if (rulesApplied > 0) confidence += 0.1;
  
  return Math.min(0.98, confidence);
}

function generatePriceExplanation(
  context: PricingContext,
  newPrice: number,
  reason: PriceChangeReason,
  factors: string[]
): string {
  const direction = newPrice > context.currentPrice ? 'increase' : 'decrease';
  const changePercent = Math.abs((newPrice - context.currentPrice) / context.currentPrice * 100).toFixed(1);
  
  const reasonText: Record<PriceChangeReason, string> = {
    demand_surge: `High demand detected (${context.viewsLast24h} views in 24h)`,
    demand_drop: `Low demand - stimulating sales`,
    inventory_low: `Only ${context.daysOfInventory.toFixed(0)} days of inventory remaining`,
    inventory_high: `${context.daysOfInventory.toFixed(0)} days of inventory - clearance pricing`,
    competitor_undercut: `Matching competitor pricing`,
    time_decay: `Weekend shopping optimization`,
    seasonal: `Seasonal demand adjustment`,
    conversion_optimization: `Optimizing for ${(context.conversionRate * 100).toFixed(1)}% conversion rate`,
    margin_protection: `Protecting minimum margin threshold`,
    promotional: `Promotional pricing active`,
  };
  
  return `Recommended ${changePercent}% price ${direction}. ${reasonText[reason]}. ${factors.length > 0 ? `Factors: ${factors.join(', ')}` : ''}`;
}

// ============================================================================
// STATISTICS & ANALYTICS
// ============================================================================

export function getPricingStats(): {
  totalDecisions: number;
  avgPriceChange: number;
  avgConfidence: number;
  approvalRate: number;
  revenueImpact: number;
  topReasons: Array<{ reason: PriceChangeReason; count: number }>;
} {
  const allDecisions = Array.from(pricingHistory.values()).flat();
  
  if (allDecisions.length === 0) {
    return {
      totalDecisions: 0,
      avgPriceChange: 0,
      avgConfidence: 0,
      approvalRate: 0,
      revenueImpact: 0,
      topReasons: [],
    };
  }
  
  const avgPriceChange = allDecisions.reduce((sum, d) => sum + d.priceChangePercent, 0) / allDecisions.length;
  const avgConfidence = allDecisions.reduce((sum, d) => sum + d.confidenceScore, 0) / allDecisions.length;
  const approvalRate = allDecisions.filter(d => d.approved).length / allDecisions.length;
  const revenueImpact = allDecisions.reduce((sum, d) => sum + d.expectedRevenueImpact, 0);
  
  // Count reasons
  const reasonCounts = new Map<PriceChangeReason, number>();
  allDecisions.forEach(d => {
    reasonCounts.set(d.reason, (reasonCounts.get(d.reason) || 0) + 1);
  });
  
  const topReasons = Array.from(reasonCounts.entries())
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  return {
    totalDecisions: allDecisions.length,
    avgPriceChange,
    avgConfidence,
    approvalRate,
    revenueImpact,
    topReasons,
  };
}

export function getProductPricingHistory(productId: string, limit: number = 10): PricingDecision[] {
  return (pricingHistory.get(productId) || []).slice(0, limit);
}

// ============================================================================
// MOCK DATA
// ============================================================================

export function generateMockPricingData(): {
  decisions: PricingDecision[];
  stats: ReturnType<typeof getPricingStats>;
  forecasts: DemandForecast[];
} {
  // Generate mock decisions
  const mockProducts = [
    { id: 'prod-001', price: 49.99, cost: 20, inventory: 15 },
    { id: 'prod-002', price: 89.99, cost: 35, inventory: 50 },
    { id: 'prod-003', price: 24.99, cost: 10, inventory: 5 },
    { id: 'prod-004', price: 149.99, cost: 60, inventory: 100 },
    { id: 'prod-005', price: 34.99, cost: 15, inventory: 25 },
  ];
  
  const decisions = mockProducts.map(p => {
    const context: PricingContext = {
      productId: p.id,
      currentPrice: p.price,
      costPrice: p.cost,
      inventoryLevel: p.inventory,
      inventoryVelocity: Math.random() * 3,
      daysOfInventory: p.inventory / (Math.random() * 3 + 0.5),
      viewsLast24h: Math.floor(Math.random() * 100),
      viewsLast7d: Math.floor(Math.random() * 500),
      addToCartsLast24h: Math.floor(Math.random() * 20),
      purchasesLast24h: Math.floor(Math.random() * 5),
      purchasesLast7d: Math.floor(Math.random() * 30),
      conversionRate: Math.random() * 0.08,
      cartAbandonmentRate: Math.random() * 0.5 + 0.4,
      dayOfWeek: new Date().getDay(),
      hourOfDay: new Date().getHours(),
      isHoliday: false,
      seasonalFactor: 1,
    };
    
    return calculateOptimalPrice(context);
  });
  
  const forecasts = mockProducts.map(p => ({
    productId: p.id,
    forecastDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    expectedDemand: Math.floor(Math.random() * 50),
    demandLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as DemandLevel,
    confidence: 0.7 + Math.random() * 0.25,
    factors: ['Historical trend', 'Seasonal adjustment'],
  }));
  
  return {
    decisions,
    stats: getPricingStats(),
    forecasts,
  };
}

// ============================================================================
// CONFIGURATION
// ============================================================================

export function configurePricing(newConfig: Partial<PricingConfig>): void {
  config = { ...config, ...newConfig };
}

export function getPricingConfig(): PricingConfig {
  return { ...config };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  calculateOptimalPrice,
  forecastDemand,
  updateElasticity,
  batchPricingAnalysis,
  getPricingStats,
  getProductPricingHistory,
  generateMockPricingData,
  configurePricing,
  getPricingConfig,
};
