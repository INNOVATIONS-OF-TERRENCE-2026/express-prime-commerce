/**
 * useProductIntelligence Hook
 *
 * React hook for consuming the Product Intelligence Engine.
 * Supports both direct analysis (client-side) and API calls (edge function).
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  analyzeProduct,
  createIntelligenceInput,
  createEmptyMetrics,
  type ProductIntelligenceOutput,
  type ProductData,
  type ProductMetrics,
} from '@/intelligence';

interface UseProductIntelligenceOptions {
  /**
   * Whether to use the edge function API instead of client-side analysis.
   * Edge function is better for:
   * - Consistent results across clients
   * - Automatic caching in ai_decisions table
   * - Rate limiting and auth handling
   */
  useApi?: boolean;

  /**
   * Auto-refresh interval in milliseconds.
   * Set to 0 to disable auto-refresh.
   */
  refetchInterval?: number;
}

/**
 * Hook for analyzing a single product.
 */
export function useProductIntelligence(
  productId: string | null,
  options: UseProductIntelligenceOptions = {}
) {
  const { useApi = false, refetchInterval = 0 } = options;

  return useQuery({
    queryKey: ['product-intelligence', productId, useApi],
    queryFn: async (): Promise<ProductIntelligenceOutput | null> => {
      if (!productId) return null;

      if (useApi) {
        // Call edge function
        const { data, error } = await supabase.functions.invoke('product-intelligence', {
          body: { product_id: productId },
        });

        if (error) throw error;
        return data as ProductIntelligenceOutput;
      }

      // Client-side analysis
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (productError) throw productError;

      // Get metrics
      const { data: metrics } = await supabase
        .from('performance_metrics')
        .select('*')
        .eq('product_id', productId)
        .order('date', { ascending: false })
        .limit(1)
        .single();

      const input = createIntelligenceInput(
        mapDbProductToInput(product),
        metrics ? mapDbMetricsToInput(metrics) : null
      );

      return analyzeProduct(input);
    },
    enabled: !!productId,
    refetchInterval: refetchInterval > 0 ? refetchInterval : false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for batch analyzing multiple products.
 */
export function useProductsIntelligence(
  productIds: string[],
  options: UseProductIntelligenceOptions = {}
) {
  const { useApi = false } = options;

  return useQuery({
    queryKey: ['products-intelligence', productIds, useApi],
    queryFn: async (): Promise<ProductIntelligenceOutput[]> => {
      if (productIds.length === 0) return [];

      if (useApi) {
        const { data, error } = await supabase.functions.invoke('product-intelligence', {
          body: { product_ids: productIds },
        });

        if (error) throw error;
        return data.results as ProductIntelligenceOutput[];
      }

      // Client-side analysis
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds);

      if (productsError) throw productsError;

      const { data: allMetrics } = await supabase
        .from('performance_metrics')
        .select('*')
        .in('product_id', productIds);

      const metricsMap = new Map<string, any>();
      for (const m of allMetrics || []) {
        metricsMap.set(m.product_id, m);
      }

      return (products || []).map((product) => {
        const metrics = metricsMap.get(product.id);
        const input = createIntelligenceInput(
          mapDbProductToInput(product),
          metrics ? mapDbMetricsToInput(metrics) : null
        );
        return analyzeProduct(input);
      });
    },
    enabled: productIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for getting products that need attention.
 */
export function useProductsNeedingAttention(limit = 10) {
  return useQuery({
    queryKey: ['products-needing-attention', limit],
    queryFn: async () => {
      // Get active products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'active')
        .limit(100); // Analyze up to 100 products

      if (productsError) throw productsError;

      // Get all metrics
      const productIds = (products || []).map((p) => p.id);
      const { data: allMetrics } = await supabase
        .from('performance_metrics')
        .select('*')
        .in('product_id', productIds);

      const metricsMap = new Map<string, any>();
      for (const m of allMetrics || []) {
        metricsMap.set(m.product_id, m);
      }

      // Analyze and filter
      const results: ProductIntelligenceOutput[] = [];

      for (const product of products || []) {
        const metrics = metricsMap.get(product.id);
        const input = createIntelligenceInput(
          mapDbProductToInput(product),
          metrics ? mapDbMetricsToInput(metrics) : null
        );
        const output = analyzeProduct(input);

        // Include if suppress decision or has critical concerns
        if (
          output.decision === 'suppress' ||
          output.explanation.concerns.some((c) => c.priority === 1)
        ) {
          results.push(output);
        }
      }

      // Sort by score (lowest first) and limit
      results.sort((a, b) => a.ai_confidence_score - b.ai_confidence_score);
      return results.slice(0, limit);
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Mutation hook for triggering batch analysis and caching.
 */
export function useRefreshIntelligence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productIds: string[]) => {
      const { data, error } = await supabase.functions.invoke('product-intelligence', {
        body: { product_ids: productIds },
      });

      if (error) throw error;
      return data.results as ProductIntelligenceOutput[];
    },
    onSuccess: (data) => {
      // Update cache for each product
      for (const result of data) {
        queryClient.setQueryData(
          ['product-intelligence', result.product_id, true],
          result
        );
      }

      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: ['products-intelligence'] });
      queryClient.invalidateQueries({ queryKey: ['products-needing-attention'] });
    },
  });
}

// Helper functions to map database types to intelligence input types
function mapDbProductToInput(dbProduct: any): ProductData {
  return {
    id: dbProduct.id,
    title: dbProduct.title,
    handle: dbProduct.handle,
    status: dbProduct.status,
    price: dbProduct.price,
    compare_at_price: dbProduct.compare_at_price,
    cost: dbProduct.cost,
    margin_percent: dbProduct.margin_percent,
    inventory_quantity: dbProduct.inventory_quantity,
    tags: dbProduct.tags,
    product_type: dbProduct.product_type,
    vendor: dbProduct.vendor,
    created_at: dbProduct.created_at,
    updated_at: dbProduct.updated_at,
  };
}

function mapDbMetricsToInput(dbMetrics: any): ProductMetrics {
  return {
    product_id: dbMetrics.product_id,
    period_days: 30, // Default period
    views: dbMetrics.views || 0,
    add_to_carts: dbMetrics.add_to_carts || 0,
    orders_count: dbMetrics.orders_count || 0,
    units_sold: dbMetrics.units_sold || 0,
    revenue: dbMetrics.revenue || 0,
    refund_count: dbMetrics.refund_count || 0,
    refund_amount: dbMetrics.refund_amount || 0,
    profit: dbMetrics.profit || 0,
    ad_spend: dbMetrics.ad_spend || 0,
    last_order_at: dbMetrics.last_order_at,
  };
}
