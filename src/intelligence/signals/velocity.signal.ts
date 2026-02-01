/**
 * Velocity Signal Evaluator
 *
 * Evaluates sales momentum based on order frequency.
 * Fast-moving products indicate strong demand.
 *
 * Scoring Logic:
 * - 0 orders in period: 0 (dead product)
 * - 1 order: 10-25 (critical - barely moving)
 * - 2-3 orders: 25-50 (warning - slow mover)
 * - 4-10 orders: 50-75 (healthy - steady seller)
 * - 10+ orders: 75-100 (excellent - strong performer)
 */

import type { ProductIntelligenceInput, SignalResult } from '../types';
import { clampScore, scoreToSeverity } from '../types';
import { VELOCITY_THRESHOLDS, DEFAULT_SIGNAL_WEIGHTS } from '../config/weights';

export function evaluateVelocitySignal(input: ProductIntelligenceInput): SignalResult {
  const { product, metrics } = input;
  const weight = DEFAULT_SIGNAL_WEIGHTS.velocity;

  // Check if product is new (less than 7 days old)
  const productAgeDays = getProductAgeDays(product.created_at, input.evaluated_at);
  const isNewProduct = productAgeDays < 7;

  // No metrics = no data to evaluate
  if (!metrics) {
    return createResult({
      score: isNewProduct ? 50 : 25, // New products get benefit of doubt
      weight,
      ordersCount: 0,
      unitsSold: 0,
      revenue: 0,
      periodDays: 30,
      isNewProduct,
      productAgeDays,
    });
  }

  const score = calculateVelocityScore(metrics.orders_count, isNewProduct);

  return createResult({
    score,
    weight,
    ordersCount: metrics.orders_count,
    unitsSold: metrics.units_sold,
    revenue: metrics.revenue,
    periodDays: metrics.period_days,
    isNewProduct,
    productAgeDays,
  });
}

function calculateVelocityScore(orders: number, isNewProduct: boolean): number {
  // Zero orders
  if (orders === VELOCITY_THRESHOLDS.dead) {
    return isNewProduct ? 40 : 0; // New products haven't had time to sell
  }

  // Critical: 1 order → score 10-25
  if (orders <= VELOCITY_THRESHOLDS.critical) {
    return clampScore(10 + (orders / VELOCITY_THRESHOLDS.critical) * 15);
  }

  // Warning: 2-3 orders → score 25-50
  if (orders <= VELOCITY_THRESHOLDS.warning) {
    const range = VELOCITY_THRESHOLDS.warning - VELOCITY_THRESHOLDS.critical;
    const position = orders - VELOCITY_THRESHOLDS.critical;
    return clampScore(25 + (position / range) * 25);
  }

  // Healthy: 4-10 orders → score 50-75
  if (orders <= VELOCITY_THRESHOLDS.healthy) {
    const range = VELOCITY_THRESHOLDS.healthy - VELOCITY_THRESHOLDS.warning;
    const position = orders - VELOCITY_THRESHOLDS.warning;
    return clampScore(50 + (position / range) * 25);
  }

  // Excellent: 10-25+ orders → score 75-100
  const range = VELOCITY_THRESHOLDS.excellent - VELOCITY_THRESHOLDS.healthy;
  const position = Math.min(orders - VELOCITY_THRESHOLDS.healthy, range);
  return clampScore(75 + (position / range) * 25);
}

function getProductAgeDays(createdAt: string, evaluatedAt: string): number {
  const created = new Date(createdAt).getTime();
  const evaluated = new Date(evaluatedAt).getTime();
  return Math.floor((evaluated - created) / (1000 * 60 * 60 * 24));
}

interface ResultParams {
  score: number;
  weight: number;
  ordersCount: number;
  unitsSold: number;
  revenue: number;
  periodDays: number;
  isNewProduct: boolean;
  productAgeDays: number;
}

function createResult(params: ResultParams): SignalResult {
  const {
    score,
    weight,
    ordersCount,
    unitsSold,
    revenue,
    periodDays,
    isNewProduct,
    productAgeDays,
  } = params;
  const severity = scoreToSeverity(score);

  const ordersPerDay = periodDays > 0 ? ordersCount / periodDays : 0;

  const explanation = buildExplanation(
    ordersCount,
    unitsSold,
    revenue,
    periodDays,
    severity,
    isNewProduct,
    productAgeDays
  );

  return {
    signal: 'velocity',
    score,
    weight,
    weighted_score: score * weight,
    severity,
    raw_values: {
      orders_count: ordersCount,
      units_sold: unitsSold,
      revenue,
      period_days: periodDays,
      orders_per_day: Math.round(ordersPerDay * 100) / 100,
      product_age_days: productAgeDays,
    },
    explanation,
  };
}

function buildExplanation(
  orders: number,
  units: number,
  revenue: number,
  period: number,
  severity: ReturnType<typeof scoreToSeverity>,
  isNew: boolean,
  ageDays: number
) {
  if (isNew && orders === 0) {
    return {
      label: 'Sales Velocity',
      summary: `New product (${ageDays} days old) - no sales yet`,
      impact: 'Insufficient data to assess demand',
      recommendation: 'Allow 7-14 days to establish baseline performance',
      threshold: null,
    };
  }

  if (orders === 0) {
    return {
      label: 'Sales Velocity',
      summary: `No orders in the last ${period} days`,
      impact: 'Product is not generating revenue - consider discontinuing',
      recommendation: 'Review listing quality, pricing, and visibility',
      threshold: {
        name: 'Minimum Orders',
        value: VELOCITY_THRESHOLDS.warning,
        unit: `per ${period} days`,
      },
    };
  }

  const revenueStr = `$${revenue.toFixed(2)}`;

  const explanations = {
    critical: {
      summary: `Only ${orders} order(s) in ${period} days (${revenueStr} revenue)`,
      impact: 'Slow mover - likely not profitable after fixed costs',
      recommendation: 'Boost visibility or reconsider product viability',
    },
    warning: {
      summary: `${orders} orders in ${period} days (${revenueStr} revenue)`,
      impact: 'Below average velocity - moderate revenue contribution',
      recommendation: 'Test promotions or pricing adjustments to increase velocity',
    },
    healthy: {
      summary: `${orders} orders in ${period} days (${revenueStr} revenue)`,
      impact: 'Steady performer contributing reliable revenue',
      recommendation: null,
    },
    excellent: {
      summary: `${orders} orders in ${period} days (${revenueStr} revenue)`,
      impact: 'High-velocity product - strong demand signal',
      recommendation: null,
    },
  };

  const data = explanations[severity];

  return {
    label: 'Sales Velocity',
    summary: data.summary,
    impact: data.impact,
    recommendation: data.recommendation,
    threshold: {
      name: 'Healthy Order Rate',
      value: VELOCITY_THRESHOLDS.healthy,
      unit: `orders per ${period} days`,
    },
  };
}
