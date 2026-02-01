/**
 * AI Product Grid - Product grid with AI-powered sorting and badges
 * 
 * Wraps the existing ProductGrid with AI ranking capabilities.
 * Falls back gracefully if AI fails.
 * 
 * @module AIProductGrid
 * @version 1.0.0
 */

import { useMemo } from 'react';
import { ProductGrid } from './ProductGrid';
import type { ProductCardProps } from './ProductCard';
import { useAIRanking } from '@/hooks/useAIRanking';
import type { ProductInput } from '@/ai';

// ============================================================================
// TYPES
// ============================================================================

interface AIProductGridProps {
  products: ProductCardProps[];
  isLoading?: boolean;
  columns?: 2 | 3 | 4;
  className?: string;
  showEmptyState?: boolean;
  skeletonCount?: number;
  enableAI?: boolean;
}

// ============================================================================
// HELPER: Convert ProductCardProps to ProductInput
// ============================================================================

function toProductInput(product: ProductCardProps): ProductInput {
  return {
    id: product.id,
    title: product.title,
    description: null, // ProductCardProps doesn't include description
    product_type: product.productType || null,
    price: product.price,
    compare_at_price: product.compareAtPrice || null,
    vendor: product.vendor || null,
    tags: product.tags || null,
  };
}

// ============================================================================
// COMPONENT
// ============================================================================

export function AIProductGrid({
  products,
  isLoading = false,
  columns = 4,
  className,
  showEmptyState = false,
  skeletonCount = 4,
  enableAI = true,
}: AIProductGridProps) {
  // Convert products to AI input format
  const productInputs = useMemo(
    () => products.map(toProductInput),
    [products]
  );

  // Get AI rankings
  const {
    products: rankedProducts,
    isLoading: aiLoading,
    isReady,
  } = useAIRanking(enableAI ? productInputs : [], {
    maxFeatured: 6,
    maxTrending: 12,
    includeStandard: true,
  });

  // Map ranked products back to ProductCardProps format
  const sortedProducts = useMemo(() => {
    if (!enableAI || !isReady || rankedProducts.length === 0) {
      return products;
    }

    // Create a map of product IDs to their rankings
    const rankMap = new Map(
      rankedProducts.map((rp) => [rp.id, rp])
    );

    // Sort products based on AI ranking
    return [...products].sort((a, b) => {
      const rankA = rankMap.get(a.id);
      const rankB = rankMap.get(b.id);

      if (!rankA && !rankB) return 0;
      if (!rankA) return 1;
      if (!rankB) return -1;

      return rankA.rankPosition - rankB.rankPosition;
    }).map((product) => {
      const ranked = rankMap.get(product.id);
      if (!ranked) return product;

      // Enhance product with AI badges
      return {
        ...product,
        isAiPick: ranked.aiTier === 'Featured',
        isTrending: ranked.aiTier === 'Trending' || product.isTrending,
      };
    });
  }, [products, rankedProducts, enableAI, isReady]);

  // Show loading if either products or AI is loading
  const showLoading = isLoading || (enableAI && aiLoading && products.length > 0);

  return (
    <ProductGrid
      products={sortedProducts}
      isLoading={showLoading}
      columns={columns}
      className={className}
      showEmptyState={showEmptyState}
      skeletonCount={skeletonCount}
    />
  );
}

export default AIProductGrid;
