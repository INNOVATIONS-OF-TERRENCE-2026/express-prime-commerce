/**
 * Refund Signal Evaluator
 *
 * Evaluates product quality and satisfaction via refund rates.
 * High refunds destroy margin and indicate quality issues.
 *
 * Scoring Logic:
 * - 0% refund rate: 100 (excellent)
 * - < 2%: 90-100 (excellent - within normal)
 * - 2-5%: 75-90 (healthy)
 * - 5-10%: 50-75 (warning)
 * - 10-20%: 25-50 (critical)
 * - > 20%: 0-25 (severe - pause/kill candidate)
 *
 * Note: Requires minimum order count for statistical significance.
 */

import type { ProductIntelligenceInput, SignalResult } from '../types';
import { clampScore, scoreToSeverity } from '../types';
import { REFUND_THRESHOLDS, DEFAULT_SIGNAL_WEIGHTS } from '../config/weights';

const MIN_ORDERS_FOR_SIGNIFICANCE = 5;

export function evaluateRefundSignal(input: ProductIntelligenceInput): SignalResult {
  const { metrics } = input;
  const weight = DEFAULT_SIGNAL_WEIGHTS.refund;

  // No metrics = assume good (no negative signal)
  if (!metrics) {
    return createResult({
      score: 75,
      weight,
      refundRate: 0,
      refundCount: 0,
      refundAmount: 0,
      ordersCount: 0,
      isStatisticallySignificant: false,
    });
  }

  const { orders_count, refund_count, refund_amount } = metrics;
  const refundRate = orders_count > 0 ? (refund_count / orders_count) * 100 : 0;
  const isSignificant = orders_count >= MIN_ORDERS_FOR_SIGNIFICANCE;

  // Not enough data - neutral score
  if (!isSignificant) {
    return createResult({
      score: 70,
      weight,
      refundRate,
      refundCount: refund_count,
      refundAmount: refund_amount,
      ordersCount: orders_count,
      isStatisticallySignificant: false,
    });
  }

  const score = calculateRefundScore(refundRate);

  return createResult({
    score,
    weight,
    refundRate,
    refundCount: refund_count,
    refundAmount: refund_amount,
    ordersCount: orders_count,
    isStatisticallySignificant: true,
  });
}

function calculateRefundScore(refundRate: number): number {
  // Perfect: 0% refunds
  if (refundRate === 0) {
    return 100;
  }

  // Excellent: < 2%
  if (refundRate < REFUND_THRESHOLDS.excellent) {
    return clampScore(90 + (1 - refundRate / REFUND_THRESHOLDS.excellent) * 10);
  }

  // Healthy: 2-5%
  if (refundRate < REFUND_THRESHOLDS.healthy) {
    const range = REFUND_THRESHOLDS.healthy - REFUND_THRESHOLDS.excellent;
    const position = refundRate - REFUND_THRESHOLDS.excellent;
    return clampScore(75 + (1 - position / range) * 15);
  }

  // Warning: 5-10%
  if (refundRate < REFUND_THRESHOLDS.warning) {
    const range = REFUND_THRESHOLDS.warning - REFUND_THRESHOLDS.healthy;
    const position = refundRate - REFUND_THRESHOLDS.healthy;
    return clampScore(50 + (1 - position / range) * 25);
  }

  // Critical: 10-20%
  if (refundRate < REFUND_THRESHOLDS.critical) {
    const range = REFUND_THRESHOLDS.critical - REFUND_THRESHOLDS.warning;
    const position = refundRate - REFUND_THRESHOLDS.warning;
    return clampScore(25 + (1 - position / range) * 25);
  }

  // Severe: > 20%
  const excess = refundRate - REFUND_THRESHOLDS.critical;
  return clampScore(Math.max(0, 25 - excess));
}

interface ResultParams {
  score: number;
  weight: number;
  refundRate: number;
  refundCount: number;
  refundAmount: number;
  ordersCount: number;
  isStatisticallySignificant: boolean;
}

function createResult(params: ResultParams): SignalResult {
  const {
    score,
    weight,
    refundRate,
    refundCount,
    refundAmount,
    ordersCount,
    isStatisticallySignificant,
  } = params;
  const severity = scoreToSeverity(score);

  const explanation = buildExplanation(
    refundRate,
    refundCount,
    refundAmount,
    ordersCount,
    severity,
    isStatisticallySignificant
  );

  return {
    signal: 'refund',
    score,
    weight,
    weighted_score: score * weight,
    severity,
    raw_values: {
      refund_rate_percent: Math.round(refundRate * 100) / 100,
      refund_count: refundCount,
      refund_amount: refundAmount,
      orders_count: ordersCount,
      min_orders_for_significance: MIN_ORDERS_FOR_SIGNIFICANCE,
    },
    explanation,
  };
}

function buildExplanation(
  rate: number,
  count: number,
  amount: number,
  orders: number,
  severity: ReturnType<typeof scoreToSeverity>,
  isSignificant: boolean
) {
  if (!isSignificant && orders > 0) {
    return {
      label: 'Refund Rate',
      summary: `${count} refund(s) from ${orders} orders - insufficient data`,
      impact: 'Sample size too small for reliable analysis',
      recommendation: `Need ${MIN_ORDERS_FOR_SIGNIFICANCE}+ orders for statistical significance`,
      threshold: null,
    };
  }

  if (orders === 0) {
    return {
      label: 'Refund Rate',
      summary: 'No orders to evaluate refund rate',
      impact: 'Cannot assess product satisfaction without sales data',
      recommendation: null,
      threshold: null,
    };
  }

  const rateStr = rate.toFixed(1);
  const amountStr = `$${amount.toFixed(2)}`;

  const explanations = {
    critical: {
      summary: `${rateStr}% refund rate (${count} of ${orders} orders, ${amountStr} refunded)`,
      impact: 'Extremely high returns destroying margin - product quality issue likely',
      recommendation: 'Pause product and investigate quality, description accuracy, or supplier',
    },
    warning: {
      summary: `${rateStr}% refund rate (${count} of ${orders} orders, ${amountStr} refunded)`,
      impact: 'Above-average returns eating into profit margin',
      recommendation: 'Review product description accuracy and customer feedback',
    },
    healthy: {
      summary: `${rateStr}% refund rate (${count} of ${orders} orders)`,
      impact: 'Returns within acceptable range',
      recommendation: null,
    },
    excellent: {
      summary: `${rateStr}% refund rate (${count} of ${orders} orders)`,
      impact: 'Excellent customer satisfaction - product meets expectations',
      recommendation: null,
    },
  };

  const data = explanations[severity];

  return {
    label: 'Refund Rate',
    summary: data.summary,
    impact: data.impact,
    recommendation: data.recommendation,
    threshold: {
      name: 'Maximum Acceptable Rate',
      value: REFUND_THRESHOLDS.warning,
      unit: '%',
    },
  };
}
