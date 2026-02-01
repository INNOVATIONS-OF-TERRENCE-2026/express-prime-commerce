/**
 * Product Intelligence Engine - Scorer
 *
 * Orchestrates all signal evaluations and produces the composite score.
 * This is the core calculation engine.
 */

import type {
  ProductIntelligenceInput,
  SignalResult,
  SignalType,
  ScoreBreakdown,
} from '../types';
import { clampScore } from '../types';
import { SIGNAL_REGISTRY } from '../signals';
import { DEFAULT_SIGNAL_WEIGHTS, mergeWeights } from '../config/weights';

export interface ScoringOptions {
  /**
   * Custom weights to override defaults.
   * Partial object - missing keys use defaults.
   */
  customWeights?: Partial<Record<SignalType, number>>;

  /**
   * Signals to exclude from scoring.
   * Useful for A/B testing or when data is unavailable.
   */
  excludeSignals?: SignalType[];
}

export interface ScoringResult {
  /**
   * Final composite score (0-100).
   */
  score: number;

  /**
   * Detailed breakdown of signal contributions.
   */
  breakdown: ScoreBreakdown;
}

/**
 * Evaluates all signals and produces a composite score.
 */
export function scoreProduct(
  input: ProductIntelligenceInput,
  options: ScoringOptions = {}
): ScoringResult {
  const { customWeights = {}, excludeSignals = [] } = options;

  // Merge custom weights with defaults
  const weights = mergeWeights(customWeights);

  // Evaluate all non-excluded signals
  const signalResults: SignalResult[] = [];

  for (const config of SIGNAL_REGISTRY) {
    if (excludeSignals.includes(config.type)) {
      continue;
    }

    // Evaluate signal
    const result = config.evaluate(input);

    // Apply custom weight if provided
    const weight = weights[config.type] ?? config.default_weight;
    const weightedScore = result.score * weight;

    signalResults.push({
      ...result,
      weight,
      weighted_score: weightedScore,
    });
  }

  // Calculate composite score
  const totalWeight = signalResults.reduce((sum, r) => sum + r.weight, 0);
  const rawScore = signalResults.reduce((sum, r) => sum + r.weighted_score, 0);

  // Normalize if weights don't sum to 1.0 (due to exclusions)
  const normalizedScore = totalWeight > 0 ? rawScore / totalWeight : 50;
  const finalScore = clampScore(normalizedScore);

  // Identify top contributors and detractors
  const sortedByContribution = [...signalResults].sort(
    (a, b) => b.weighted_score - a.weighted_score
  );

  const topContributors = sortedByContribution
    .filter((r) => r.score >= 60)
    .slice(0, 3)
    .map((r) => r.signal);

  const sortedByWeakness = [...signalResults].sort(
    (a, b) => a.score - b.score
  );

  const topDetractors = sortedByWeakness
    .filter((r) => r.score < 50)
    .slice(0, 3)
    .map((r) => r.signal);

  const breakdown: ScoreBreakdown = {
    signals: signalResults,
    total_weight: totalWeight,
    top_contributors: topContributors,
    top_detractors: topDetractors,
  };

  return {
    score: finalScore,
    breakdown,
  };
}

/**
 * Evaluates a single signal for a product.
 * Useful for targeted analysis or debugging.
 */
export function evaluateSingleSignal(
  input: ProductIntelligenceInput,
  signalType: SignalType
): SignalResult | null {
  const config = SIGNAL_REGISTRY.find((c) => c.type === signalType);
  if (!config) {
    return null;
  }

  return config.evaluate(input);
}

/**
 * Quick score check without full breakdown.
 * Faster for batch operations.
 */
export function quickScore(input: ProductIntelligenceInput): number {
  let totalWeightedScore = 0;
  let totalWeight = 0;

  for (const config of SIGNAL_REGISTRY) {
    const result = config.evaluate(input);
    totalWeightedScore += result.score * config.default_weight;
    totalWeight += config.default_weight;
  }

  return clampScore(totalWeightedScore / totalWeight);
}
