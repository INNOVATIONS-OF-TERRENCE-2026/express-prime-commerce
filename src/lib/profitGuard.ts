/**
 * PROFIT GUARD - Guaranteed Profit Protection System
 * 
 * This module ensures EVERY sale generates profit by:
 * 1. Calculating true costs (product + shipping + payment fees + platform fees)
 * 2. Validating minimum profit margins before checkout
 * 3. Computing price floors to prevent below-cost sales
 * 4. Real-time profit calculation for cart items
 * 
 * @author Express Prime Commerce AI Engine
 * @version 2.0.0
 */

// ============================================================================
// CONFIGURATION - Easily tunable profit parameters
// ============================================================================

export const PROFIT_CONFIG = {
  // Minimum acceptable profit margin (percentage)
  MIN_PROFIT_MARGIN_PERCENT: 15,
  
  // Target profit margin for healthy business (percentage)
  TARGET_PROFIT_MARGIN_PERCENT: 35,
  
  // Warning threshold - below this triggers alerts (percentage)
  WARNING_PROFIT_MARGIN_PERCENT: 20,
  
  // Payment processing fees (Stripe/PayPal)
  PAYMENT_FEE_PERCENT: 2.9,
  PAYMENT_FEE_FIXED: 0.30,
  
  // Platform fees (if using marketplace)
  PLATFORM_FEE_PERCENT: 0,
  
  // Default shipping cost estimate when unknown
  DEFAULT_SHIPPING_COST: 5.99,
  
  // Fulfillment/handling fee per order
  FULFILLMENT_FEE: 2.00,
  
  // Marketing/acquisition cost allocation per item (CAC)
  CUSTOMER_ACQUISITION_COST: 3.00,
  
  // Buffer for unexpected costs (percentage)
  SAFETY_BUFFER_PERCENT: 5,
} as const;

// ============================================================================
// TYPES
// ============================================================================

export interface ProductCostBreakdown {
  productCost: number;
  shippingCost: number;
  paymentFee: number;
  platformFee: number;
  fulfillmentFee: number;
  acquisitionCost: number;
  safetyBuffer: number;
  totalCost: number;
}

export interface ProfitAnalysis {
  salePrice: number;
  costBreakdown: ProductCostBreakdown;
  grossProfit: number;
  netProfit: number;
  profitMarginPercent: number;
  isProfitable: boolean;
  meetsMinimumMargin: boolean;
  meetsTargetMargin: boolean;
  status: 'excellent' | 'healthy' | 'warning' | 'critical' | 'loss';
  recommendation: string;
  priceFloor: number;
  suggestedPrice: number;
}

export interface CartProfitSummary {
  subtotal: number;
  totalCost: number;
  totalProfit: number;
  averageMarginPercent: number;
  isProfitable: boolean;
  itemAnalyses: Array<{
    productId: string;
    title: string;
    quantity: number;
    analysis: ProfitAnalysis;
  }>;
  unprofitableItems: string[];
  recommendation: string;
}

// ============================================================================
// CORE PROFIT CALCULATIONS
// ============================================================================

/**
 * Calculate the payment processing fee for a given sale price
 */
export function calculatePaymentFee(salePrice: number): number {
  return (salePrice * PROFIT_CONFIG.PAYMENT_FEE_PERCENT / 100) + PROFIT_CONFIG.PAYMENT_FEE_FIXED;
}

/**
 * Calculate the platform fee for a given sale price
 */
export function calculatePlatformFee(salePrice: number): number {
  return salePrice * PROFIT_CONFIG.PLATFORM_FEE_PERCENT / 100;
}

/**
 * Calculate the safety buffer for unexpected costs
 */
export function calculateSafetyBuffer(baseCost: number): number {
  return baseCost * PROFIT_CONFIG.SAFETY_BUFFER_PERCENT / 100;
}

/**
 * Get the complete cost breakdown for a product sale
 */
export function calculateCostBreakdown(
  productCost: number,
  salePrice: number,
  shippingCost?: number
): ProductCostBreakdown {
  const shipping = shippingCost ?? PROFIT_CONFIG.DEFAULT_SHIPPING_COST;
  const paymentFee = calculatePaymentFee(salePrice);
  const platformFee = calculatePlatformFee(salePrice);
  const fulfillmentFee = PROFIT_CONFIG.FULFILLMENT_FEE;
  const acquisitionCost = PROFIT_CONFIG.CUSTOMER_ACQUISITION_COST;
  
  const baseCost = productCost + shipping + paymentFee + platformFee + fulfillmentFee + acquisitionCost;
  const safetyBuffer = calculateSafetyBuffer(baseCost);
  
  return {
    productCost,
    shippingCost: shipping,
    paymentFee: Math.round(paymentFee * 100) / 100,
    platformFee: Math.round(platformFee * 100) / 100,
    fulfillmentFee,
    acquisitionCost,
    safetyBuffer: Math.round(safetyBuffer * 100) / 100,
    totalCost: Math.round((baseCost + safetyBuffer) * 100) / 100,
  };
}

