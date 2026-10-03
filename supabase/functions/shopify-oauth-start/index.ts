// @ts-nocheck
// Supabase Edge Function: shopify-oauth-start
// Initiates Shopify OAuth flow

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const shopifyApiKey = Deno.env.get("SHOPIFY_API_KEY");
    const shopifyApiSecret = Deno.env.get("SHOPIFY_API_SECRET");
    const appUrl = Deno.env.get("APP_URL") || "https://express-prime.vercel.app";

    if (!shopifyApiKey || !shopifyApiSecret) {
      return new Response(
        JSON.stringify({ error: "Shopify credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate state for CSRF protection
    const state = crypto.randomUUID();
    
    // Store state in Supabase for verification
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseSecretKeys = Deno.env.get("SUPABASE_SECRET_KEYS");
    const supabaseServiceKey = supabaseSecretKeys
      ? JSON.parse(supabaseSecretKeys)["default"]
      : Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseServiceKey) {
      throw new Error("Supabase privileged key is not configured");
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    await supabase.from("oauth_states").insert({
      state,
      shop,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 min expiry
    });

    // Scopes needed for full integration
    const scopes = [
      "read_products",
      "write_products",
      "read_orders",
      "write_orders",
      "read_customers",
      "read_inventory",
      "write_inventory",
      "read_fulfillments",
      "write_fulfillments",
    ].join(",");

    // Use Supabase function URL for OAuth callback (not app URL)
    const redirectUri = `${supabaseUrl}/functions/v1/shopify-oauth-callback`;
    const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${shopifyApiKey}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;

    return new Response(
      JSON.stringify({ installUrl, state }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("OAuth start error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to initiate OAuth" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
