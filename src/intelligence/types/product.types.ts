/**
 * Product Intelligence Engine - Product Input Types
 *
 * These types define the shape of product data consumed by the intelligence engine.
 * They are intentionally decoupled from Supabase types to allow:
 * 1. Validation before processing
 * 2. Edge function compatibility (Deno runtime)
 * 3. Future data source flexibility
 */

/**
 * Core product data required for intelligence scoring.
 * Maps 1:1 with Supabase products table essential fields.
 */
export interface ProductData {
  id: string;
  title: string;
  handle: string | null;
  status: ProductStatus;
  price: number | null;
  compare_at_price: number | null;
  cost: number | null;
  margin_percent: number | null;
  inventory_quantity: number | null;
  tags: string[] | null;
  product_type: string | null;
  vendor: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Performance metrics for a product over a time window.
 * Aggregated from performance_metrics table.
 */
export interface ProductMetrics {
  product_id: string;
  period_days: number;
  views: number;
  add_to_carts: number;
  orders_count: number;
  units_sold: number;
  revenue: number;
  refund_count: number;
  refund_amount: number;
  profit: number;
  ad_spend: number;
  last_order_at: string | null;
}

/**
 * Combined input for the intelligence engine.
 * This is the complete context needed to score a product.
 */
export interface ProductIntelligenceInput {
  product: ProductData;
  metrics: ProductMetrics | null;
  /**
   * ISO timestamp of when scoring is performed.
   * Used for freshness calculations.
   */
  evaluated_at: string;
}

/**
 * Product status values matching Supabase enum.
 */
export type ProductStatus = 'active' | 'paused' | 'killed' | 'draft';

/**
 * Creates a ProductIntelligenceInput with default metrics.
 * Use when metrics are unavailable (new products).
 */
export function createIntelligenceInput(
  product: ProductData,
  metrics: ProductMetrics | null = null,
  evaluatedAt: string = new Date().toISOString()
): ProductIntelligenceInput {
  return {
    product,
    metrics: metrics ?? createEmptyMetrics(product.id),
    evaluated_at: evaluatedAt,
  };
}

/**
 * Creates empty metrics for products with no performance data.
 */
export function createEmptyMetrics(productId: string, periodDays = 30): ProductMetrics {
  return {
    product_id: productId,
    period_days: periodDays,
    views: 0,
    add_to_carts: 0,
    orders_count: 0,
    units_sold: 0,
    revenue: 0,
    refund_count: 0,
    refund_amount: 0,
    profit: 0,
    ad_spend: 0,
    last_order_at: null,
  };
}
