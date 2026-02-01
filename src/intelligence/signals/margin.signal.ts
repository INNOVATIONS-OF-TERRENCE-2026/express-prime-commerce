/**
 * Margin Signal Evaluator
 *
 * Evaluates product profitability based on margin percentage.
 * This is the most critical signal - unprofitable products harm the business.
 *
 * Scoring Logic:
 * - No margin data: 50 (neutral, cannot determine)
 * - < 15%: 0-25 (critical - losing money on acquisition)
 * - 15-25%: 25-50 (warning - thin margins)
 * - 25-40%: 50-75 (healthy - acceptable profit)
 * - > 40%: 75-100 (excellent - strong profit potential)
 */

import type { ProductIntelligenceInput, SignalResult } from '../types';
import { clampScore, scoreToSeverity } from '../types';
import { MARGIN_THRESHOLDS, DEFAULT_SIGNAL_WEIGHTS } from '../config/weights';

export function evaluateMarginSignal(input: ProductIntelligenceInput): SignalResult {
  const { product } = input;
  const weight = DEFAULT_SIGNAL_WEIGHTS.margin;

  // Extract margin data
  const marginPercent = product.margin_percent;
  const price = product.price ?? 0;
  const cost = product.cost ?? 0;

  // Calculate margin if not provided
  let actualMargin: number | null = marginPercent;
  if (actualMargin === null && price > 0 && cost > 0) {
    actualMargin = ((price - cost) / price) * 100;
  }

  // Handle missing data case
  if (actualMargin === null || price === 0) {
    return createResult({
      score: 50,
      weight,
      marginPercent: null,
      price,
      cost,
      hasCostData: cost > 0,
    });
  }

  // Calculate score based on margin
  const score = calculateMarginScore(actualMargin);

  return createResult({
    score,
    weight,
    marginPercent: actualMargin,
    price,
    cost,
    hasCostData: cost > 0,
  });
}

function calculateMarginScore(margin: number): number {
  // Negative margin = worst case
  if (margin < 0) {
    return clampScore(Math.max(0, 10 + margin)); // Allows slight negative to score ~10
  }

  // Critical: 0-15% margin → score 0-25
  if (margin < MARGIN_THRESHOLDS.critical) {
    return clampScore((margin / MARGIN_THRESHOLDS.critical) * 25);
  }

  // Warning: 15-25% margin → score 25-50
  if (margin < MARGIN_THRESHOLDS.warning) {
    const range = MARGIN_THRESHOLDS.warning - MARGIN_THRESHOLDS.critical;
    const position = margin - MARGIN_THRESHOLDS.critical;
    return clampScore(25 + (position / range) * 25);
  }

  // Healthy: 25-40% margin → score 50-75
  if (margin < MARGIN_THRESHOLDS.healthy) {
    const range = MARGIN_THRESHOLDS.healthy - MARGIN_THRESHOLDS.warning;
    const position = margin - MARGIN_THRESHOLDS.warning;
    return clampScore(50 + (position / range) * 25);
  }

  // Excellent: 40-50%+ margin → score 75-100
  const range = MARGIN_THRESHOLDS.excellent - MARGIN_THRESHOLDS.healthy;
  const position = Math.min(margin - MARGIN_THRESHOLDS.healthy, range);
  return clampScore(75 + (position / range) * 25);
}

interface ResultParams {
  score: number;
  weight: number;
  marginPercent: number | null;
  price: number;
  cost: number;
  hasCostData: boolean;
}

function createResult(params: ResultParams): SignalResult {
  const { score, weight, marginPercent, price, cost, hasCostData } = params;
  const severity = scoreToSeverity(score);

  const explanation = buildExplanation(marginPercent, severity, hasCostData);

  return {
    signal: 'margin',
    score,
    weight,
    weighted_score: score * weight,
    severity,
    raw_values: {
      margin_percent: marginPercent,
      price,
      cost,
      profit_per_unit: price && cost ? price - cost : null,
    },
    explanation,
  };
}

function buildExplanation(
  marginPercent: number | null,
  severity: ReturnType<typeof scoreToSeverity>,
  hasCostData: boolean
) {
  if (marginPercent === null) {
    return {
      label: 'Profit Margin',
      summary: hasCostData
        ? 'Margin cannot be calculated (missing price data)'
        : 'Cost data not available for margin calculation',
      impact: 'Unable to determine profitability without complete pricing data',
      recommendation: hasCostData
        ? 'Verify product pricing is configured correctly'
        : 'Add cost data to enable margin tracking',
      threshold: null,
    };
  }

  const marginStr = marginPercent.toFixed(1);

  const explanations = {
    critical: {
      summary: `Margin at ${marginStr}% is critically low`,
      impact: 'Product likely unprofitable after ad spend and operations costs',
      recommendation: 'Increase price or find lower-cost supplier immediately',
    },
    warning: {
      summary: `Margin at ${marginStr}% leaves thin profit cushion`,
      impact: 'Vulnerable to cost increases or discount pressure',
      recommendation: 'Consider price optimization or cost reduction',
    },
    healthy: {
      summary: `Margin at ${marginStr}% is within acceptable range`,
      impact: 'Profitable with room for operational variance',
      recommendation: null,
    },
    excellent: {
      summary: `Margin at ${marginStr}% indicates strong profit potential`,
      impact: 'High-margin product suitable for scaling',
      recommendation: null,
    },
  };

  const data = explanations[severity];

  return {
    label: 'Profit Margin',
    summary: data.summary,
    impact: data.impact,
    recommendation: data.recommendation,
    threshold: {
      name: 'Minimum Healthy Margin',
      value: MARGIN_THRESHOLDS.warning,
      unit: '%',
    },
  };
}
