// @ts-nocheck
// Supabase Edge Function: shopify-webhook-handler
// Handles incoming Shopify webhooks

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

serve(async (req) => {
  try {
    const shopifyApiSecret = Deno.env.get("SHOPIFY_API_SECRET")!;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseSecretKeys = Deno.env.get("SUPABASE_SECRET_KEYS");
    const supabaseServiceKey = supabaseSecretKeys
      ? JSON.parse(supabaseSecretKeys)["default"]
      : Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseServiceKey) {
      throw new Error("Supabase privileged key is not configured");
    }

    // Get raw body for HMAC verification
    const rawBody = await req.text();
    
    // Verify HMAC
    const hmacHeader = req.headers.get("X-Shopify-Hmac-Sha256");
    if (hmacHeader) {
      const hmac = createHmac("sha256", shopifyApiSecret);
      hmac.update(rawBody);
      const calculatedHmac = hmac.digest("base64");
      
      if (calculatedHmac !== hmacHeader) {
        console.error("HMAC verification failed");
        return new Response("Unauthorized", { status: 401 });
      }
    }

    const topic = req.headers.get("X-Shopify-Topic");
    const shop = req.headers.get("X-Shopify-Shop-Domain");
    const payload = JSON.parse(rawBody);

    console.log(`Received webhook: ${topic} from ${shop}`);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle different webhook topics
    switch (topic) {
      case "orders/create":
      case "orders/updated":
        await handleOrder(supabase, payload, shop!);
        break;
      
      case "orders/cancelled":
        await handleOrderCancellation(supabase, payload);
        break;
      
      case "refunds/create":
        await handleRefund(supabase, payload);
        break;
      
      case "products/create":
      case "products/update":
        await handleProduct(supabase, payload, shop!);
        break;
      
      case "products/delete":
        await handleProductDelete(supabase, payload);
        break;
      
      case "app/uninstalled":
        await handleUninstall(supabase, shop!);
        break;
      
      default:
        console.log(`Unhandled webhook topic: ${topic}`);
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return new Response("Internal error", { status: 500 });
  }
});

async function handleOrder(supabase: any, order: any, shop: string) {
  const orderData = {
    shopify_order_id: String(order.id),
    order_number: order.name || `#${order.order_number}`,
    customer_email: order.email || order.customer?.email,
    status: mapOrderStatus(order),
    total_price: parseFloat(order.total_price),
    subtotal_price: parseFloat(order.subtotal_price),
    total_tax: parseFloat(order.total_tax || 0),
    currency: order.currency,
    line_items: order.line_items.map((item: any) => ({
      product_id: item.product_id,
      variant_id: item.variant_id,
      title: item.title,
      quantity: item.quantity,
      price: parseFloat(item.price),
      sku: item.sku,
    })),
    shipping_address: order.shipping_address,
    billing_address: order.billing_address,
    shop_domain: shop,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("orders")
    .upsert(orderData, { onConflict: "shopify_order_id" });

  if (error) {
    console.error("Failed to save order:", error);
    throw error;
  }

  // Update product performance metrics
  for (const item of order.line_items) {
    await updateProductMetrics(supabase, item.product_id, {
      orders: 1,
      revenue: parseFloat(item.price) * item.quantity,
    });
  }
}

async function handleOrderCancellation(supabase: any, order: any) {
  await supabase
    .from("orders")
    .update({ 
      status: "cancelled",
      updated_at: new Date().toISOString()
    })
    .eq("shopify_order_id", String(order.id));
}

async function handleRefund(supabase: any, refund: any) {
  // Update order status
  await supabase
    .from("orders")
    .update({ 
      status: "refunded",
      refund_data: refund,
      updated_at: new Date().toISOString()
    })
    .eq("shopify_order_id", String(refund.order_id));

  // Update product metrics for refund tracking
  for (const lineItem of refund.refund_line_items || []) {
    await updateProductMetrics(supabase, lineItem.line_item?.product_id, {
      refunds: 1,
      refund_amount: parseFloat(lineItem.subtotal),
    });
  }
}

async function handleProduct(supabase: any, product: any, shop: string) {
  const variant = product.variants?.[0];
  
  const productData = {
    shopify_product_id: String(product.id),
    handle: product.handle,
    title: product.title,
    description: product.body_html,
    vendor: product.vendor,
    product_type: product.product_type,
    tags: product.tags?.split(", ") || [],
    price: variant ? parseFloat(variant.price) : null,
    compare_at_price: variant?.compare_at_price ? parseFloat(variant.compare_at_price) : null,
    image_url: product.images?.[0]?.src,
    images: product.images?.map((img: any) => img.src) || [],
    status: product.status === "active" ? "active" : "draft",
    shop_domain: shop,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("products")
    .upsert(productData, { onConflict: "shopify_product_id" });

  if (error) {
    console.error("Failed to save product:", error);
    throw error;
  }
}

async function handleProductDelete(supabase: any, payload: any) {
  // Soft delete - mark as killed
  await supabase
    .from("products")
    .update({ 
      status: "killed",
      updated_at: new Date().toISOString()
    })
    .eq("shopify_product_id", String(payload.id));
}

async function handleUninstall(supabase: any, shop: string) {
  await supabase
    .from("shopify_installations")
    .update({ 
      is_active: false,
      uninstalled_at: new Date().toISOString()
    })
    .eq("shop_domain", shop);
}

async function updateProductMetrics(
  supabase: any, 
  productId: string, 
  metrics: { orders?: number; revenue?: number; refunds?: number; refund_amount?: number }
) {
  if (!productId) return;

  const { data: existing } = await supabase
    .from("performance_metrics")
    .select("*")
    .eq("product_id", productId)
    .single();

  if (existing) {
    await supabase
      .from("performance_metrics")
      .update({
        orders_count: (existing.orders_count || 0) + (metrics.orders || 0),
        revenue: (existing.revenue || 0) + (metrics.revenue || 0),
        refunds_count: (existing.refunds_count || 0) + (metrics.refunds || 0),
        refund_amount: (existing.refund_amount || 0) + (metrics.refund_amount || 0),
        updated_at: new Date().toISOString(),
      })
      .eq("product_id", productId);
  } else {
    await supabase.from("performance_metrics").insert({
      product_id: productId,
      orders_count: metrics.orders || 0,
      revenue: metrics.revenue || 0,
      refunds_count: metrics.refunds || 0,
      refund_amount: metrics.refund_amount || 0,
    });
  }
}

function mapOrderStatus(order: any): string {
  if (order.cancelled_at) return "cancelled";
  if (order.fulfillment_status === "fulfilled") return "delivered";
  if (order.fulfillment_status === "partial") return "shipped";
  if (order.financial_status === "paid") return "paid";
  if (order.financial_status === "refunded") return "refunded";
  return "pending";
}
