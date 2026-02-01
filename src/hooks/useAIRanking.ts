/**
 * useAIRanking Hook - React hook for AI-powered product ranking
 * 
 * Provides reactive state management for AI product scoring and ranking
 * with loading states, error handling, and automatic caching.
 * 
 * @module useAIRanking
 * @version 1.0.0
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  rankProducts,
  getAIPicks,
  getCuratedCarousel,
  getGridProducts,
  quickRank,
  initializeRanker,
  getRankerStatus,
  type ProductInput,
  type RankedProduct,
  type RankingResult,
  type RankingOptions,
} from '../ai';

// ============================================================================
// TYPES
// ============================================================================

export interface UseAIRankingState {
  products: RankedProduct[];
  featured: RankedProduct[];
  trending: RankedProduct[];
  isLoading: boolean;
  isInitializing: boolean;
  error: Error | null;
  stats: RankingResult['stats'] | null;
}

export interface UseAIRankingReturn extends UseAIRankingState {
  refresh: () => Promise<void>;
  getProductById: (id: string) => RankedProduct | undefined;
  isReady: boolean;
}

export interface UseAIPicksReturn {
  picks: RankedProduct[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export interface UseCuratedCarouselReturn {
  products: RankedProduct[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

// ============================================================================
// INITIALIZATION HOOK
// ============================================================================

let initializationPromise: Promise<boolean> | null = null;
let isInitialized = false;

/**
 * Hook to initialize AI ranker on app load
 */
export function useAIInitializer(): {
  isInitialized: boolean;
  isInitializing: boolean;
  initialize: () => Promise<boolean>;
} {
  const [initializing, setInitializing] = useState(false);
  const [initialized, setInitialized] = useState(isInitialized);

  const initialize = useCallback(async () => {
    if (isInitialized) return true;

    if (initializationPromise) {
      return initializationPromise;
    }

    setInitializing(true);

    initializationPromise = initializeRanker()
      .then((success) => {
        isInitialized = success;
        setInitialized(success);
        return success;
      })
      .catch((error) => {
        console.error('AI initialization error:', error);
        return false;
      })
      .finally(() => {
        setInitializing(false);
        initializationPromise = null;
      });

    return initializationPromise;
  }, []);

  // Auto-initialize on mount
  useEffect(() => {
    if (!isInitialized && !initializationPromise) {
      initialize();
    }
  }, [initialize]);

  return {
    isInitialized: initialized,
    isInitializing: initializing,
    initialize,
  };
}

// ============================================================================
// MAIN RANKING HOOK
// ============================================================================

/**
 * Main hook for AI product ranking
 */
export function useAIRanking(
  products: ProductInput[],
  options?: RankingOptions
): UseAIRankingReturn {
  const [state, setState] = useState<UseAIRankingState>({
    products: [],
    featured: [],
    trending: [],
    isLoading: true,
    isInitializing: true,
    error: null,
    stats: null,
  });

  const abortRef = useRef<AbortController | null>(null);
  const productsRef = useRef<ProductInput[]>(products);
  const optionsRef = useRef(options);

  // Update refs
  productsRef.current = products;
  optionsRef.current = options;

  // Initialize AI on first use
  const { isInitialized, isInitializing } = useAIInitializer();

  // Memoized product IDs for dependency tracking
  const productIds = useMemo(
    () => products.map((p) => p.id).join(','),
    [products]
  );

  const rankProductsAsync = useCallback(async () => {
    // Cancel previous request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Quick rank first for instant feedback
      const quickRanked = quickRank(productsRef.current);
      setState((prev) => ({
        ...prev,
        products: quickRanked,
        featured: quickRanked.filter((p) => p.aiTier === 'Featured').slice(0, 6),
        trending: quickRanked.filter((p) => p.aiTier === 'Trending').slice(0, 12),
      }));

      // Full AI ranking
      const result = await rankProducts(productsRef.current, optionsRef.current);

      // Check if aborted
      if (abortRef.current?.signal.aborted) return;

      setState({
        products: result.products,
        featured: result.featured,
        trending: result.trending,
        isLoading: false,
        isInitializing: false,
        error: null,
        stats: result.stats,
      });
    } catch (error) {
      if (abortRef.current?.signal.aborted) return;

      console.error('AI ranking error:', error);
      
      // Fall back to quick rank on error
      const fallback = quickRank(productsRef.current);
      setState({
        products: fallback,
        featured: fallback.filter((p) => p.aiTier === 'Featured').slice(0, 6),
        trending: fallback.filter((p) => p.aiTier === 'Trending').slice(0, 12),
        isLoading: false,
        isInitializing: false,
        error: error instanceof Error ? error : new Error('AI ranking failed'),
        stats: null,
      });
    }
  }, [productIds]);

  // Rank when products change or AI initializes
  useEffect(() => {
    if (products.length > 0) {
      rankProductsAsync();
    } else {
      setState((prev) => ({
        ...prev,
        products: [],
        featured: [],
        trending: [],
        isLoading: false,
      }));
    }

    return () => {
      abortRef.current?.abort();
    };
  }, [productIds, isInitialized, rankProductsAsync]);

  // Update initializing state
  useEffect(() => {
    setState((prev) => ({ ...prev, isInitializing }));
  }, [isInitializing]);

  const getProductById = useCallback(
    (id: string) => state.products.find((p) => p.id === id),
    [state.products]
  );

  return {
    ...state,
    refresh: rankProductsAsync,
    getProductById,
    isReady: isInitialized && !state.isLoading,
  };
}

