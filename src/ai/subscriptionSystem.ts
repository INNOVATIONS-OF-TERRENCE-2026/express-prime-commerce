/**
 * Subscription & Membership System
 * 
 * Recurring orders, membership tiers, and subscription
 * box management with intelligent recommendations.
 * 
 * FEATURES:
 * - Flexible billing cycles
 * - Membership tiers with benefits
 * - Subscription box curation
 * - Churn prediction & prevention
 * - Revenue forecasting
 * 
 * @module ai/subscriptionSystem
 * @version 1.0.0
 */

// ============================================================================
// TYPES
// ============================================================================

export type BillingCycle = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually';

export type SubscriptionStatus = 
  | 'active'
  | 'paused'
  | 'cancelled'
  | 'past_due'
  | 'expired'
  | 'trialing';

export type MembershipTier = 'basic' | 'plus' | 'premium' | 'elite' | 'founder';

export interface Subscription {
  id: string;
  customerId: string;
  customerEmail: string;
  customerName?: string;
  // Subscription details
  planId: string;
  planName: string;
  billingCycle: BillingCycle;
  status: SubscriptionStatus;
  // Pricing
  basePrice: number;
  discountPercent: number;
  currentPrice: number;
  currency: string;
  // Items
  items: SubscriptionItem[];
  // Dates
  startDate: Date;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  nextBillingDate: Date;
  trialEndDate?: Date;
  cancelledAt?: Date;
  pausedUntil?: Date;
  // Metadata
  orderCount: number;
  totalSpent: number;
  skippedCount: number;
  // Settings
  autoRenew: boolean;
  allowSwap: boolean;
  allowSkip: boolean;
}

export interface SubscriptionItem {
  productId: string;
  variantId?: string;
  title: string;
  quantity: number;
  price: number;
  isCustomizable: boolean;
  swappableWith?: string[];
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  billingCycles: BillingCycle[];
  defaultCycle: BillingCycle;
  // Pricing
  basePrice: number;
  pricePerCycle: Record<BillingCycle, number>;
  savingsPerCycle: Record<BillingCycle, number>;
  // Features
  features: string[];
  includedProducts: string[];
  maxItems: number;
  // Trial
  trialDays: number;
  // Benefits
  benefits: PlanBenefit[];
}

export interface PlanBenefit {
  id: string;
  name: string;
  description: string;
  type: 'discount' | 'free_shipping' | 'early_access' | 'exclusive' | 'bonus_points';
  value?: number;
}

export interface Membership {
  id: string;
  customerId: string;
  tier: MembershipTier;
  // Status
  isActive: boolean;
  startDate: Date;
  renewalDate: Date;
  // Points
  pointsBalance: number;
  lifetimePoints: number;
  // Benefits
  activeBenefits: MembershipBenefit[];
  // Stats
  totalSaved: number;
  ordersThisYear: number;
  spentThisYear: number;
}

export interface MembershipBenefit {
  id: string;
  name: string;
  tier: MembershipTier;
  discountPercent?: number;
  freeShippingThreshold?: number;
  exclusiveAccess?: boolean;
  bonusPointsMultiplier?: number;
  birthdayBonus?: number;
  prioritySupport?: boolean;
}

export interface SubscriptionBox {
  id: string;
  name: string;
  description: string;
  theme?: string;
  // Curation
  isCurated: boolean;
  curatorNotes?: string;
  // Items
  items: SubscriptionItem[];
  totalValue: number;
  boxPrice: number;
  savings: number;
  // Schedule
  shipsOn: Date;
  deliveryEstimate: Date;
  // Customization
  isCustomizable: boolean;
  customizationDeadline?: Date;
}

export interface SubscriptionAnalytics {
  // Overview
  totalActiveSubscriptions: number;
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  avgSubscriptionValue: number;
  // Churn
  churnRate: number;
  churnedThisMonth: number;
  atRiskSubscriptions: number;
  // Growth
  newSubscriptionsThisMonth: number;
  reactivatedThisMonth: number;
  growthRate: number;
  // By plan
  subscriptionsByPlan: Map<string, number>;
  revenueByPlan: Map<string, number>;
  // By cycle
  subscriptionsByCycle: Map<BillingCycle, number>;
  // Retention
  retentionByMonth: number[];
  avgSubscriptionDuration: number;
}

