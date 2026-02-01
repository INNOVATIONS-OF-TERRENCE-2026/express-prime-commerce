/**
 * AI Supplier Selector
 * 
 * Deterministic AI algorithm for selecting the optimal supplier.
 * 
 * Scoring Formula:
 * supplier_score = 
 *   (0.35 × reliability_score) +
 *   (0.30 × shipping_speed_inverse) +
 *   (0.20 × margin_score) +
 *   (0.15 × priority_weight)
 * 
 * Rules:
 * - Highest score wins
 * - Score < threshold → product hidden
 * - If supplier fails → fallback supplier
 * - Digital products auto-select
 * 
 * @module multiSourceCommerce/supplierSelector
 * @version 1.0.0
 */

import type {
  Supplier,
  SupplierProduct,
  ExternalProduct,
  SupplierScore,
  SupplierSelectionResult,
  SourceType,
} from './types';

// ============================================================================
// CONSTANTS
// ============================================================================

const WEIGHTS = {
  reliability: 0.35,
  shippingSpeed: 0.30,
  margin: 0.20,
  priority: 0.15,
};

// Minimum score threshold to show product
const MIN_SCORE_THRESHOLD = 40;

// Maximum acceptable shipping days (used for normalization)
const MAX_SHIPPING_DAYS = 21;

// Fallback timeout (ms) before trying next supplier
const FALLBACK_TIMEOUT_MS = 48 * 60 * 60 * 1000; // 48 hours

// ============================================================================
// SCORE CALCULATIONS
// ============================================================================

/**
 * Calculate reliability component (0-100)
 */
function calculateReliabilityScore(supplier: Supplier): number {
  return supplier.reliability_score;
}

/**
 * Calculate shipping speed score (0-100)
 * Faster shipping = higher score
 */
function calculateShippingSpeedScore(supplier: Supplier): number {
  const days = Math.min(supplier.avg_shipping_days, MAX_SHIPPING_DAYS);
  // Inverse: 1 day = 100, 21 days = 0
  return Math.round(((MAX_SHIPPING_DAYS - days) / MAX_SHIPPING_DAYS) * 100);
}

/**
 * Calculate margin score (0-100)
 * Higher margin = higher score
 */
function calculateMarginScore(
  supplierCost: number,
  retailPrice: number
): number {
  if (retailPrice <= 0) return 0;
  
  const margin = (retailPrice - supplierCost) / retailPrice;
  
  // Scale: 0% margin = 0, 50%+ margin = 100
  return Math.round(Math.min(margin * 200, 100));
}

/**
 * Calculate priority weight component (0-100)
 */
function calculatePriorityScore(supplierProduct: SupplierProduct): number {
  return supplierProduct.priority_weight;
}

// ============================================================================
// MAIN SELECTOR
// ============================================================================

/**
 * Calculate supplier score
 */
export function calculateSupplierScore(
  supplier: Supplier,
  supplierProduct: SupplierProduct,
  product: ExternalProduct
): SupplierScore {
  const reliabilityScore = calculateReliabilityScore(supplier);
  const shippingScore = calculateShippingSpeedScore(supplier);
  const marginScore = calculateMarginScore(
    supplierProduct.supplier_cost,
    product.retail_price
  );
  const priorityScore = calculatePriorityScore(supplierProduct);

  const calculatedScore = Math.round(
    (reliabilityScore * WEIGHTS.reliability) +
    (shippingScore * WEIGHTS.shippingSpeed) +
    (marginScore * WEIGHTS.margin) +
    (priorityScore * WEIGHTS.priority)
  );

  const margin = product.retail_price > 0
    ? (product.retail_price - supplierProduct.supplier_cost) / product.retail_price
    : 0;

  return {
    supplier_id: supplier.id,
    supplier_name: supplier.name,
    supplier_cost: supplierProduct.supplier_cost,
    reliability_score: reliabilityScore,
    shipping_days: supplier.avg_shipping_days,
    calculated_score: calculatedScore,
    margin: Math.round(margin * 100),
  };
}

/**
 * Select best supplier for a product
 */
export function selectSupplier(
  product: ExternalProduct,
  supplierProducts: SupplierProduct[],
  suppliers: Map<string, Supplier>
): SupplierSelectionResult | null {
  // Digital products auto-select
  if (product.inventory_policy === 'digital') {
    const digitalSupplier = supplierProducts.find(sp => {
      const supplier = suppliers.get(sp.supplier_id);
      return supplier?.source_type === 'digital';
    });

    if (digitalSupplier) {
      const supplier = suppliers.get(digitalSupplier.supplier_id)!;
      const score = calculateSupplierScore(supplier, digitalSupplier, product);
      
      return {
        selected: score,
        alternatives: [],
        selection_reason: 'Digital product - automatic selection',
      };
    }
  }

  // Calculate scores for all suppliers
  const scores: SupplierScore[] = [];

  for (const sp of supplierProducts) {
    if (!sp.active) continue;
    
    const supplier = suppliers.get(sp.supplier_id);
    if (!supplier || !supplier.active) continue;

    const score = calculateSupplierScore(supplier, sp, product);
    scores.push(score);
  }

  // Sort by score (highest first)
  scores.sort((a, b) => b.calculated_score - a.calculated_score);

  // Check if best score meets threshold
  if (scores.length === 0 || scores[0].calculated_score < MIN_SCORE_THRESHOLD) {
    return null; // Product should be hidden
  }

  const selected = scores[0];
  const alternatives = scores.slice(1, 4); // Top 3 alternatives

  // Generate selection reason
  let reason = `Selected ${selected.supplier_name} (score: ${selected.calculated_score})`;
  if (selected.reliability_score >= 85) {
    reason += ' - High reliability';
  } else if (selected.shipping_days <= 5) {
    reason += ' - Fast shipping';
  } else if (selected.margin >= 40) {
    reason += ' - Strong margins';
  }

  return {
    selected,
    alternatives,
    selection_reason: reason,
  };
}

