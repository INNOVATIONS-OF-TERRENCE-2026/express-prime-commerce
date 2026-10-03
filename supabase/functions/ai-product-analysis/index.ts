/**
 * Supabase Edge Function: ai-product-analysis
 * 
 * Server-side AI analysis using Hugging Face Inference API
 * Provides comprehensive product analysis including:
 * - Sentiment analysis
 * - Category classification
 * - Price optimization
 * - Demand forecasting
 * - Review summarization
 * 
 * @endpoint POST /ai-product-analysis
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Hugging Face API configuration
const HF_API_URL = "https://api-inference.huggingface.co/models";
const MODELS = {
  SENTIMENT: "distilbert-base-uncased-finetuned-sst-2-english",
  CLASSIFICATION: "facebook/bart-large-mnli",
  SUMMARIZATION: "facebook/bart-large-cnn",
};

const PRODUCT_CATEGORIES = [
  "Electronics",
  "Health & Wellness",
  "Home & Living",
  "Kitchen Gadgets",
  "Office Accessories",
  "Fitness",
  "Beauty & Personal Care",
  "Outdoor & Sports",
  "Pet Supplies",
  "Toys & Games",
];

interface AnalysisRequest {
  type: "sentiment" | "classify" | "full" | "batch";
  productId?: string;
  productIds?: string[];
  text?: string;
}

interface SentimentResult {
  label: string;
  score: number;
}

interface ClassificationResult {
  category: string;
  confidence: number;
  allScores: Array<{ label: string; score: number }>;
}

// Call Hugging Face API
async function callHuggingFace(
  model: string,
  payload: any,
  hfToken: string
): Promise<any> {
  const response = await fetch(`${HF_API_URL}/${model}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${hfToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Hugging Face API error: ${error}`);
  }

  return response.json();
}

// Analyze sentiment
async function analyzeSentiment(
  text: string,
  hfToken: string
): Promise<SentimentResult> {
  try {
    const result = await callHuggingFace(
      MODELS.SENTIMENT,
      { inputs: text },
      hfToken
    );

    if (result && result[0] && result[0][0]) {
      return {
        label: result[0][0].label,
        score: result[0][0].score,
      };
    }

    return { label: "NEUTRAL", score: 0.5 };
  } catch (error) {
    console.error("Sentiment analysis failed:", error);
    return { label: "NEUTRAL", score: 0.5 };
  }
}

// Classify product
async function classifyProduct(
  text: string,
  hfToken: string
): Promise<ClassificationResult> {
  try {
    const result = await callHuggingFace(
      MODELS.CLASSIFICATION,
      {
        inputs: text,
        parameters: {
          candidate_labels: PRODUCT_CATEGORIES,
        },
      },
      hfToken
    );

    if (result && result.labels && result.scores) {
      return {
        category: result.labels[0],
        confidence: result.scores[0],
        allScores: result.labels.map((label: string, i: number) => ({
          label,
          score: result.scores[i],
        })),
      };
    }

    return {
      category: "Other",
      confidence: 0,
      allScores: [],
    };
  } catch (error) {
    console.error("Classification failed:", error);
    return { category: "Other", confidence: 0, allScores: [] };
  }
}

// Full product analysis
async function fullAnalysis(
  product: any,
  metrics: any[],
  hfToken: string
): Promise<any> {
  const text = `${product.title}. ${product.description || ""}`;

  // Run analyses in parallel
  const [sentiment, classification] = await Promise.all([
    analyzeSentiment(text, hfToken),
    classifyProduct(text, hfToken),
  ]);

  // Calculate sales metrics
  const recentSales = metrics.slice(0, 7);
  const salesVelocity =
    recentSales.reduce((sum, m) => sum + (m.orders_count || 0), 0) /
    Math.max(1, recentSales.length);

  // Calculate margin
  const cost = product.cost || product.price * 0.6;
  const margin = ((product.price - cost) / product.price) * 100;

  // Determine price recommendation
  let priceAction = "maintain_price";
  let priceReasoning = "Current pricing is optimal";

  if (margin < 15) {
    priceAction = "increase_price";
    priceReasoning = "Margin below minimum threshold";
  } else if (salesVelocity < 1 && margin > 30) {
    priceAction = "run_promotion";
    priceReasoning = "Low velocity with healthy margin - promotion opportunity";
  } else if (sentiment.label === "POSITIVE" && salesVelocity > 5) {
    priceAction = "increase_price";
    priceReasoning = "Strong demand and positive sentiment support higher price";
  }

  // Calculate scores
  const sentimentScore = sentiment.label === "POSITIVE" ? sentiment.score * 100 : (1 - sentiment.score) * 100;
  const riskScore =
    (margin < 20 ? 40 : 0) +
    (salesVelocity < 1 ? 30 : 0) +
    (sentiment.label === "NEGATIVE" ? 30 : 0);
  const opportunityScore =
    (sentiment.label === "POSITIVE" ? 30 : 0) +
    (classification.confidence > 0.8 ? 20 : 0) +
    (margin > 40 ? 25 : 0) +
    (salesVelocity > 3 ? 25 : 0);

  const overallScore = Math.round(
    sentimentScore * 0.25 +
    classification.confidence * 25 +
    Math.min(50, margin) * 0.5 +
    (100 - riskScore) * 0.25
  );

  // Determine decision
  let decision: "promote" | "neutral" | "suppress";
  if (overallScore >= 70) decision = "promote";
  else if (overallScore >= 40) decision = "neutral";
  else decision = "suppress";

  return {
    productId: product.id,
    title: product.title,
    sentiment: {
      label: sentiment.label,
      score: sentiment.score,
      displayScore: Math.round(sentimentScore),
    },
    classification: {
      category: classification.category,
      confidence: Math.round(classification.confidence * 100),
      suggestedCategory: classification.category,
    },
    pricing: {
      currentPrice: product.price,
      cost: cost,
      margin: Math.round(margin * 10) / 10,
      action: priceAction,
      reasoning: priceReasoning,
    },
    performance: {
      salesVelocity: Math.round(salesVelocity * 10) / 10,
      trend: salesVelocity > 2 ? "increasing" : salesVelocity < 0.5 ? "decreasing" : "stable",
    },
    scores: {
      overall: overallScore,
      risk: riskScore,
      opportunity: opportunityScore,
    },
    decision,
    recommendation: decision === "promote"
      ? "Feature this product prominently"
      : decision === "suppress"
      ? "Review pricing or consider discontinuing"
      : "Monitor performance",
    analyzedAt: new Date().toISOString(),
  };
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseSecretKeys = Deno.env.get("SUPABASE_SECRET_KEYS");
    const supabaseServiceKey = supabaseSecretKeys
      ? JSON.parse(supabaseSecretKeys)["default"]
      : Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseServiceKey) {
      throw new Error("Supabase privileged key is not configured");
    }
    const hfToken = Deno.env.get("HUGGINGFACE_TOKEN") || "";
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { type, productId, productIds, text } = await req.json() as AnalysisRequest;

    // Simple sentiment analysis
    if (type === "sentiment" && text) {
      const result = await analyzeSentiment(text, hfToken);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Simple classification
    if (type === "classify" && text) {
      const result = await classifyProduct(text, hfToken);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Full single product analysis
    if (type === "full" && productId) {
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();

      if (productError || !product) {
        return new Response(
          JSON.stringify({ error: "Product not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: metrics } = await supabase
        .from("performance_metrics")
        .select("*")
        .eq("product_id", productId)
        .order("date", { ascending: false })
        .limit(30);

      const analysis = await fullAnalysis(product, metrics || [], hfToken);

      // Store the AI decision
      await supabase.from("ai_decisions").insert({
        product_id: productId,
        decision_type: analysis.decision === "suppress" ? "flag" : "activate",
        reason: analysis.recommendation,
        confidence: analysis.scores.overall / 100,
        old_value: { price: product.price, status: product.status },
        new_value: { 
          suggestedCategory: analysis.classification.suggestedCategory,
          priceAction: analysis.pricing.action,
        },
        was_applied: false,
      });

      return new Response(JSON.stringify(analysis), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Batch analysis
    if (type === "batch" && productIds && productIds.length > 0) {
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("*")
        .in("id", productIds);

      if (productsError || !products) {
        return new Response(
          JSON.stringify({ error: "Products not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const analyses = [];
      for (const product of products) {
        const { data: metrics } = await supabase
          .from("performance_metrics")
          .select("*")
          .eq("product_id", product.id)
          .order("date", { ascending: false })
          .limit(30);

        try {
          const analysis = await fullAnalysis(product, metrics || [], hfToken);
          analyses.push(analysis);

          // Store decision
          await supabase.from("ai_decisions").insert({
            product_id: product.id,
            decision_type: analysis.decision === "suppress" ? "flag" : "activate",
            reason: analysis.recommendation,
            confidence: analysis.scores.overall / 100,
            was_applied: false,
          });
        } catch (e) {
          console.error(`Failed to analyze product ${product.id}:`, e);
          analyses.push({
            productId: product.id,
            title: product.title,
            error: "Analysis failed",
          });
        }
      }

      return new Response(
        JSON.stringify({
          analyzed: analyses.length,
          results: analyses,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid request type" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("AI analysis error:", error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: "Analysis failed", message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
