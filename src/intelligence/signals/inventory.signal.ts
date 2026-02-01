/**
 * Inventory Signal Evaluator
 *
 * Evaluates stock health and availability.
 * Out-of-stock products can't generate revenue.
 *
 * Scoring Logic:
 * - 0 units: 0 (critical - can't sell)
 * - 1-5 units: 0-25 (critical - will stockout soon)
 * - 6-15 units: 25-50 (warning - low stock)
 * - 16-50 units: 50-75 (healthy - adequate)
 * - 50+ units: 75-100 (excellent - well stocked)
 */

import type { ProductIntelligenceInput, SignalResult } from '../types';
import { clampScore, scoreToSeverity } from '../types';
import { INVENTORY_THRESHOLDS, DEFAULT_SIGNAL_WEIGHTS } from '../config/weights';

export function evaluateInventorySignal(input: ProductIntelligenceInput): SignalResult {
  const { product } = input;
  const weight = DEFAULT_SIGNAL_WEIGHTS.inventory;

  const inventory = product.inventory_quantity;

  // Handle null inventory (infinite stock or untracked)
  if (inventory === null) {
    return createResult({
      score: 75, // Assume adequate if not tracked
      weight,
      inventoryQuantity: null,
      isTracked: false,
    });
  }

  const score = calculateInventoryScore(inventory);

  return createResult({
    score,
    weight,
    inventoryQuantity: inventory,
    isTracked: true,
  });
}

function calculateInventoryScore(inventory: number): number {
  // Out of stock = 0
  if (inventory <= INVENTORY_THRESHOLDS.outOfStock) {
    return 0;
  }

  // Critical: 1-5 units → score 5-25
  if (inventory <= INVENTORY_THRESHOLDS.critical) {
    return clampScore(5 + (inventory / INVENTORY_THRESHOLDS.critical) * 20);
  }

  // Warning: 6-15 units → score 25-50
  if (inventory <= INVENTORY_THRESHOLDS.warning) {
    const range = INVENTORY_THRESHOLDS.warning - INVENTORY_THRESHOLDS.critical;
    const position = inventory - INVENTORY_THRESHOLDS.critical;
    return clampScore(25 + (position / range) * 25);
  }

  // Healthy: 16-50 units → score 50-75
  if (inventory <= INVENTORY_THRESHOLDS.healthy) {
    const range = INVENTORY_THRESHOLDS.healthy - INVENTORY_THRESHOLDS.warning;
    const position = inventory - INVENTORY_THRESHOLDS.warning;
    return clampScore(50 + (position / range) * 25);
  }

  // Excellent: 50-100+ units → score 75-100
  const range = INVENTORY_THRESHOLDS.excellent - INVENTORY_THRESHOLDS.healthy;
  const position = Math.min(inventory - INVENTORY_THRESHOLDS.healthy, range);
  return clampScore(75 + (position / range) * 25);
}

interface ResultParams {
  score: number;
  weight: number;
  inventoryQuantity: number | null;
  isTracked: boolean;
}

function createResult(params: ResultParams): SignalResult {
  const { score, weight, inventoryQuantity, isTracked } = params;
  const severity = scoreToSeverity(score);

  const explanation = buildExplanation(inventoryQuantity, severity, isTracked);

  return {
    signal: 'inventory',
    score,
    weight,
    weighted_score: score * weight,
    severity,
    raw_values: {
      inventory_quantity: inventoryQuantity,
      is_tracked: isTracked ? 1 : 0,
    },
    explanation,
  };
}

function buildExplanation(
  quantity: number | null,
  severity: ReturnType<typeof scoreToSeverity>,
  isTracked: boolean
) {
  if (!isTracked) {
    return {
      label: 'Inventory Level',
      summary: 'Inventory tracking not enabled',
      impact: 'Cannot predict stockouts or optimize reordering',
      recommendation: 'Enable inventory tracking for better fulfillment planning',
      threshold: null,
    };
  }

  if (quantity === 0) {
    return {
      label: 'Inventory Level',
      summary: 'Product is out of stock',
      impact: 'Cannot fulfill orders - lost revenue and damaged customer trust',
      recommendation: 'Restock immediately or pause product to avoid overselling',
      threshold: {
        name: 'Minimum Stock',
        value: INVENTORY_THRESHOLDS.critical,
        unit: 'units',
      },
    };
  }

  const explanations = {
    critical: {
      summary: `Only ${quantity} units remaining`,
      impact: 'High risk of stockout within days',
      recommendation: 'Initiate reorder immediately',
    },
    warning: {
      summary: `${quantity} units in stock - running low`,
      impact: 'May stockout before next restock cycle',
      recommendation: 'Plan reorder or reduce promotional activity',
    },
    healthy: {
      summary: `${quantity} units available - adequate stock`,
      impact: 'Sufficient inventory for normal demand',
      recommendation: null,
    },
    excellent: {
      summary: `${quantity} units in stock - well supplied`,
      impact: 'Can support promotional campaigns without stockout risk',
      recommendation: null,
    },
  };

  const data = explanations[severity];

  return {
    label: 'Inventory Level',
    summary: data.summary,
    impact: data.impact,
    recommendation: data.recommendation,
    threshold: {
      name: 'Healthy Stock Level',
      value: INVENTORY_THRESHOLDS.warning,
      unit: 'units',
    },
  };
}
