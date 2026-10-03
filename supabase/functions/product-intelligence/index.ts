/**
 * Supabase Edge Function: product-intelligence
 *
 * Exposes the Product Intelligence Engine as an HTTP API.
 * Supports single product analysis and batch operations.
 *
 * Endpoints:
 * POST /product-intelligence
 *   - Body: { product_id: string } - analyze single product
 *   - Body: { product_ids: string[] } - analyze multiple products
 *   - Body: { product_ids: string[], quick: true } - batch quick analysis
 *
 * Returns: ProductIntelligenceOutput | ProductIntelligenceOutput[]
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Import intelligence engine (will be bundled)
// In production, these would be compiled/bundled together
// For now, we inline the core logic

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// INLINE INTELLIGENCE ENGINE
// The following is a compiled version of the intelligence engine for Deno
// ============================================================================

const ALGORITHM_VERSION = '1.0.0';

const DECISION_THRESHOLDS = {
  promote: { min: 70 },
  neutral: { min: 40, max: 69 },
  suppress: { max: 39 },
} as const;

const DEFAULT_SIGNAL_WEIGHTS = {
  margin: 0.30,
  velocity: 0.20,
  engagement: 0.15,
  refund: 0.15,
  inventory: 0.10,
  freshness: 0.10,
};

const MARGIN_THRESHOLDS = { critical: 15, warning: 25, healthy: 40, excellent: 50 };
const INVENTORY_THRESHOLDS = { outOfStock: 0, critical: 5, warning: 15, healthy: 50, excellent: 100 };
const VELOCITY_THRESHOLDS = { dead: 0, critical: 1, warning: 3, healthy: 10, excellent: 25 };
const REFUND_THRESHOLDS = { critical: 20, warning: 10, healthy: 5, excellent: 2 };
const ENGAGEMENT_THRESHOLDS = { critical: 1, warning: 3, healthy: 5, excellent: 10 };
const FRESHNESS_THRESHOLDS = { stale: 30, aging: 14, fresh: 7, hot: 3 };

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function scoreToSeverity(score: number): 'critical' | 'warning' | 'healthy' | 'excellent' {
  if (score >= 75) return 'excellent';
  if (score >= 50) return 'healthy';
  if (score >= 25) return 'warning';
  return 'critical';
}

function scoreToDecision(score: number): 'promote' | 'neutral' | 'suppress' {
  if (score >= DECISION_THRESHOLDS.promote.min) return 'promote';
  if (score >= DECISION_THRESHOLDS.neutral.min) return 'neutral';
  return 'suppress';
}

// Signal evaluators (simplified for edge function)
function evaluateMargin(product: any): any {
  const weight = DEFAULT_SIGNAL_WEIGHTS.margin;
  let margin = product.margin_percent;
  
  if (margin === null && product.price && product.cost) {
    margin = ((product.price - product.cost) / product.price) * 100;
  }
  
  if (margin === null || product.price === 0) {
    return { signal: 'margin', score: 50, weight, weighted_score: 50 * weight, severity: 'healthy' };
  }
  
  let score = 50;
  if (margin < 0) score = clampScore(Math.max(0, 10 + margin));
  else if (margin < MARGIN_THRESHOLDS.critical) score = clampScore((margin / 15) * 25);
  else if (margin < MARGIN_THRESHOLDS.warning) score = clampScore(25 + ((margin - 15) / 10) * 25);
  else if (margin < MARGIN_THRESHOLDS.healthy) score = clampScore(50 + ((margin - 25) / 15) * 25);
  else score = clampScore(75 + ((Math.min(margin - 40, 10)) / 10) * 25);
  
  return { signal: 'margin', score, weight, weighted_score: score * weight, severity: scoreToSeverity(score) };
}

function evaluateInventory(product: any): any {
  const weight = DEFAULT_SIGNAL_WEIGHTS.inventory;
  const inventory = product.inventory_quantity;
  
  if (inventory === null) {
    return { signal: 'inventory', score: 75, weight, weighted_score: 75 * weight, severity: 'healthy' };
  }
  
  let score = 75;
  if (inventory <= 0) score = 0;
  else if (inventory <= 5) score = clampScore(5 + (inventory / 5) * 20);
  else if (inventory <= 15) score = clampScore(25 + ((inventory - 5) / 10) * 25);
  else if (inventory <= 50) score = clampScore(50 + ((inventory - 15) / 35) * 25);
  else score = clampScore(75 + (Math.min((inventory - 50) / 50, 1) * 25));
  
  return { signal: 'inventory', score, weight, weighted_score: score * weight, severity: scoreToSeverity(score) };
}

function evaluateVelocity(metrics: any, productCreatedAt: string, evaluatedAt: string): any {
  const weight = DEFAULT_SIGNAL_WEIGHTS.velocity;
  const productAgeDays = Math.floor((new Date(evaluatedAt).getTime() - new Date(productCreatedAt).getTime()) / (1000 * 60 * 60 * 24));
  const isNew = productAgeDays < 7;
  
  if (!metrics) {
    return { signal: 'velocity', score: isNew ? 50 : 25, weight, weighted_score: (isNew ? 50 : 25) * weight, severity: isNew ? 'healthy' : 'warning' };
  }
  
  const orders = metrics.orders_count || 0;
  let score = 50;
  
  if (orders === 0) score = isNew ? 40 : 0;
  else if (orders <= 1) score = clampScore(10 + orders * 15);
  else if (orders <= 3) score = clampScore(25 + ((orders - 1) / 2) * 25);
  else if (orders <= 10) score = clampScore(50 + ((orders - 3) / 7) * 25);
  else score = clampScore(75 + (Math.min((orders - 10) / 15, 1) * 25));
  
  return { signal: 'velocity', score, weight, weighted_score: score * weight, severity: scoreToSeverity(score) };
}

function evaluateRefund(metrics: any): any {
  const weight = DEFAULT_SIGNAL_WEIGHTS.refund;
  
  if (!metrics || metrics.orders_count < 5) {
    return { signal: 'refund', score: 70, weight, weighted_score: 70 * weight, severity: 'healthy' };
  }
  
  const refundRate = (metrics.refund_count / metrics.orders_count) * 100;
  let score = 75;
  
  if (refundRate === 0) score = 100;
  else if (refundRate < 2) score = clampScore(90 + (1 - refundRate / 2) * 10);
  else if (refundRate < 5) score = clampScore(75 + (1 - (refundRate - 2) / 3) * 15);
  else if (refundRate < 10) score = clampScore(50 + (1 - (refundRate - 5) / 5) * 25);
  else if (refundRate < 20) score = clampScore(25 + (1 - (refundRate - 10) / 10) * 25);
  else score = clampScore(Math.max(0, 25 - (refundRate - 20)));
  
  return { signal: 'refund', score, weight, weighted_score: score * weight, severity: scoreToSeverity(score) };
}

function evaluateEngagement(metrics: any): any {
  const weight = DEFAULT_SIGNAL_WEIGHTS.engagement;
  
  if (!metrics || metrics.views < 10) {
    return { signal: 'engagement', score: 50, weight, weighted_score: 50 * weight, severity: 'healthy' };
  }
  
  const atcRate = (metrics.add_to_carts / metrics.views) * 100;
  let score = 50;
  
  if (atcRate === 0) score = 15;
  else if (atcRate < 1) score = clampScore(15 + (atcRate) * 10);
  else if (atcRate < 3) score = clampScore(25 + ((atcRate - 1) / 2) * 25);
  else if (atcRate < 5) score = clampScore(50 + ((atcRate - 3) / 2) * 25);
  else if (atcRate < 10) score = clampScore(75 + ((atcRate - 5) / 5) * 20);
  else score = clampScore(95 + Math.min(5, (atcRate - 10) / 5));
  
  return { signal: 'engagement', score, weight, weighted_score: score * weight, severity: scoreToSeverity(score) };
}

function evaluateFreshness(product: any, metrics: any, evaluatedAt: string): any {
  const weight = DEFAULT_SIGNAL_WEIGHTS.freshness;
  
  const lastOrderAt = metrics?.last_order_at ? new Date(metrics.last_order_at) : null;
  const productUpdatedAt = new Date(product.updated_at);
  const productCreatedAt = new Date(product.created_at);
  
  const lastActivity = lastOrderAt 
    ? new Date(Math.max(lastOrderAt.getTime(), productUpdatedAt.getTime()))
    : productUpdatedAt;
  
  const daysSinceActivity = Math.floor((new Date(evaluatedAt).getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
  const productAgeDays = Math.floor((new Date(evaluatedAt).getTime() - productCreatedAt.getTime()) / (1000 * 60 * 60 * 24));
  const isNew = productAgeDays < 7;
  
  if (isNew) {
    return { signal: 'freshness', score: 80, weight, weighted_score: 80 * weight, severity: 'excellent' };
  }
  
  let score = 50;
  if (daysSinceActivity <= 3) score = 100;
  else if (daysSinceActivity <= 7) score = clampScore(100 - ((daysSinceActivity - 3) / 4) * 25);
  else if (daysSinceActivity <= 14) score = clampScore(75 - ((daysSinceActivity - 7) / 7) * 25);
  else if (daysSinceActivity <= 30) score = clampScore(50 - ((daysSinceActivity - 14) / 16) * 25);
  else score = clampScore(Math.max(0, 25 - (daysSinceActivity - 30)));
  
  return { signal: 'freshness', score, weight, weighted_score: score * weight, severity: scoreToSeverity(score) };
}

function analyzeProduct(product: any, metrics: any): any {
  const startTime = Date.now();
  const evaluatedAt = new Date().toISOString();
  
  // Evaluate all signals
  const signals = [
    evaluateMargin(product),
    evaluateInventory(product),
    evaluateVelocity(metrics, product.created_at, evaluatedAt),
    evaluateRefund(metrics),
    evaluateEngagement(metrics),
    evaluateFreshness(product, metrics, evaluatedAt),
  ];
  
  // Calculate composite score
  const totalWeight = signals.reduce((sum, s) => sum + s.weight, 0);
  const rawScore = signals.reduce((sum, s) => sum + s.weighted_score, 0);
  const finalScore = clampScore(rawScore / totalWeight);
  
  // Determine decision
  const decision = scoreToDecision(finalScore);
  
  // Identify top contributors and detractors
  const sortedByContribution = [...signals].sort((a, b) => b.weighted_score - a.weighted_score);
  const topContributors = sortedByContribution.filter(s => s.score >= 60).slice(0, 3).map(s => s.signal);
  
  const sortedByWeakness = [...signals].sort((a, b) => a.score - b.score);
  const topDetractors = sortedByWeakness.filter(s => s.score < 50).slice(0, 3).map(s => s.signal);
  
  // Build explanation
  const headline = decision === 'promote' 
    ? `Strong performer${topDetractors.length ? ` with minor ${topDetractors.join(', ')} concerns` : ''}`
    : decision === 'neutral'
    ? `Moderate performer - ${topDetractors.length ? `${topDetractors.join(', ')} need attention` : 'meeting baseline'}`
    : `Underperforming product - review for issues`;
  
  const concerns = signals
    .filter(s => s.severity === 'critical' || s.severity === 'warning')
    .map(s => ({ signal: s.signal, severity: s.severity, score: s.score }));
  
  const strengths = signals
    .filter(s => s.severity === 'excellent' || s.severity === 'healthy')
    .map(s => ({ signal: s.signal, severity: s.severity, score: s.score }));
  
  return {
    product_id: product.id,
    ai_confidence_score: finalScore,
    score_breakdown: {
      signals,
      total_weight: totalWeight,
      top_contributors: topContributors,
      top_detractors: topDetractors,
    },
    explanation: {
      headline,
      summary: `Score ${finalScore}/100. ${decision === 'promote' ? 'Recommended for promotion.' : decision === 'suppress' ? 'Consider pausing.' : 'Monitor performance.'}`,
      strengths,
      concerns,
      recommendations: concerns.map(c => `Address ${c.signal} (score: ${c.score})`),
    },
    decision,
    metadata: {
      scored_at: evaluatedAt,
      algorithm_version: ALGORITHM_VERSION,
      metrics_period_days: metrics?.period_days || 30,
      processing_time_ms: Date.now() - startTime,
      weight_source: 'default',
    },
  };
}

// ============================================================================
// EDGE FUNCTION HANDLER
// ============================================================================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseSecretKeys = Deno.env.get("SUPABASE_SECRET_KEYS");
    const supabaseServiceKey = supabaseSecretKeys
      ? JSON.parse(supabaseSecretKeys)["default"]
      : Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseServiceKey) {
      throw new Error("Supabase privileged key is not configured");
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { product_id, product_ids, quick = false } = body;

    // Validate input
    if (!product_id && (!product_ids || !Array.isArray(product_ids))) {
      return new Response(
        JSON.stringify({ error: 'product_id or product_ids required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Single product analysis
    if (product_id) {
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', product_id)
        .single();

      if (productError || !product) {
        return new Response(
          JSON.stringify({ error: 'Product not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get metrics
      const { data: metricsData } = await supabase
        .from('performance_metrics')
        .select('*')
        .eq('product_id', product_id)
        .order('date', { ascending: false })
        .limit(1)
        .single();

      const result = analyzeProduct(product, metricsData);

      // Cache result in ai_decisions table
      await supabase.from('ai_decisions').insert({
        product_id: product.id,
        decision_type: result.decision,
        reason: result.explanation.headline,
        confidence: result.ai_confidence_score / 100,
        old_value: { score_breakdown: result.score_breakdown },
        new_value: { recommendation: result.decision },
        was_applied: false,
      });

      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Batch analysis
    const ids = product_ids as string[];
    
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .in('id', ids);

    if (productsError) {
      throw productsError;
    }

    // Get all metrics in one query
    const { data: allMetrics } = await supabase
      .from('performance_metrics')
      .select('*')
      .in('product_id', ids);

    const metricsMap = new Map();
    for (const m of (allMetrics || [])) {
      metricsMap.set(m.product_id, m);
    }

    const results = (products || []).map((product) => {
      const metrics = metricsMap.get(product.id);
      const result = analyzeProduct(product, metrics);
      
      if (quick) {
        return {
          product_id: result.product_id,
          ai_confidence_score: result.ai_confidence_score,
          decision: result.decision,
        };
      }
      
      return result;
    });

    return new Response(
      JSON.stringify({ results, count: results.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Intelligence engine error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Intelligence analysis failed', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
