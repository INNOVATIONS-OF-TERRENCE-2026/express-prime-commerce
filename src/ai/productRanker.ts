/**
 * Product Ranker Module - AI-powered product sorting and curation
 * 
 * Sorts products based on AI scores with tier-based priority:
 * 1. Featured (highest AI scores, premium picks)
 * 2. Trending (popular, viral products)
 * 3. Standard (quality products)
 * 4. Price anchor logic for balance
 * 
 * @module productRanker
 * @version 1.0.0
 */

import {
  scoreProducts,
  scoreProduct,
  preloadModel,
  isModelReady,
  type ProductInput,
  type ProductScore,
} from './productScorer';
import {
  getCachedScore,
  getAllCachedScores,
  getCacheStats,
  type CachedProductScore,
} from './aiCache';

// ============================================================================
// TYPES
// ============================================================================

export interface RankedProduct extends ProductInput {
  aiScore: number;
  aiTags: string[];
  aiTier: 'Featured' | 'Trending' | 'Standard';
  rankPosition: number;
}

export interface RankingResult {
  products: RankedProduct[];
  featured: RankedProduct[];
  trending: RankedProduct[];
  standard: RankedProduct[];
  stats: RankingStats;
}

export interface RankingStats {
  totalProducts: number;
  featuredCount: number;
  trendingCount: number;
  standardCount: number;
  avgScore: number;
  processingTimeMs: number;
  modelReady: boolean;
  fromCache: number;
}

