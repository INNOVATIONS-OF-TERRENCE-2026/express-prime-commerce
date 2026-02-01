/**
 * Scale Intelligence Scorer
 * 
 * "How far can this platform grow without structural risk?"
 * 
 * Inputs:
 * - SKU expansion headroom
 * - AI automation coverage
 * - Margin defensibility
 * - Frontend adaptability
 * 
 * @module storeIQ/scaleIntelligence
 */

import type { ScaleIntelligence, ProductDataPoint, OperationalMetrics } from './types';

// ============================================================================
// CONSTANTS
// ============================================================================

const WEIGHTS = {
  skuHeadroom: 0.25,
  aiAutomation: 0.30,
  marginDefensibility: 0.25,
  frontendAdaptability: 0.20,
};

// Benchmarks
const BENCHMARKS = {
  optimalSkuCount: 500, // Good variety
  maxSkuCount: 2000, // Before complexity issues
  minMargin: 0.20, // 20% minimum
  optimalMargin: 0.40, // 40% is healthy
};

// ============================================================================
// CALCULATIONS
// ============================================================================

/**
 * Calculate SKU expansion headroom
 * Room to add more products without complexity overload
 */
function calculateSkuExpansionHeadroom(productCount: number): number {
  if (productCount <= BENCHMARKS.optimalSkuCount) {
    // Lots of room to grow
    return 100;
  }

  if (productCount <= BENCHMARKS.maxSkuCount) {
    // Some room left
    const range = BENCHMARKS.maxSkuCount - BENCHMARKS.optimalSkuCount;
    const position = productCount - BENCHMARKS.optimalSkuCount;
    return Math.round(100 - (position / range) * 50);
  }

  // Over capacity - need consolidation
  return Math.max(20, 50 - ((productCount - BENCHMARKS.maxSkuCount) / 500) * 10);
}

/**
 * Calculate AI automation coverage
 * What percentage of decisions are AI-assisted?
 */
function calculateAIAutomationCoverage(
  products: ProductDataPoint[],
  operationalMetrics: OperationalMetrics
): number {
  // Base coverage from operational metrics
  const baseCoverage = operationalMetrics.aiCoveragePercent;

  // Boost if products have AI scores
  const productsWithAI = products.filter(p => p.aiScore > 0).length;
  const aiProductCoverage = products.length > 0 
    ? (productsWithAI / products.length) * 100 
    : 50;

  // Combined score
  return Math.round((baseCoverage * 0.6) + (aiProductCoverage * 0.4));
}

/**
 * Calculate margin defensibility
 * Can margins be protected under competitive pressure?
 */
function calculateMarginDefensibility(products: ProductDataPoint[]): number {
  if (products.length === 0) return 50;

  let defendableProducts = 0;

  products.forEach(p => {
    if (p.compareAtPrice && p.compareAtPrice > 0) {
      const margin = (p.compareAtPrice - p.price) / p.compareAtPrice;
      
      if (margin >= BENCHMARKS.optimalMargin) {
        // Excellent margin - very defensible
        defendableProducts += 1;
      } else if (margin >= BENCHMARKS.minMargin) {
        // Acceptable margin - somewhat defensible
        defendableProducts += 0.7;
      } else {
        // Low margin - hard to defend
        defendableProducts += 0.3;
      }
    } else {
      // No compare at price - assume moderate margin
      defendableProducts += 0.5;
    }
  });

  return Math.round((defendableProducts / products.length) * 100);
}

/**
 * Calculate frontend adaptability
 * How flexible is the UI for different product types and scales?
 */
function calculateFrontendAdaptability(
  products: ProductDataPoint[],
  operationalMetrics: OperationalMetrics
): number {
  // Factors:
  // 1. Category diversity (UI handles multiple types)
  const categories = new Set(products.map(p => p.category)).size;
  const categoryScore = Math.min(categories / 10, 1) * 40;

  // 2. AI integration depth
  const aiScore = operationalMetrics.aiCoveragePercent * 0.4;

  // 3. Product count handling (assumed if we got here)
  const scaleScore = products.length > 20 ? 20 : (products.length / 20) * 20;

  return Math.round(categoryScore + aiScore + scaleScore);
}

// ============================================================================
// INSIGHTS GENERATOR
// ============================================================================

function generateInsights(
  skuHeadroom: number,
  aiAutomation: number,
  marginDefensibility: number,
  frontendAdaptability: number,
  productCount: number
): string[] {
  const insights: string[] = [];

  // SKU headroom insights
  if (skuHeadroom >= 80) {
    insights.push(`Strong SKU expansion headroom (${productCount} products)`);
  } else if (skuHeadroom <= 50) {
    insights.push('Approaching SKU complexity limits - consider curation');
  }

  // AI automation insights
  if (aiAutomation >= 80) {
    insights.push('High AI automation coverage - ready for scale');
  } else if (aiAutomation <= 50) {
    insights.push('Increase AI automation to reduce manual overhead at scale');
  }

  // Margin insights
  if (marginDefensibility >= 75) {
    insights.push('Strong margin defensibility across catalog');
  } else if (marginDefensibility <= 45) {
    insights.push('Margin pressure risk - focus on value differentiation');
  }

  // Frontend insights
  if (frontendAdaptability >= 75) {
    insights.push('Frontend architecture ready for expansion');
  } else if (frontendAdaptability <= 50) {
    insights.push('Frontend may need updates to handle scale increase');
  }

  return insights;
}

// ============================================================================
// MAIN CALCULATOR
// ============================================================================

export function calculateScaleIntelligence(
  products: ProductDataPoint[],
  operationalMetrics: OperationalMetrics
): ScaleIntelligence {
  const skuExpansionHeadroom = calculateSkuExpansionHeadroom(products.length);
  const aiAutomationCoverage = calculateAIAutomationCoverage(products, operationalMetrics);
  const marginDefensibility = calculateMarginDefensibility(products);
  const frontendAdaptability = calculateFrontendAdaptability(products, operationalMetrics);

  // Weighted composite score
  const score = Math.round(
    (skuExpansionHeadroom * WEIGHTS.skuHeadroom) +
    (aiAutomationCoverage * WEIGHTS.aiAutomation) +
    (marginDefensibility * WEIGHTS.marginDefensibility) +
    (frontendAdaptability * WEIGHTS.frontendAdaptability)
  );

  const insights = generateInsights(
    skuExpansionHeadroom,
    aiAutomationCoverage,
    marginDefensibility,
    frontendAdaptability,
    products.length
  );

  return {
    score,
    skuExpansionHeadroom,
    aiAutomationCoverage,
    marginDefensibility,
    frontendAdaptability,
    insights,
  };
}

export default calculateScaleIntelligence;
