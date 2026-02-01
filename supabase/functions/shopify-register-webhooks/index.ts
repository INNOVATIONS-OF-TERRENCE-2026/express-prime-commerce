// @ts-nocheck
// Supabase Edge Function: shopify-register-webhooks
// Registers required Shopify webhooks for real-time sync

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const WEBHOOK_TOPICS = [
  "orders/create",
  "orders/updated",
  "orders/cancelled",
  "refunds/create",
  "products/create",
  "products/update",
  "products/delete",
  "app/uninstalled",
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { shop } = await req.json();
    
    if (!shop) {
      return new Response(
        JSON.stringify({ error: "Shop domain is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const appUrl = Deno.env.get("APP_URL") || "https://express-prime.vercel.app";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get access token
    const { data: installation, error: installError } = await supabase
      .from("shopify_installations")
      .select("access_token")
      .eq("shop_domain", shop)
      .single();

    if (installError || !installation?.access_token) {
      return new Response(
        JSON.stringify({ error: "Shop not found or not installed" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accessToken = installation.access_token;
    const webhookEndpoint = `${supabaseUrl}/functions/v1/shopify-webhook-handler`;
    const results: { topic: string; success: boolean; error?: string }[] = [];

    // First, delete existing webhooks to avoid duplicates
    const existingWebhooksRes = await fetch(
      `https://${shop}/admin/api/2024-01/webhooks.json`,
      {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
      }
    );

    if (existingWebhooksRes.ok) {
      const { webhooks } = await existingWebhooksRes.json();
      for (const webhook of webhooks) {
        await fetch(
          `https://${shop}/admin/api/2024-01/webhooks/${webhook.id}.json`,
          {
            method: "DELETE",
            headers: { "X-Shopify-Access-Token": accessToken },
          }
        );
      }
    }

    // Register new webhooks
    for (const topic of WEBHOOK_TOPICS) {
      try {
        const response = await fetch(
          `https://${shop}/admin/api/2024-01/webhooks.json`,
          {
            method: "POST",
            headers: {
              "X-Shopify-Access-Token": accessToken,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              webhook: {
                topic,
                address: webhookEndpoint,
                format: "json",
              },
            }),
          }
        );

        if (response.ok) {
          results.push({ topic, success: true });
        } else {
          const error = await response.text();
          results.push({ topic, success: false, error });
        }
      } catch (error) {
        results.push({ topic, success: false, error: String(error) });
      }
    }

    // Update installation with webhook status
    await supabase
      .from("shopify_installations")
      .update({
        webhooks_registered: results.filter((r) => r.success).map((r) => r.topic),
        updated_at: new Date().toISOString(),
      })
      .eq("shop_domain", shop);

    return new Response(
      JSON.stringify({ 
        success: true, 
        registered: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        results 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Webhook registration error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to register webhooks" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
