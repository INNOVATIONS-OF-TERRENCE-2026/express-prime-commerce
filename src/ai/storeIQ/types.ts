/**
 * Store IQ Score System - Type Definitions
 * 
 * Investor-grade analytics system for Express Prime.
 * This is NOT a vanity metric - it's a decision-making intelligence system.
 * 
 * @module storeIQ/types
 * @version 1.0.0
 */

// ============================================================================
// GRADE SYSTEM
// ============================================================================

export type StoreIQGrade = 'A+' | 'A' | 'B' | 'C' | 'Risk';

export function getGradeFromScore(score: number): StoreIQGrade {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 65) return 'B';
  if (score >= 50) return 'C';
  return 'Risk';
}

export function getGradeColor(grade: StoreIQGrade): string {
  switch (grade) {
    case 'A+': return '#10b981'; // emerald-500
    case 'A': return '#22c55e';  // green-500
    case 'B': return '#eab308';  // yellow-500
    case 'C': return '#f97316';  // orange-500
    case 'Risk': return '#ef4444'; // red-500
  }
}

// ============================================================================
// DIMENSION SCORES
// ============================================================================

export interface DemandIntelligence {
  score: number;
  trendVelocity: number;
  viewMomentum: number;
  risingSkuCount: number;
  coolingSkuCount: number;
  categorySpread: number;
  insights: string[];
}

export interface ConversionIntelligence {
  score: number;
  addToCartVelocity: number;
  checkoutCompletionRate: number;
  buyerIntentConfidence: number;
  dropOffFriction: number;
  insights: string[];
}

export interface ProductIntelligence {
  score: number;
  avgAIScore: number;
  skuRedundancy: number;
  priceValueAlignment: number;
  visualSaliencyConsistency: number;
  insights: string[];
}

export interface TrustIntelligence {
  score: number;
  brandTrustScore: number;
  priceCoherence: number;
  returnRiskInference: number;
  shippingClarityScore: number;
  insights: string[];
}

export interface OperationalIntelligence {
  score: number;
  paymentReadiness: number;
  checkoutReliability: number;
  inventoryConsistency: number;
  failureFallbackCoverage: number;
  insights: string[];
}

export interface ScaleIntelligence {
  score: number;
  skuExpansionHeadroom: number;
  aiAutomationCoverage: number;
  marginDefensibility: number;
  frontendAdaptability: number;
  insights: string[];
}

// ============================================================================
// DIMENSION BREAKDOWN
// ============================================================================

export interface DimensionBreakdown {
  demand: DemandIntelligence;
  conversion: ConversionIntelligence;
  product: ProductIntelligence;
  trust: TrustIntelligence;
  ops: OperationalIntelligence;
  scale: ScaleIntelligence;
}

// ============================================================================
// STORE IQ OUTPUT
// ============================================================================

export interface StoreIQOutput {
  store_iq_score: number;
  grade: StoreIQGrade;
  dimension_breakdown: DimensionBreakdown;
  key_strengths: string[];
  critical_risks: string[];
  ai_recommendations: string[];
  calculated_at: Date;
  data_freshness: 'real-time' | 'cached' | 'stale';
}

// ============================================================================
// SCORING WEIGHTS
// ============================================================================

export const DIMENSION_WEIGHTS = {
  demand: 0.20,      // 20%
  conversion: 0.25,  // 25% (most important for revenue)
  product: 0.15,     // 15%
  trust: 0.15,       // 15%
  ops: 0.10,         // 10%
  scale: 0.15,       // 15%
} as const;

// Ensure weights sum to 1
const weightSum = Object.values(DIMENSION_WEIGHTS).reduce((a, b) => a + b, 0);
if (Math.abs(weightSum - 1) > 0.001) {
  throw new Error(`Dimension weights must sum to 1, got ${weightSum}`);
}

// ============================================================================
// INSIGHT TYPES
// ============================================================================

export type InsightType = 'strength' | 'risk' | 'recommendation';

export interface Insight {
  type: InsightType;
  dimension: keyof DimensionBreakdown;
  message: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
}

// ============================================================================
// ENGINE STATE
// ============================================================================

export interface StoreIQEngineState {
  isCalculating: boolean;
  lastCalculation: Date | null;
  error: Error | null;
  output: StoreIQOutput | null;
}

// ============================================================================
// INPUT DATA
// ============================================================================

export interface StoreIQInputData {
  products: ProductDataPoint[];
  trendingData: TrendingDataPoint[];
  cartData: CartDataPoint[];
  operationalMetrics: OperationalMetrics;
}

export interface ProductDataPoint {
  id: string;
  title: string;
  price: number;
  compareAtPrice: number | null;
  aiScore: number;
  visualSaliency: number;
  views: number;
  addToCartRate: number;
  category: string;
}

export interface TrendingDataPoint {
  productId: string;
  velocity: number;
  direction: 'rising' | 'stable' | 'cooling';
  rankChange: number;
}

export interface CartDataPoint {
  timestamp: Date;
  productId: string;
  action: 'add' | 'remove' | 'checkout' | 'abandon';
}

export interface OperationalMetrics {
  paymentMethodsActive: number;
  checkoutSuccessRate: number;
  avgInventoryLevel: number;
  fallbackSupplierCount: number;
  aiCoveragePercent: number;
}

// ============================================================================
// THRESHOLDS
// ============================================================================

export const SCORE_THRESHOLDS = {
  excellent: 85,
  good: 70,
  acceptable: 55,
  concerning: 40,
  critical: 25,
} as const;

export function getScoreStatus(score: number): 'excellent' | 'good' | 'acceptable' | 'concerning' | 'critical' {
  if (score >= SCORE_THRESHOLDS.excellent) return 'excellent';
  if (score >= SCORE_THRESHOLDS.good) return 'good';
  if (score >= SCORE_THRESHOLDS.acceptable) return 'acceptable';
  if (score >= SCORE_THRESHOLDS.concerning) return 'concerning';
  return 'critical';
}
