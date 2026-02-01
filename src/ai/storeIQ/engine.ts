/**
 * Store IQ Engine
 * 
 * Central intelligence scoring system for Express Prime.
 * Outputs a single composite score (0-100) with full transparency.
 * 
 * Investor-grade. Founder-readable. Decision-ready.
 * 
 * @module storeIQ/engine
 * @version 1.0.0
 */

import { calculateDemandIntelligence } from './demandIntelligence';
import { calculateConversionIntelligence } from './conversionIntelligence';
import { calculateProductIntelligence } from './productIntelligence';
import { calculateTrustIntelligence } from './trustIntelligence';
import { calculateOperationalIntelligence } from './operationalIntelligence';
import { calculateScaleIntelligence } from './scaleIntelligence';
import {
  type StoreIQOutput,
  type StoreIQInputData,
  type DimensionBreakdown,
  type Insight,
  DIMENSION_WEIGHTS,
  getGradeFromScore,
} from './types';

// ============================================================================
// ENGINE STATE
// ============================================================================

let lastCalculation: StoreIQOutput | null = null;
let lastCalculationTime: Date | null = null;
let isCalculating = false;

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ============================================================================
// MAIN CALCULATION
// ============================================================================

/**
 * Calculate the complete Store IQ Score
 */
export async function calculateStoreIQ(
  inputData: StoreIQInputData
): Promise<StoreIQOutput> {
  isCalculating = true;

  try {
    // Check cache
    if (lastCalculation && lastCalculationTime) {
      const age = Date.now() - lastCalculationTime.getTime();
      if (age < CACHE_TTL_MS) {
        return {
          ...lastCalculation,
          data_freshness: 'cached',
        };
      }
    }

    // Calculate all dimension scores
    const demand = calculateDemandIntelligence(
      inputData.products,
      inputData.trendingData
    );

    const conversion = calculateConversionIntelligence(
      inputData.products,
      inputData.cartData
    );

    const product = calculateProductIntelligence(inputData.products);

    const trust = calculateTrustIntelligence(
      inputData.products,
      inputData.operationalMetrics
    );

    const ops = calculateOperationalIntelligence(inputData.operationalMetrics);

    const scale = calculateScaleIntelligence(
      inputData.products,
      inputData.operationalMetrics
    );

    // Build dimension breakdown
    const dimension_breakdown: DimensionBreakdown = {
      demand,
      conversion,
      product,
      trust,
      ops,
      scale,
    };

    // Calculate weighted composite score
    const store_iq_score = Math.round(
      (demand.score * DIMENSION_WEIGHTS.demand) +
      (conversion.score * DIMENSION_WEIGHTS.conversion) +
      (product.score * DIMENSION_WEIGHTS.product) +
      (trust.score * DIMENSION_WEIGHTS.trust) +
      (ops.score * DIMENSION_WEIGHTS.ops) +
      (scale.score * DIMENSION_WEIGHTS.scale)
    );

    // Generate aggregated insights
    const { key_strengths, critical_risks, ai_recommendations } = aggregateInsights(
      dimension_breakdown,
      store_iq_score
    );

    // Build output
    const output: StoreIQOutput = {
      store_iq_score,
      grade: getGradeFromScore(store_iq_score),
      dimension_breakdown,
      key_strengths,
      critical_risks,
      ai_recommendations,
      calculated_at: new Date(),
      data_freshness: 'real-time',
    };

    // Update cache
    lastCalculation = output;
    lastCalculationTime = new Date();

    return output;

  } finally {
    isCalculating = false;
  }
}

// ============================================================================
// INSIGHT AGGREGATION
// ============================================================================

function aggregateInsights(
  breakdown: DimensionBreakdown,
  overallScore: number
): {
  key_strengths: string[];
  critical_risks: string[];
  ai_recommendations: string[];
} {
  const allInsights: Insight[] = [];

  // Collect all insights with dimension info
  const dimensions: (keyof DimensionBreakdown)[] = [
    'demand', 'conversion', 'product', 'trust', 'ops', 'scale'
  ];

  dimensions.forEach(dim => {
    const dimData = breakdown[dim];
    const score = dimData.score;

    dimData.insights.forEach(message => {
      const isStrength = score >= 70;
      const isRisk = score <= 50;
      
      allInsights.push({
        type: isStrength ? 'strength' : isRisk ? 'risk' : 'recommendation',
        dimension: dim,
        message,
        impact: score >= 80 || score <= 35 ? 'high' : 'medium',
        actionable: true,
      });
    });
  });

  // Separate by type
  const strengths = allInsights
    .filter(i => i.type === 'strength')
    .sort((a, b) => (a.impact === 'high' ? -1 : 1) - (b.impact === 'high' ? -1 : 1))
    .slice(0, 5)
    .map(i => i.message);

  const risks = allInsights
    .filter(i => i.type === 'risk')
    .sort((a, b) => (a.impact === 'high' ? -1 : 1) - (b.impact === 'high' ? -1 : 1))
    .slice(0, 5)
    .map(i => i.message);

  // Generate recommendations based on lowest scores
  const recommendations = generateRecommendations(breakdown, overallScore);

  return {
    key_strengths: strengths,
    critical_risks: risks,
    ai_recommendations: recommendations,
  };
}

