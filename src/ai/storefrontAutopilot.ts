/**
 * Storefront Autopilot - Zero-Touch AI Merchandising Engine
 * 
 * The FINAL AUTHORITY on frontend product ordering and presentation.
 * Orchestrates all AI subsystems to deliver autonomous merchandising.
 * 
 * Responsibilities:
 * - Hero product selection
 * - Featured section curation
 * - Carousel intelligence
 * - Badge assignment
 * - Real-time grid re-ranking
 * - Graceful failure handling
 * 
 * @module storefrontAutopilot
 * @version 1.0.0
 */

import { type ProductInput, type ProductScore, scoreProduct, scoreProducts } from './productScorer';
import { type RankedProduct, rankProducts, type RankingResult } from './productRanker';
import {
  getTrendingSignal,
  recordImpression,
  recordClick,
  initializeProducts,
  getTopTrending,
  type TrendingSignal,
} from './trendingDetector';
import {
  analyzePriceSensitivity,
  getUndervaluedProducts,
  type PriceSensitivityResult,
} from './priceSensitivity';
import {
  analyzeVisualSaliency,
  type VisualSaliencyResult,
} from './visualSaliency';
import {
  generateSmartCollections,
  getAllSmartCollections,
  type SmartCollection,
} from './smartCollections';
import { cleanupCache, getCacheStats } from './embeddingsCache';

// ============================================================================
// TYPES
// ============================================================================

export interface AutopilotProduct extends ProductInput {
  // AI Scores
  aiScore: number;
  aiTier: 'Featured' | 'Trending' | 'Standard';
  aiTags: string[];
  
  // Trending
  trendScore: number;
  trendStatus: 'Exploding' | 'Rising' | 'Stable' | 'Cooling';
  
  // Price
  priceEfficiency: number;
  valueCategory: 'Undervalued' | 'Fair' | 'Premium-Justified' | 'Impulse-Buy';
  
  // Visual
  visualScore: number;
  visualTier: 'Hero' | 'Strong' | 'Standard';
  
  // Final Rankings
  heroScore: number;
  featuredScore: number;
  gridPosition: number;
  
  // Badges to display
  badges: AutopilotBadge[];
}

export interface AutopilotBadge {
  type: 'ai-pick' | 'trending' | 'best-value' | 'premium' | 'new' | 'deal' | 'hot';
  label: string;
  priority: number;
  icon: string;
}

export interface AutopilotDecisions {
  hero: AutopilotProduct[];
  featured: AutopilotProduct[];
  carousel: AutopilotProduct[];
  grid: AutopilotProduct[];
  collections: SmartCollection[];
  stats: AutopilotStats;
}

export interface AutopilotStats {
  totalProducts: number;
  aiProcessed: number;
  heroCount: number;
  featuredCount: number;
  trendingCount: number;
  processingTimeMs: number;
  modelStatus: {
    scorer: boolean;
    trending: boolean;
    price: boolean;
    visual: boolean;
    collections: boolean;
  };
  cacheStats: {
    size: number;
    hitRate: number;
  };
}

