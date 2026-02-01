/**
 * Product Intelligence Engine - Type Exports
 *
 * Central export point for all intelligence types.
 * Import from here for cleaner imports:
 *
 * import type { ProductIntelligenceOutput, SignalResult } from '@/intelligence/types';
 */

// Product input types
export type {
  ProductData,
  ProductMetrics,
  ProductIntelligenceInput,
  ProductStatus,
} from './product.types';

export {
  createIntelligenceInput,
  createEmptyMetrics,
} from './product.types';

// Signal types
export type {
  SignalType,
  SignalSeverity,
  SignalResult,
  SignalExplanation,
  SignalEvaluator,
  SignalConfig,
} from './signal.types';

export {
  SEVERITY_THRESHOLDS,
  scoreToSeverity,
  clampScore,
} from './signal.types';

// Score output types
export type {
  IntelligenceDecision,
  ProductIntelligenceOutput,
  ScoreBreakdown,
  IntelligenceExplanation,
  ExplanationPoint,
  ScoringMetadata,
} from './score.types';

export {
  DECISION_THRESHOLDS,
  scoreToDecision,
  ALGORITHM_VERSION,
} from './score.types';
