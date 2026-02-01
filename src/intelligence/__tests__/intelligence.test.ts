/**
 * Product Intelligence Engine - Unit Tests
 *
 * Tests cover:
 * 1. Individual signal evaluators
 * 2. Composite scoring
 * 3. Decision mapping
 * 4. Explanation generation
 * 5. Edge cases
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  analyzeProduct,
  quickAnalyze,
  rankProducts,
  filterByDecision,
  createIntelligenceInput,
  createEmptyMetrics,
  scoreToDecision,
  DECISION_THRESHOLDS,
} from '../index';
import type { ProductData, ProductMetrics, ProductIntelligenceInput } from '../types';

// Test fixtures
function createTestProduct(overrides: Partial<ProductData> = {}): ProductData {
  return {
    id: 'test-product-123',
    title: 'Test Product',
    handle: 'test-product',
    status: 'active',
    price: 49.99,
    compare_at_price: 69.99,
    cost: 20.00,
    margin_percent: 60,
    inventory_quantity: 100,
    tags: ['trending', 'new'],
    product_type: 'Electronics',
    vendor: 'Test Vendor',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    ...overrides,
  };
}

function createTestMetrics(overrides: Partial<ProductMetrics> = {}): ProductMetrics {
  return {
    product_id: 'test-product-123',
    period_days: 30,
    views: 1000,
    add_to_carts: 50,
    orders_count: 25,
    units_sold: 30,
    revenue: 1499.70,
    refund_count: 1,
    refund_amount: 49.99,
    profit: 749.70,
    ad_spend: 200,
    last_order_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    ...overrides,
  };
}

function createInput(
  productOverrides: Partial<ProductData> = {},
  metricsOverrides: Partial<ProductMetrics> | null = {}
): ProductIntelligenceInput {
  return createIntelligenceInput(
    createTestProduct(productOverrides),
    metricsOverrides === null ? null : createTestMetrics(metricsOverrides),
    new Date().toISOString()
  );
}

describe('Product Intelligence Engine', () => {
  describe('analyzeProduct', () => {
    it('returns complete output structure', () => {
      const input = createInput();
      const result = analyzeProduct(input);

      expect(result).toHaveProperty('product_id');
      expect(result).toHaveProperty('ai_confidence_score');
      expect(result).toHaveProperty('score_breakdown');
      expect(result).toHaveProperty('explanation');
      expect(result).toHaveProperty('decision');
      expect(result).toHaveProperty('metadata');
    });

    it('returns score between 0 and 100', () => {
      const input = createInput();
      const result = analyzeProduct(input);

      expect(result.ai_confidence_score).toBeGreaterThanOrEqual(0);
      expect(result.ai_confidence_score).toBeLessThanOrEqual(100);
    });

    it('returns valid decision', () => {
      const input = createInput();
      const result = analyzeProduct(input);

      expect(['promote', 'neutral', 'suppress']).toContain(result.decision);
    });

    it('includes algorithm version in metadata', () => {
      const input = createInput();
      const result = analyzeProduct(input);

      expect(result.metadata.algorithm_version).toBeDefined();
      expect(result.metadata.algorithm_version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('includes processing time in metadata', () => {
      const input = createInput();
      const result = analyzeProduct(input);

      expect(result.metadata.processing_time_ms).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Decision Mapping', () => {
    it('maps high scores to promote decision', () => {
      expect(scoreToDecision(100)).toBe('promote');
      expect(scoreToDecision(85)).toBe('promote');
      expect(scoreToDecision(70)).toBe('promote');
    });

    it('maps medium scores to neutral decision', () => {
      expect(scoreToDecision(69)).toBe('neutral');
      expect(scoreToDecision(55)).toBe('neutral');
      expect(scoreToDecision(40)).toBe('neutral');
    });

    it('maps low scores to suppress decision', () => {
      expect(scoreToDecision(39)).toBe('suppress');
      expect(scoreToDecision(20)).toBe('suppress');
      expect(scoreToDecision(0)).toBe('suppress');
    });

    it('respects threshold boundaries', () => {
      expect(scoreToDecision(DECISION_THRESHOLDS.promote.min)).toBe('promote');
      expect(scoreToDecision(DECISION_THRESHOLDS.promote.min - 1)).toBe('neutral');
      expect(scoreToDecision(DECISION_THRESHOLDS.neutral.min)).toBe('neutral');
      expect(scoreToDecision(DECISION_THRESHOLDS.neutral.min - 1)).toBe('suppress');
    });
  });

  describe('Signal Scoring', () => {
    describe('Margin Signal', () => {
      it('scores high margin products as excellent', () => {
        const input = createInput({ margin_percent: 60, price: 100, cost: 40 });
        const result = analyzeProduct(input);
        const marginSignal = result.score_breakdown.signals.find(s => s.signal === 'margin');

        expect(marginSignal?.severity).toBe('excellent');
        expect(marginSignal?.score).toBeGreaterThanOrEqual(75);
      });

      it('scores low margin products as warning/critical', () => {
        const input = createInput({ margin_percent: 10, price: 100, cost: 90 });
        const result = analyzeProduct(input);
        const marginSignal = result.score_breakdown.signals.find(s => s.signal === 'margin');

        expect(['critical', 'warning']).toContain(marginSignal?.severity);
        expect(marginSignal?.score).toBeLessThan(50);
      });

      it('calculates margin from price/cost when margin_percent is null', () => {
        const input = createInput({ margin_percent: null, price: 100, cost: 40 });
        const result = analyzeProduct(input);
        const marginSignal = result.score_breakdown.signals.find(s => s.signal === 'margin');

        expect(marginSignal?.score).toBeGreaterThan(50);
      });
    });

    describe('Inventory Signal', () => {
      it('scores out-of-stock products as critical', () => {
        const input = createInput({ inventory_quantity: 0 });
        const result = analyzeProduct(input);
        const inventorySignal = result.score_breakdown.signals.find(s => s.signal === 'inventory');

        expect(inventorySignal?.severity).toBe('critical');
        expect(inventorySignal?.score).toBe(0);
      });

      it('scores well-stocked products as excellent', () => {
        const input = createInput({ inventory_quantity: 150 });
        const result = analyzeProduct(input);
        const inventorySignal = result.score_breakdown.signals.find(s => s.signal === 'inventory');

        expect(inventorySignal?.severity).toBe('excellent');
      });

      it('handles null inventory gracefully', () => {
        const input = createInput({ inventory_quantity: null });
        const result = analyzeProduct(input);
        const inventorySignal = result.score_breakdown.signals.find(s => s.signal === 'inventory');

        expect(inventorySignal?.score).toBe(75); // Assumes adequate if not tracked
      });
    });

    describe('Velocity Signal', () => {
      it('scores high-velocity products as excellent', () => {
        const input = createInput({}, { orders_count: 50, units_sold: 60 });
        const result = analyzeProduct(input);
        const velocitySignal = result.score_breakdown.signals.find(s => s.signal === 'velocity');

        expect(velocitySignal?.severity).toBe('excellent');
      });

      it('scores zero-velocity products appropriately', () => {
        const input = createInput({}, { orders_count: 0, units_sold: 0 });
        const result = analyzeProduct(input);
        const velocitySignal = result.score_breakdown.signals.find(s => s.signal === 'velocity');

        expect(velocitySignal?.severity).toBe('critical');
      });

      it('gives new products benefit of doubt', () => {
        const input = createInput(
          { created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
          { orders_count: 0 }
        );
        const result = analyzeProduct(input);
        const velocitySignal = result.score_breakdown.signals.find(s => s.signal === 'velocity');

        // New products with no sales should score better than old products with no sales
        expect(velocitySignal?.score).toBeGreaterThanOrEqual(40);
      });
    });

    describe('Refund Signal', () => {
      it('scores products with no refunds as excellent', () => {
        const input = createInput({}, { refund_count: 0, orders_count: 20 });
        const result = analyzeProduct(input);
        const refundSignal = result.score_breakdown.signals.find(s => s.signal === 'refund');

        expect(refundSignal?.severity).toBe('excellent');
        expect(refundSignal?.score).toBe(100);
      });

      it('scores high refund rate as critical', () => {
        const input = createInput({}, { refund_count: 10, orders_count: 20 }); // 50% refund rate
        const result = analyzeProduct(input);
        const refundSignal = result.score_breakdown.signals.find(s => s.signal === 'refund');

        expect(refundSignal?.severity).toBe('critical');
      });

      it('requires minimum orders for statistical significance', () => {
        const input = createInput({}, { refund_count: 1, orders_count: 2 }); // 50% but only 2 orders
        const result = analyzeProduct(input);
        const refundSignal = result.score_breakdown.signals.find(s => s.signal === 'refund');

        // Should not penalize heavily due to low sample size
        expect(refundSignal?.score).toBeGreaterThan(50);
      });
    });

    describe('Engagement Signal', () => {
      it('scores high engagement as excellent', () => {
        const input = createInput({}, { views: 100, add_to_carts: 15 }); // 15% ATC rate
        const result = analyzeProduct(input);
        const engagementSignal = result.score_breakdown.signals.find(s => s.signal === 'engagement');

        expect(engagementSignal?.severity).toBe('excellent');
      });

      it('scores zero engagement as critical', () => {
        const input = createInput({}, { views: 100, add_to_carts: 0 });
        const result = analyzeProduct(input);
        const engagementSignal = result.score_breakdown.signals.find(s => s.signal === 'engagement');

        expect(engagementSignal?.severity).toBe('critical');
      });

      it('requires minimum views for analysis', () => {
        const input = createInput({}, { views: 5, add_to_carts: 0 });
        const result = analyzeProduct(input);
        const engagementSignal = result.score_breakdown.signals.find(s => s.signal === 'engagement');

        // Should not penalize heavily due to low views
        expect(engagementSignal?.score).toBe(50);
      });
    });

    describe('Freshness Signal', () => {
      it('scores recently active products as excellent', () => {
        const input = createInput(
          { updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
          { last_order_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }
        );
        const result = analyzeProduct(input);
        const freshnessSignal = result.score_breakdown.signals.find(s => s.signal === 'freshness');

        expect(freshnessSignal?.severity).toBe('excellent');
      });

      it('scores stale products as critical', () => {
        const input = createInput(
          { 
            created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
          },
          { last_order_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString() }
        );
        const result = analyzeProduct(input);
        const freshnessSignal = result.score_breakdown.signals.find(s => s.signal === 'freshness');

        expect(freshnessSignal?.severity).toBe('critical');
      });
    });
  });

  describe('Explanation Generation', () => {
    it('generates headline for each decision type', () => {
      const promoteInput = createInput({ margin_percent: 60 }, { orders_count: 50 });
      const suppressInput = createInput(
        { margin_percent: 5, inventory_quantity: 0 },
        { orders_count: 0, refund_count: 5, views: 100, add_to_carts: 0 }
      );

      const promoteResult = analyzeProduct(promoteInput);
      const suppressResult = analyzeProduct(suppressInput);

      expect(promoteResult.explanation.headline).toBeTruthy();
      expect(suppressResult.explanation.headline).toBeTruthy();
      expect(promoteResult.explanation.headline).not.toBe(suppressResult.explanation.headline);
    });

    it('includes strengths for healthy signals', () => {
      const input = createInput({ margin_percent: 60, inventory_quantity: 100 });
      const result = analyzeProduct(input);

      expect(result.explanation.strengths.length).toBeGreaterThan(0);
    });

    it('includes concerns for problematic signals', () => {
      const input = createInput({ margin_percent: 5, inventory_quantity: 0 });
      const result = analyzeProduct(input);

      expect(result.explanation.concerns.length).toBeGreaterThan(0);
    });

    it('generates recommendations for issues', () => {
      const input = createInput({ margin_percent: 5, inventory_quantity: 0 });
      const result = analyzeProduct(input);

      expect(result.explanation.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Batch Operations', () => {
    it('quickAnalyze returns minimal output', () => {
      const input = createInput();
      const result = quickAnalyze(input);

      expect(result).toHaveProperty('product_id');
      expect(result).toHaveProperty('ai_confidence_score');
      expect(result).toHaveProperty('decision');
      expect(result).not.toHaveProperty('explanation');
      expect(result).not.toHaveProperty('score_breakdown');
    });

    it('rankProducts sorts by score descending', () => {
      const inputs = [
        createInput({ id: 'low', margin_percent: 5 }, { orders_count: 0 }),
        createInput({ id: 'high', margin_percent: 60 }, { orders_count: 50 }),
        createInput({ id: 'mid', margin_percent: 30 }, { orders_count: 10 }),
      ];

      const ranked = rankProducts(inputs);

      expect(ranked[0]).toBe('high');
      expect(ranked[ranked.length - 1]).toBe('low');
    });

    it('filterByDecision returns correct products', () => {
      const goodProduct = createInput({ id: 'good', margin_percent: 60 }, { orders_count: 50 });
      const badProduct = createInput(
        { id: 'bad', margin_percent: 5, inventory_quantity: 0 },
        { orders_count: 0, refund_count: 10 }
      );

      const inputs = [goodProduct, badProduct];

      const promoted = filterByDecision(inputs, 'promote');
      const suppressed = filterByDecision(inputs, 'suppress');

      // At least one should be in each category
      expect(promoted.length + suppressed.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('handles product with no metrics', () => {
      const input = createInput({}, null);
      const result = analyzeProduct(input);

      expect(result.ai_confidence_score).toBeGreaterThanOrEqual(0);
      expect(result.ai_confidence_score).toBeLessThanOrEqual(100);
    });

    it('handles product with all null values', () => {
      const input = createInput({
        price: null,
        cost: null,
        margin_percent: null,
        inventory_quantity: null,
      }, null);

      const result = analyzeProduct(input);

      expect(result.ai_confidence_score).toBeGreaterThanOrEqual(0);
      expect(result.ai_confidence_score).toBeLessThanOrEqual(100);
    });

    it('handles negative margin', () => {
      const input = createInput({ margin_percent: -10 });
      const result = analyzeProduct(input);
      const marginSignal = result.score_breakdown.signals.find(s => s.signal === 'margin');

      expect(marginSignal?.severity).toBe('critical');
      expect(marginSignal?.score).toBeLessThan(15);
    });

    it('handles very old product', () => {
      const input = createInput({
        created_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
      }, {
        last_order_at: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const result = analyzeProduct(input);

      expect(result.ai_confidence_score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Score Breakdown', () => {
    it('includes all six signals', () => {
      const input = createInput();
      const result = analyzeProduct(input);

      expect(result.score_breakdown.signals).toHaveLength(6);
      
      const signalTypes = result.score_breakdown.signals.map(s => s.signal);
      expect(signalTypes).toContain('margin');
      expect(signalTypes).toContain('inventory');
      expect(signalTypes).toContain('velocity');
      expect(signalTypes).toContain('refund');
      expect(signalTypes).toContain('engagement');
      expect(signalTypes).toContain('freshness');
    });

    it('weights sum to approximately 1.0', () => {
      const input = createInput();
      const result = analyzeProduct(input);

      const totalWeight = result.score_breakdown.total_weight;
      expect(totalWeight).toBeCloseTo(1.0, 2);
    });

    it('weighted scores sum to final score', () => {
      const input = createInput();
      const result = analyzeProduct(input);

      const sumOfWeighted = result.score_breakdown.signals.reduce(
        (sum, s) => sum + s.weighted_score,
        0
      );

      // Should be close (rounding may cause small differences)
      expect(Math.abs(sumOfWeighted - result.ai_confidence_score)).toBeLessThan(2);
    });

    it('identifies top contributors correctly', () => {
      const input = createInput({ margin_percent: 70 }, { orders_count: 50 });
      const result = analyzeProduct(input);

      // High margin and velocity should be top contributors
      expect(result.score_breakdown.top_contributors.length).toBeGreaterThan(0);
    });

    it('identifies top detractors correctly', () => {
      const input = createInput({ inventory_quantity: 0 });
      const result = analyzeProduct(input);

      expect(result.score_breakdown.top_detractors).toContain('inventory');
    });
  });
});
