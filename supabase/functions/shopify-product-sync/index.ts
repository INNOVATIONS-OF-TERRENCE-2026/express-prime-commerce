// @ts-nocheck
// Supabase Edge Function: shopify-product-sync
// Syncs products created via Shopify Admin Extension back to Supabase

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-shopify-shop-domain",
};

interface ShopifyProduct {
  id: string;
  title: string;
  description?: string;
  descriptionHtml?: string;
  vendor?: string;
  productType?: string;
  tags?: string[];
  status?: string;
  handle?: string;
  variants?: {
    nodes?: Array<{
      id: string;
      price: string;
      compareAtPrice?: string;
      inventoryQuantity?: number;
    }>;
  };
  images?: {
    nodes?: Array<{
      url: string;
    }>;
  };
}

interface SyncRequest {
  shop: string;
  products?: ShopifyProduct[];
  productId?: string;
  action?: 'create' | 'update' | 'delete' | 'sync_all';
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: SyncRequest = await req.json();
    const { shop, products, productId, action = 'sync_all' } = body;

    if (!shop) {
      return new Response(
        JSON.stringify({ error: "Shop domain is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get shop installation
    const { data: installation } = await supabase
      .from("shopify_installations")
      .select("*")
      .eq("shop_domain", shop)
      .eq("is_active", true)
      .single();

    let syncedProducts: any[] = [];
    let errors: string[] = [];

    // Handle different sync actions
    if (action === 'delete' && productId) {
      // Delete product from Supabase
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("shopify_product_id", productId);

      if (error) {
        errors.push(`Failed to delete product: ${error.message}`);
      }
    } else if (products && products.length > 0) {
      // Sync provided products
      for (const product of products) {
        try {
          const variant = product.variants?.nodes?.[0];
          const image = product.images?.nodes?.[0];
          
          const price = variant?.price ? parseFloat(variant.price) : 0;
          const compareAtPrice = variant?.compareAtPrice ? parseFloat(variant.compareAtPrice) : null;
          const marginPercent = compareAtPrice && compareAtPrice > price 
            ? ((compareAtPrice - price) / compareAtPrice) * 100 
            : null;

          const productData = {
            shopify_product_id: product.id.replace('gid://shopify/Product/', ''),
            shopify_installation_id: installation?.id || null,
            shop_domain: shop,
            title: product.title,
            description: product.description || product.descriptionHtml?.replace(/<[^>]*>/g, '') || '',
            handle: product.handle || product.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            vendor: product.vendor || 'Express Prime',
            product_type: product.productType || 'General',
            tags: product.tags || [],
            status: (product.status?.toLowerCase() || 'active') as 'active' | 'paused' | 'killed' | 'draft',
            price: price,
            compare_at_price: compareAtPrice,
            margin_percent: marginPercent,
            inventory_quantity: variant?.inventoryQuantity || 0,
            image_url: image?.url || null,
            is_synced: true,
            last_synced_at: new Date().toISOString(),
          };

          const { data, error } = await supabase
            .from("products")
            .upsert(productData, { 
              onConflict: 'shopify_product_id',
              ignoreDuplicates: false 
            })
            .select()
            .single();

          if (error) {
            errors.push(`${product.title}: ${error.message}`);
          } else {
            syncedProducts.push(data);
          }
        } catch (err: any) {
          errors.push(`${product.title}: ${err.message}`);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        synced: syncedProducts.length,
        errors: errors.length > 0 ? errors : undefined,
        products: syncedProducts,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Sync error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Sync failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
