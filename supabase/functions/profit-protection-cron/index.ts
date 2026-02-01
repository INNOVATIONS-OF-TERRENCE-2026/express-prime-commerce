// @ts-nocheck
// Supabase Edge Function: profit-protection-cron
// Runs every hour to analyze product performance and make AI decisions

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Default thresholds (can be overridden by global_settings)
const DEFAULT_THRESHOLDS = {
  minMarginPercent: 20,
  maxRefundRatePercent: 10,
  noSalesKillWindowDays: 14,
  noSalesPauseWindowDays: 7,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get global settings
    const { data: settingsData } = await supabase
      .from("global_settings")
      .select("value")
      .eq("key", "profit_protection")
      .single();

    const thresholds = settingsData?.value || DEFAULT_THRESHOLDS;
    
    console.log("Running profit protection analysis with thresholds:", thresholds);

    const decisions: any[] = [];
    const now = new Date();

    // 1. Check for low margin products
    const { data: lowMarginProducts } = await supabase
      .from("products")
      .select("id, title, handle, price, cost, margin_percent, status")
      .eq("status", "active")
      .lt("margin_percent", thresholds.minMarginPercent)
      .not("margin_percent", "is", null);

    for (const product of lowMarginProducts || []) {
      decisions.push({
        product_id: product.id,
        decision_type: "flag",
        reason: `Margin (${product.margin_percent?.toFixed(1)}%) is below minimum threshold (${thresholds.minMarginPercent}%)`,
        confidence: 0.9,
        old_value: { margin_percent: product.margin_percent },
        new_value: { recommended_action: "increase_price_or_reduce_cost" },
      });
    }

    // 2. Check for high refund rate products
    const { data: productsWithMetrics } = await supabase
      .from("products")
      .select(`
        id, title, handle, status,
        performance_metrics (
          orders_count,
          refunds_count,
          revenue,
          refund_amount
        )
      `)
      .eq("status", "active");

    for (const product of productsWithMetrics || []) {
      const metrics = product.performance_metrics?.[0];
      if (!metrics || !metrics.orders_count) continue;

      const refundRate = (metrics.refunds_count / metrics.orders_count) * 100;
      
      if (refundRate > thresholds.maxRefundRatePercent && metrics.orders_count >= 5) {
        const confidence = Math.min(0.95, 0.5 + (refundRate / 100));
        decisions.push({
          product_id: product.id,
          decision_type: refundRate > thresholds.maxRefundRatePercent * 2 ? "kill" : "pause",
          reason: `Refund rate (${refundRate.toFixed(1)}%) exceeds maximum threshold (${thresholds.maxRefundRatePercent}%)`,
          confidence,
          old_value: { refund_rate: refundRate, orders: metrics.orders_count, refunds: metrics.refunds_count },
          new_value: { status: refundRate > thresholds.maxRefundRatePercent * 2 ? "killed" : "paused" },
        });
      }
    }

    // 3. Check for products with no sales
    const pauseDate = new Date(now.getTime() - thresholds.noSalesPauseWindowDays * 24 * 60 * 60 * 1000);
    const killDate = new Date(now.getTime() - thresholds.noSalesKillWindowDays * 24 * 60 * 60 * 1000);

    const { data: activeProducts } = await supabase
      .from("products")
      .select(`
        id, title, handle, status, created_at,
        performance_metrics (
          orders_count,
          last_order_at
        )
      `)
      .eq("status", "active");

    for (const product of activeProducts || []) {
      const metrics = product.performance_metrics?.[0];
      const lastOrderAt = metrics?.last_order_at 
        ? new Date(metrics.last_order_at) 
        : new Date(product.created_at);
      
      // Skip recently created products
      const productAge = now.getTime() - new Date(product.created_at).getTime();
      if (productAge < thresholds.noSalesPauseWindowDays * 24 * 60 * 60 * 1000) continue;

      if (lastOrderAt < killDate) {
        decisions.push({
          product_id: product.id,
          decision_type: "kill",
          reason: `No sales in ${thresholds.noSalesKillWindowDays} days`,
          confidence: 0.85,
          old_value: { last_order_at: lastOrderAt.toISOString() },
          new_value: { status: "killed" },
        });
      } else if (lastOrderAt < pauseDate) {
        decisions.push({
          product_id: product.id,
          decision_type: "pause",
          reason: `No sales in ${thresholds.noSalesPauseWindowDays} days`,
          confidence: 0.7,
          old_value: { last_order_at: lastOrderAt.toISOString() },
          new_value: { status: "paused" },
        });
      }
    }

    // 4. Save decisions to database
    if (decisions.length > 0) {
      const { error: insertError } = await supabase
        .from("ai_decisions")
        .insert(decisions.map(d => ({
          ...d,
          was_applied: false,
          created_at: now.toISOString(),
        })));

      if (insertError) {
        console.error("Failed to insert decisions:", insertError);
      }

      // Auto-apply decisions if enabled
      const autoApply = settingsData?.value?.autoApplyDecisions;
      if (autoApply) {
        for (const decision of decisions) {
          if (decision.decision_type === "pause" || decision.decision_type === "kill") {
            await supabase
              .from("products")
              .update({ 
                status: decision.decision_type === "kill" ? "killed" : "paused",
                updated_at: now.toISOString()
              })
              .eq("id", decision.product_id);

            await supabase
              .from("ai_decisions")
              .update({ was_applied: true })
              .eq("product_id", decision.product_id)
              .eq("decision_type", decision.decision_type);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        analyzed: (activeProducts?.length || 0) + (lowMarginProducts?.length || 0),
        decisions: decisions.length,
        summary: {
          flagged: decisions.filter(d => d.decision_type === "flag").length,
          paused: decisions.filter(d => d.decision_type === "pause").length,
          killed: decisions.filter(d => d.decision_type === "kill").length,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Profit protection error:", error);
    return new Response(
      JSON.stringify({ error: "Profit protection analysis failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
