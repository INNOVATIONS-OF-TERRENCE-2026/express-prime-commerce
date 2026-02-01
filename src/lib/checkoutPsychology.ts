/**
 * Checkout Psychology Layer - Pre-Checkout Confidence System
 * 
 * Dominates the moment BEFORE checkout with:
 * - AI reassurance copy
 * - Hesitation detection
 * - Loss-aversion visuals
 * - Trust collapse mechanism
 * 
 * No popups. No pressure tactics. Pure psychology.
 * 
 * @module checkoutPsychology
 * @version 1.0.0
 */

// ============================================================================
// TYPES
// ============================================================================

export interface HesitationMetrics {
  scrollPauses: number;
  priceHoverTime: number; // ms
  cartDwellTime: number; // ms
  checkoutButtonHovers: number;
  backNavigations: number;
}

export interface ConfidenceSignals {
  purchaseConfidence: 'high' | 'medium' | 'low';
  returnLikelihood: 'low' | 'medium' | 'high';
  completionRate: number; // 0-100
  popularitySignal: string;
}

export interface LossAversionCopy {
  availability: string;
  demand: string;
  timeContext: string;
}

export type NudgeType = 
  | 'confidence-boost'
  | 'completion-time'
  | 'trust-signal'
  | 'demand-indicator';

export interface CheckoutNudge {
  type: NudgeType;
  message: string;
  icon: string;
  priority: number;
}

// ============================================================================
// HESITATION DETECTION
// ============================================================================

let hesitationData: HesitationMetrics = {
  scrollPauses: 0,
  priceHoverTime: 0,
  cartDwellTime: 0,
  checkoutButtonHovers: 0,
  backNavigations: 0,
};

let cartEntryTime: number | null = null;
let priceHoverStart: number | null = null;

/**
 * Record cart page entry
 */
export function recordCartEntry(): void {
  cartEntryTime = Date.now();
}

/**
 * Record cart page exit
 */
export function recordCartExit(): number {
  if (cartEntryTime) {
    hesitationData.cartDwellTime += Date.now() - cartEntryTime;
    cartEntryTime = null;
  }
  return hesitationData.cartDwellTime;
}

/**
 * Record scroll pause
 */
export function recordScrollPause(): void {
  hesitationData.scrollPauses++;
}

/**
 * Start price hover tracking
 */
export function startPriceHover(): void {
  priceHoverStart = Date.now();
}

/**
 * End price hover tracking
 */
export function endPriceHover(): void {
  if (priceHoverStart) {
    hesitationData.priceHoverTime += Date.now() - priceHoverStart;
    priceHoverStart = null;
  }
}

/**
 * Record checkout button hover
 */
export function recordCheckoutHover(): void {
  hesitationData.checkoutButtonHovers++;
}

/**
 * Record back navigation
 */
export function recordBackNavigation(): void {
  hesitationData.backNavigations++;
}

/**
 * Get current hesitation metrics
 */
export function getHesitationMetrics(): HesitationMetrics {
  // Include ongoing cart dwell time
  const currentDwell = cartEntryTime 
    ? hesitationData.cartDwellTime + (Date.now() - cartEntryTime)
    : hesitationData.cartDwellTime;

  return {
    ...hesitationData,
    cartDwellTime: currentDwell,
  };
}

/**
 * Reset hesitation tracking
 */
export function resetHesitation(): void {
  hesitationData = {
    scrollPauses: 0,
    priceHoverTime: 0,
    cartDwellTime: 0,
    checkoutButtonHovers: 0,
    backNavigations: 0,
  };
  cartEntryTime = null;
  priceHoverStart = null;
}

/**
 * Calculate hesitation score (0-100)
 */
export function calculateHesitationScore(): number {
  const metrics = getHesitationMetrics();
  
  let score = 0;
  
  // Price hover contributes heavily
  if (metrics.priceHoverTime > 3000) score += 25;
  else if (metrics.priceHoverTime > 1500) score += 15;
  else if (metrics.priceHoverTime > 500) score += 5;
  
  // Cart dwell time
  if (metrics.cartDwellTime > 120000) score += 30; // 2+ minutes
  else if (metrics.cartDwellTime > 60000) score += 20; // 1+ minute
  else if (metrics.cartDwellTime > 30000) score += 10;
  
  // Checkout hover without clicking
  score += Math.min(metrics.checkoutButtonHovers * 5, 20);
  
  // Scroll pauses
  score += Math.min(metrics.scrollPauses * 3, 15);
  
  // Back navigations are strong signals
  score += Math.min(metrics.backNavigations * 10, 20);
  
  return Math.min(score, 100);
}

/**
 * Check if user is hesitating
 */
export function isHesitating(threshold: number = 40): boolean {
  return calculateHesitationScore() >= threshold;
}

// ============================================================================
// CONFIDENCE ENGINE
// ============================================================================

