/**
 * Freshness Signal Evaluator
 *
 * Evaluates how recently a product has been active.
 * Stale products with no activity may need attention or removal.
 *
 * "Freshness" = recency of either:
 * 1. Last order
 * 2. Last product update (if no orders)
 *
 * Scoring Logic:
 * - Activity in last 3 days: 100 (hot)
 * - Activity in 3-7 days: 75-100 (fresh)
 * - Activity in 7-14 days: 50-75 (healthy)
 * - Activity in 14-30 days: 25-50 (aging)
 * - No activity 30+ days: 0-25 (stale)
 */

import type { ProductIntelligenceInput, SignalResult } from '../types';
import { clampScore, scoreToSeverity } from '../types';
import { FRESHNESS_THRESHOLDS, DEFAULT_SIGNAL_WEIGHTS } from '../config/weights';

export function evaluateFreshnessSignal(input: ProductIntelligenceInput): SignalResult {
  const { product, metrics, evaluated_at } = input;
  const weight = DEFAULT_SIGNAL_WEIGHTS.freshness;

  // Determine last activity date
  const lastOrderAt = metrics?.last_order_at ? new Date(metrics.last_order_at) : null;
  const productUpdatedAt = new Date(product.updated_at);
  const productCreatedAt = new Date(product.created_at);
  const evaluatedAt = new Date(evaluated_at);

  // Use most recent activity
  const lastActivity = lastOrderAt
    ? new Date(Math.max(lastOrderAt.getTime(), productUpdatedAt.getTime()))
    : productUpdatedAt;

  const daysSinceActivity = Math.floor(
    (evaluatedAt.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
  );

  const productAgeDays = Math.floor(
    (evaluatedAt.getTime() - productCreatedAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Very new products get a pass
  const isNewProduct = productAgeDays < 7;

  const score = calculateFreshnessScore(daysSinceActivity, isNewProduct);

  return createResult({
    score,
    weight,
    daysSinceActivity,
    lastOrderAt: lastOrderAt?.toISOString() ?? null,
    productUpdatedAt: product.updated_at,
    productCreatedAt: product.created_at,
    productAgeDays,
    isNewProduct,
    hadSales: !!lastOrderAt,
  });
}

function calculateFreshnessScore(days: number, isNew: boolean): number {
  // New products get benefit of doubt
  if (isNew) {
    return 80;
  }

  // Hot: 0-3 days
  if (days <= FRESHNESS_THRESHOLDS.hot) {
    return 100;
  }

  // Fresh: 3-7 days
  if (days <= FRESHNESS_THRESHOLDS.fresh) {
    const range = FRESHNESS_THRESHOLDS.fresh - FRESHNESS_THRESHOLDS.hot;
    const position = days - FRESHNESS_THRESHOLDS.hot;
    return clampScore(100 - (position / range) * 25);
  }

  // Healthy/Aging: 7-14 days
  if (days <= FRESHNESS_THRESHOLDS.aging) {
    const range = FRESHNESS_THRESHOLDS.aging - FRESHNESS_THRESHOLDS.fresh;
    const position = days - FRESHNESS_THRESHOLDS.fresh;
    return clampScore(75 - (position / range) * 25);
  }

  // Aging to Stale: 14-30 days
  if (days <= FRESHNESS_THRESHOLDS.stale) {
    const range = FRESHNESS_THRESHOLDS.stale - FRESHNESS_THRESHOLDS.aging;
    const position = days - FRESHNESS_THRESHOLDS.aging;
    return clampScore(50 - (position / range) * 25);
  }

  // Very stale: 30+ days
  const excessDays = days - FRESHNESS_THRESHOLDS.stale;
  return clampScore(Math.max(0, 25 - excessDays));
}

interface ResultParams {
  score: number;
  weight: number;
  daysSinceActivity: number;
  lastOrderAt: string | null;
  productUpdatedAt: string;
  productCreatedAt: string;
  productAgeDays: number;
  isNewProduct: boolean;
  hadSales: boolean;
}

function createResult(params: ResultParams): SignalResult {
  const {
    score,
    weight,
    daysSinceActivity,
    lastOrderAt,
    productUpdatedAt,
    productCreatedAt,
    productAgeDays,
    isNewProduct,
    hadSales,
  } = params;
  const severity = scoreToSeverity(score);

  const explanation = buildExplanation(
    daysSinceActivity,
    productAgeDays,
    severity,
    isNewProduct,
    hadSales
  );

  return {
    signal: 'freshness',
    score,
    weight,
    weighted_score: score * weight,
    severity,
    raw_values: {
      days_since_activity: daysSinceActivity,
      last_order_at: lastOrderAt,
      product_updated_at: productUpdatedAt,
      product_created_at: productCreatedAt,
      product_age_days: productAgeDays,
    },
    explanation,
  };
}

function buildExplanation(
  daysSince: number,
  ageDays: number,
  severity: ReturnType<typeof scoreToSeverity>,
  isNew: boolean,
  hadSales: boolean
) {
  if (isNew) {
    return {
      label: 'Product Freshness',
      summary: `New product (${ageDays} days old)`,
      impact: 'Recently added - building sales history',
      recommendation: null,
      threshold: null,
    };
  }

  const activityType = hadSales ? 'last sale' : 'last update';

  if (daysSince <= FRESHNESS_THRESHOLDS.hot) {
    return {
      label: 'Product Freshness',
      summary: `Very active - ${activityType} ${daysSince} day(s) ago`,
      impact: 'Product showing recent market activity',
      recommendation: null,
      threshold: null,
    };
  }

  const explanations = {
    critical: {
      summary: `Stale - ${activityType} was ${daysSince} days ago`,
      impact: 'Long-inactive product may be losing relevance',
      recommendation: 'Evaluate for discontinuation or refresh with new creative/pricing',
    },
    warning: {
      summary: `Aging - ${activityType} was ${daysSince} days ago`,
      impact: 'Activity declining - may need intervention',
      recommendation: 'Consider promotion or visibility boost to revive interest',
    },
    healthy: {
      summary: `Active - ${activityType} was ${daysSince} days ago`,
      impact: 'Normal activity cadence',
      recommendation: null,
    },
    excellent: {
      summary: `Fresh - ${activityType} was ${daysSince} days ago`,
      impact: 'Strong recent activity indicates healthy demand',
      recommendation: null,
    },
  };

  const data = explanations[severity];

  return {
    label: 'Product Freshness',
    summary: data.summary,
    impact: data.impact,
    recommendation: data.recommendation,
    threshold: {
      name: 'Stale Threshold',
      value: FRESHNESS_THRESHOLDS.stale,
      unit: 'days',
    },
  };
}