/**
 * Calculate the minimum price floor to guarantee profit
 */
export function calculatePriceFloor(
  productCost: number,
  shippingCost?: number,
  targetMarginPercent: number = PROFIT_CONFIG.MIN_PROFIT_MARGIN_PERCENT
): number {
  // Start with base costs (excluding payment fee which depends on price)
  const shipping = shippingCost ?? PROFIT_CONFIG.DEFAULT_SHIPPING_COST;
  const baseCosts = productCost + shipping + PROFIT_CONFIG.FULFILLMENT_FEE + 
                    PROFIT_CONFIG.CUSTOMER_ACQUISITION_COST;
  
  // Add safety buffer to base costs
  const costsWithBuffer = baseCosts * (1 + PROFIT_CONFIG.SAFETY_BUFFER_PERCENT / 100);
  
  // Calculate price floor using formula:
  // Price = (Costs + Fixed Payment Fee) / (1 - Payment% - Platform% - TargetMargin%)
  const divisor = 1 - (PROFIT_CONFIG.PAYMENT_FEE_PERCENT / 100) - 
                  (PROFIT_CONFIG.PLATFORM_FEE_PERCENT / 100) - 
                  (targetMarginPercent / 100);
  
  const priceFloor = (costsWithBuffer + PROFIT_CONFIG.PAYMENT_FEE_FIXED) / divisor;
  
  return Math.ceil(priceFloor * 100) / 100; // Round up to nearest cent
}

/**
 * Perform a complete profit analysis for a product at a given price
 */
export function analyzeProfitability(
  salePrice: number,
  productCost: number,
  shippingCost?: number
): ProfitAnalysis {
  const costBreakdown = calculateCostBreakdown(productCost, salePrice, shippingCost);
  const grossProfit = salePrice - productCost;
  const netProfit = salePrice - costBreakdown.totalCost;
  const profitMarginPercent = salePrice > 0 ? (netProfit / salePrice) * 100 : 0;
  
  const isProfitable = netProfit > 0;
  const meetsMinimumMargin = profitMarginPercent >= PROFIT_CONFIG.MIN_PROFIT_MARGIN_PERCENT;
  const meetsTargetMargin = profitMarginPercent >= PROFIT_CONFIG.TARGET_PROFIT_MARGIN_PERCENT;
  
  let status: ProfitAnalysis['status'];
  let recommendation: string;
  
  if (netProfit < 0) {
    status = 'loss';
    recommendation = `STOP: This sale loses $${Math.abs(netProfit).toFixed(2)}. Increase price to at least $${calculatePriceFloor(productCost, shippingCost).toFixed(2)}`;
  } else if (profitMarginPercent < PROFIT_CONFIG.MIN_PROFIT_MARGIN_PERCENT) {
    status = 'critical';
    recommendation = `Critical: ${profitMarginPercent.toFixed(1)}% margin is below minimum ${PROFIT_CONFIG.MIN_PROFIT_MARGIN_PERCENT}%. Consider raising price.`;
  } else if (profitMarginPercent < PROFIT_CONFIG.WARNING_PROFIT_MARGIN_PERCENT) {
    status = 'warning';
    recommendation = `Warning: ${profitMarginPercent.toFixed(1)}% margin is thin. Target ${PROFIT_CONFIG.TARGET_PROFIT_MARGIN_PERCENT}% for healthy business.`;
  } else if (profitMarginPercent < PROFIT_CONFIG.TARGET_PROFIT_MARGIN_PERCENT) {
    status = 'healthy';
    recommendation = `Healthy: ${profitMarginPercent.toFixed(1)}% margin. Room to optimize toward ${PROFIT_CONFIG.TARGET_PROFIT_MARGIN_PERCENT}% target.`;
  } else {
    status = 'excellent';
    recommendation = `Excellent: ${profitMarginPercent.toFixed(1)}% margin exceeds target. Strong profit position.`;
  }
  
  const priceFloor = calculatePriceFloor(productCost, shippingCost);
  const suggestedPrice = calculatePriceFloor(productCost, shippingCost, PROFIT_CONFIG.TARGET_PROFIT_MARGIN_PERCENT);
  
  return {
    salePrice: Math.round(salePrice * 100) / 100,
    costBreakdown,
    grossProfit: Math.round(grossProfit * 100) / 100,
    netProfit: Math.round(netProfit * 100) / 100,
    profitMarginPercent: Math.round(profitMarginPercent * 100) / 100,
    isProfitable,
    meetsMinimumMargin,
    meetsTargetMargin,
    status,
    recommendation,
    priceFloor,
    suggestedPrice: Math.round(suggestedPrice * 100) / 100,
  };
}

