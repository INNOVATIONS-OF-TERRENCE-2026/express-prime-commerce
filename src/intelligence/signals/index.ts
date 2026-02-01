/**
 * Signal Registry
 *
 * Central registry of all signal evaluators.
 * Add new signals here to include them in scoring.
 */

import type { SignalConfig, SignalType } from '../types';
import { evaluateMarginSignal } from './margin.signal';
import { evaluateInventorySignal } from './inventory.signal';
import { evaluateVelocitySignal } from './velocity.signal';
import { evaluateRefundSignal } from './refund.signal';
import { evaluateEngagementSignal } from './engagement.signal';
import { evaluateFreshnessSignal } from './freshness.signal';
import { DEFAULT_SIGNAL_WEIGHTS } from '../config/weights';

/**
 * All registered signal configurations.
 */
export const SIGNAL_REGISTRY: SignalConfig[] = [
  {
    type: 'margin',
    default_weight: DEFAULT_SIGNAL_WEIGHTS.margin,
    display_name: 'Profit Margin',
    description: 'Evaluates product profitability based on cost vs. price',
    evaluate: evaluateMarginSignal,
  },
  {
    type: 'inventory',
    default_weight: DEFAULT_SIGNAL_WEIGHTS.inventory,
    display_name: 'Inventory Health',
    description: 'Assesses stock levels and availability',
    evaluate: evaluateInventorySignal,
  },
  {
    type: 'velocity',
    default_weight: DEFAULT_SIGNAL_WEIGHTS.velocity,
    display_name: 'Sales Velocity',
    description: 'Measures order frequency and sales momentum',
    evaluate: evaluateVelocitySignal,
  },
  {
    type: 'refund',
    default_weight: DEFAULT_SIGNAL_WEIGHTS.refund,
    display_name: 'Refund Rate',
    description: 'Evaluates customer satisfaction via return rates',
    evaluate: evaluateRefundSignal,
  },
  {
    type: 'engagement',
    default_weight: DEFAULT_SIGNAL_WEIGHTS.engagement,
    display_name: 'Customer Engagement',
    description: 'Measures view-to-cart-to-purchase conversion',
    evaluate: evaluateEngagementSignal,
  },
  {
    type: 'freshness',
    default_weight: DEFAULT_SIGNAL_WEIGHTS.freshness,
    display_name: 'Product Freshness',
    description: 'Tracks recency of product activity',
    evaluate: evaluateFreshnessSignal,
  },
];

/**
 * Get a signal config by type.
 */
export function getSignalConfig(type: SignalType): SignalConfig | undefined {
  return SIGNAL_REGISTRY.find((s) => s.type === type);
}

/**
 * Get all signal types.
 */
export function getAllSignalTypes(): SignalType[] {
  return SIGNAL_REGISTRY.map((s) => s.type);
}

/**
 * Get signal display name.
 */
export function getSignalDisplayName(type: SignalType): string {
  return getSignalConfig(type)?.display_name ?? type;
}

// Re-export individual evaluators for direct use
export { evaluateMarginSignal } from './margin.signal';
export { evaluateInventorySignal } from './inventory.signal';
export { evaluateVelocitySignal } from './velocity.signal';
export { evaluateRefundSignal } from './refund.signal';
export { evaluateEngagementSignal } from './engagement.signal';
export { evaluateFreshnessSignal } from './freshness.signal';