// ============================================================================
// RECOMMENDATION GENERATOR
// ============================================================================

function generateRecommendations(
  breakdown: DimensionBreakdown,
  overallScore: number
): string[] {
  const recommendations: string[] = [];

  // Find weakest dimensions
  const dimensionScores = [
    { name: 'demand', score: breakdown.demand.score, weight: DIMENSION_WEIGHTS.demand },
    { name: 'conversion', score: breakdown.conversion.score, weight: DIMENSION_WEIGHTS.conversion },
    { name: 'product', score: breakdown.product.score, weight: DIMENSION_WEIGHTS.product },
    { name: 'trust', score: breakdown.trust.score, weight: DIMENSION_WEIGHTS.trust },
    { name: 'ops', score: breakdown.ops.score, weight: DIMENSION_WEIGHTS.ops },
    { name: 'scale', score: breakdown.scale.score, weight: DIMENSION_WEIGHTS.scale },
  ].sort((a, b) => a.score - b.score);

  // Target weakest dimensions for most impact
  const weakest = dimensionScores.slice(0, 3);

  weakest.forEach(dim => {
    const potentialGain = Math.round((100 - dim.score) * dim.weight);
    
    switch (dim.name) {
      case 'demand':
        if (dim.score < 60) {
          recommendations.push(`Improve demand intelligence (+${potentialGain} potential): Focus on trend analysis and product visibility`);
        }
        break;
      case 'conversion':
        if (dim.score < 60) {
          recommendations.push(`Boost conversion rate (+${potentialGain} potential): Reduce checkout friction and improve product presentation`);
        }
        break;
      case 'product':
        if (dim.score < 60) {
          recommendations.push(`Optimize product mix (+${potentialGain} potential): Review AI scores and remove underperformers`);
        }
        break;
      case 'trust':
        if (dim.score < 60) {
          recommendations.push(`Increase trust signals (+${potentialGain} potential): Standardize pricing and improve shipping clarity`);
        }
        break;
      case 'ops':
        if (dim.score < 60) {
          recommendations.push(`Strengthen operations (+${potentialGain} potential): Add payment methods and fallback suppliers`);
        }
        break;
      case 'scale':
        if (dim.score < 60) {
          recommendations.push(`Prepare for scale (+${potentialGain} potential): Increase AI automation and protect margins`);
        }
        break;
    }
  });

  // Add overall recommendation
  if (overallScore < 50) {
    recommendations.unshift('🚨 Critical: Overall Store IQ below threshold. Prioritize operational reliability.');
  } else if (overallScore >= 80) {
    recommendations.push('✓ Maintain current trajectory - strong foundation for growth');
  }

  return recommendations.slice(0, 5);
}

// ============================================================================
// MOCK DATA GENERATOR (for development/demo)
// ============================================================================

export function generateMockInputData(): StoreIQInputData {
  const products = Array.from({ length: 25 }, (_, i) => ({
    id: `product-${i}`,
    title: `Product ${i + 1}`,
    price: 20 + Math.random() * 180,
    compareAtPrice: Math.random() > 0.3 ? 40 + Math.random() * 200 : null,
    aiScore: 50 + Math.random() * 45,
    visualSaliency: 40 + Math.random() * 50,
    views: Math.floor(20 + Math.random() * 200),
    addToCartRate: 0.05 + Math.random() * 0.1,
    category: ['electronics', 'home', 'health', 'kitchen'][Math.floor(Math.random() * 4)],
  }));

  const trendingData = products.slice(0, 15).map(p => ({
    productId: p.id,
    velocity: 0.8 + Math.random() * 1.2,
    direction: (['rising', 'stable', 'cooling'] as const)[Math.floor(Math.random() * 3)],
    rankChange: Math.floor(Math.random() * 10) - 5,
  }));

  const cartData = Array.from({ length: 50 }, () => ({
    timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
    productId: products[Math.floor(Math.random() * products.length)].id,
    action: (['add', 'remove', 'checkout', 'abandon'] as const)[
      Math.random() < 0.5 ? 0 : Math.random() < 0.7 ? 2 : Math.random() < 0.9 ? 3 : 1
    ],
  }));

  const operationalMetrics = {
    paymentMethodsActive: 3,
    checkoutSuccessRate: 0.92,
    avgInventoryLevel: 45,
    fallbackSupplierCount: 2,
    aiCoveragePercent: 75,
  };

  return { products, trendingData, cartData, operationalMetrics };
}

// ============================================================================
// UTILITIES
// ============================================================================

export function getCalculationStatus(): {
  isCalculating: boolean;
  lastCalculation: Date | null;
  hasCachedResult: boolean;
} {
  return {
    isCalculating,
    lastCalculation: lastCalculationTime,
    hasCachedResult: lastCalculation !== null,
  };
}

export function invalidateCache(): void {
  lastCalculation = null;
  lastCalculationTime = null;
}

// ============================================================================
// EXPORTS
// ============================================================================

export { calculateDemandIntelligence } from './demandIntelligence';
export { calculateConversionIntelligence } from './conversionIntelligence';
export { calculateProductIntelligence } from './productIntelligence';
export { calculateTrustIntelligence } from './trustIntelligence';
export { calculateOperationalIntelligence } from './operationalIntelligence';
export { calculateScaleIntelligence } from './scaleIntelligence';
export * from './types';
