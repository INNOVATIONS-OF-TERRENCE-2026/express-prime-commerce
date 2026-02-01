/**
 * Product Intelligence Scorer
 * 
 * "How intelligent and optimized is the product mix?"
 * 
 * Inputs:
 * - AI product scores
 * - SKU redundancy
 * - Price-value alignment
 * - Visual saliency consistency
 * 
 * @module storeIQ/productIntelligence
 */

import type { ProductIntelligence, ProductDataPoint } from './types';

// ============================================================================
// CONSTANTS
// ============================================================================

const WEIGHTS = {
  avgAIScore: 0.30,
  skuRedundancy: 0.20,
  priceValueAlignment: 0.30,
  visualSaliency: 0.20,
};

// ============================================================================
// CALCULATIONS
// ============================================================================

/**
 * Calculate average AI score across products
 */
function calculateAvgAIScore(products: ProductDataPoint[]): number {
  if (products.length === 0) return 50;
  
  const avg = products.reduce((sum, p) => sum + p.aiScore, 0) / products.length;
  return Math.round(avg);
}

/**
 * Calculate SKU redundancy score
 * Lower redundancy = higher score (more unique products)
 */
function calculateSkuRedundancy(products: ProductDataPoint[]): number {
  if (products.length <= 1) return 100; // No redundancy possible

  // Group by category
  const categoryGroups = new Map<string, ProductDataPoint[]>();
  products.forEach(p => {
    const existing = categoryGroups.get(p.category) || [];
    existing.push(p);
    categoryGroups.set(p.category, existing);
  });

  // Check for similar products within categories (same price tier)
  let redundantPairs = 0;
  let totalPairs = 0;

  categoryGroups.forEach(group => {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        totalPairs++;
        const priceDiff = Math.abs(group[i].price - group[j].price);
        const avgPrice = (group[i].price + group[j].price) / 2;
        
        // If prices within 15% and same category = potentially redundant
        if (priceDiff / avgPrice < 0.15) {
          redundantPairs++;
        }
      }
    }
  });

  if (totalPairs === 0) return 100;

  const redundancyRatio = redundantPairs / totalPairs;
  return Math.round((1 - redundancyRatio) * 100);
}

/**
 * Calculate price-value alignment
 * High alignment = prices match perceived value
 */
function calculatePriceValueAlignment(products: ProductDataPoint[]): number {
  if (products.length === 0) return 50;

  let alignedCount = 0;

  products.forEach(p => {
    // Use AI score as proxy for value
    // High AI score + competitive price = aligned
    // Low AI score + high price = misaligned
    
    const valueScore = p.aiScore / 100;
    const pricePosition = p.compareAtPrice 
      ? p.price / p.compareAtPrice 
      : 0.8; // Assume 20% discount baseline
    
    // Good alignment: high value + good price OR low value + low price
    const alignment = 1 - Math.abs(valueScore - (1 - pricePosition));
    
    if (alignment > 0.6) alignedCount++;
  });

  return Math.round((alignedCount / products.length) * 100);
}

/**
 * Calculate visual saliency consistency
 * Consistent high saliency = better product presentation
 */
function calculateVisualSaliencyConsistency(products: ProductDataPoint[]): number {
  if (products.length === 0) return 50;

  const saliencyScores = products.map(p => p.visualSaliency);
  const avg = saliencyScores.reduce((a, b) => a + b, 0) / saliencyScores.length;
  
  // Calculate standard deviation
  const variance = saliencyScores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / saliencyScores.length;
  const stdDev = Math.sqrt(variance);

  // Lower stdDev = more consistent
  // Combine with average for final score
  const consistencyScore = Math.max(0, 100 - (stdDev * 2));
  const avgScore = avg;

  // Weighted average of consistency and level
  return Math.round((consistencyScore * 0.4) + (avgScore * 0.6));
}

// ============================================================================
// INSIGHTS GENERATOR
// ============================================================================

function generateInsights(
  avgAIScore: number,
  skuRedundancy: number,
  priceValueAlignment: number,
  visualSaliency: number,
  productCount: number
): string[] {
  const insights: string[] = [];

  // AI score insights
  if (avgAIScore >= 75) {
    insights.push('Strong AI product scores indicate high-quality catalog');
  } else if (avgAIScore <= 50) {
    insights.push('Below-average AI scores - review underperforming products');
  }

  // Redundancy insights
  if (skuRedundancy >= 80) {
    insights.push('Good SKU diversity with minimal redundancy');
  } else if (skuRedundancy <= 50) {
    insights.push('High SKU redundancy detected - consider consolidating similar products');
  }

  // Price-value insights
  if (priceValueAlignment >= 75) {
    insights.push('Excellent price-value alignment across catalog');
  } else if (priceValueAlignment <= 50) {
    insights.push('Price-value misalignment - some products may be over or underpriced');
  }

  // Visual saliency insights
  if (visualSaliency >= 75) {
    insights.push('Consistent, high-quality product imagery');
  } else if (visualSaliency <= 50) {
    insights.push('Visual presentation inconsistency - standardize product photography');
  }

  // Product count insights
  if (productCount < 10) {
    insights.push('Limited catalog size - expansion opportunity exists');
  } else if (productCount > 100) {
    insights.push('Large catalog may benefit from AI curation to reduce choice paralysis');
  }

  return insights;
}

// ============================================================================
// MAIN CALCULATOR
// ============================================================================

export function calculateProductIntelligence(
  products: ProductDataPoint[]
): ProductIntelligence {
  const avgAIScore = calculateAvgAIScore(products);
  const skuRedundancy = calculateSkuRedundancy(products);
  const priceValueAlignment = calculatePriceValueAlignment(products);
  const visualSaliencyConsistency = calculateVisualSaliencyConsistency(products);

  // Weighted composite score
  const score = Math.round(
    (avgAIScore * WEIGHTS.avgAIScore) +
    (skuRedundancy * WEIGHTS.skuRedundancy) +
    (priceValueAlignment * WEIGHTS.priceValueAlignment) +
    (visualSaliencyConsistency * WEIGHTS.visualSaliency)
  );

  const insights = generateInsights(
    avgAIScore,
    skuRedundancy,
    priceValueAlignment,
    visualSaliencyConsistency,
    products.length
  );

  return {
    score,
    avgAIScore,
    skuRedundancy,
    priceValueAlignment,
    visualSaliencyConsistency,
    insights,
  };
}

export default calculateProductIntelligence;
