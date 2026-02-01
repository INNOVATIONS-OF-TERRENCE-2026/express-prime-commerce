/**
 * Product Intelligence Engine - Explainer
 *
 * Generates human-readable explanations from signal results.
 * Designed for UI rendering - not prose generation.
 */

import type {
  SignalResult,
  SignalType,
  IntelligenceExplanation,
  ExplanationPoint,
  IntelligenceDecision,
  ScoreBreakdown,
} from '../types';
import { scoreToSeverity } from '../types';
import { getSignalDisplayName } from '../signals';

/**
 * Generates a complete explanation from scoring results.
 */
export function generateExplanation(
  score: number,
  breakdown: ScoreBreakdown,
  decision: IntelligenceDecision
): IntelligenceExplanation {
  const { signals, top_contributors, top_detractors } = breakdown;

  const headline = generateHeadline(score, decision, top_detractors);
  const summary = generateSummary(score, signals, decision);
  const strengths = extractStrengths(signals, top_contributors);
  const concerns = extractConcerns(signals, top_detractors);
  const recommendations = extractRecommendations(signals);

  return {
    headline,
    summary,
    strengths,
    concerns,
    recommendations,
  };
}

/**
 * Generates a one-line headline based on overall performance.
 */
function generateHeadline(
  score: number,
  decision: IntelligenceDecision,
  detractors: SignalType[]
): string {
  const severity = scoreToSeverity(score);

  if (decision === 'promote') {
    if (detractors.length === 0) {
      return 'Excellent performer across all metrics';
    }
    return `Strong performer with minor ${formatSignalList(detractors)} concerns`;
  }

  if (decision === 'neutral') {
    if (detractors.length === 0) {
      return 'Moderate performer - meeting baseline expectations';
    }
    if (detractors.length === 1) {
      return `Average overall with ${getSignalDisplayName(detractors[0]).toLowerCase()} needing attention`;
    }
    return `Mixed performance - ${formatSignalList(detractors)} require improvement`;
  }

  // Suppress decision
  if (severity === 'critical') {
    return `Critical issues detected - immediate action required`;
  }
  return `Underperforming product - review for discontinuation`;
}

/**
 * Generates a 2-3 sentence summary.
 */
function generateSummary(
  score: number,
  signals: SignalResult[],
  decision: IntelligenceDecision
): string {
  const parts: string[] = [];

  // Overall score context
  parts.push(`This product scores ${score}/100 on the AI confidence index.`);

  // Count of healthy vs problematic signals
  const healthyCount = signals.filter((s) => s.severity === 'excellent' || s.severity === 'healthy').length;
  const problemCount = signals.filter((s) => s.severity === 'critical' || s.severity === 'warning').length;

  if (healthyCount === signals.length) {
    parts.push('All metrics are within healthy ranges.');
  } else if (problemCount === 0) {
    parts.push(`${healthyCount} of ${signals.length} metrics show healthy performance.`);
  } else {
    parts.push(`${problemCount} metric(s) require attention while ${healthyCount} are performing well.`);
  }

  // Decision implication
  const decisionText = {
    promote: 'Recommended for increased visibility and promotional investment.',
    neutral: 'Maintain current strategy while monitoring performance.',
    suppress: 'Consider reducing visibility or pausing until issues are resolved.',
  };
  parts.push(decisionText[decision]);

  return parts.join(' ');
}

/**
 * Extracts strengths from high-scoring signals.
 */
function extractStrengths(
  signals: SignalResult[],
  topContributors: SignalType[]
): ExplanationPoint[] {
  const strengths: ExplanationPoint[] = [];

  for (const signal of signals) {
    if (signal.severity !== 'excellent' && signal.severity !== 'healthy') {
      continue;
    }

    const isTopContributor = topContributors.includes(signal.signal);
    const priority = isTopContributor ? 1 : 2;

    strengths.push({
      signal: signal.signal,
      label: signal.explanation.label,
      text: signal.explanation.summary,
      priority,
    });
  }

  return strengths.sort((a, b) => a.priority - b.priority);
}

/**
 * Extracts concerns from low-scoring signals.
 */
function extractConcerns(
  signals: SignalResult[],
  topDetractors: SignalType[]
): ExplanationPoint[] {
  const concerns: ExplanationPoint[] = [];

  for (const signal of signals) {
    if (signal.severity !== 'critical' && signal.severity !== 'warning') {
      continue;
    }

    const isTopDetractor = topDetractors.includes(signal.signal);
    const priority = signal.severity === 'critical' ? 1 : isTopDetractor ? 2 : 3;

    concerns.push({
      signal: signal.signal,
      label: signal.explanation.label,
      text: `${signal.explanation.summary} ${signal.explanation.impact}`,
      priority,
    });
  }

  return concerns.sort((a, b) => a.priority - b.priority);
}

/**
 * Extracts actionable recommendations from signals.
 */
function extractRecommendations(signals: SignalResult[]): ExplanationPoint[] {
  const recommendations: ExplanationPoint[] = [];

  // Sort signals by severity (critical first, then warning)
  const sorted = [...signals].sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, healthy: 2, excellent: 3 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  let priority = 1;
  for (const signal of sorted) {
    if (!signal.explanation.recommendation) {
      continue;
    }

    recommendations.push({
      signal: signal.signal,
      label: signal.explanation.label,
      text: signal.explanation.recommendation,
      priority: priority++,
    });

    // Limit to top 5 recommendations
    if (recommendations.length >= 5) {
      break;
    }
  }

  return recommendations;
}

/**
 * Formats a list of signal types for display.
 */
function formatSignalList(types: SignalType[]): string {
  if (types.length === 0) return '';
  if (types.length === 1) return getSignalDisplayName(types[0]).toLowerCase();
  if (types.length === 2) {
    return `${getSignalDisplayName(types[0]).toLowerCase()} and ${getSignalDisplayName(types[1]).toLowerCase()}`;
  }
  const last = types.pop()!;
  return `${types.map((t) => getSignalDisplayName(t).toLowerCase()).join(', ')}, and ${getSignalDisplayName(last).toLowerCase()}`;
}

/**
 * Generates a minimal explanation for batch operations.
 * Faster than full explanation generation.
 */
export function generateQuickExplanation(
  score: number,
  decision: IntelligenceDecision
): string {
  if (decision === 'promote') {
    return `Score ${score}/100 - Recommended for promotion`;
  }
  if (decision === 'neutral') {
    return `Score ${score}/100 - Maintain current strategy`;
  }
  return `Score ${score}/100 - Review for potential issues`;
}
