/**
 * Product Intelligence Engine - Main Entry Point
 *
 * This is the primary public API for the intelligence engine.
 * All external consumers should use this interface.
 *
 * Usage:
 * ```typescript
 * import { analyzeProduct, analyzeProducts } from '@/intelligence';
 *
 * const result = analyzeProduct(productInput);
 * console.log(result.ai_confidence_score); // 0-100
 * console.log(result.decision); // 'promote' | 'neutral' | 'suppress'
 * ```
 */

import type {
  ProductIntelligenceInput,
  ProductIntelligenceOutput,
  ScoringMetadata,
  SignalType,
} from './types';
import { ALGORITHM_VERSION } from './types';
import { scoreProduct, type ScoringOptions } from './engine/scorer';
import { generateExplanation } from './engine/explainer';
import { mapToDecision } from './engine/decision-mapper';

export interface AnalysisOptions extends ScoringOptions {
  /**
   * Source identifier for weight configuration.
   * Used for tracking which settings produced the score.
   */
  weightSource?: string;

  /**
   * Override metrics period for metadata.
   * Defaults to 30 days.
   */
  metricsPeriodDays?: number;
}

/**
 * Analyzes a single product and returns comprehensive intelligence output.
 *
 * This is the primary function for the Product Intelligence Engine.
 * Returns the complete output shape required by the UI.
 */
export function analyzeProduct(
  input: ProductIntelligenceInput,
  options: AnalysisOptions = {}
): ProductIntelligenceOutput {
  const startTime = performance.now();

  const { weightSource = 'default', metricsPeriodDays = 30, ...scoringOptions } = options;

  // 1. Score the product
  const { score, breakdown } = scoreProduct(input, scoringOptions);

  // 2. Map to decision
  const { decision, decision_confidence, primary_factors } = mapToDecision(score, breakdown);

  // 3. Generate explanation
  const explanation = generateExplanation(score, breakdown, decision);

  // 4. Build metadata
  const processingTimeMs = Math.round(performance.now() - startTime);
  const metadata: ScoringMetadata = {
    scored_at: new Date().toISOString(),
    algorithm_version: ALGORITHM_VERSION,
    metrics_period_days: input.metrics?.period_days ?? metricsPeriodDays,
    processing_time_ms: processingTimeMs,
    weight_source: weightSource,
  };

  return {
    product_id: input.product.id,
    ai_confidence_score: score,
    score_breakdown: breakdown,
    explanation,
    decision,
    metadata,
  };
}

/**
 * Analyzes multiple products in batch.
 * More efficient than calling analyzeProduct in a loop
 * when processing large catalogs.
 */
export function analyzeProducts(
  inputs: ProductIntelligenceInput[],
  options: AnalysisOptions = {}
): ProductIntelligenceOutput[] {
  return inputs.map((input) => analyzeProduct(input, options));
}

/**
 * Quick analysis returning only the essential output.
 * Use for high-volume batch operations where full explanations aren't needed.
 */
export function quickAnalyze(input: ProductIntelligenceInput): {
  product_id: string;
  ai_confidence_score: number;
  decision: 'promote' | 'neutral' | 'suppress';
} {
  const { score, breakdown } = scoreProduct(input);
  const { decision } = mapToDecision(score, breakdown);

  return {
    product_id: input.product.id,
    ai_confidence_score: score,
    decision,
  };
}

/**
 * Ranks products by AI confidence score.
 * Returns product IDs sorted from highest to lowest score.
 */
export function rankProducts(inputs: ProductIntelligenceInput[]): string[] {
  const scored = inputs.map((input) => ({
    id: input.product.id,
    score: scoreProduct(input).score,
  }));

  scored.sort((a, b) => b.score - a.score);

  return scored.map((s) => s.id);
}

/**
 * Filters products by decision category.
 */
export function filterByDecision(
  inputs: ProductIntelligenceInput[],
  decision: 'promote' | 'neutral' | 'suppress'
): ProductIntelligenceInput[] {
  return inputs.filter((input) => {
    const result = quickAnalyze(input);
    return result.decision === decision;
  });
}

/**
 * Gets products that need attention (suppress or near threshold).
 */
export function getProductsNeedingAttention(
  inputs: ProductIntelligenceInput[]
): ProductIntelligenceOutput[] {
  const results: ProductIntelligenceOutput[] = [];

  for (const input of inputs) {
    const output = analyzeProduct(input);

    // Include if suppressed or has critical concerns
    if (
      output.decision === 'suppress' ||
      output.explanation.concerns.some((c) => c.priority === 1)
    ) {
      results.push(output);
    }
  }

  // Sort by score (lowest first = most urgent)
  results.sort((a, b) => a.ai_confidence_score - b.ai_confidence_score);

  return results;
}

// Re-export types for convenience
export type {
  ProductData,
  ProductMetrics,
  ProductIntelligenceInput,
  ProductIntelligenceOutput,
  IntelligenceDecision,
  SignalResult,
  SignalType,
  ScoreBreakdown,
  IntelligenceExplanation,
  ExplanationPoint,
  ScoringMetadata,
} from './types';

export {
  createIntelligenceInput,
  createEmptyMetrics,
  ALGORITHM_VERSION,
  DECISION_THRESHOLDS,
  scoreToDecision,
} from './types';

// Export config for customization
export { DEFAULT_SIGNAL_WEIGHTS, mergeWeights } from './config/weights';

// Export individual signals for targeted analysis
export { SIGNAL_REGISTRY, getAllSignalTypes, getSignalDisplayName } from './signals';

// Export engine components for advanced usage
export { scoreProduct, evaluateSingleSignal, quickScore } from './engine/scorer';
export { generateExplanation, generateQuickExplanation } from './engine/explainer';
export { mapToDecision, getDecisionJustification, isNearThreshold } from './engine/decision-mapper';
