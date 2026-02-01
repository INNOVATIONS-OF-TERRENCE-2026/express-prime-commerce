/**
 * Trust & Risk Intelligence Scorer
 * 
 * "How safe does the store feel to buy from?"
 * 
 * Inputs:
 * - Brand trust score
 * - Price coherence
 * - Return-risk inference
 * - Shipping clarity signals
 * 
 * @module storeIQ/trustIntelligence
 */

import type { TrustIntelligence, ProductDataPoint, OperationalMetrics } from './types';

// ============================================================================
// CONSTANTS
// ============================================================================

const WEIGHTS = {
  brandTrust: 0.30,
  priceCoherence: 0.25,
  returnRisk: 0.20,
  shippingClarity: 0.25,
};

// ============================================================================
// CALCULATIONS
// ============================================================================

/**
 * Calculate brand trust score
 * Based on pricing consistency, product quality signals, and operational reliability
 */
function calculateBrandTrustScore(
  products: ProductDataPoint[],
  operationalMetrics: OperationalMetrics
): number {
  if (products.length === 0) return 50;

  // Factors:
  // 1. Checkout success rate (operational trust)
  const checkoutTrust = operationalMetrics.checkoutSuccessRate * 100;

  // 2. Product quality consistency (AI scores)
  const avgAIScore = products.reduce((sum, p) => sum + p.aiScore, 0) / products.length;

  // 3. Professional pricing (not too many "weird" prices)
  const standardPrices = products.filter(p => {
    const price = p.price;
    // Check for professional pricing (ends in .99, .95, .00, etc.)
    const cents = Math.round((price % 1) * 100);
    return [0, 95, 99, 49, 50].includes(cents);
  }).length;
  const pricingProfessionalism = (standardPrices / products.length) * 100;

  return Math.round(
    (checkoutTrust * 0.4) + 
    (avgAIScore * 0.3) + 
    (pricingProfessionalism * 0.3)
  );
}

/**
 * Calculate price coherence
 * Are prices consistent and sensible within categories?
 */
function calculatePriceCoherence(products: ProductDataPoint[]): number {
  if (products.length <= 1) return 100;

  // Group by category
  const categoryPrices = new Map<string, number[]>();
  products.forEach(p => {
    const prices = categoryPrices.get(p.category) || [];
    prices.push(p.price);
    categoryPrices.set(p.category, prices);
  });

  let coherentCategories = 0;
  let totalCategories = 0;

  categoryPrices.forEach((prices, _category) => {
    if (prices.length < 2) {
      coherentCategories++;
      totalCategories++;
      return;
    }

    totalCategories++;
    
    // Check price range coherence (not too extreme)
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const range = maxPrice - minPrice;
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

    // Range should be less than 5x average
    if (range < avgPrice * 5) {
      coherentCategories++;
    }
  });

  return Math.round((coherentCategories / totalCategories) * 100);
}

/**
 * Calculate return risk inference
 * Lower inferred return risk = higher score
 */
function calculateReturnRiskInference(products: ProductDataPoint[]): number {
  if (products.length === 0) return 70; // Assume moderate if no data

  let lowRiskCount = 0;

  products.forEach(p => {
    // Factors that reduce return risk:
    // 1. High AI score (quality product)
    // 2. Reasonable price (not impulse buy)
    // 3. Good visual presentation (accurate expectations)
    
    const qualityFactor = p.aiScore >= 60 ? 1 : 0.5;
    const priceFactor = p.price >= 20 && p.price <= 200 ? 1 : 0.7;
    const visualFactor = p.visualSaliency >= 50 ? 1 : 0.7;

    const riskScore = qualityFactor * priceFactor * visualFactor;
    if (riskScore >= 0.7) lowRiskCount++;
  });

  return Math.round((lowRiskCount / products.length) * 100);
}

/**
 * Calculate shipping clarity score
 * Clear shipping expectations = higher trust
 */
function calculateShippingClarity(operationalMetrics: OperationalMetrics): number {
  // Factors:
  // 1. Inventory consistency (products actually available)
  const inventoryClarity = Math.min(operationalMetrics.avgInventoryLevel / 50, 1) * 40;

  // 2. Fallback suppliers (backup fulfillment)
  const fallbackClarity = Math.min(operationalMetrics.fallbackSupplierCount / 3, 1) * 30;

  // 3. General checkout reliability (orders go through)
  const checkoutClarity = operationalMetrics.checkoutSuccessRate * 30;

  return Math.round(inventoryClarity + fallbackClarity + checkoutClarity);
}

// ============================================================================
// INSIGHTS GENERATOR
// ============================================================================

function generateInsights(
  brandTrust: number,
  priceCoherence: number,
  returnRisk: number,
  shippingClarity: number
): string[] {
  const insights: string[] = [];

  // Brand trust insights
  if (brandTrust >= 80) {
    insights.push('Strong brand trust signals across all touchpoints');
  } else if (brandTrust <= 50) {
    insights.push('Brand trust signals need improvement - review checkout and product quality');
  }

  // Price coherence insights
  if (priceCoherence >= 80) {
    insights.push('Pricing is coherent and professional across categories');
  } else if (priceCoherence <= 50) {
    insights.push('Price incoherence detected - standardize pricing within categories');
  }

  // Return risk insights
  if (returnRisk >= 75) {
    insights.push('Low inferred return risk across catalog');
  } else if (returnRisk <= 50) {
    insights.push('Higher return risk inferred - improve product descriptions and imagery');
  }

  // Shipping clarity insights
  if (shippingClarity >= 75) {
    insights.push('Clear shipping expectations set for customers');
  } else if (shippingClarity <= 50) {
    insights.push('Shipping clarity needs improvement - add more supplier fallbacks');
  }

  return insights;
}

// ============================================================================
// MAIN CALCULATOR
// ============================================================================

export function calculateTrustIntelligence(
  products: ProductDataPoint[],
  operationalMetrics: OperationalMetrics
): TrustIntelligence {
  const brandTrustScore = calculateBrandTrustScore(products, operationalMetrics);
  const priceCoherence = calculatePriceCoherence(products);
  const returnRiskInference = calculateReturnRiskInference(products);
  const shippingClarityScore = calculateShippingClarity(operationalMetrics);

  // Weighted composite score
  const score = Math.round(
    (brandTrustScore * WEIGHTS.brandTrust) +
    (priceCoherence * WEIGHTS.priceCoherence) +
    (returnRiskInference * WEIGHTS.returnRisk) +
    (shippingClarityScore * WEIGHTS.shippingClarity)
  );

  const insights = generateInsights(
    brandTrustScore,
    priceCoherence,
    returnRiskInference,
    shippingClarityScore
  );

  return {
    score,
    brandTrustScore,
    priceCoherence,
    returnRiskInference,
    shippingClarityScore,
    insights,
  };
}

export default calculateTrustIntelligence;
