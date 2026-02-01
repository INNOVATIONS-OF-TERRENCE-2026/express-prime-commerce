// Supabase Edge Function: shopify-product-sync
// Syncs products from Shopify Admin API to Supabase

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Shopify configuration - will be provided by the caller or use defaults
const SHOPIFY_STORE_DOMAIN = "9hbckq-qe.myshopify.com";

interface ShopifyAdminProduct {
  id: number;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  created_at: string;
  handle: string;
  updated_at: string;
  published_at: string | null;
  status: string;
  tags: string;
  variants: Array<{
    id: number;
    product_id: number;
    title: string;
    price: string;
    compare_at_price: string | null;
    sku: string;
    inventory_quantity: number;
  }>;
  images: Array<{
    id: number;
    src: string;
    alt: string | null;
  }>;
}

interface SyncRequest {
  products?: ShopifyAdminProduct[];
  limit?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting Shopify product sync...");

    let body: SyncRequest = {};
    try {
      body = await req.json();
    } catch {
      // Empty body is fine
    }

    // If products are provided directly (from webhook or extension), use them
    let productsToSync: ShopifyAdminProduct[] = body.products || [];

    // If no products provided, we need to get them from the caller
    // This function expects products to be passed in since we can't use Admin API without token
    if (productsToSync.length === 0) {
      // Return a message explaining how to use this endpoint
      return new Response(
        JSON.stringify({
          success: false,
          message: "No products provided. Pass products array in request body or use the admin extension to sync.",
          usage: {
            method: "POST",
            body: {
              products: "[array of Shopify product objects from Admin API]"
            }
          }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get shop installation (optional, for linking)
    const { data: installation } = await supabase
      .from("shopify_installations")
      .select("*")
      .eq("shop_domain", SHOPIFY_STORE_DOMAIN)
      .eq("is_active", true)
      .maybeSingle();

    const syncedProducts: unknown[] = [];
    const errors: string[] = [];

    // Sync each product to Supabase
    for (const product of productsToSync) {
      try {
        const firstVariant = product.variants?.[0];
        const price = firstVariant?.price ? parseFloat(firstVariant.price) : 0;
        const compareAtPrice = firstVariant?.compare_at_price 
          ? parseFloat(firstVariant.compare_at_price) 
          : null;
        
        const marginPercent = compareAtPrice && compareAtPrice > price
          ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100 * 100) / 100
          : null;

        const firstImage = product.images?.[0];
        const tags = product.tags ? product.tags.split(", ").map(t => t.trim()).filter(Boolean) : [];

        // Clean description - remove HTML tags
        const description = product.body_html 
          ? product.body_html.replace(/<[^>]*>/g, '').trim()
          : '';

        const productData = {
          shopify_product_id: String(product.id),
          shopify_variant_id: firstVariant?.id ? String(firstVariant.id) : null,
          shopify_installation_id: installation?.id || null,
          title: product.title,
          description: description,
          handle: product.handle,
          vendor: product.vendor || "Express Prime",
          product_type: product.product_type || "General",
          tags: tags,
          status: product.status === "active" ? "active" as const : "draft" as const,
          price: price,
          compare_at_price: compareAtPrice,
          margin_percent: marginPercent,
          inventory_quantity: firstVariant?.inventory_quantity || 0,
          image_url: firstImage?.src || null,
          images: product.images?.map(img => ({
            url: img.src,
            altText: img.alt,
          })) || [],
          is_synced: true,
          last_synced_at: new Date().toISOString(),
        };

        console.log(`Syncing product: ${product.title} (${product.id})`);

        // Check if product already exists
        const { data: existing } = await supabase
          .from("products")
          .select("id")
          .eq("shopify_product_id", String(product.id))
          .maybeSingle();

        let result;
        if (existing) {
          // Update existing product
          result = await supabase
            .from("products")
            .update(productData)
            .eq("id", existing.id)
            .select()
            .single();
        } else {
          // Insert new product
          result = await supabase
            .from("products")
            .insert(productData)
            .select()
            .single();
        }

        if (result.error) {
          console.error(`Error syncing ${product.title}:`, result.error);
          errors.push(`${product.title}: ${result.error.message}`);
        } else {
          syncedProducts.push(result.data);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error(`Error processing ${product.title}:`, errorMessage);
        errors.push(`${product.title}: ${errorMessage}`);
      }
    }

    console.log(`Sync complete: ${syncedProducts.length} products synced, ${errors.length} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully synced ${syncedProducts.length} products from Shopify`,
        synced: syncedProducts.length,
        total: productsToSync.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Sync error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage, success: false }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