/**
 * Generate confidence signals for cart items
 */
export function generateConfidenceSignals(
  cartValue: number,
  itemCount: number,
  avgItemRating?: number
): ConfidenceSignals {
  // Simulate AI confidence calculation
  const baseConfidence = avgItemRating 
    ? avgItemRating >= 4 ? 'high' : avgItemRating >= 3 ? 'medium' : 'low'
    : 'medium';

  const returnLikelihood = cartValue > 200 
    ? 'low' 
    : cartValue > 50 
      ? 'medium' 
      : 'high';

  // Completion rate based on cart value and items
  const completionRate = Math.min(
    70 + (cartValue / 10) + (itemCount * 5),
    98
  );

  // Popularity signal
  const popularitySignal = completionRate > 85
    ? 'Frequently completed purchase'
    : completionRate > 70
      ? 'Popular cart combination'
      : 'Good selection';

  return {
    purchaseConfidence: baseConfidence,
    returnLikelihood,
    completionRate: Math.round(completionRate),
    popularitySignal,
  };
}

/**
 * Get AI reassurance copy based on confidence
 */
export function getReassuranceCopy(signals: ConfidenceSignals): string[] {
  const copy: string[] = [];

  if (signals.purchaseConfidence === 'high') {
    copy.push('High purchase confidence');
  } else if (signals.purchaseConfidence === 'medium') {
    copy.push('Good product selection');
  }

  if (signals.returnLikelihood === 'low') {
    copy.push('Low return likelihood');
  }

  if (signals.completionRate > 80) {
    copy.push(signals.popularitySignal);
  }

  return copy;
}

// ============================================================================
// LOSS AVERSION
// ============================================================================

/**
 * Generate loss-aversion copy (subtle, not aggressive)
 */
export function generateLossAversionCopy(
  inventoryLevel?: number,
  dailyViews?: number
): LossAversionCopy {
  // Subtle availability messaging
  const availability = inventoryLevel && inventoryLevel < 10
    ? 'Limited availability'
    : inventoryLevel && inventoryLevel < 50
      ? 'Availability may change'
      : '';

  // Demand indicator
  const demand = dailyViews && dailyViews > 100
    ? 'High demand today'
    : dailyViews && dailyViews > 50
      ? 'Growing interest'
      : '';

  // Time context (subtle)
  const hour = new Date().getHours();
  const timeContext = hour >= 10 && hour <= 22
    ? 'Peak shopping hours'
    : '';

  return {
    availability,
    demand,
    timeContext,
  };
}

// ============================================================================
// CHECKOUT NUDGES
// ============================================================================

/**
 * Get appropriate nudge based on hesitation level
 */
export function getCheckoutNudge(hesitationScore: number): CheckoutNudge | null {
  // Only show nudge if hesitating
  if (hesitationScore < 30) return null;

  if (hesitationScore >= 70) {
    return {
      type: 'confidence-boost',
      message: 'Most buyers complete checkout within minutes',
      icon: 'check-circle',
      priority: 1,
    };
  }

  if (hesitationScore >= 50) {
    return {
      type: 'trust-signal',
      message: 'Secure checkout • Easy returns',
      icon: 'shield',
      priority: 2,
    };
  }

  if (hesitationScore >= 30) {
    return {
      type: 'completion-time',
      message: 'Quick checkout • 2 minutes or less',
      icon: 'clock',
      priority: 3,
    };
  }

  return null;
}

// ============================================================================
// TRUST COLLAPSE DATA
// ============================================================================

export interface TrustCollapseData {
  secureCheckout: {
    icon: string;
    label: string;
    detail: string;
  };
  shipping: {
    icon: string;
    label: string;
    detail: string;
  };
  returns: {
    icon: string;
    label: string;
    detail: string;
  };
}

/**
 * Get trust collapse content
 */
export function getTrustCollapseData(): TrustCollapseData {
  return {
    secureCheckout: {
      icon: 'shield-check',
      label: 'Secure Checkout',
      detail: '256-bit SSL encryption • PCI compliant',
    },
    shipping: {
      icon: 'truck',
      label: 'Shipping',
      detail: 'Free shipping on orders over $50 • 2-5 business days',
    },
    returns: {
      icon: 'rotate-ccw',
      label: 'Easy Returns',
      detail: '30-day hassle-free returns • Free return shipping',
    },
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Hesitation
  recordCartEntry,
  recordCartExit,
  recordScrollPause,
  startPriceHover,
  endPriceHover,
  recordCheckoutHover,
  recordBackNavigation,
  getHesitationMetrics,
  resetHesitation,
  calculateHesitationScore,
  isHesitating,
  // Confidence
  generateConfidenceSignals,
  getReassuranceCopy,
  // Loss Aversion
  generateLossAversionCopy,
  // Nudges
  getCheckoutNudge,
  // Trust
  getTrustCollapseData,
};
