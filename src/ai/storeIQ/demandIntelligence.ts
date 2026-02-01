/**
 * Demand Intelligence Scorer
 * 
 * "How strong and sustainable is demand right now?"
 * 
 * Inputs:
 * - Trend velocity
 * - Product view momentum  
 * - Rising vs cooling SKUs
 * - Category demand spread
 * 
 * @module storeIQ/demandIntelligence
 */

import type { 
  DemandIntelligence, 
  ProductDataPoint, 
  TrendingDataPoint 
} from './types';

// ============================================================================
// CONSTANTS
// ============================================================================

const WEIGHTS = {
  trendVelocity: 0.30,
  viewMomentum: 0.25,
  risingVsCooling: 0.25,
  categorySpread: 0.20,
};

// ============================================================================
// CALCULATIONS
// ============================================================================

/**
 * Calculate trend velocity score
 * Higher velocity = stronger demand signals
 */
function calculateTrendVelocity(trendingData: TrendingDataPoint[]): number {
  if (trendingData.length === 0) return 50; // Neutral if no data

  const avgVelocity = trendingData.reduce((sum, t) => sum + t.velocity, 0) / trendingData.length;
  
  // Normalize: velocity 1.0 = baseline, 2.0 = very strong
  const normalized = Math.min(avgVelocity / 1.5, 1) * 100;
  return Math.round(normalized);
}

/**
 * Calculate view momentum score
 * Compares recent views to historical baseline
 */
function calculateViewMomentum(products: ProductDataPoint[]): number {
  if (products.length === 0) return 50;

  const totalViews = products.reduce((sum, p) => sum + p.views, 0);
  const avgViews = totalViews / products.length;
  
  // Assume baseline of 50 views per product is "normal"
  const baseline = 50;
  const momentum = avgViews / baseline;
  
  // Cap at 100, floor at 0
  return Math.round(Math.min(Math.max(momentum * 50, 0), 100));
}

/**
 * Calculate rising vs cooling SKU ratio
 */
function calculateRisingVsCooling(trendingData: TrendingDataPoint[]): {
  score: number;
  risingCount: number;
  coolingCount: number;
} {
  if (trendingData.length === 0) {
    return { score: 50, risingCount: 0, coolingCount: 0 };
  }

  const rising = trendingData.filter(t => t.direction === 'rising').length;
  const cooling = trendingData.filter(t => t.direction === 'cooling').length;
  const stable = trendingData.filter(t => t.direction === 'stable').length;

  // Score favors rising, penalizes cooling
  const risingWeight = rising * 2;
  const stableWeight = stable * 1;
  const coolingWeight = cooling * 0.5;

  const total = risingWeight + stableWeight + coolingWeight;
  const maxPossible = trendingData.length * 2; // All rising

  const score = (total / maxPossible) * 100;

  return {
    score: Math.round(score),
    risingCount: rising,
    coolingCount: cooling,
  };
}

/**
 * Calculate category demand spread
 * Good spread = demand across multiple categories (diversified)
 */
function calculateCategorySpread(products: ProductDataPoint[]): number {
  if (products.length === 0) return 50;

  const categoryViews = new Map<string, number>();
  
  products.forEach(p => {
    const current = categoryViews.get(p.category) || 0;
    categoryViews.set(p.category, current + p.views);
  });

  const categories = Array.from(categoryViews.values());
  const totalViews = categories.reduce((a, b) => a + b, 0);
  
  if (totalViews === 0 || categories.length <= 1) return 50;

  // Calculate Herfindahl-Hirschman Index (HHI) for concentration
  // Lower HHI = more spread = better
  const hhi = categories.reduce((sum, views) => {
    const share = views / totalViews;
    return sum + (share * share);
  }, 0);

  // HHI ranges from 1/n to 1
  // Convert to score where higher spread = higher score
  const minHHI = 1 / categories.length;
  const normalizedHHI = (1 - hhi) / (1 - minHHI);
  
  return Math.round(normalizedHHI * 100);
}

// ============================================================================
// INSIGHTS GENERATOR
// ============================================================================

function generateInsights(
  trendVelocity: number,
  viewMomentum: number,
  risingCount: number,
  coolingCount: number,
  categorySpread: number
): string[] {
  const insights: string[] = [];

  // Trend velocity insights
  if (trendVelocity >= 80) {
    insights.push('Strong trend velocity indicates high market momentum');
  } else if (trendVelocity <= 40) {
    insights.push('Low trend velocity - consider refreshing product positioning');
  }

  // View momentum insights
  if (viewMomentum >= 75) {
    insights.push('Above-average view momentum suggests growing interest');
  } else if (viewMomentum <= 35) {
    insights.push('Below-average views - marketing or SEO may need attention');
  }

  // Rising/cooling insights
  if (risingCount > coolingCount * 2) {
    insights.push(`${risingCount} rising SKUs vs ${coolingCount} cooling - healthy demand growth`);
  } else if (coolingCount > risingCount) {
    insights.push(`More SKUs cooling (${coolingCount}) than rising (${risingCount}) - review underperformers`);
  }

  // Category spread insights
  if (categorySpread >= 70) {
    insights.push('Demand well-distributed across categories');
  } else if (categorySpread <= 40) {
    insights.push('Demand concentrated in few categories - diversification opportunity');
  }

  return insights;
}

// ============================================================================
// MAIN CALCULATOR
// ============================================================================

export function calculateDemandIntelligence(
  products: ProductDataPoint[],
  trendingData: TrendingDataPoint[]
): DemandIntelligence {
  const trendVelocity = calculateTrendVelocity(trendingData);
  const viewMomentum = calculateViewMomentum(products);
  const { score: risingVsCoolingScore, risingCount, coolingCount } = calculateRisingVsCooling(trendingData);
  const categorySpread = calculateCategorySpread(products);

  // Weighted composite score
  const score = Math.round(
    (trendVelocity * WEIGHTS.trendVelocity) +
    (viewMomentum * WEIGHTS.viewMomentum) +
    (risingVsCoolingScore * WEIGHTS.risingVsCooling) +
    (categorySpread * WEIGHTS.categorySpread)
  );

  const insights = generateInsights(
    trendVelocity,
    viewMomentum,
    risingCount,
    coolingCount,
    categorySpread
  );

  return {
    score,
    trendVelocity,
    viewMomentum,
    risingSkuCount: risingCount,
    coolingSkuCount: coolingCount,
    categorySpread,
    insights,
  };
}

export default calculateDemandIntelligence;
