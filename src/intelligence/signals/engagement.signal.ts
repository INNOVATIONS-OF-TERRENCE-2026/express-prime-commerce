/**
 * Engagement Signal Evaluator
 *
 * Evaluates customer interest via views → cart → purchase funnel.
 * High engagement with low conversion may indicate pricing issues.
 *
 * Primary metric: Add-to-cart rate (add_to_carts / views * 100)
 *
 * Scoring Logic:
 * - 0% ATC rate: 15 (some views = some interest)
 * - < 1%: 15-25 (critical - poor conversion)
 * - 1-3%: 25-50 (warning - below average)
 * - 3-5%: 50-75 (healthy - industry average)
 * - > 5%: 75-100 (excellent - high intent)
 */

import type { ProductIntelligenceInput, SignalResult } from '../types';
import { clampScore, scoreToSeverity } from '../types';
import { ENGAGEMENT_THRESHOLDS, DEFAULT_SIGNAL_WEIGHTS } from '../config/weights';

const MIN_VIEWS_FOR_ANALYSIS = 10;

export function evaluateEngagementSignal(input: ProductIntelligenceInput): SignalResult {
  const { metrics } = input;
  const weight = DEFAULT_SIGNAL_WEIGHTS.engagement;

  // No metrics = neutral
  if (!metrics) {
    return createResult({
      score: 50,
      weight,
      views: 0,
      addToCarts: 0,
      atcRate: 0,
      ordersCount: 0,
      viewToOrderRate: 0,
      hasEnoughData: false,
    });
  }

  const { views, add_to_carts, orders_count } = metrics;
  const hasEnoughData = views >= MIN_VIEWS_FOR_ANALYSIS;

  // Not enough views - can't calculate meaningful conversion
  if (!hasEnoughData) {
    return createResult({
      score: 50,
      weight,
      views,
      addToCarts: add_to_carts,
      atcRate: 0,
      ordersCount: orders_count,
      viewToOrderRate: 0,
      hasEnoughData: false,
    });
  }

  const atcRate = (add_to_carts / views) * 100;
  const viewToOrderRate = (orders_count / views) * 100;
  const score = calculateEngagementScore(atcRate, viewToOrderRate);

  return createResult({
    score,
    weight,
    views,
    addToCarts: add_to_carts,
    atcRate,
    ordersCount: orders_count,
    viewToOrderRate,
    hasEnoughData: true,
  });
}

function calculateEngagementScore(atcRate: number, viewToOrderRate: number): number {
  // Primary score from ATC rate
  let baseScore: number;

  if (atcRate === 0) {
    // Zero conversions but has views - something is wrong
    baseScore = 15;
  } else if (atcRate < ENGAGEMENT_THRESHOLDS.critical) {
    // Critical: < 1%
    baseScore = 15 + (atcRate / ENGAGEMENT_THRESHOLDS.critical) * 10;
  } else if (atcRate < ENGAGEMENT_THRESHOLDS.warning) {
    // Warning: 1-3%
    const range = ENGAGEMENT_THRESHOLDS.warning - ENGAGEMENT_THRESHOLDS.critical;
    const position = atcRate - ENGAGEMENT_THRESHOLDS.critical;
    baseScore = 25 + (position / range) * 25;
  } else if (atcRate < ENGAGEMENT_THRESHOLDS.healthy) {
    // Healthy: 3-5%
    const range = ENGAGEMENT_THRESHOLDS.healthy - ENGAGEMENT_THRESHOLDS.warning;
    const position = atcRate - ENGAGEMENT_THRESHOLDS.warning;
    baseScore = 50 + (position / range) * 25;
  } else if (atcRate < ENGAGEMENT_THRESHOLDS.excellent) {
    // Excellent: 5-10%
    const range = ENGAGEMENT_THRESHOLDS.excellent - ENGAGEMENT_THRESHOLDS.healthy;
    const position = atcRate - ENGAGEMENT_THRESHOLDS.healthy;
    baseScore = 75 + (position / range) * 20;
  } else {
    // Outstanding: > 10%
    baseScore = 95 + Math.min(5, (atcRate - ENGAGEMENT_THRESHOLDS.excellent) / 5);
  }

  // Bonus for strong view-to-order conversion
  const conversionBonus = viewToOrderRate > 2 ? 5 : viewToOrderRate > 1 ? 2 : 0;

  return clampScore(baseScore + conversionBonus);
}

interface ResultParams {
  score: number;
  weight: number;
  views: number;
  addToCarts: number;
  atcRate: number;
  ordersCount: number;
  viewToOrderRate: number;
  hasEnoughData: boolean;
}

function createResult(params: ResultParams): SignalResult {
  const {
    score,
    weight,
    views,
    addToCarts,
    atcRate,
    ordersCount,
    viewToOrderRate,
    hasEnoughData,
  } = params;
  const severity = scoreToSeverity(score);

  const explanation = buildExplanation(
    views,
    addToCarts,
    atcRate,
    ordersCount,
    viewToOrderRate,
    severity,
    hasEnoughData
  );

  return {
    signal: 'engagement',
    score,
    weight,
    weighted_score: score * weight,
    severity,
    raw_values: {
      views,
      add_to_carts: addToCarts,
      atc_rate_percent: Math.round(atcRate * 100) / 100,
      orders_count: ordersCount,
      view_to_order_percent: Math.round(viewToOrderRate * 100) / 100,
    },
    explanation,
  };
}

function buildExplanation(
  views: number,
  atc: number,
  atcRate: number,
  orders: number,
  vtoPct: number,
  severity: ReturnType<typeof scoreToSeverity>,
  hasData: boolean
) {
  if (!hasData && views === 0) {
    return {
      label: 'Customer Engagement',
      summary: 'No views recorded yet',
      impact: 'Product not getting exposure',
      recommendation: 'Increase visibility through ads or better SEO',
      threshold: null,
    };
  }

  if (!hasData) {
    return {
      label: 'Customer Engagement',
      summary: `${views} views - insufficient data for conversion analysis`,
      impact: 'Need more traffic to assess engagement quality',
      recommendation: `Gather ${MIN_VIEWS_FOR_ANALYSIS}+ views for meaningful analysis`,
      threshold: null,
    };
  }

  const rateStr = atcRate.toFixed(1);

  const explanations = {
    critical: {
      summary: `${rateStr}% add-to-cart rate (${atc} carts from ${views} views)`,
      impact: 'Customers viewing but not adding to cart - listing may be unappealing',
      recommendation: 'Review images, description, pricing, and competitor positioning',
    },
    warning: {
      summary: `${rateStr}% add-to-cart rate (${atc} carts from ${views} views)`,
      impact: 'Below-average conversion - room for optimization',
      recommendation: 'A/B test images, titles, or pricing to improve conversion',
    },
    healthy: {
      summary: `${rateStr}% add-to-cart rate (${atc} carts from ${views} views)`,
      impact: 'Good engagement - customers are interested',
      recommendation: null,
    },
    excellent: {
      summary: `${rateStr}% add-to-cart rate (${atc} carts from ${views} views)`,
      impact: 'Strong engagement signals high purchase intent',
      recommendation: null,
    },
  };

  const data = explanations[severity];

  return {
    label: 'Customer Engagement',
    summary: data.summary,
    impact: data.impact,
    recommendation: data.recommendation,
    threshold: {
      name: 'Industry Average ATC Rate',
      value: ENGAGEMENT_THRESHOLDS.warning,
      unit: '%',
    },
  };
}