export interface AutopilotConfig {
  heroCount: number;
  featuredCount: number;
  carouselCount: number;
  enableVisualAnalysis: boolean;
  enablePriceAnalysis: boolean;
  enableTrending: boolean;
  enableCollections: boolean;
  fallbackMode: 'deterministic' | 'random';
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_CONFIG: AutopilotConfig = {
  heroCount: 4,
  featuredCount: 8,
  carouselCount: 12,
  enableVisualAnalysis: false, // Expensive, disabled by default
  enablePriceAnalysis: true,
  enableTrending: true,
  enableCollections: true,
  fallbackMode: 'deterministic',
};

const BADGE_CONFIG: Record<string, AutopilotBadge> = {
  'ai-pick': {
    type: 'ai-pick',
    label: 'AI Pick',
    priority: 1,
    icon: '🤖',
  },
  trending: {
    type: 'trending',
    label: 'Trending',
    priority: 2,
    icon: '🔥',
  },
  'best-value': {
    type: 'best-value',
    label: 'Best Value',
    priority: 3,
    icon: '💎',
  },
  premium: {
    type: 'premium',
    label: 'Premium',
    priority: 4,
    icon: '✨',
  },
  deal: {
    type: 'deal',
    label: 'Deal',
    priority: 5,
    icon: '🏷️',
  },
  hot: {
    type: 'hot',
    label: 'Hot',
    priority: 6,
    icon: '🚀',
  },
};

// ============================================================================
// STATE
// ============================================================================

let config = { ...DEFAULT_CONFIG };
let lastDecisions: AutopilotDecisions | null = null;
let isProcessing = false;
let lastProcessTime = 0;

// ============================================================================
// CORE PROCESSING
// ============================================================================

/**
 * Process a single product through all AI systems
 */
async function processProduct(
  product: ProductInput,
  imageUrl?: string
): Promise<AutopilotProduct> {
  // Base AI scoring
  const aiScore = await scoreProduct(product);
  
  // Trending signal
  const trendingSignal = getTrendingSignal(product.id);
  
  // Price analysis (if enabled)
  let priceAnalysis: PriceSensitivityResult | null = null;
  if (config.enablePriceAnalysis) {
    try {
      priceAnalysis = await analyzePriceSensitivity({
        id: product.id,
        title: product.title,
        description: product.description,
        price: product.price,
        compareAtPrice: product.compare_at_price,
        productType: product.product_type,
        vendor: product.vendor,
        tags: product.tags,
      });
    } catch {
      // Ignore errors
    }
  }
  
  // Visual analysis (if enabled and image available)
  let visualAnalysis: VisualSaliencyResult | null = null;
  if (config.enableVisualAnalysis && imageUrl) {
    try {
      visualAnalysis = await analyzeVisualSaliency(product.id, imageUrl);
    } catch {
      // Ignore errors
    }
  }
  
  // Calculate composite scores
  const heroScore = calculateHeroScore(aiScore, trendingSignal, priceAnalysis, visualAnalysis);
  const featuredScore = calculateFeaturedScore(aiScore, trendingSignal, priceAnalysis);
  
  // Determine badges
  const badges = determineBadges(aiScore, trendingSignal, priceAnalysis, product);
  
  return {
    ...product,
    aiScore: aiScore.aiScore,
    aiTier: aiScore.aiTier,
    aiTags: aiScore.aiTags,
    trendScore: trendingSignal?.trendScore ?? 0.5,
    trendStatus: trendingSignal?.trendStatus ?? 'Stable',
    priceEfficiency: priceAnalysis?.priceEfficiency ?? 0.5,
    valueCategory: priceAnalysis?.valueCategory ?? 'Fair',
    visualScore: visualAnalysis?.visualScore ?? 0.5,
    visualTier: visualAnalysis?.visualTier ?? 'Standard',
    heroScore,
    featuredScore,
    gridPosition: 0, // Will be set during ranking
    badges,
  };
}

/**
 * Calculate hero placement score
 */
function calculateHeroScore(
  aiScore: ProductScore,
  trending: TrendingSignal | null,
  price: PriceSensitivityResult | null,
  visual: VisualSaliencyResult | null
): number {
  let score = aiScore.aiScore * 0.4;
  
  // Trending boost
  if (trending) {
    if (trending.trendStatus === 'Exploding') score += 0.25;
    else if (trending.trendStatus === 'Rising') score += 0.15;
  }
  
  // Value boost
  if (price) {
    if (price.valueCategory === 'Undervalued') score += 0.15;
    else if (price.valueCategory === 'Impulse-Buy') score += 0.1;
  }
  
  // Visual boost
  if (visual) {
    if (visual.visualTier === 'Hero') score += 0.15;
    else if (visual.visualTier === 'Strong') score += 0.05;
  }
  
  return Math.min(score, 1);
}

/**
 * Calculate featured placement score
 */
function calculateFeaturedScore(
  aiScore: ProductScore,
  trending: TrendingSignal | null,
  price: PriceSensitivityResult | null
): number {
  let score = aiScore.aiScore * 0.5;
  
  // Trending boost
  if (trending && trending.trendScore > 0.5) {
    score += trending.trendScore * 0.25;
  }
  
  // Price efficiency boost
  if (price) {
    score += price.priceEfficiency * 0.25;
  }
  
  return Math.min(score, 1);
}

/**
 * Determine badges for a product
 */
function determineBadges(
  aiScore: ProductScore,
  trending: TrendingSignal | null,
  price: PriceSensitivityResult | null,
  product: ProductInput
): AutopilotBadge[] {
  const badges: AutopilotBadge[] = [];
  
  // AI Pick badge (high AI score)
  if (aiScore.aiTier === 'Featured' || aiScore.aiScore > 0.75) {
    badges.push(BADGE_CONFIG['ai-pick']);
  }
  
  // Trending badge
  if (trending?.trendStatus === 'Exploding') {
    badges.push(BADGE_CONFIG.hot);
  } else if (trending?.trendStatus === 'Rising' || trending?.trendScore > 0.6) {
    badges.push(BADGE_CONFIG.trending);
  }
  
  // Value badges
  if (price?.valueCategory === 'Undervalued') {
    badges.push(BADGE_CONFIG['best-value']);
  } else if (price?.valueCategory === 'Premium-Justified' && product.price > 100) {
    badges.push(BADGE_CONFIG.premium);
  }
  
  // Discount badge
  if (product.compare_at_price && product.compare_at_price > product.price) {
    const discount = (product.compare_at_price - product.price) / product.compare_at_price;
    if (discount > 0.2) {
      badges.push(BADGE_CONFIG.deal);
    }
  }
  
  // Sort by priority and limit
  badges.sort((a, b) => a.priority - b.priority);
  return badges.slice(0, 2);
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Run the autopilot and get all merchandising decisions
 */
export async function runAutopilot(
  products: ProductInput[],
  imageUrls?: Map<string, string>
): Promise<AutopilotDecisions> {
  if (isProcessing) {
    // Return cached decisions if processing
    if (lastDecisions) return lastDecisions;
  }
  
  isProcessing = true;
  const startTime = performance.now();
  
  try {
    // Initialize trending for all products
    if (config.enableTrending) {
      initializeProducts(products.map((p) => p.id));
    }
    
    // Process all products
    const processedProducts: AutopilotProduct[] = [];
    
    for (const product of products) {
      const imageUrl = imageUrls?.get(product.id);
      const processed = await processProduct(product, imageUrl);
      processedProducts.push(processed);
    }
    
    // Sort by hero score for hero selection
    const heroSorted = [...processedProducts].sort((a, b) => b.heroScore - a.heroScore);
    const hero = heroSorted.slice(0, config.heroCount);
    
    // Sort by featured score for featured section
    const featuredSorted = [...processedProducts].sort((a, b) => b.featuredScore - a.featuredScore);
    const featured = featuredSorted
      .filter((p) => !hero.find((h) => h.id === p.id))
      .slice(0, config.featuredCount);
    
    // Carousel - mix of trending and high value
    const carousel = [...processedProducts]
      .filter((p) => !hero.find((h) => h.id === p.id))
      .sort((a, b) => {
        const aScore = a.trendScore * 0.5 + a.priceEfficiency * 0.5;
        const bScore = b.trendScore * 0.5 + b.priceEfficiency * 0.5;
        return bScore - aScore;
      })
      .slice(0, config.carouselCount);
    
    // Grid - full product list with AI ranking
    const grid = [...processedProducts]
      .sort((a, b) => b.aiScore - a.aiScore)
      .map((p, i) => ({ ...p, gridPosition: i }));
    
    // Generate smart collections
    let collections: SmartCollection[] = [];
    if (config.enableCollections) {
      try {
        collections = await generateSmartCollections(products);
      } catch {
        // Collections failed, continue without them
      }
    }
    
    // Build stats
    const processingTimeMs = performance.now() - startTime;
    const cacheStats = await getCacheStats();
    
    const stats: AutopilotStats = {
      totalProducts: products.length,
      aiProcessed: processedProducts.length,
      heroCount: hero.length,
      featuredCount: featured.length,
      trendingCount: processedProducts.filter((p) => p.trendStatus === 'Rising' || p.trendStatus === 'Exploding').length,
      processingTimeMs: Math.round(processingTimeMs),
      modelStatus: {
        scorer: true,
        trending: config.enableTrending,
        price: config.enablePriceAnalysis,
        visual: config.enableVisualAnalysis,
        collections: config.enableCollections,
      },
      cacheStats: {
        size: cacheStats.totalEntries,
        hitRate: cacheStats.cacheHitRate,
      },
    };
    
    const decisions: AutopilotDecisions = {
      hero,
      featured,
      carousel,
      grid,
      collections,
      stats,
    };
    
    lastDecisions = decisions;
    lastProcessTime = Date.now();
    
    return decisions;
  } catch (error) {
    console.error('Autopilot processing failed:', error);
    
    // Return fallback decisions
    return createFallbackDecisions(products);
  } finally {
    isProcessing = false;
  }
}

/**
 * Create fallback decisions when AI fails
 */
function createFallbackDecisions(products: ProductInput[]): AutopilotDecisions {
  const fallbackProducts: AutopilotProduct[] = products.map((p, i) => ({
    ...p,
    aiScore: 0.5,
    aiTier: 'Standard' as const,
    aiTags: ['Quality'],
    trendScore: 0.5,
    trendStatus: 'Stable' as const,
    priceEfficiency: 0.5,
    valueCategory: 'Fair' as const,
    visualScore: 0.5,
    visualTier: 'Standard' as const,
    heroScore: 0.5,
    featuredScore: 0.5,
    gridPosition: i,
    badges: [],
  }));
  
  // Sort by price for deterministic fallback (deals first)
  if (config.fallbackMode === 'deterministic') {
    fallbackProducts.sort((a, b) => {
      const aDiscount = a.compare_at_price ? (a.compare_at_price - a.price) / a.compare_at_price : 0;
      const bDiscount = b.compare_at_price ? (b.compare_at_price - b.price) / b.compare_at_price : 0;
      return bDiscount - aDiscount;
    });
  }
  
  return {
    hero: fallbackProducts.slice(0, config.heroCount),
    featured: fallbackProducts.slice(config.heroCount, config.heroCount + config.featuredCount),
    carousel: fallbackProducts.slice(0, config.carouselCount),
    grid: fallbackProducts,
    collections: [],
    stats: {
      totalProducts: products.length,
      aiProcessed: 0,
      heroCount: config.heroCount,
      featuredCount: config.featuredCount,
      trendingCount: 0,
      processingTimeMs: 0,
      modelStatus: {
        scorer: false,
        trending: false,
        price: false,
        visual: false,
        collections: false,
      },
      cacheStats: { size: 0, hitRate: 0 },
    },
  };
}

/**
 * Record product impression for trending
 */
export function recordProductImpression(productId: string): void {
  if (config.enableTrending) {
    recordImpression(productId);
  }
}

/**
 * Record product click for trending
 */
export function recordProductClick(productId: string): void {
  if (config.enableTrending) {
    recordClick(productId);
  }
}

/**
 * Get hero products only
 */
export async function getHeroProducts(
  products: ProductInput[],
  count?: number
): Promise<AutopilotProduct[]> {
  const decisions = await runAutopilot(products);
  return decisions.hero.slice(0, count ?? config.heroCount);
}

/**
 * Get featured products only
 */
export async function getFeaturedProducts(
  products: ProductInput[],
  count?: number
): Promise<AutopilotProduct[]> {
  const decisions = await runAutopilot(products);
  return decisions.featured.slice(0, count ?? config.featuredCount);
}

/**
 * Get carousel products only
 */
export async function getCarouselProducts(
  products: ProductInput[],
  count?: number
): Promise<AutopilotProduct[]> {
  const decisions = await runAutopilot(products);
  return decisions.carousel.slice(0, count ?? config.carouselCount);
}

/**
 * Get grid products (full sorted list)
 */
export async function getGridProducts(
  products: ProductInput[]
): Promise<AutopilotProduct[]> {
  const decisions = await runAutopilot(products);
  return decisions.grid;
}

/**
 * Get smart collections
 */
export async function getSmartCollections(
  products: ProductInput[]
): Promise<SmartCollection[]> {
  const decisions = await runAutopilot(products);
  return decisions.collections;
}

/**
 * Get last autopilot stats
 */
export function getAutopilotStats(): AutopilotStats | null {
  return lastDecisions?.stats ?? null;
}

/**
 * Configure autopilot
 */
export function configureAutopilot(newConfig: Partial<AutopilotConfig>): void {
  config = { ...config, ...newConfig };
}

/**
 * Reset autopilot state
 */
export function resetAutopilot(): void {
  lastDecisions = null;
  lastProcessTime = 0;
}

/**
 * Clean up cache
 */
export async function cleanupAutopilot(): Promise<void> {
  await cleanupCache();
}

/**
 * Check if autopilot has cached decisions
 */
export function hasCachedDecisions(): boolean {
  return lastDecisions !== null;
}

/**
 * Get cached decisions without reprocessing
 */
export function getCachedDecisions(): AutopilotDecisions | null {
  return lastDecisions;
}

export default {
  runAutopilot,
  recordProductImpression,
  recordProductClick,
  getHeroProducts,
  getFeaturedProducts,
  getCarouselProducts,
  getGridProducts,
  getSmartCollections,
  getAutopilotStats,
  configureAutopilot,
  resetAutopilot,
  cleanupAutopilot,
  hasCachedDecisions,
  getCachedDecisions,
};
