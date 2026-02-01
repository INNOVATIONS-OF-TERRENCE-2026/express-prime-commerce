/**
 * Product Intelligence Engine - Weight Configuration
 *
 * Defines default weights for each signal and thresholds for scoring.
 * These values can be overridden via Supabase global_settings table.
 *
 * Weight Philosophy:
 * - Margin is king (30%): Unprofitable products harm the business
 * - Velocity matters (20%): Sales momentum indicates demand
 * - Engagement signals intent (15%): Views → carts → purchases funnel
 * - Refunds are costly (15%): High returns destroy margin
 * - Inventory affects fulfillment (10%): Stockouts = lost sales
 * - Freshness keeps catalog relevant (10%): Stale products lose interest
 *
 * Total: 100% (weights sum to 1.0)
 */

import type { SignalType } from '../types';

/**
 * Default weights for each signal.
 * Keys match SignalType, values are 0.0 to 1.0.
 */
export const DEFAULT_SIGNAL_WEIGHTS: Record<SignalType, number> = {
  margin: 0.30,
  velocity: 0.20,
  engagement: 0.15,
  refund: 0.15,
  inventory: 0.10,
  freshness: 0.10,
};

/**
 * Margin signal thresholds.
 */
export const MARGIN_THRESHOLDS = {
  /** Below this = critical (likely losing money on ads) */
  critical: 15,
  /** Below this = warning (thin margins) */
  warning: 25,
  /** Below this = healthy (acceptable) */
  healthy: 40,
  /** Above this = excellent (strong profit potential) */
  excellent: 50,
} as const;

/**
 * Inventory signal thresholds.
 */
export const INVENTORY_THRESHOLDS = {
  /** Out of stock */
  outOfStock: 0,
  /** Dangerously low */
  critical: 5,
  /** Getting low */
  warning: 15,
  /** Healthy stock level */
  healthy: 50,
  /** Well stocked */
  excellent: 100,
} as const;

/**
 * Velocity signal thresholds (orders per period).
 */
export const VELOCITY_THRESHOLDS = {
  /** No sales in period */
  dead: 0,
  /** Very slow mover */
  critical: 1,
  /** Below average */
  warning: 3,
  /** Steady seller */
  healthy: 10,
  /** Strong performer */
  excellent: 25,
} as const;

/**
 * Refund rate thresholds (as percentage).
 */
export const REFUND_THRESHOLDS = {
  /** Extremely problematic */
  critical: 20,
  /** Concerning rate */
  warning: 10,
  /** Acceptable rate */
  healthy: 5,
  /** Excellent retention */
  excellent: 2,
} as const;

/**
 * Engagement thresholds.
 * Conversion rate: add_to_cart / views
 */
export const ENGAGEMENT_THRESHOLDS = {
  /** Very poor conversion */
  critical: 1,
  /** Below average */
  warning: 3,
  /** Industry average */
  healthy: 5,
  /** High performer */
  excellent: 10,
} as const;

/**
 * Freshness thresholds (days since last activity).
 * "Activity" = last order or last update.
 */
export const FRESHNESS_THRESHOLDS = {
  /** No recent activity (consider killing) */
  stale: 30,
  /** Getting old */
  aging: 14,
  /** Active recently */
  fresh: 7,
  /** Very active */
  hot: 3,
} as const;

/**
 * Global settings key for retrieving custom weights.
 */
export const WEIGHT_SETTINGS_KEY = 'product_intelligence_weights';

/**
 * Validates that weights sum to approximately 1.0.
 */
export function validateWeights(weights: Record<SignalType, number>): boolean {
  const sum = Object.values(weights).reduce((acc, w) => acc + w, 0);
  return Math.abs(sum - 1.0) < 0.01;
}

/**
 * Merges custom weights with defaults, ensuring all signals have weights.
 */
export function mergeWeights(
  customWeights: Partial<Record<SignalType, number>>
): Record<SignalType, number> {
  const merged = { ...DEFAULT_SIGNAL_WEIGHTS };

  for (const [key, value] of Object.entries(customWeights)) {
    if (key in merged && typeof value === 'number' && value >= 0 && value <= 1) {
      merged[key as SignalType] = value;
    }
  }

  // Normalize if weights don't sum to 1.0
  const sum = Object.values(merged).reduce((acc, w) => acc + w, 0);
  if (sum !== 1.0 && sum > 0) {
    for (const key of Object.keys(merged) as SignalType[]) {
      merged[key] = merged[key] / sum;
    }
  }

  return merged;
}
