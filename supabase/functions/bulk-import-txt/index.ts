// @ts-nocheck
// Supabase Edge Function: bulk-import-txt
// Imports products from CSV/TXT file

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ParsedProduct {
  handle: string;
  title: string;
  description: string;
  vendor: string;
  product_type: string;
  tags: string[];
  price: number;
  compare_at_price: number | null;
  cost: number | null;
  status: "active" | "draft";
  image_url?: string;
}

serve(async (req) => {
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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { content, userId } = await req.json();

    if (!content) {
      return new Response(
        JSON.stringify({ error: "File content is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse CSV content
    const products = parseCSV(content);
    
    if (products.length === 0) {
      return new Response(
        JSON.stringify({ error: "No valid products found in file" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create sync run
    const { data: syncRun, error: syncError } = await supabase
      .from("sync_runs")
      .insert({
        sync_type: "bulk_import",
        status: "processing",
        total_items: products.length,
        started_at: new Date().toISOString(),
        triggered_by: userId,
      })
      .select()
      .single();

    if (syncError) {
      throw syncError;
    }

    let created = 0;
    let updated = 0;
    let failed = 0;
    const errors: { handle: string; error: string }[] = [];

    // Process products
    for (const product of products) {
      try {
        // Check if product exists
        const { data: existing } = await supabase
          .from("products")
          .select("id")
          .eq("handle", product.handle)
          .single();

        // Calculate margin if cost is provided
        let marginPercent = null;
        if (product.cost && product.price) {
          marginPercent = ((product.price - product.cost) / product.price) * 100;
        }

        const productData = {
          ...product,
          margin_percent: marginPercent,
          updated_at: new Date().toISOString(),
        };

        if (existing) {
          // Update
          const { error: updateError } = await supabase
            .from("products")
            .update(productData)
            .eq("id", existing.id);

          if (updateError) throw updateError;
          updated++;

          await supabase.from("sync_items").insert({
            run_id: syncRun.id,
            sku: product.handle,
            action: "update",
            status: "success",
          });
        } else {
          // Create
          const { error: createError } = await supabase
            .from("products")
            .insert(productData);

          if (createError) throw createError;
          created++;

          await supabase.from("sync_items").insert({
            run_id: syncRun.id,
            sku: product.handle,
            action: "create",
            status: "success",
          });
        }
      } catch (error: any) {
        failed++;
        errors.push({ handle: product.handle, error: error.message });

        await supabase.from("sync_items").insert({
          run_id: syncRun.id,
          sku: product.handle,
          action: "create",
          status: "failed",
          error: error.message,
        });
      }
    }

    // Update sync run
    await supabase
      .from("sync_runs")
      .update({
        status: failed > 0 ? "partial" : "completed",
        processed_items: products.length,
        successful_items: created + updated,
        failed_items: failed,
        completed_at: new Date().toISOString(),
      })
      .eq("id", syncRun.id);

    return new Response(
      JSON.stringify({
        success: true,
        syncRunId: syncRun.id,
        total: products.length,
        created,
        updated,
        failed,
        errors: errors.slice(0, 10), // Return first 10 errors
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Bulk import error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Bulk import failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function parseCSV(content: string): ParsedProduct[] {
  const lines = content.split("\n");
  const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
  
  const products: ParsedProduct[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    // Handle CSV parsing with quoted fields
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim().replace(/^"|"$/g, ""));
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^"|"$/g, ""));
    
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });
    
    if (row["Handle"] && row["Title"]) {
      products.push({
        handle: row["Handle"],
        title: row["Title"],
        description: row["Body (HTML)"] || row["Description"] || "",
        vendor: row["Vendor"] || "Express Prime",
        product_type: row["Type"] || row["Product Type"] || "",
        tags: row["Tags"] ? row["Tags"].split(", ").map((t) => t.trim()) : [],
        price: parseFloat(row["Variant Price"] || row["Price"]) || 0,
        compare_at_price: parseFloat(row["Variant Compare At Price"] || row["Compare At Price"]) || null,
        cost: parseFloat(row["Variant Cost"] || row["Cost"]) || null,
        status: row["Status"] === "active" ? "active" : "draft",
        image_url: row["Image Src"] || row["Image URL"] || undefined,
      });
    }
  }
  
  return products;
}