// ============================================================================
// STATE
// ============================================================================

const subscriptions: Map<string, Subscription> = new Map();
const subscriptionPlans: Map<string, SubscriptionPlan> = new Map();
const memberships: Map<string, Membership> = new Map();
const subscriptionBoxes: Map<string, SubscriptionBox> = new Map();

// Membership tiers configuration
const membershipTiers: Record<MembershipTier, MembershipBenefit[]> = {
  basic: [
    { id: 'basic-discount', name: 'Member Discount', tier: 'basic', discountPercent: 5 },
    { id: 'basic-points', name: 'Earn Points', tier: 'basic', bonusPointsMultiplier: 1 },
  ],
  plus: [
    { id: 'plus-discount', name: 'Plus Discount', tier: 'plus', discountPercent: 10 },
    { id: 'plus-shipping', name: 'Reduced Shipping', tier: 'plus', freeShippingThreshold: 50 },
    { id: 'plus-points', name: 'Bonus Points', tier: 'plus', bonusPointsMultiplier: 1.5 },
  ],
  premium: [
    { id: 'premium-discount', name: 'Premium Discount', tier: 'premium', discountPercent: 15 },
    { id: 'premium-shipping', name: 'Free Shipping', tier: 'premium', freeShippingThreshold: 0 },
    { id: 'premium-points', name: '2x Points', tier: 'premium', bonusPointsMultiplier: 2 },
    { id: 'premium-early', name: 'Early Access', tier: 'premium', exclusiveAccess: true },
  ],
  elite: [
    { id: 'elite-discount', name: 'Elite Discount', tier: 'elite', discountPercent: 20 },
    { id: 'elite-shipping', name: 'Priority Shipping', tier: 'elite', freeShippingThreshold: 0 },
    { id: 'elite-points', name: '3x Points', tier: 'elite', bonusPointsMultiplier: 3 },
    { id: 'elite-early', name: 'VIP Early Access', tier: 'elite', exclusiveAccess: true },
    { id: 'elite-birthday', name: 'Birthday Bonus', tier: 'elite', birthdayBonus: 50 },
    { id: 'elite-support', name: 'Priority Support', tier: 'elite', prioritySupport: true },
  ],
  founder: [
    { id: 'founder-discount', name: 'Founder Discount', tier: 'founder', discountPercent: 25 },
    { id: 'founder-shipping', name: 'Free Priority Shipping', tier: 'founder', freeShippingThreshold: 0 },
    { id: 'founder-points', name: '5x Points', tier: 'founder', bonusPointsMultiplier: 5 },
    { id: 'founder-early', name: 'Exclusive Founder Access', tier: 'founder', exclusiveAccess: true },
    { id: 'founder-birthday', name: 'Founder Birthday Gift', tier: 'founder', birthdayBonus: 100 },
    { id: 'founder-support', name: 'Dedicated Support', tier: 'founder', prioritySupport: true },
  ],
};

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Create a new subscription
 */
