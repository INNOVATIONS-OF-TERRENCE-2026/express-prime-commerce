/**
 * useProfitGuard - React hook for real-time profit protection
 * 
 * Provides profit analysis for cart items and validates checkout profitability.
 * Integrates with CartContext to enforce guaranteed profit on every sale.
 */

import { useMemo, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/contexts/CartContext';
import {
  analyzeProfitability,
  validateCartProfitability,
  validateCheckout,
  calculateDynamicPrice,
  calculatePriceFloor,
  PROFIT_CONFIG,
  type ProfitAnalysis,
  type CartProfitSummary,
  type CheckoutValidation,
  type DynamicPriceRecommendation,
} from '@/lib/profitGuard';

// ============================================================================
// TYPES
// ============================================================================

interface ProductWithCost {
  id: string;
  title: string;
  price: number;
  cost: number | null;
  inventory_quantity: number | null;
  margin_percent: number | null;
}

interface CartItemWithCost {
  productId: string;
  title: string;
  price: number;
  cost: number;
  quantity: number;
  shippingCost?: number;
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Get profit analysis for a single product
 */
export function useProductProfitAnalysis(productId: string | undefined) {
  return useQuery({
    queryKey: ['profit-analysis', productId],
    queryFn: async (): Promise<ProfitAnalysis | null> => {
      if (!productId) return null;

      const { data, error } = await supabase
        .from('products')
        .select('id, title, price, cost, inventory_quantity, margin_percent')
        .eq('id', productId)
        .single();

      if (error || !data) return null;

      // Use actual cost or estimate at 60% of price
      const cost = data.cost ?? (data.price * 0.6);
      return analyzeProfitability(data.price, cost);
    },
    enabled: !!productId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Get dynamic pricing recommendation for a product
 */
export function useDynamicPricing(productId: string | undefined) {
  return useQuery({
    queryKey: ['dynamic-pricing', productId],
    queryFn: async (): Promise<DynamicPriceRecommendation | null> => {
      if (!productId) return null;

      // Get product with performance metrics
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, title, price, cost, inventory_quantity')
        .eq('id', productId)
        .single();

      if (productError || !product) return null;

      // Get recent sales velocity
      const { data: metrics } = await supabase
        .from('performance_metrics')
        .select('orders_count')
        .eq('product_id', productId)
        .order('date', { ascending: false })
        .limit(7);

      const weeklyOrders = metrics?.reduce((sum, m) => sum + (m.orders_count || 0), 0) ?? 0;
      const cost = product.cost ?? (product.price * 0.6);

      return calculateDynamicPrice(
        product.price,
        cost,
        product.inventory_quantity ?? 100,
        weeklyOrders
      );
    },
    enabled: !!productId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Main hook for cart profit protection
 */
export function useCartProfitGuard() {
  const { items, subtotal } = useCart();

  // Fetch cost data for all cart items
  const productIds = useMemo(() => items.map(item => item.productId), [items]);

  const { data: productsWithCost, isLoading: isLoadingCosts } = useQuery({
    queryKey: ['cart-product-costs', productIds],
    queryFn: async (): Promise<Map<string, ProductWithCost>> => {
      if (productIds.length === 0) return new Map();

      const { data, error } = await supabase
        .from('products')
        .select('id, title, price, cost, inventory_quantity, margin_percent')
        .in('id', productIds);

      if (error) throw error;

      const map = new Map<string, ProductWithCost>();
      for (const product of data || []) {
        map.set(product.id, product);
      }
      return map;
    },
    enabled: productIds.length > 0,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Build cart items with cost data
  const cartItemsWithCost = useMemo((): CartItemWithCost[] => {
    if (!productsWithCost) return [];

    return items.map(item => {
      const product = productsWithCost.get(item.productId);
      // Use actual cost or estimate at 60% of price
      const cost = product?.cost ?? (item.price * 0.6);

      return {
        productId: item.productId,
        title: item.title,
        price: item.price,
        cost,
        quantity: item.quantity,
      };
    });
  }, [items, productsWithCost]);

  // Calculate cart profit summary
  const profitSummary = useMemo((): CartProfitSummary | null => {
    if (cartItemsWithCost.length === 0) return null;
    return validateCartProfitability(cartItemsWithCost);
  }, [cartItemsWithCost]);

  // Checkout validation
  const checkoutValidation = useMemo((): CheckoutValidation | null => {
    if (cartItemsWithCost.length === 0) return null;
    return validateCheckout(cartItemsWithCost, true);
  }, [cartItemsWithCost]);

  // Check if checkout should be blocked
  const canCheckout = useMemo(() => {
    if (!checkoutValidation) return true; // Empty cart
    return checkoutValidation.canProceed;
  }, [checkoutValidation]);

  // Get list of unprofitable items
  const unprofitableItems = useMemo(() => {
    if (!profitSummary) return [];
    return profitSummary.unprofitableItems;
  }, [profitSummary]);

  // Get total expected profit
  const expectedProfit = useMemo(() => {
    return profitSummary?.totalProfit ?? 0;
  }, [profitSummary]);

  // Get average margin
  const averageMargin = useMemo(() => {
    return profitSummary?.averageMarginPercent ?? 0;
  }, [profitSummary]);

  return {
    // Loading state
    isLoading: isLoadingCosts,

    // Cart profit data
    profitSummary,
    checkoutValidation,
    cartItemsWithCost,

    // Quick access values
    canCheckout,
    unprofitableItems,
    expectedProfit,
    averageMargin,
    subtotal,

    // Profit config
    config: PROFIT_CONFIG,
  };
}

/**
 * Hook to validate a single item before adding to cart
 */
export function useAddToCartValidation() {
  const validateItem = useCallback(
    async (
      productId: string,
      price: number
    ): Promise<{
      isValid: boolean;
      analysis: ProfitAnalysis | null;
      warning: string | null;
    }> => {
      // Fetch product cost
      const { data: product, error } = await supabase
        .from('products')
        .select('cost')
        .eq('id', productId)
        .single();

      if (error || !product) {
        return {
          isValid: true, // Allow if we can't check
          analysis: null,
          warning: 'Could not verify product profitability',
        };
      }

      const cost = product.cost ?? (price * 0.6);
      const analysis = analyzeProfitability(price, cost);

      let warning: string | null = null;
      if (analysis.status === 'loss') {
        warning = `This product is currently priced below cost`;
      } else if (analysis.status === 'critical') {
        warning = `Low margin product (${analysis.profitMarginPercent.toFixed(1)}%)`;
      }

      return {
        isValid: analysis.isProfitable,
        analysis,
        warning,
      };
    },
    []
  );

  return { validateItem };
}

/**
 * Hook for admin to get bulk profit analysis
 */
export function useBulkProfitAnalysis(productIds: string[]) {
  return useQuery({
    queryKey: ['bulk-profit-analysis', productIds],
    queryFn: async () => {
      if (productIds.length === 0) return [];

      const { data, error } = await supabase
        .from('products')
        .select('id, title, handle, price, cost, margin_percent, inventory_quantity, status')
        .in('id', productIds);

      if (error) throw error;

      return (data || []).map(product => {
        const cost = product.cost ?? (product.price * 0.6);
        const analysis = analyzeProfitability(product.price, cost);
        const priceFloor = calculatePriceFloor(cost);

        return {
          ...product,
          analysis,
          priceFloor,
          needsPriceIncrease: product.price < priceFloor,
        };
      });
    },
    enabled: productIds.length > 0,
  });
}

/**
 * Hook to get all products that need price adjustments
 */
export function useUnprofitableProducts() {
  return useQuery({
    queryKey: ['unprofitable-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, title, handle, price, cost, margin_percent, inventory_quantity, status')
        .eq('status', 'active')
        .not('cost', 'is', null);

      if (error) throw error;

      const unprofitable = (data || [])
        .map(product => {
          const analysis = analyzeProfitability(product.price, product.cost!);
          const priceFloor = calculatePriceFloor(product.cost!);

          return {
            ...product,
            analysis,
            priceFloor,
            suggestedIncrease: Math.max(0, priceFloor - product.price),
          };
        })
        .filter(p => !p.analysis.meetsMinimumMargin)
        .sort((a, b) => a.analysis.netProfit - b.analysis.netProfit);

      return unprofitable;
    },
    staleTime: 1000 * 60 * 5,
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  analyzeProfitability,
  validateCartProfitability,
  validateCheckout,
  calculateDynamicPrice,
  calculatePriceFloor,
  PROFIT_CONFIG,
};

export type {
  ProfitAnalysis,
  CartProfitSummary,
  CheckoutValidation,
  DynamicPriceRecommendation,
};
