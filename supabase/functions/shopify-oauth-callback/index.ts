// @ts-nocheck
// Supabase Edge Function: shopify-oauth-callback
// Completes Shopify OAuth flow and stores access token

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as hexEncode } from "https://deno.land/std@0.168.0/encoding/hex.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Verify HMAC signature from Shopify
async function verifyHmac(params: URLSearchParams, secret: string): Promise<boolean> {
  const hmac = params.get("hmac");
  if (!hmac) return false;

  // Build the message by sorting and joining params (excluding hmac)
  const sortedParams = Array.from(params.entries())
    .filter(([key]) => key !== "hmac")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  // Create HMAC-SHA256 signature
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(sortedParams)
  );

  const computedHmac = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // Constant-time comparison to prevent timing attacks
  return hmac.length === computedHmac.length && 
    hmac.split('').every((char, i) => char === computedHmac[i]);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const shop = url.searchParams.get("shop");
    const state = url.searchParams.get("state");
    const hmac = url.searchParams.get("hmac");

    if (!code || !shop || !state) {
      return new Response("Missing required parameters", { status: 400 });
    }

    const shopifyApiKey = Deno.env.get("SHOPIFY_API_KEY");
    const shopifyApiSecret = Deno.env.get("SHOPIFY_API_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const appUrl = Deno.env.get("APP_URL") || "https://express-prime.vercel.app";

    // Verify HMAC signature if secret is available
    if (shopifyApiSecret && hmac) {
      const isValid = await verifyHmac(url.searchParams, shopifyApiSecret);
      if (!isValid) {
        console.error("HMAC verification failed");
        return new Response("Invalid HMAC signature", { status: 403 });
      }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify state
    const { data: stateRecord, error: stateError } = await supabase
      .from("oauth_states")
      .select("*")
      .eq("state", state)
      .eq("shop", shop)
      .single();

    if (stateError || !stateRecord) {
      return new Response("Invalid state parameter", { status: 400 });
    }

    // Check expiry
    if (new Date(stateRecord.expires_at) < new Date()) {
      return new Response("OAuth session expired", { status: 400 });
    }

    // Delete used state
    await supabase.from("oauth_states").delete().eq("state", state);

    // Exchange code for access token
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: shopifyApiKey,
        client_secret: shopifyApiSecret,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error("Token exchange failed:", error);
      return new Response("Failed to exchange code for token", { status: 500 });
    }

    const { access_token, scope } = await tokenResponse.json();

    // Store installation in Supabase
    const { error: installError } = await supabase
      .from("shopify_installations")
      .upsert({
        shop_domain: shop,
        access_token: access_token,
        scopes: scope.split(","),
        is_active: true,
        installed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "shop_domain" });

    if (installError) {
      console.error("Failed to save installation:", installError);
      return new Response("Failed to save installation", { status: 500 });
    }

    // Trigger webhook registration
    await fetch(`${supabaseUrl}/functions/v1/shopify-register-webhooks`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${supabaseServiceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ shop }),
    });

    // Redirect to admin dashboard
    return Response.redirect(`${appUrl}/admin?shopify=connected`, 302);
  } catch (error) {
    console.error("OAuth callback error:", error);
    return new Response("OAuth callback failed", { status: 500 });
  }
});