export function createSubscription(
  customerId: string,
  customerEmail: string,
  planId: string,
  billingCycle: BillingCycle,
  items: SubscriptionItem[],
  options?: {
    customerName?: string;
    trialDays?: number;
    discountPercent?: number;
  }
): Subscription {
  const plan = subscriptionPlans.get(planId);
  const id = `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const basePrice = plan?.pricePerCycle[billingCycle] || items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const discountPercent = options?.discountPercent || 0;
  const currentPrice = basePrice * (1 - discountPercent / 100);
  
  const now = new Date();
  const trialDays = options?.trialDays || plan?.trialDays || 0;
  const trialEndDate = trialDays > 0 ? new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000) : undefined;
  
  const periodEnd = calculateNextBillingDate(now, billingCycle);
  
  const subscription: Subscription = {
    id,
    customerId,
    customerEmail,
    customerName: options?.customerName,
    planId,
    planName: plan?.name || 'Custom Subscription',
    billingCycle,
    status: trialDays > 0 ? 'trialing' : 'active',
    basePrice,
    discountPercent,
    currentPrice,
    currency: 'USD',
    items,
    startDate: now,
    currentPeriodStart: now,
    currentPeriodEnd: periodEnd,
    nextBillingDate: trialEndDate || periodEnd,
    trialEndDate,
    orderCount: 0,
    totalSpent: 0,
    skippedCount: 0,
    autoRenew: true,
    allowSwap: true,
    allowSkip: true,
  };
  
  subscriptions.set(id, subscription);
  return subscription;
}

/**
 * Update subscription items
 */
export function updateSubscriptionItems(
  subscriptionId: string,
  items: SubscriptionItem[]
): Subscription | null {
  const subscription = subscriptions.get(subscriptionId);
  if (!subscription) return null;
  
  subscription.items = items;
  subscription.basePrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  subscription.currentPrice = subscription.basePrice * (1 - subscription.discountPercent / 100);
  
  subscriptions.set(subscriptionId, subscription);
  return subscription;
}

/**
 * Swap item in subscription
 */
export function swapSubscriptionItem(
  subscriptionId: string,
  oldProductId: string,
  newProductId: string,
  newProduct: Omit<SubscriptionItem, 'swappableWith'>
): Subscription | null {
  const subscription = subscriptions.get(subscriptionId);
  if (!subscription || !subscription.allowSwap) return null;
  
  const itemIndex = subscription.items.findIndex(i => i.productId === oldProductId);
  if (itemIndex === -1) return null;
  
  const oldItem = subscription.items[itemIndex];
  if (oldItem.swappableWith && !oldItem.swappableWith.includes(newProductId)) {
    return null; // Not in allowed swap list
  }
  
  subscription.items[itemIndex] = {
    ...newProduct,
    swappableWith: oldItem.swappableWith,
  };
  
  subscriptions.set(subscriptionId, subscription);
  return subscription;
}

/**
 * Skip next delivery
 */
export function skipNextDelivery(subscriptionId: string): Subscription | null {
  const subscription = subscriptions.get(subscriptionId);
  if (!subscription || !subscription.allowSkip) return null;
  
  subscription.nextBillingDate = calculateNextBillingDate(
    subscription.nextBillingDate,
    subscription.billingCycle
  );
  subscription.skippedCount++;
  
  subscriptions.set(subscriptionId, subscription);
  return subscription;
}

/**
 * Pause subscription
 */
export function pauseSubscription(subscriptionId: string, resumeDate: Date): Subscription | null {
  const subscription = subscriptions.get(subscriptionId);
  if (!subscription) return null;
  
  subscription.status = 'paused';
  subscription.pausedUntil = resumeDate;
  
  subscriptions.set(subscriptionId, subscription);
  return subscription;
}

/**
 * Resume subscription
 */
export function resumeSubscription(subscriptionId: string): Subscription | null {
  const subscription = subscriptions.get(subscriptionId);
  if (!subscription || subscription.status !== 'paused') return null;
  
  subscription.status = 'active';
  subscription.pausedUntil = undefined;
  subscription.nextBillingDate = calculateNextBillingDate(new Date(), subscription.billingCycle);
  
  subscriptions.set(subscriptionId, subscription);
  return subscription;
}

/**
 * Cancel subscription
 */
export function cancelSubscription(subscriptionId: string, immediate: boolean = false): Subscription | null {
  const subscription = subscriptions.get(subscriptionId);
  if (!subscription) return null;
  
  subscription.cancelledAt = new Date();
  subscription.autoRenew = false;
  
  if (immediate) {
    subscription.status = 'cancelled';
    subscription.currentPeriodEnd = new Date();
  } else {
    // Cancel at end of current period
    subscription.status = 'active'; // Still active until period ends
  }
  
  subscriptions.set(subscriptionId, subscription);
  return subscription;
}

/**
 * Process subscription renewal
 */
export function processRenewal(subscriptionId: string): { success: boolean; order?: { id: string; total: number }; error?: string } {
  const subscription = subscriptions.get(subscriptionId);
  if (!subscription) return { success: false, error: 'Subscription not found' };
  
  if (subscription.status === 'cancelled' || subscription.status === 'expired') {
    return { success: false, error: 'Subscription is not active' };
  }
  
  if (subscription.cancelledAt && subscription.currentPeriodEnd <= new Date()) {
    subscription.status = 'cancelled';
    subscriptions.set(subscriptionId, subscription);
    return { success: false, error: 'Subscription ended' };
  }
  
  // Create renewal order
  const orderId = `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const orderTotal = subscription.currentPrice;
  
  // Update subscription
  subscription.orderCount++;
  subscription.totalSpent += orderTotal;
  subscription.currentPeriodStart = new Date();
  subscription.currentPeriodEnd = calculateNextBillingDate(new Date(), subscription.billingCycle);
  subscription.nextBillingDate = subscription.currentPeriodEnd;
  
  if (subscription.status === 'trialing' && subscription.trialEndDate && new Date() >= subscription.trialEndDate) {
    subscription.status = 'active';
  }
  
  subscriptions.set(subscriptionId, subscription);
  
  return {
    success: true,
    order: { id: orderId, total: orderTotal },
  };
}

