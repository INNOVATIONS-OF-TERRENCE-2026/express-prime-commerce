/**
 * Conversion Intelligence Scorer
 * 
 * "How efficiently does traffic turn into revenue?"
 * 
 * Inputs:
 * - Add-to-cart velocity
 * - Checkout completion likelihood
 * - Buyer intent prediction confidence
 * - Drop-off friction signals
 * 
 * @module storeIQ/conversionIntelligence
 */

import type { 
  ConversionIntelligence, 
  ProductDataPoint, 
  CartDataPoint 
} from './types';

// ============================================================================
// CONSTANTS
// ============================================================================

const WEIGHTS = {
  addToCartVelocity: 0.25,
  checkoutCompletion: 0.35,
  buyerIntent: 0.25,
  dropOffFriction: 0.15,
};

// Industry benchmarks
const BENCHMARKS = {
  addToCartRate: 0.08, // 8% is good
  checkoutCompletionRate: 0.65, // 65% of carts complete
  avgBuyerIntent: 0.60, // 60% confidence is baseline
};

// ============================================================================
// CALCULATIONS
// ============================================================================

/**
 * Calculate add-to-cart velocity score
 */
function calculateAddToCartVelocity(
  products: ProductDataPoint[],
  cartData: CartDataPoint[]
): number {
  if (products.length === 0) return 50;

  // Calculate from products if available
  const avgAddToCartRate = products.reduce((sum, p) => sum + p.addToCartRate, 0) / products.length;
  
  // Also factor in recent cart activity
  const recentAdds = cartData.filter(c => 
    c.action === 'add' && 
    (Date.now() - c.timestamp.getTime()) < 24 * 60 * 60 * 1000 // Last 24h
  ).length;

  // Normalize against benchmark
  const rateScore = (avgAddToCartRate / BENCHMARKS.addToCartRate) * 50;
  const velocityScore = Math.min(recentAdds / 10, 1) * 50; // 10 adds/day = max

  return Math.round(Math.min(rateScore + velocityScore, 100));
}

/**
 * Calculate checkout completion likelihood
 */
function calculateCheckoutCompletion(cartData: CartDataPoint[]): number {
  const checkouts = cartData.filter(c => c.action === 'checkout').length;
  const abandons = cartData.filter(c => c.action === 'abandon').length;
  const adds = cartData.filter(c => c.action === 'add').length;

  if (adds === 0) return 50; // No data

  // Completion rate
  const completionRate = adds > 0 ? checkouts / adds : 0;
  
  // Normalize against benchmark
  const normalized = completionRate / BENCHMARKS.checkoutCompletionRate;
  
  return Math.round(Math.min(normalized * 100, 100));
}

/**
 * Calculate buyer intent prediction confidence
 * Based on AI scoring confidence across products
 */
function calculateBuyerIntentConfidence(products: ProductDataPoint[]): number {
  if (products.length === 0) return 50;

  // Use AI scores as proxy for intent prediction
  const avgAIScore = products.reduce((sum, p) => sum + p.aiScore, 0) / products.length;
  
  // Normalize to 0-100
  return Math.round(avgAIScore);
}

/**
 * Calculate drop-off friction score
 * Lower friction = higher score
 */
function calculateDropOffFriction(cartData: CartDataPoint[]): number {
  const adds = cartData.filter(c => c.action === 'add').length;
  const removes = cartData.filter(c => c.action === 'remove').length;
  const abandons = cartData.filter(c => c.action === 'abandon').length;

  if (adds === 0) return 70; // No friction data = assume okay

  // Friction ratio
  const frictionEvents = removes + abandons;
  const frictionRatio = frictionEvents / adds;

  // Lower friction = higher score
  // 0% friction = 100, 50%+ friction = 0
  const score = Math.max(0, 100 - (frictionRatio * 200));

  return Math.round(score);
}

// ============================================================================
// INSIGHTS GENERATOR
// ============================================================================

function generateInsights(
  addToCartVelocity: number,
  checkoutCompletion: number,
  buyerIntent: number,
  dropOffFriction: number
): string[] {
  const insights: string[] = [];

  // Add-to-cart insights
  if (addToCartVelocity >= 75) {
    insights.push('Strong add-to-cart velocity indicates high product appeal');
  } else if (addToCartVelocity <= 40) {
    insights.push('Low add-to-cart rate - review product presentation and pricing');
  }

  // Checkout completion insights
  if (checkoutCompletion >= 80) {
    insights.push('Excellent checkout completion rate - minimal checkout friction');
  } else if (checkoutCompletion <= 50) {
    insights.push('Checkout completion below benchmark - review checkout UX');
  }

  // Buyer intent insights
  if (buyerIntent >= 70) {
    insights.push('High buyer intent signals across catalog');
  } else if (buyerIntent <= 45) {
    insights.push('Buyer intent predictions show uncertainty - improve product clarity');
  }

  // Friction insights
  if (dropOffFriction >= 80) {
    insights.push('Low cart abandonment and removal friction');
  } else if (dropOffFriction <= 50) {
    insights.push('High drop-off friction detected - investigate cart abandonment causes');
  }

  return insights;
}

// ============================================================================
// MAIN CALCULATOR
// ============================================================================

export function calculateConversionIntelligence(
  products: ProductDataPoint[],
  cartData: CartDataPoint[]
): ConversionIntelligence {
  const addToCartVelocity = calculateAddToCartVelocity(products, cartData);
  const checkoutCompletionRate = calculateCheckoutCompletion(cartData);
  const buyerIntentConfidence = calculateBuyerIntentConfidence(products);
  const dropOffFriction = calculateDropOffFriction(cartData);

  // Weighted composite score
  const score = Math.round(
    (addToCartVelocity * WEIGHTS.addToCartVelocity) +
    (checkoutCompletionRate * WEIGHTS.checkoutCompletion) +
    (buyerIntentConfidence * WEIGHTS.buyerIntent) +
    (dropOffFriction * WEIGHTS.dropOffFriction)
  );

  const insights = generateInsights(
    addToCartVelocity,
    checkoutCompletionRate,
    buyerIntentConfidence,
    dropOffFriction
  );

  return {
    score,
    addToCartVelocity,
    checkoutCompletionRate,
    buyerIntentConfidence,
    dropOffFriction,
    insights,
  };
}

export default calculateConversionIntelligence;