/**
 * Get fallback supplier if primary fails
 */
export function getFallbackSupplier(
  currentSupplierId: string,
  product: ExternalProduct,
  supplierProducts: SupplierProduct[],
  suppliers: Map<string, Supplier>
): SupplierScore | null {
  // Filter out current supplier
  const alternativeProducts = supplierProducts.filter(
    sp => sp.supplier_id !== currentSupplierId && sp.active
  );

  const result = selectSupplier(product, alternativeProducts, suppliers);
  return result?.selected || null;
}

// ============================================================================
// PRODUCT VISIBILITY
// ============================================================================

/**
 * Check if product should be visible based on supplier availability
 */
export function shouldShowProduct(
  product: ExternalProduct,
  supplierProducts: SupplierProduct[],
  suppliers: Map<string, Supplier>
): boolean {
  // Digital products always show
  if (product.inventory_policy === 'digital') {
    return true;
  }

  const result = selectSupplier(product, supplierProducts, suppliers);
  return result !== null;
}

/**
 * Get visibility reason for admin
 */
export function getVisibilityReason(
  product: ExternalProduct,
  supplierProducts: SupplierProduct[],
  suppliers: Map<string, Supplier>
): string {
  if (!product.active) {
    return 'Product is disabled';
  }

  if (supplierProducts.length === 0) {
    return 'No suppliers assigned';
  }

  const activeSupplierProducts = supplierProducts.filter(sp => sp.active);
  if (activeSupplierProducts.length === 0) {
    return 'All supplier mappings are disabled';
  }

  const result = selectSupplier(product, supplierProducts, suppliers);
  if (!result) {
    return `Best supplier score below threshold (${MIN_SCORE_THRESHOLD})`;
  }

  return `Visible - ${result.selection_reason}`;
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Select suppliers for multiple products at once
 */
export function batchSelectSuppliers(
  products: ExternalProduct[],
  allSupplierProducts: SupplierProduct[],
  suppliers: Map<string, Supplier>
): Map<string, SupplierSelectionResult | null> {
  const results = new Map<string, SupplierSelectionResult | null>();

  for (const product of products) {
    const productSuppliers = allSupplierProducts.filter(
      sp => sp.external_product_id === product.id
    );
    
    const result = selectSupplier(product, productSuppliers, suppliers);
    results.set(product.id, result);
  }

  return results;
}

// ============================================================================
// MARGIN ANALYSIS
// ============================================================================

/**
 * Analyze margins across suppliers for a product
 */
export function analyzeMargins(
  product: ExternalProduct,
  supplierProducts: SupplierProduct[]
): {
  best_margin: number;
  worst_margin: number;
  avg_margin: number;
  recommendation: string;
} {
  if (supplierProducts.length === 0) {
    return {
      best_margin: 0,
      worst_margin: 0,
      avg_margin: 0,
      recommendation: 'No suppliers to analyze',
    };
  }

  const margins = supplierProducts.map(sp => {
    return product.retail_price > 0
      ? ((product.retail_price - sp.supplier_cost) / product.retail_price) * 100
      : 0;
  });

  const best_margin = Math.max(...margins);
  const worst_margin = Math.min(...margins);
  const avg_margin = margins.reduce((a, b) => a + b, 0) / margins.length;

  let recommendation: string;
  if (avg_margin >= 40) {
    recommendation = 'Healthy margins - maintain pricing';
  } else if (avg_margin >= 25) {
    recommendation = 'Acceptable margins - consider value-adds';
  } else if (avg_margin >= 15) {
    recommendation = 'Thin margins - negotiate with suppliers or raise prices';
  } else {
    recommendation = 'Critical: Margins too low - pricing adjustment needed';
  }

  return {
    best_margin: Math.round(best_margin),
    worst_margin: Math.round(worst_margin),
    avg_margin: Math.round(avg_margin),
    recommendation,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  WEIGHTS as SUPPLIER_WEIGHTS,
  MIN_SCORE_THRESHOLD,
  MAX_SHIPPING_DAYS,
  FALLBACK_TIMEOUT_MS,
};
