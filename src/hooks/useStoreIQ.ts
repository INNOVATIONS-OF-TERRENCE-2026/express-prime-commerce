/**
 * useStoreIQ Hook
 * 
 * React hook for accessing Store IQ Score system.
 * Provides real-time intelligence scoring with caching.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  calculateStoreIQ,
  generateMockInputData,
  invalidateCache,
  type StoreIQOutput,
  type StoreIQInputData,
} from '@/ai/storeIQ';
import { useShopifyProducts } from './useShopifyProducts';

// ============================================================================
// HOOK
// ============================================================================

export function useStoreIQ() {
  const [output, setOutput] = useState<StoreIQOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Get real product data
  const { data: shopifyProducts = [] } = useShopifyProducts({ limit: 50 });

  // Convert Shopify products to Store IQ input format
  const convertToInputData = useCallback((): StoreIQInputData => {
    if (shopifyProducts.length === 0) {
      // Use mock data if no products
      return generateMockInputData();
    }

    const products = shopifyProducts.map((p, index) => ({
      id: p.node.id,
      title: p.node.title,
      price: parseFloat(p.node.priceRange?.minVariantPrice?.amount || '0'),
      compareAtPrice: p.node.compareAtPriceRange?.minVariantPrice?.amount
        ? parseFloat(p.node.compareAtPriceRange.minVariantPrice.amount)
        : null,
      aiScore: 60 + Math.random() * 30, // Simulated AI score
      visualSaliency: 50 + Math.random() * 40, // Simulated
      views: 30 + Math.floor(Math.random() * 150), // Simulated
      addToCartRate: 0.05 + Math.random() * 0.08, // Simulated
      category: p.node.productType || 'general',
    }));

    // Generate simulated trending data
    const trendingData = products.slice(0, 15).map(p => ({
      productId: p.id,
      velocity: 0.8 + Math.random() * 1.0,
      direction: (['rising', 'stable', 'cooling'] as const)[
        Math.floor(Math.random() * 3)
      ],
      rankChange: Math.floor(Math.random() * 10) - 5,
    }));

    // Generate simulated cart data
    const cartData = Array.from({ length: 40 }, () => ({
      timestamp: new Date(Date.now() - Math.random() * 48 * 60 * 60 * 1000),
      productId: products[Math.floor(Math.random() * products.length)]?.id || 'unknown',
      action: (['add', 'add', 'checkout', 'abandon'] as const)[
        Math.floor(Math.random() * 4)
      ],
    }));

    // Operational metrics (would come from real ops data)
    const operationalMetrics = {
      paymentMethodsActive: 3,
      checkoutSuccessRate: 0.89 + Math.random() * 0.08,
      avgInventoryLevel: 35 + Math.floor(Math.random() * 40),
      fallbackSupplierCount: 2,
      aiCoveragePercent: 70 + Math.floor(Math.random() * 20),
    };

    return { products, trendingData, cartData, operationalMetrics };
  }, [shopifyProducts]);

  // Calculate Store IQ
  const calculate = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const inputData = convertToInputData();
      const result = await calculateStoreIQ(inputData);
      setOutput(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Calculation failed'));
    } finally {
      setIsLoading(false);
    }
  }, [convertToInputData]);

  // Refresh (invalidate cache and recalculate)
  const refresh = useCallback(async () => {
    invalidateCache();
    await calculate();
  }, [calculate]);

  // Auto-calculate on mount and when products change
  useEffect(() => {
    calculate();
  }, [calculate]);

  return {
    output,
    isLoading,
    error,
    calculate,
    refresh,
  };
}

export default useStoreIQ;
