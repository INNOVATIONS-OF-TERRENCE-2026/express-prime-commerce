/**
 * Product Intelligence Engine - Score Output Types
 *
 * These types define the final output of the intelligence engine.
 * They are the contract between backend and frontend.
 */

import type { SignalResult, SignalType } from './signal.types';

/**
 * Strategic decision based on AI confidence score.
 * - promote: Feature prominently, increase ad spend
 * - neutral: Maintain current state, monitor
 * - suppress: Reduce visibility, consider pausing
 */
export type IntelligenceDecision = 'promote' | 'neutral' | 'suppress';

/**
 * The complete output of the Product Intelligence Engine.
 * This is the primary return type for all scoring operations.
 */
export interface ProductIntelligenceOutput {
  /**
   * Product identifier (Supabase UUID).
   */
  product_id: string;

  /**
   * Composite confidence score (0-100).
   * Weighted sum of all signal scores.
   */
  ai_confidence_score: number;

  /**
   * Breakdown of individual signal contributions.
   * Enables UI to show "why" behind the score.
   */
  score_breakdown: ScoreBreakdown;

  /**
   * Human-readable explanation of the score.
   * Structured for UI rendering.
   */
  explanation: IntelligenceExplanation;

  /**
   * Strategic recommendation.
   */
  decision: IntelligenceDecision;

  /**
   * Metadata about the scoring process.
   */
  metadata: ScoringMetadata;
}

/**
 * Detailed breakdown of how the final score was calculated.
 */
export interface ScoreBreakdown {
  /**
   * Individual signal results.
   */
  signals: SignalResult[];

  /**
   * Sum of all weights (should be 1.0 if configured correctly).
   */
  total_weight: number;

  /**
   * Signals that most positively impacted the score.
   */
  top_contributors: SignalType[];

  /**
   * Signals that most negatively impacted the score.
   */
  top_detractors: SignalType[];
}

/**
 * Structured explanation optimized for UI rendering.
 */
export interface IntelligenceExplanation {
  /**
   * One-line headline (e.g., "Strong performer with minor inventory concern").
   */
  headline: string;

  /**
   * 2-3 sentence summary of overall health.
   */
  summary: string;

  /**
   * Key strengths identified.
   */
  strengths: ExplanationPoint[];

  /**
   * Areas of concern or improvement.
   */
  concerns: ExplanationPoint[];

  /**
   * Prioritized action items.
   */
  recommendations: ExplanationPoint[];
}

/**
 * A single point in the explanation.
 */
export interface ExplanationPoint {
  /**
   * Which signal this relates to.
   */
  signal: SignalType;

  /**
   * Short label for display.
   */
  label: string;

  /**
   * Detailed text.
   */
  text: string;

  /**
   * Priority for sorting (1 = highest).
   */
  priority: number;
}

/**
 * Metadata about the scoring operation.
 */
export interface ScoringMetadata {
  /**
   * ISO timestamp when scoring was performed.
   */
  scored_at: string;

  /**
   * Version of the scoring algorithm.
   * Increment when logic changes significantly.
   */
  algorithm_version: string;

  /**
   * Time window used for metrics (in days).
   */
  metrics_period_days: number;

  /**
   * Processing time in milliseconds.
   */
  processing_time_ms: number;

  /**
   * Source of weight configuration.
   * 'default' | 'global_settings' | 'custom'
   */
  weight_source: string;
}

/**
 * Decision thresholds.
 * These define the boundaries between promote/neutral/suppress.
 */
export const DECISION_THRESHOLDS = {
  promote: { min: 70 },
  neutral: { min: 40, max: 69 },
  suppress: { max: 39 },
} as const;

/**
 * Maps a confidence score to a decision.
 */
export function scoreToDecision(score: number): IntelligenceDecision {
  if (score >= DECISION_THRESHOLDS.promote.min) return 'promote';
  if (score >= DECISION_THRESHOLDS.neutral.min) return 'neutral';
  return 'suppress';
}

/**
 * Current algorithm version.
 * Update this when making significant changes to scoring logic.
 */
export const ALGORITHM_VERSION = '1.0.0';
