/**
 * Operational Intelligence Scorer
 * 
 * "How prepared is the store to scale without breaking?"
 * 
 * Inputs:
 * - Payment readiness
 * - Checkout reliability
 * - Inventory consistency
 * - Failure fallback coverage
 * 
 * @module storeIQ/operationalIntelligence
 */

import type { OperationalIntelligence, OperationalMetrics } from './types';

// ============================================================================
// CONSTANTS
// ============================================================================

const WEIGHTS = {
  paymentReadiness: 0.25,
  checkoutReliability: 0.30,
  inventoryConsistency: 0.25,
  failureFallback: 0.20,
};

// Benchmarks
const BENCHMARKS = {
  minPaymentMethods: 2,
  optimalPaymentMethods: 4,
  checkoutSuccessRate: 0.95, // 95% is excellent
  minInventoryLevel: 20,
  optimalInventoryLevel: 100,
  minFallbackSuppliers: 1,
  optimalFallbackSuppliers: 3,
};

// ============================================================================
// CALCULATIONS
// ============================================================================

/**
 * Calculate payment readiness score
 */
function calculatePaymentReadiness(paymentMethodsActive: number): number {
  if (paymentMethodsActive >= BENCHMARKS.optimalPaymentMethods) {
    return 100;
  }
  
  if (paymentMethodsActive >= BENCHMARKS.minPaymentMethods) {
    const range = BENCHMARKS.optimalPaymentMethods - BENCHMARKS.minPaymentMethods;
    const position = paymentMethodsActive - BENCHMARKS.minPaymentMethods;
    return Math.round(70 + (position / range) * 30);
  }

  // Below minimum
  return Math.round((paymentMethodsActive / BENCHMARKS.minPaymentMethods) * 70);
}

/**
 * Calculate checkout reliability score
 */
function calculateCheckoutReliability(checkoutSuccessRate: number): number {
  // Scale: 90% = 70 score, 95% = 85 score, 98%+ = 100 score
  if (checkoutSuccessRate >= 0.98) return 100;
  if (checkoutSuccessRate >= 0.95) {
    return Math.round(85 + ((checkoutSuccessRate - 0.95) / 0.03) * 15);
  }
  if (checkoutSuccessRate >= 0.90) {
    return Math.round(70 + ((checkoutSuccessRate - 0.90) / 0.05) * 15);
  }
  if (checkoutSuccessRate >= 0.80) {
    return Math.round(50 + ((checkoutSuccessRate - 0.80) / 0.10) * 20);
  }
  
  return Math.round(checkoutSuccessRate * 62.5); // Below 80%
}

/**
 * Calculate inventory consistency score
 */
function calculateInventoryConsistency(avgInventoryLevel: number): number {
  if (avgInventoryLevel >= BENCHMARKS.optimalInventoryLevel) {
    return 100;
  }

  if (avgInventoryLevel >= BENCHMARKS.minInventoryLevel) {
    const range = BENCHMARKS.optimalInventoryLevel - BENCHMARKS.minInventoryLevel;
    const position = avgInventoryLevel - BENCHMARKS.minInventoryLevel;
    return Math.round(60 + (position / range) * 40);
  }

  // Below minimum - concerning
  return Math.round((avgInventoryLevel / BENCHMARKS.minInventoryLevel) * 60);
}

/**
 * Calculate failure fallback coverage score
 */
function calculateFailureFallback(fallbackSupplierCount: number): number {
  if (fallbackSupplierCount >= BENCHMARKS.optimalFallbackSuppliers) {
    return 100;
  }

  if (fallbackSupplierCount >= BENCHMARKS.minFallbackSuppliers) {
    const range = BENCHMARKS.optimalFallbackSuppliers - BENCHMARKS.minFallbackSuppliers;
    const position = fallbackSupplierCount - BENCHMARKS.minFallbackSuppliers;
    return Math.round(65 + (position / range) * 35);
  }

  // No fallback suppliers - risky
  return fallbackSupplierCount === 0 ? 30 : 50;
}

// ============================================================================
// INSIGHTS GENERATOR
// ============================================================================

function generateInsights(
  paymentReadiness: number,
  checkoutReliability: number,
  inventoryConsistency: number,
  failureFallback: number,
  metrics: OperationalMetrics
): string[] {
  const insights: string[] = [];

  // Payment readiness insights
  if (paymentReadiness >= 90) {
    insights.push(`${metrics.paymentMethodsActive} payment methods active - excellent coverage`);
  } else if (paymentReadiness <= 60) {
    insights.push('Add more payment methods to reduce checkout friction');
  }

  // Checkout reliability insights
  if (checkoutReliability >= 90) {
    insights.push(`${Math.round(metrics.checkoutSuccessRate * 100)}% checkout success rate - excellent`);
  } else if (checkoutReliability <= 70) {
    insights.push('Checkout reliability needs attention - investigate failed transactions');
  }

  // Inventory insights
  if (inventoryConsistency >= 80) {
    insights.push('Inventory levels healthy across catalog');
  } else if (inventoryConsistency <= 50) {
    insights.push('Inventory consistency is low - risk of stockouts');
  }

  // Fallback insights
  if (failureFallback >= 80) {
    insights.push(`${metrics.fallbackSupplierCount} fallback suppliers configured - resilient setup`);
  } else if (failureFallback <= 50) {
    insights.push('Limited fallback suppliers - add backups for reliability');
  }

  return insights;
}

// ============================================================================
// MAIN CALCULATOR
// ============================================================================

export function calculateOperationalIntelligence(
  metrics: OperationalMetrics
): OperationalIntelligence {
  const paymentReadiness = calculatePaymentReadiness(metrics.paymentMethodsActive);
  const checkoutReliability = calculateCheckoutReliability(metrics.checkoutSuccessRate);
  const inventoryConsistency = calculateInventoryConsistency(metrics.avgInventoryLevel);
  const failureFallbackCoverage = calculateFailureFallback(metrics.fallbackSupplierCount);

  // Weighted composite score
  const score = Math.round(
    (paymentReadiness * WEIGHTS.paymentReadiness) +
    (checkoutReliability * WEIGHTS.checkoutReliability) +
    (inventoryConsistency * WEIGHTS.inventoryConsistency) +
    (failureFallbackCoverage * WEIGHTS.failureFallback)
  );

  const insights = generateInsights(
    paymentReadiness,
    checkoutReliability,
    inventoryConsistency,
    failureFallbackCoverage,
    metrics
  );

  return {
    score,
    paymentReadiness,
    checkoutReliability,
    inventoryConsistency,
    failureFallbackCoverage,
    insights,
  };
}

export default calculateOperationalIntelligence;
