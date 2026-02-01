/**
 * Supabase Edge Function: validate-checkout-profit
 * 
 * Server-side profit validation before checkout completion.
 * This is the LAST LINE OF DEFENSE to ensure no unprofitable sale goes through.
 * 
 * Call this function BEFORE processing payment to guarantee profit on every sale.
 * 
 * @endpoint POST /validate-checkout-profit
 * @body { cartItems: Array<{ productId: string, price: number, quantity: number }> }
 * @returns { valid: boolean, canProceed: boolean, totalProfit: number, warnings: string[], blockers: string[] }
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================================================
// PROFIT CONFIGURATION (Server-side, cannot be tampered with)
// ============================================================================

const PROFIT_CONFIG = {
  MIN_PROFIT_MARGIN_PERCENT: 15,
  TARGET_PROFIT_MARGIN_PERCENT: 35,
  WARNING_PROFIT_MARGIN_PERCENT: 20,
  PAYMENT_FEE_PERCENT: 2.9,
  PAYMENT_FEE_FIXED: 0.30,
  PLATFORM_FEE_PERCENT: 0,
  DEFAULT_SHIPPING_COST: 5.99,
  FULFILLMENT_FEE: 2.00,
  CUSTOMER_ACQUISITION_COST: 3.00,
  SAFETY_BUFFER_PERCENT: 5,
};

// ============================================================================
// PROFIT CALCULATION FUNCTIONS
// ============================================================================

function calculatePaymentFee(salePrice: number): number {
  return (salePrice * PROFIT_CONFIG.PAYMENT_FEE_PERCENT / 100) + PROFIT_CONFIG.PAYMENT_FEE_FIXED;
}

function calculateTotalCost(
  productCost: number,
  salePrice: number,
  shippingCost: number = PROFIT_CONFIG.DEFAULT_SHIPPING_COST
): number {
  const paymentFee = calculatePaymentFee(salePrice);
  const platformFee = salePrice * PROFIT_CONFIG.PLATFORM_FEE_PERCENT / 100;
  const baseCost = productCost + shippingCost + paymentFee + platformFee + 
                   PROFIT_CONFIG.FULFILLMENT_FEE + PROFIT_CONFIG.CUSTOMER_ACQUISITION_COST;
  const safetyBuffer = baseCost * PROFIT_CONFIG.SAFETY_BUFFER_PERCENT / 100;
  return baseCost + safetyBuffer;
}

function calculatePriceFloor(productCost: number, shippingCost: number = PROFIT_CONFIG.DEFAULT_SHIPPING_COST): number {
  const baseCosts = productCost + shippingCost + PROFIT_CONFIG.FULFILLMENT_FEE + PROFIT_CONFIG.CUSTOMER_ACQUISITION_COST;
  const costsWithBuffer = baseCosts * (1 + PROFIT_CONFIG.SAFETY_BUFFER_PERCENT / 100);
  const divisor = 1 - (PROFIT_CONFIG.PAYMENT_FEE_PERCENT / 100) - 
                  (PROFIT_CONFIG.PLATFORM_FEE_PERCENT / 100) - 
                  (PROFIT_CONFIG.MIN_PROFIT_MARGIN_PERCENT / 100);
  return Math.ceil(((costsWithBuffer + PROFIT_CONFIG.PAYMENT_FEE_FIXED) / divisor) * 100) / 100;
}

interface CartItem {
  productId: string;
  price: number;
  quantity: number;
}

interface ValidationResult {
  valid: boolean;
  canProceed: boolean;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
  warnings: string[];
  blockers: string[];
  itemDetails: Array<{
    productId: string;
    title: string;
    quantity: number;
    price: number;
    cost: number;
    profit: number;
    margin: number;
    status: 'excellent' | 'healthy' | 'warning' | 'critical' | 'loss';
  }>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { cartItems } = await req.json() as { cartItems: CartItem[] };

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid cart items" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch product costs from database
    const productIds = cartItems.map(item => item.productId);
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, title, price, cost, margin_percent")
      .in("id", productIds);

    if (productsError) {
      console.error("Failed to fetch products:", productsError);
      return new Response(
        JSON.stringify({ error: "Failed to validate products" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create product lookup map
    const productMap = new Map(products?.map(p => [p.id, p]) || []);

    // Validate each item
    const result: ValidationResult = {
      valid: true,
      canProceed: true,
      totalRevenue: 0,
      totalCost: 0,
      totalProfit: 0,
      profitMargin: 0,
      warnings: [],
      blockers: [],
      itemDetails: [],
    };

    for (const item of cartItems) {
      const product = productMap.get(item.productId);
      
      if (!product) {
        result.blockers.push(`Product ${item.productId} not found`);
        result.canProceed = false;
        continue;
      }

      // Use actual cost or estimate at 60% of database price
      const productCost = product.cost ?? (product.price * 0.6);
      
      // CRITICAL: Use the price from our database, NOT from the client
      // This prevents price manipulation attacks
      const trustedPrice = product.price;
      
      // Check if client-sent price differs from database (potential attack)
      if (Math.abs(item.price - trustedPrice) > 0.01) {
        console.warn(`Price mismatch for ${product.title}: client=${item.price}, db=${trustedPrice}`);
        // Use the trusted database price
      }

      const itemRevenue = trustedPrice * item.quantity;
      const itemTotalCost = calculateTotalCost(productCost, trustedPrice) * item.quantity;
      const itemProfit = itemRevenue - itemTotalCost;
      const itemMargin = trustedPrice > 0 ? (itemProfit / itemRevenue) * 100 : 0;

      result.totalRevenue += itemRevenue;
      result.totalCost += itemTotalCost;

      // Determine status
      let status: 'excellent' | 'healthy' | 'warning' | 'critical' | 'loss';
      if (itemProfit < 0) {
        status = 'loss';
        result.blockers.push(`${product.title}: Selling at loss (-$${Math.abs(itemProfit / item.quantity).toFixed(2)} per unit)`);
        result.canProceed = false;
      } else if (itemMargin < PROFIT_CONFIG.MIN_PROFIT_MARGIN_PERCENT) {
        status = 'critical';
        result.warnings.push(`${product.title}: Below minimum margin (${itemMargin.toFixed(1)}%)`);
      } else if (itemMargin < PROFIT_CONFIG.WARNING_PROFIT_MARGIN_PERCENT) {
        status = 'warning';
        result.warnings.push(`${product.title}: Low margin (${itemMargin.toFixed(1)}%)`);
      } else if (itemMargin < PROFIT_CONFIG.TARGET_PROFIT_MARGIN_PERCENT) {
        status = 'healthy';
      } else {
        status = 'excellent';
      }

      result.itemDetails.push({
        productId: item.productId,
        title: product.title,
        quantity: item.quantity,
        price: trustedPrice,
        cost: productCost,
        profit: Math.round(itemProfit * 100) / 100,
        margin: Math.round(itemMargin * 100) / 100,
        status,
      });
    }

    // Calculate totals
    result.totalProfit = result.totalRevenue - result.totalCost;
    result.profitMargin = result.totalRevenue > 0 
      ? (result.totalProfit / result.totalRevenue) * 100 
      : 0;

    // Final validation
    result.valid = result.blockers.length === 0 && result.warnings.length === 0;
    
    // Round final numbers
    result.totalRevenue = Math.round(result.totalRevenue * 100) / 100;
    result.totalCost = Math.round(result.totalCost * 100) / 100;
    result.totalProfit = Math.round(result.totalProfit * 100) / 100;
    result.profitMargin = Math.round(result.profitMargin * 100) / 100;

    // Log for audit trail
    console.log("Checkout validation:", {
      itemCount: cartItems.length,
      totalRevenue: result.totalRevenue,
      totalProfit: result.totalProfit,
      profitMargin: result.profitMargin,
      canProceed: result.canProceed,
      blockers: result.blockers.length,
      warnings: result.warnings.length,
    });

    // If blocked, record the attempt for review
    if (!result.canProceed) {
      try {
        await supabase.from("ai_decisions").insert({
          product_id: cartItems[0].productId, // Primary product
          decision_type: "block_checkout",
          reason: `Checkout blocked: ${result.blockers.join("; ")}`,
          confidence: 1.0,
          old_value: { cartItems },
          new_value: { blockers: result.blockers, warnings: result.warnings },
          was_applied: true,
        });
      } catch (e) {
        console.error("Failed to log blocked checkout:", e);
      }
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Validation error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Checkout validation failed", 
        canProceed: false,
        blockers: ["System error during validation - please retry"]
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
