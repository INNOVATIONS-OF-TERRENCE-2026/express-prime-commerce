/**
 * Store IQ Module Index
 * 
 * AI-powered intelligence scoring system for Express Prime.
 * Single composite score (0-100) with full dimension transparency.
 */

export {
  calculateStoreIQ,
  generateMockInputData,
  getCalculationStatus,
  invalidateCache,
  calculateDemandIntelligence,
  calculateConversionIntelligence,
  calculateProductIntelligence,
  calculateTrustIntelligence,
  calculateOperationalIntelligence,
  calculateScaleIntelligence,
} from './engine';

export {
  type StoreIQOutput,
  type StoreIQInputData,
  type DimensionBreakdown,
  type DemandIntelligence,
  type ConversionIntelligence,
  type ProductIntelligence,
  type TrustIntelligence,
  type OperationalIntelligence,
  type ScaleIntelligence,
  type StoreIQGrade,
  type ProductDataPoint,
  type TrendingDataPoint,
  type CartDataPoint,
  type OperationalMetrics,
  DIMENSION_WEIGHTS,
  SCORE_THRESHOLDS,
  getGradeFromScore,
  getGradeColor,
  getScoreStatus,
} from './types';