// ============================================================================
// MEMBERSHIP FUNCTIONS
// ============================================================================

/**
 * Create or upgrade membership
 */
export function createMembership(
  customerId: string,
  tier: MembershipTier
): Membership {
  const id = `mem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date();
  
  const membership: Membership = {
    id,
    customerId,
    tier,
    isActive: true,
    startDate: now,
    renewalDate: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
    pointsBalance: 0,
    lifetimePoints: 0,
    activeBenefits: membershipTiers[tier],
    totalSaved: 0,
    ordersThisYear: 0,
    spentThisYear: 0,
  };
  
  memberships.set(customerId, membership);
  return membership;
}

/**
 * Upgrade membership tier
 */
export function upgradeMembership(customerId: string, newTier: MembershipTier): Membership | null {
  const membership = memberships.get(customerId);
  if (!membership) return null;
  
  const tierOrder: MembershipTier[] = ['basic', 'plus', 'premium', 'elite', 'founder'];
  const currentIndex = tierOrder.indexOf(membership.tier);
  const newIndex = tierOrder.indexOf(newTier);
  
  if (newIndex <= currentIndex) {
    return null; // Can't downgrade or stay same
  }
  
  membership.tier = newTier;
  membership.activeBenefits = membershipTiers[newTier];
  
  memberships.set(customerId, membership);
  return membership;
}

/**
 * Add points to membership
 */
export function addMembershipPoints(customerId: string, points: number): Membership | null {
  const membership = memberships.get(customerId);
  if (!membership) return null;
  
  // Apply points multiplier
  const multiplier = membership.activeBenefits.find(b => b.bonusPointsMultiplier)?.bonusPointsMultiplier || 1;
  const earnedPoints = Math.floor(points * multiplier);
  
  membership.pointsBalance += earnedPoints;
  membership.lifetimePoints += earnedPoints;
  
  memberships.set(customerId, membership);
  return membership;
}

/**
 * Redeem points
 */
export function redeemPoints(customerId: string, points: number): { success: boolean; discountValue?: number } {
  const membership = memberships.get(customerId);
  if (!membership || membership.pointsBalance < points) {
    return { success: false };
  }
  
  // 100 points = $1 value
  const discountValue = points / 100;
  membership.pointsBalance -= points;
  
  memberships.set(customerId, membership);
  return { success: true, discountValue };
}

/**
 * Get membership benefits for checkout
 */
export function getMembershipBenefits(customerId: string): {
  discount: number;
  freeShipping: boolean;
  freeShippingThreshold: number;
  pointsMultiplier: number;
} {
  const membership = memberships.get(customerId);
  
  if (!membership || !membership.isActive) {
    return {
      discount: 0,
      freeShipping: false,
      freeShippingThreshold: 75,
      pointsMultiplier: 1,
    };
  }
  
  const benefits = membership.activeBenefits;
  
  return {
    discount: benefits.find(b => b.discountPercent)?.discountPercent || 0,
    freeShipping: (benefits.find(b => b.freeShippingThreshold !== undefined)?.freeShippingThreshold || 999) === 0,
    freeShippingThreshold: benefits.find(b => b.freeShippingThreshold !== undefined)?.freeShippingThreshold || 75,
    pointsMultiplier: benefits.find(b => b.bonusPointsMultiplier)?.bonusPointsMultiplier || 1,
  };
}

// ============================================================================
// SUBSCRIPTION BOX FUNCTIONS
// ============================================================================

/**
 * Create a subscription box
 */
export function createSubscriptionBox(
  name: string,
  items: SubscriptionItem[],
  options?: {
    description?: string;
    theme?: string;
    curatorNotes?: string;
    shipsOn?: Date;
    isCustomizable?: boolean;
  }
): SubscriptionBox {
  const id = `box-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const totalValue = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const boxPrice = totalValue * 0.85; // 15% savings
  const savings = totalValue - boxPrice;
  
  const shipsOn = options?.shipsOn || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  
  const box: SubscriptionBox = {
    id,
    name,
    description: options?.description || '',
    theme: options?.theme,
    isCurated: true,
    curatorNotes: options?.curatorNotes,
    items,
    totalValue,
    boxPrice,
    savings,
    shipsOn,
    deliveryEstimate: new Date(shipsOn.getTime() + 5 * 24 * 60 * 60 * 1000),
    isCustomizable: options?.isCustomizable ?? true,
    customizationDeadline: options?.isCustomizable 
      ? new Date(shipsOn.getTime() - 3 * 24 * 60 * 60 * 1000)
      : undefined,
  };
  
  subscriptionBoxes.set(id, box);
  return box;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateNextBillingDate(from: Date, cycle: BillingCycle): Date {
  const next = new Date(from);
  
  switch (cycle) {
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'biweekly':
      next.setDate(next.getDate() + 14);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'quarterly':
      next.setMonth(next.getMonth() + 3);
      break;
    case 'annually':
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  
  return next;
}

// ============================================================================
// ANALYTICS
// ============================================================================

export function getSubscriptionAnalytics(): SubscriptionAnalytics {
  const allSubs = Array.from(subscriptions.values());
  const activeSubs = allSubs.filter(s => s.status === 'active' || s.status === 'trialing');
  
  // Calculate MRR (normalize all to monthly)
  const cycleToMonthlyMultiplier: Record<BillingCycle, number> = {
    weekly: 4.33,
    biweekly: 2.17,
    monthly: 1,
    quarterly: 0.33,
    annually: 0.083,
  };
  
  const monthlyRecurringRevenue = activeSubs.reduce((sum, s) => {
    return sum + (s.currentPrice * cycleToMonthlyMultiplier[s.billingCycle]);
  }, 0);
  
  const annualRecurringRevenue = monthlyRecurringRevenue * 12;
  const avgSubscriptionValue = activeSubs.length > 0 
    ? monthlyRecurringRevenue / activeSubs.length 
    : 0;
  
  // Churn calculation (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const churned = allSubs.filter(s => s.cancelledAt && s.cancelledAt >= thirtyDaysAgo);
  const churnRate = activeSubs.length > 0 ? churned.length / (activeSubs.length + churned.length) : 0;
  
  // At-risk subscriptions (high skip count, long time since order)
  const atRisk = activeSubs.filter(s => s.skippedCount >= 2 || s.orderCount === 0);
  
  // New subscriptions this month
  const newThisMonth = activeSubs.filter(s => s.startDate >= thirtyDaysAgo);
  
  // Group by plan
  const subscriptionsByPlan = new Map<string, number>();
  const revenueByPlan = new Map<string, number>();
  activeSubs.forEach(s => {
    subscriptionsByPlan.set(s.planId, (subscriptionsByPlan.get(s.planId) || 0) + 1);
    revenueByPlan.set(s.planId, (revenueByPlan.get(s.planId) || 0) + s.currentPrice);
  });
  
  // Group by cycle
  const subscriptionsByCycle = new Map<BillingCycle, number>();
  activeSubs.forEach(s => {
    subscriptionsByCycle.set(s.billingCycle, (subscriptionsByCycle.get(s.billingCycle) || 0) + 1);
  });
  
  // Retention (mock data for cohort analysis)
  const retentionByMonth = [100, 85, 75, 68, 62, 58, 55, 52, 50, 48, 46, 45];
  
  // Average subscription duration
  const avgDuration = activeSubs.reduce((sum, s) => {
    return sum + (new Date().getTime() - s.startDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
  }, 0) / (activeSubs.length || 1);
  
  return {
    totalActiveSubscriptions: activeSubs.length,
    monthlyRecurringRevenue,
    annualRecurringRevenue,
    avgSubscriptionValue,
    churnRate,
    churnedThisMonth: churned.length,
    atRiskSubscriptions: atRisk.length,
    newSubscriptionsThisMonth: newThisMonth.length,
    reactivatedThisMonth: 0, // Would track separately
    growthRate: activeSubs.length > 0 ? (newThisMonth.length - churned.length) / activeSubs.length : 0,
    subscriptionsByPlan,
    revenueByPlan,
    subscriptionsByCycle,
    retentionByMonth,
    avgSubscriptionDuration: avgDuration,
  };
}

// ============================================================================
// DATA ACCESS
// ============================================================================

export function getSubscription(id: string): Subscription | undefined {
  return subscriptions.get(id);
}

export function getCustomerSubscriptions(customerId: string): Subscription[] {
  return Array.from(subscriptions.values()).filter(s => s.customerId === customerId);
}

export function getMembership(customerId: string): Membership | undefined {
  return memberships.get(customerId);
}

export function getSubscriptionPlan(id: string): SubscriptionPlan | undefined {
  return subscriptionPlans.get(id);
}

export function getAllPlans(): SubscriptionPlan[] {
  return Array.from(subscriptionPlans.values());
}

export function getSubscriptionBox(id: string): SubscriptionBox | undefined {
  return subscriptionBoxes.get(id);
}

// ============================================================================
// MOCK DATA
// ============================================================================

export function generateMockSubscriptionData(): {
  subscriptions: Subscription[];
  memberships: Membership[];
  plans: SubscriptionPlan[];
  boxes: SubscriptionBox[];
  analytics: SubscriptionAnalytics;
} {
  // Create mock plans
  const mockPlans: SubscriptionPlan[] = [
    {
      id: 'plan-essentials',
      name: 'Essentials Box',
      description: 'Monthly curated essentials for everyday life',
      billingCycles: ['monthly', 'quarterly', 'annually'],
      defaultCycle: 'monthly',
      basePrice: 29.99,
      pricePerCycle: { weekly: 0, biweekly: 0, monthly: 29.99, quarterly: 79.99, annually: 299.99 },
      savingsPerCycle: { weekly: 0, biweekly: 0, monthly: 0, quarterly: 10, annually: 60 },
      features: ['5-7 curated items', 'Free shipping', 'Exclusive products'],
      includedProducts: [],
      maxItems: 7,
      trialDays: 0,
      benefits: [
        { id: 'ess-discount', name: '10% Member Discount', description: 'On all additional purchases', type: 'discount', value: 10 },
        { id: 'ess-shipping', name: 'Free Shipping', description: 'On subscription orders', type: 'free_shipping' },
      ],
    },
    {
      id: 'plan-premium',
      name: 'Premium Box',
      description: 'Luxury curated box with premium products',
      billingCycles: ['monthly', 'quarterly'],
      defaultCycle: 'monthly',
      basePrice: 79.99,
      pricePerCycle: { weekly: 0, biweekly: 0, monthly: 79.99, quarterly: 219.99, annually: 0 },
      savingsPerCycle: { weekly: 0, biweekly: 0, monthly: 0, quarterly: 20, annually: 0 },
      features: ['10-12 premium items', 'Priority shipping', 'Early access', 'Exclusive member events'],
      includedProducts: [],
      maxItems: 12,
      trialDays: 7,
      benefits: [
        { id: 'prem-discount', name: '20% Member Discount', description: 'On all purchases', type: 'discount', value: 20 },
        { id: 'prem-early', name: 'Early Access', description: 'New product launches', type: 'early_access' },
      ],
    },
  ];
  
  mockPlans.forEach(p => subscriptionPlans.set(p.id, p));
  
  // Create mock subscriptions
  const statuses: SubscriptionStatus[] = ['active', 'active', 'active', 'paused', 'trialing'];
  const cycles: BillingCycle[] = ['monthly', 'monthly', 'quarterly', 'monthly', 'annually'];
  
  for (let i = 0; i < 30; i++) {
    const items: SubscriptionItem[] = [
      {
        productId: `prod-sub-${i}-1`,
        title: ['Premium Moisturizer', 'Organic Serum', 'Daily Vitamins', 'Protein Powder', 'Essential Oil Set'][i % 5],
        quantity: 1,
        price: [24.99, 34.99, 19.99, 44.99, 29.99][i % 5],
        isCustomizable: true,
        swappableWith: [`prod-sub-${i}-alt1`, `prod-sub-${i}-alt2`],
      },
    ];
    
    const startDate = new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000);
    
    createSubscription(
      `cust-sub-${i}`,
      `subscriber${i}@example.com`,
      mockPlans[i % 2].id,
      cycles[i % cycles.length],
      items,
      {
        customerName: ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'][i % 5],
        discountPercent: i % 4 === 0 ? 10 : 0,
      }
    );
    
    // Set various statuses
    const sub = Array.from(subscriptions.values())[i];
    sub.status = statuses[i % statuses.length];
    sub.startDate = startDate;
    sub.orderCount = Math.floor(Math.random() * 10);
    sub.totalSpent = sub.orderCount * sub.currentPrice;
    subscriptions.set(sub.id, sub);
  }
  
  // Create mock memberships
  const tiers: MembershipTier[] = ['basic', 'plus', 'premium', 'elite', 'founder'];
  
  for (let i = 0; i < 20; i++) {
    const membership = createMembership(`cust-mem-${i}`, tiers[i % tiers.length]);
    membership.pointsBalance = Math.floor(Math.random() * 5000);
    membership.lifetimePoints = membership.pointsBalance + Math.floor(Math.random() * 10000);
    membership.totalSaved = Math.floor(Math.random() * 500);
    membership.ordersThisYear = Math.floor(Math.random() * 20);
    membership.spentThisYear = membership.ordersThisYear * (50 + Math.random() * 100);
    memberships.set(membership.customerId, membership);
  }
  
  // Create mock subscription boxes
  const boxes: SubscriptionBox[] = [
    createSubscriptionBox('February Wellness Box', [
      { productId: 'box-item-1', title: 'Organic Green Tea', quantity: 1, price: 12.99, isCustomizable: true },
      { productId: 'box-item-2', title: 'Aromatherapy Candle', quantity: 1, price: 18.99, isCustomizable: true },
      { productId: 'box-item-3', title: 'Mindfulness Journal', quantity: 1, price: 14.99, isCustomizable: false },
      { productId: 'box-item-4', title: 'Herbal Bath Salts', quantity: 1, price: 9.99, isCustomizable: true },
    ], {
      theme: 'Self-Care & Wellness',
      description: 'Start your wellness journey with our curated February box',
      curatorNotes: 'This month we focused on relaxation and mindfulness.',
    }),
    createSubscriptionBox('Tech Enthusiast Box', [
      { productId: 'box-item-5', title: 'Wireless Earbuds', quantity: 1, price: 49.99, isCustomizable: false },
      { productId: 'box-item-6', title: 'Phone Stand', quantity: 1, price: 19.99, isCustomizable: true },
      { productId: 'box-item-7', title: 'Cable Organizer', quantity: 1, price: 12.99, isCustomizable: true },
    ], {
      theme: 'Tech & Gadgets',
      description: 'Latest tech accessories for the modern professional',
    }),
  ];
  
  return {
    subscriptions: Array.from(subscriptions.values()),
    memberships: Array.from(memberships.values()),
    plans: mockPlans,
    boxes,
    analytics: getSubscriptionAnalytics(),
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Subscription management
  createSubscription,
  updateSubscriptionItems,
  swapSubscriptionItem,
  skipNextDelivery,
  pauseSubscription,
  resumeSubscription,
  cancelSubscription,
  processRenewal,
  // Membership management
  createMembership,
  upgradeMembership,
  addMembershipPoints,
  redeemPoints,
  getMembershipBenefits,
  // Subscription boxes
  createSubscriptionBox,
  // Data access
  getSubscription,
  getCustomerSubscriptions,
  getMembership,
  getSubscriptionPlan,
  getAllPlans,
  getSubscriptionBox,
  // Analytics
  getSubscriptionAnalytics,
  // Mock
  generateMockSubscriptionData,
};