/**
 * Validate if a cart checkout will be profitable
 */
export function validateCartProfitability(
  cartItems: Array<{
    productId: string;
    title: string;
    price: number;
    cost: number;
    quantity: number;
    shippingCost?: number;
  }>
): CartProfitSummary {
  let subtotal = 0;
  let totalCost = 0;
  const itemAnalyses: CartProfitSummary['itemAnalyses'] = [];
  const unprofitableItems: string[] = [];
  
  for (const item of cartItems) {
    const itemTotal = item.price * item.quantity;
    const analysis = analyzeProfitability(item.price, item.cost, item.shippingCost);
    
    subtotal += itemTotal;
    totalCost += analysis.costBreakdown.totalCost * item.quantity;
    
    itemAnalyses.push({
      productId: item.productId,
      title: item.title,
      quantity: item.quantity,
      analysis,
    });
    
    if (!analysis.isProfitable || !analysis.meetsMinimumMargin) {
      unprofitableItems.push(item.title);
    }
  }
  
  const totalProfit = subtotal - totalCost;
  const averageMarginPercent = subtotal > 0 ? (totalProfit / subtotal) * 100 : 0;
  const isProfitable = totalProfit > 0 && unprofitableItems.length === 0;
  
  let recommendation: string;
  if (unprofitableItems.length > 0) {
    recommendation = `⚠️ ${unprofitableItems.length} item(s) have insufficient margins: ${unprofitableItems.join(', ')}. Review pricing before checkout.`;
  } else if (averageMarginPercent < PROFIT_CONFIG.WARNING_PROFIT_MARGIN_PERCENT) {
    recommendation = `Cart margin (${averageMarginPercent.toFixed(1)}%) is below target. Consider upselling higher-margin items.`;
  } else {
    recommendation = `✅ Cart is profitable with ${averageMarginPercent.toFixed(1)}% average margin.`;
  }
  
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    totalProfit: Math.round(totalProfit * 100) / 100,
    averageMarginPercent: Math.round(averageMarginPercent * 100) / 100,
    isProfitable,
    itemAnalyses,
    unprofitableItems,
    recommendation,
  };
}

// ============================================================================
// DYNAMIC PRICING ENGINE
// ============================================================================

export interface DynamicPriceRecommendation {
  currentPrice: number;
  recommendedPrice: number;
  priceFloor: number;
  priceCeiling: number;
  adjustment: number;
  adjustmentPercent: number;
  reason: string;
  urgency: 'immediate' | 'soon' | 'optional';
}

/**
 * Calculate dynamic price recommendation based on multiple factors
 */