// ============================================================================
// SPECIALIZED HOOKS
// ============================================================================

/**
 * Hook for AI Picks section (hero/featured)
 */
export function useAIPicks(
  products: ProductInput[],
  count: number = 4
): UseAIPicksReturn {
  const [picks, setPicks] = useState<RankedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const productIds = useMemo(
    () => products.map((p) => p.id).join(','),
    [products]
  );

  const fetchPicks = useCallback(async () => {
    if (products.length === 0) {
      setPicks([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getAIPicks(products, count);
      setPicks(result);
    } catch (err) {
      console.error('AI picks error:', err);
      setError(err instanceof Error ? err : new Error('Failed to get AI picks'));
      // Fallback to first N products
      setPicks(
        products.slice(0, count).map((p, i) => ({
          ...p,
          aiScore: 0.5,
          aiTags: ['Quality'],
          aiTier: 'Standard' as const,
          rankPosition: i,
        }))
      );
    } finally {
      setIsLoading(false);
    }
  }, [productIds, count]);

  useEffect(() => {
    fetchPicks();
  }, [fetchPicks]);

  return { picks, isLoading, error, refresh: fetchPicks };
}

/**
 * Hook for Curated Carousel
 */
export function useCuratedCarousel(
  products: ProductInput[],
  count: number = 8
): UseCuratedCarouselReturn {
  const [carouselProducts, setCarouselProducts] = useState<RankedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const productIds = useMemo(
    () => products.map((p) => p.id).join(','),
    [products]
  );

  const fetchCarousel = useCallback(async () => {
    if (products.length === 0) {
      setCarouselProducts([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getCuratedCarousel(products, count);
      setCarouselProducts(result);
    } catch (err) {
      console.error('Curated carousel error:', err);
      setError(err instanceof Error ? err : new Error('Failed to get carousel'));
      // Fallback
      setCarouselProducts(
        products.slice(0, count).map((p, i) => ({
          ...p,
          aiScore: 0.5,
          aiTags: ['Quality'],
          aiTier: 'Standard' as const,
          rankPosition: i,
        }))
      );
    } finally {
      setIsLoading(false);
    }
  }, [productIds, count]);

  useEffect(() => {
    fetchCarousel();
  }, [fetchCarousel]);

  return { products: carouselProducts, isLoading, error, refresh: fetchCarousel };
}

/**
 * Hook for Product Grid with AI sorting
 */
export function useAIGrid(
  products: ProductInput[],
  options?: RankingOptions
): {
  products: RankedProduct[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
} {
  const [gridProducts, setGridProducts] = useState<RankedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const productIds = useMemo(
    () => products.map((p) => p.id).join(','),
    [products]
  );

  const fetchGrid = useCallback(async () => {
    if (products.length === 0) {
      setGridProducts([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getGridProducts(products, options);
      setGridProducts(result);
    } catch (err) {
      console.error('AI grid error:', err);
      setError(err instanceof Error ? err : new Error('Failed to get grid'));
      // Fallback to original order
      setGridProducts(
        products.map((p, i) => ({
          ...p,
          aiScore: 0.5,
          aiTags: ['Quality'],
          aiTier: 'Standard' as const,
          rankPosition: i,
        }))
      );
    } finally {
      setIsLoading(false);
    }
  }, [productIds, options]);

  useEffect(() => {
    fetchGrid();
  }, [fetchGrid]);

  return { products: gridProducts, isLoading, error, refresh: fetchGrid };
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook to get AI ranker status
 */
export function useAIStatus(): {
  ready: boolean;
  cacheSize: number;
} {
  const [status, setStatus] = useState({ ready: false, cacheSize: 0 });

  useEffect(() => {
    const checkStatus = () => {
      setStatus(getRankerStatus());
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  return status;
}

export default {
  useAIRanking,
  useAIPicks,
  useCuratedCarousel,
  useAIGrid,
  useAIInitializer,
  useAIStatus,
};
