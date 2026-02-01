/**
 * Product Intelligence Engine - Decision Mapper
 *
 * Maps scores to strategic decisions and provides decision metadata.
 */

import type { IntelligenceDecision, SignalType, ScoreBreakdown } from '../types';
import { DECISION_THRESHOLDS, scoreToDecision } from '../types';

export interface DecisionContext {
  /**
   * The strategic decision.
   */
  decision: IntelligenceDecision;

  /**
   * Confidence in this decision (0-1).
   * Higher when score is far from thresholds.
   */
  decision_confidence: number;

  /**
   * How close to next threshold boundary.
   */
  threshold_proximity: {
    distance_to_promote: number | null;
    distance_to_suppress: number | null;
  };

  /**
   * Signals that most influenced the decision.
   */
  primary_factors: SignalType[];
}

/**
 * Maps a score and breakdown to a decision with context.
 */
export function mapToDecision(score: number, breakdown: ScoreBreakdown): DecisionContext {
  const decision = scoreToDecision(score);

  // Calculate decision confidence based on distance from thresholds
  const decisionConfidence = calculateDecisionConfidence(score, decision);

  // Calculate proximity to thresholds
  const thresholdProximity = calculateThresholdProximity(score, decision);

  // Determine primary factors
  const primaryFactors = determinePrimaryFactors(breakdown, decision);

  return {
    decision,
    decision_confidence: decisionConfidence,
    threshold_proximity: thresholdProximity,
    primary_factors: primaryFactors,
  };
}

/**
 * Calculates confidence in the decision.
 * Higher when score is far from decision boundaries.
 */
function calculateDecisionConfidence(
  score: number,
  decision: IntelligenceDecision
): number {
  const promoteMin = DECISION_THRESHOLDS.promote.min;
  const neutralMin = DECISION_THRESHOLDS.neutral.min;

  if (decision === 'promote') {
    // Distance from promote threshold (70)
    const distance = score - promoteMin;
    // Max distance in promote range is 30 (70-100)
    return Math.min(1, 0.5 + (distance / 30) * 0.5);
  }

  if (decision === 'suppress') {
    // Distance from suppress threshold (39)
    const distance = neutralMin - 1 - score;
    // Max distance is ~39 (0-39)
    return Math.min(1, 0.5 + (distance / 39) * 0.5);
  }

  // Neutral - confidence based on distance from both boundaries
  const distanceToPromote = promoteMin - score;
  const distanceToSuppress = score - neutralMin;
  const minDistance = Math.min(distanceToPromote, distanceToSuppress);
  // Max distance from center is ~15 (at score 55, 15 from both boundaries)
  return Math.min(1, 0.3 + (minDistance / 15) * 0.4);
}

/**
 * Calculates how far the score is from threshold boundaries.
 */
function calculateThresholdProximity(
  score: number,
  decision: IntelligenceDecision
): { distance_to_promote: number | null; distance_to_suppress: number | null } {
  const promoteMin = DECISION_THRESHOLDS.promote.min;
  const neutralMin = DECISION_THRESHOLDS.neutral.min;

  if (decision === 'promote') {
    return {
      distance_to_promote: null, // Already promoting
      distance_to_suppress: score - neutralMin,
    };
  }

  if (decision === 'suppress') {
    return {
      distance_to_promote: promoteMin - score,
      distance_to_suppress: null, // Already suppressing
    };
  }

  // Neutral
  return {
    distance_to_promote: promoteMin - score,
    distance_to_suppress: score - neutralMin + 1,
  };
}

/**
 * Determines which signals most influenced the decision.
 */
function determinePrimaryFactors(
  breakdown: ScoreBreakdown,
  decision: IntelligenceDecision
): SignalType[] {
  if (decision === 'promote') {
    // For promote, top contributors are primary factors
    return breakdown.top_contributors.slice(0, 2);
  }

  if (decision === 'suppress') {
    // For suppress, top detractors are primary factors
    return breakdown.top_detractors.slice(0, 2);
  }

  // For neutral, both contributors and detractors matter
  const factors: SignalType[] = [];
  if (breakdown.top_contributors.length > 0) {
    factors.push(breakdown.top_contributors[0]);
  }
  if (breakdown.top_detractors.length > 0) {
    factors.push(breakdown.top_detractors[0]);
  }
  return factors;
}

/**
 * Returns a human-readable justification for the decision.
 */
export function getDecisionJustification(
  decision: IntelligenceDecision,
  score: number,
  primaryFactors: SignalType[]
): string {
  const factorStr = primaryFactors.length > 0 
    ? primaryFactors.join(' and ')
    : 'overall metrics';

  switch (decision) {
    case 'promote':
      return `Score of ${score} exceeds promotion threshold (70). Strong performance in ${factorStr}.`;
    case 'suppress':
      return `Score of ${score} falls below acceptable threshold (40). Issues with ${factorStr}.`;
    case 'neutral':
      return `Score of ${score} is within normal range (40-69). Monitor ${factorStr}.`;
  }
}

/**
 * Checks if a product is close to changing decision categories.
 * Useful for alerting operators to watch-list products.
 */
export function isNearThreshold(score: number, threshold = 5): boolean {
  const promoteMin = DECISION_THRESHOLDS.promote.min;
  const neutralMin = DECISION_THRESHOLDS.neutral.min;

  return (
    Math.abs(score - promoteMin) <= threshold ||
    Math.abs(score - neutralMin) <= threshold
  );
}
