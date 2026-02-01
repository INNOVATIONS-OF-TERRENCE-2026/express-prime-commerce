/**
 * Product Intelligence Engine - Signal Types
 *
 * A "signal" is a single measurable dimension of product health.
 * Each signal produces a normalized score (0-100) and structured metadata.
 */

import type { ProductIntelligenceInput } from './product.types';

/**
 * All supported signal types.
 * Add new signals here when extending the engine.
 */
export type SignalType =
  | 'margin'
  | 'inventory'
  | 'velocity'
  | 'refund'
  | 'engagement'
  | 'freshness';

/**
 * Severity levels for signal evaluation.
 * Used to communicate urgency in explanations.
 */
export type SignalSeverity = 'critical' | 'warning' | 'healthy' | 'excellent';

/**
 * The result of evaluating a single signal.
 */
export interface SignalResult {
  /**
   * Which signal produced this result.
   */
  signal: SignalType;

  /**
   * Normalized score from 0-100.
   * 0 = worst possible, 100 = best possible.
   */
  score: number;

  /**
   * Weight applied to this signal in final calculation.
   * From 0.0 to 1.0, weights across all signals should sum to 1.0.
   */
  weight: number;

  /**
   * Weighted contribution to final score.
   * Calculated as: score * weight
   */
  weighted_score: number;

  /**
   * Health assessment for this signal.
   */
  severity: SignalSeverity;

  /**
   * Raw values used in calculation.
   * Enables UI to show actual numbers alongside scores.
   */
  raw_values: Record<string, number | string | null>;

  /**
   * Deterministic explanation components.
   * UI assembles these into human-readable text.
   */
  explanation: SignalExplanation;
}

/**
 * Structured explanation for a signal.
 * Designed for UI rendering, not prose generation.
 */
export interface SignalExplanation {
  /**
   * Short label for the signal (e.g., "Profit Margin").
   */
  label: string;

  /**
   * One-line summary of the current state.
   */
  summary: string;

  /**
   * What the current value means for the business.
   */
  impact: string;

  /**
   * Actionable recommendation if improvement is needed.
   * Null if signal is healthy/excellent.
   */
  recommendation: string | null;

  /**
   * Threshold that was evaluated against.
   */
  threshold: {
    name: string;
    value: number;
    unit: string;
  } | null;
}

/**
 * A signal evaluator function.
 * Takes product input, returns a signal result.
 */
export type SignalEvaluator = (input: ProductIntelligenceInput) => SignalResult;

/**
 * Configuration for a signal evaluator.
 */
export interface SignalConfig {
  /**
   * Unique identifier for this signal.
   */
  type: SignalType;

  /**
   * Default weight (0.0 - 1.0).
   * Can be overridden via global_settings.
   */
  default_weight: number;

  /**
   * Human-readable name.
   */
  display_name: string;

  /**
   * Brief description of what this signal measures.
   */
  description: string;

  /**
   * The evaluator function.
   */
  evaluate: SignalEvaluator;
}

/**
 * Maps severity to score ranges for consistent UI rendering.
 */
export const SEVERITY_THRESHOLDS: Record<SignalSeverity, { min: number; max: number }> = {
  critical: { min: 0, max: 24 },
  warning: { min: 25, max: 49 },
  healthy: { min: 50, max: 74 },
  excellent: { min: 75, max: 100 },
};

/**
 * Determines severity from a normalized score.
 */
export function scoreToSeverity(score: number): SignalSeverity {
  if (score >= 75) return 'excellent';
  if (score >= 50) return 'healthy';
  if (score >= 25) return 'warning';
  return 'critical';
}

/**
 * Clamps a score to valid range [0, 100].
 */
export function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}