export interface RankingOptions {
  maxFeatured?: number;
  maxTrending?: number;
  includeStandard?: boolean;
  priceAnchorEnabled?: boolean;
  minScore?: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_OPTIONS: Required<RankingOptions> = {
  maxFeatured: 6,
  maxTrending: 12,
  includeStandard: true,
  priceAnchorEnabled: true,
  minScore: 0,
};

// Tier priority weights for sorting
const TIER_PRIORITY: Record<string, number> = {
  Featured: 3,
  Trending: 2,
  Standard: 1,
};

// ============================================================================
// RANKING FUNCTIONS
// ============================================================================

/**
 * Rank products using AI scoring
 */
export async function rankProducts(
  products: ProductInput[],
  options: RankingOptions = {}
): Promise<RankingResult> {
  const startTime = performance.now();
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (products.length === 0) {
    return createEmptyResult(startTime);
  }

  // Score all products
  const scores = await scoreProducts(products);
  const scoreMap = new Map(scores.map((s) => [s.productId, s]));

  // Combine products with scores
  let rankedProducts: RankedProduct[] = products.map((product, index) => {
    const score = scoreMap.get(product.id) || createDefaultScore(product.id);
    return {
      ...product,
      aiScore: score.aiScore,
      aiTags: score.aiTags,
      aiTier: score.aiTier,
      rankPosition: index,
    };
  });

  // Filter by minimum score
  if (opts.minScore > 0) {
    rankedProducts = rankedProducts.filter((p) => p.aiScore >= opts.minScore);
  }

  // Sort by tier priority, then by AI score
  rankedProducts.sort((a, b) => {
    const tierDiff = TIER_PRIORITY[b.aiTier] - TIER_PRIORITY[a.aiTier];
    if (tierDiff !== 0) return tierDiff;
    return b.aiScore - a.aiScore;
  });

  // Apply price anchoring if enabled
  if (opts.priceAnchorEnabled) {
    rankedProducts = applyPriceAnchoring(rankedProducts);
  }

  // Update rank positions
  rankedProducts.forEach((p, i) => {
    p.rankPosition = i;
  });

  // Split into tiers
  const featured = rankedProducts
    .filter((p) => p.aiTier === 'Featured')
    .slice(0, opts.maxFeatured);

  const trending = rankedProducts
    .filter((p) => p.aiTier === 'Trending')
    .slice(0, opts.maxTrending);

  const standard = opts.includeStandard
    ? rankedProducts.filter((p) => p.aiTier === 'Standard')
    : [];

  // Calculate stats
  const avgScore =
    rankedProducts.length > 0
      ? rankedProducts.reduce((sum, p) => sum + p.aiScore, 0) / rankedProducts.length
      : 0;

  const cacheStats = getCacheStats();
  const processingTimeMs = performance.now() - startTime;

  return {
    products: rankedProducts,
    featured,
    trending,
    standard,
    stats: {
      totalProducts: rankedProducts.length,
      featuredCount: featured.length,
      trendingCount: trending.length,
      standardCount: standard.length,
      avgScore: Math.round(avgScore * 100) / 100,
      processingTimeMs: Math.round(processingTimeMs),
      modelReady: isModelReady(),
      fromCache: cacheStats.size,
    },
  };
}

/**
 * Get AI picks - top featured products for hero section
 */
export async function getAIPicks(
  products: ProductInput[],
  count: number = 4
): Promise<RankedProduct[]> {
  const result = await rankProducts(products, {
    maxFeatured: count,
    maxTrending: 0,
    includeStandard: false,
    minScore: 0.5,
  });

  // If not enough featured, include trending
  if (result.featured.length < count) {
    const trendingResult = await rankProducts(products, {
      maxFeatured: 0,
      maxTrending: count - result.featured.length,
      includeStandard: false,
    });
    return [...result.featured, ...trendingResult.trending].slice(0, count);
  }

  return result.featured;
}

/**
 * Get curated carousel products
 */
export async function getCuratedCarousel(
  products: ProductInput[],
  count: number = 8
): Promise<RankedProduct[]> {
  const result = await rankProducts(products, {
    maxFeatured: Math.ceil(count / 2),
    maxTrending: Math.floor(count / 2),
    includeStandard: false,
  });

  // Interleave featured and trending for variety
  const interleaved: RankedProduct[] = [];
  const maxLen = Math.max(result.featured.length, result.trending.length);

  for (let i = 0; i < maxLen && interleaved.length < count; i++) {
    if (i < result.featured.length) {
      interleaved.push(result.featured[i]);
    }
    if (i < result.trending.length && interleaved.length < count) {
      interleaved.push(result.trending[i]);
    }
  }

  return interleaved;
}

/**
 * Get products for grid display with AI sorting
 */
export async function getGridProducts(
  products: ProductInput[],
  options?: RankingOptions
): Promise<RankedProduct[]> {
  const result = await rankProducts(products, options);
  return result.products;
}

/**
 * Quick rank - uses cache when available, no model load
 */
export function quickRank(products: ProductInput[]): RankedProduct[] {
  const cachedScores = getAllCachedScores();
  const scoreMap = new Map(cachedScores.map((s) => [s.productId, s]));

  const ranked: RankedProduct[] = products.map((product, index) => {
    const cached = scoreMap.get(product.id);
    return {
      ...product,
      aiScore: cached?.aiScore ?? 0.5,
      aiTags: cached?.aiTags ?? ['Quality'],
      aiTier: cached?.aiTier ?? 'Standard',
      rankPosition: index,
    };
  });

  // Sort by cached scores
  ranked.sort((a, b) => {
    const tierDiff = TIER_PRIORITY[b.aiTier] - TIER_PRIORITY[a.aiTier];
    if (tierDiff !== 0) return tierDiff;
    return b.aiScore - a.aiScore;
  });

  ranked.forEach((p, i) => {
    p.rankPosition = i;
  });

  return ranked;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Apply price anchoring to improve perceived value
 * Places high-value items near premium items
 */
function applyPriceAnchoring(products: RankedProduct[]): RankedProduct[] {
  if (products.length < 4) return products;

  const result = [...products];
  const highValue = products.filter((p) => p.aiTags.includes('High Value'));
  const premium = products.filter((p) => p.aiTags.includes('Premium Pick'));

  // Insert high-value items after premium items
  if (premium.length > 0 && highValue.length > 0) {
    const premiumIndices = premium.map((p) =>
      result.findIndex((r) => r.id === p.id)
    );

    highValue.forEach((hv, i) => {
      if (i < premiumIndices.length) {
        const currentIndex = result.findIndex((r) => r.id === hv.id);
        const targetIndex = premiumIndices[i] + 1;

        if (currentIndex !== -1 && currentIndex !== targetIndex) {
          // Move high-value item after premium
          result.splice(currentIndex, 1);
          const insertAt = targetIndex > currentIndex ? targetIndex - 1 : targetIndex;
          result.splice(Math.min(insertAt, result.length), 0, hv);
        }
      }
    });
  }

  return result;
}

/**
 * Create default score for unscored products
 */
function createDefaultScore(productId: string): ProductScore {
  return {
    productId,
    aiScore: 0.5,
    aiTags: ['Quality'],
    aiTier: 'Standard',
    confidence: 0,
  };
}

/**
 * Create empty ranking result
 */
function createEmptyResult(startTime: number): RankingResult {
  return {
    products: [],
    featured: [],
    trending: [],
    standard: [],
    stats: {
      totalProducts: 0,
      featuredCount: 0,
      trendingCount: 0,
      standardCount: 0,
      avgScore: 0,
      processingTimeMs: Math.round(performance.now() - startTime),
      modelReady: isModelReady(),
      fromCache: 0,
    },
  };
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize ranker - preloads model for faster first ranking
 */
export async function initializeRanker(): Promise<boolean> {
  try {
    await preloadModel();
    console.log('✅ Product Ranker initialized');
    return true;
  } catch (error) {
    console.warn('⚠️ Product Ranker initialization failed, using fallback:', error);
    return false;
  }
}

/**
 * Check ranker status
 */
export function getRankerStatus(): {
  ready: boolean;
  cacheSize: number;
} {
  const stats = getCacheStats();
  return {
    ready: stats.modelLoaded,
    cacheSize: stats.size,
  };
}

export default {
  rankProducts,
  getAIPicks,
  getCuratedCarousel,
  getGridProducts,
  quickRank,
  initializeRanker,
  getRankerStatus,
};