export function calculateDynamicPrice(
  currentPrice: number,
  productCost: number,
  inventoryQuantity: number,
  salesVelocity: number, // orders per week
  competitorPrice?: number,
  demandScore?: number // 0-100
): DynamicPriceRecommendation {
  const priceFloor = calculatePriceFloor(productCost);
  const targetPrice = calculatePriceFloor(productCost, undefined, PROFIT_CONFIG.TARGET_PROFIT_MARGIN_PERCENT);
  const maxPrice = targetPrice * 1.5; // Cap at 50% above target
  
  let recommendedPrice = targetPrice;
  let reason = '';
  let urgency: DynamicPriceRecommendation['urgency'] = 'optional';
  
  // Factor 1: Current profitability
  const analysis = analyzeProfitability(currentPrice, productCost);
  if (!analysis.isProfitable) {
    recommendedPrice = priceFloor;
    reason = 'Current price is below cost - immediate price increase required';
    urgency = 'immediate';
  } else if (!analysis.meetsMinimumMargin) {
    recommendedPrice = priceFloor;
    reason = 'Margin below minimum threshold';
    urgency = 'soon';
  }
  
  // Factor 2: Inventory pressure
  if (inventoryQuantity > 100 && salesVelocity < 2) {
    // Overstocked and slow moving - reduce price to clear
    recommendedPrice = Math.max(priceFloor, targetPrice * 0.9);
    reason = 'High inventory with low velocity - consider promotional pricing';
    urgency = 'soon';
  } else if (inventoryQuantity < 10 && salesVelocity > 5) {
    // Low stock, high demand - can increase price
    recommendedPrice = Math.min(maxPrice, targetPrice * 1.15);
    reason = 'Low inventory with high demand - opportunity to increase margin';
  }
  
  // Factor 3: Demand score
  if (demandScore !== undefined) {
    if (demandScore > 80) {
      recommendedPrice = Math.min(maxPrice, recommendedPrice * 1.1);
      reason += ' High demand detected.';
    } else if (demandScore < 30) {
      recommendedPrice = Math.max(priceFloor, recommendedPrice * 0.95);
      reason += ' Low demand - consider promotional pricing.';
    }
  }
  
  // Factor 4: Competitor pricing
  if (competitorPrice !== undefined) {
    if (competitorPrice < priceFloor) {
      reason += ' Competitor pricing below our cost floor - maintain value positioning.';
    } else if (competitorPrice < recommendedPrice * 0.9) {
      recommendedPrice = Math.max(priceFloor, competitorPrice * 1.05);
      reason += ' Adjusted for competitive positioning.';
    }
  }
  
  // Ensure we never go below floor
  recommendedPrice = Math.max(priceFloor, recommendedPrice);
  recommendedPrice = Math.round(recommendedPrice * 100) / 100;
  
  const adjustment = recommendedPrice - currentPrice;
  const adjustmentPercent = currentPrice > 0 ? (adjustment / currentPrice) * 100 : 0;
  
  return {
    currentPrice,
    recommendedPrice,
    priceFloor,
    priceCeiling: maxPrice,
    adjustment: Math.round(adjustment * 100) / 100,
    adjustmentPercent: Math.round(adjustmentPercent * 100) / 100,
    reason: reason || 'Price is optimally positioned',
    urgency,
  };
}

// ============================================================================
// CHECKOUT VALIDATION
// ============================================================================

export interface CheckoutValidation {
  isValid: boolean;
  canProceed: boolean;
  warnings: string[];
  blockers: string[];
  totalProfit: number;
  totalMargin: number;
}

/**
 * Validate checkout for profitability - CALL THIS BEFORE PROCESSING PAYMENT
 */
export function validateCheckout(
  cartItems: Array<{
    productId: string;
    title: string;
    price: number;
    cost: number;
    quantity: number;
  }>,
  blockUnprofitable: boolean = true
): CheckoutValidation {
  const warnings: string[] = [];
  const blockers: string[] = [];
  let totalRevenue = 0;
  let totalCost = 0;
  
  for (const item of cartItems) {
    const analysis = analyzeProfitability(item.price, item.cost);
    const itemRevenue = item.price * item.quantity;
    const itemCost = analysis.costBreakdown.totalCost * item.quantity;
    
    totalRevenue += itemRevenue;
    totalCost += itemCost;
    
    if (analysis.status === 'loss') {
      blockers.push(`${item.title}: Selling at loss (-$${Math.abs(analysis.netProfit).toFixed(2)} per unit)`);
    } else if (analysis.status === 'critical') {
      warnings.push(`${item.title}: Margin (${analysis.profitMarginPercent.toFixed(1)}%) below minimum`);
    } else if (analysis.status === 'warning') {
      warnings.push(`${item.title}: Low margin (${analysis.profitMarginPercent.toFixed(1)}%)`);
    }
  }
  
  const totalProfit = totalRevenue - totalCost;
  const totalMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  
  const hasBlockers = blockers.length > 0;
  const canProceed = blockUnprofitable ? !hasBlockers : true;
  const isValid = !hasBlockers && warnings.length === 0;
  
  return {
    isValid,
    canProceed,
    warnings,
    blockers,
    totalProfit: Math.round(totalProfit * 100) / 100,
    totalMargin: Math.round(totalMargin * 100) / 100,
  };
}

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

export default {
  PROFIT_CONFIG,
  calculatePaymentFee,
  calculatePlatformFee,
  calculateSafetyBuffer,
  calculateCostBreakdown,
  calculatePriceFloor,
  analyzeProfitability,
  validateCartProfitability,
  calculateDynamicPrice,
  validateCheckout,
};
