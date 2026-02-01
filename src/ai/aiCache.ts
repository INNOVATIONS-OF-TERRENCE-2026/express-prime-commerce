/**
 * AI Cache Module - Session-based memoization for AI inference results
 * 
 * Prevents redundant model inference by caching results per product ID.
 * Cache persists for the browser session only.
 * 
 * @module aiCache
 * @version 1.0.0
 */

// ============================================================================
// TYPES
// ============================================================================

export interface CachedProductScore {
  productId: string;
  aiScore: number;
  aiTags: string[];
  aiTier: 'Featured' | 'Trending' | 'Standard';
  embedding?: number[];
  timestamp: number;
}

interface CacheStore {
  scores: Map<string, CachedProductScore>;
  modelLoaded: boolean;
  modelLoadPromise: Promise<void> | null;
}

// ============================================================================
// CACHE STORE
// ============================================================================

const cache: CacheStore = {
  scores: new Map(),
  modelLoaded: false,
  modelLoadPromise: null,
};

// Cache TTL: 30 minutes (in milliseconds)
const CACHE_TTL = 30 * 60 * 1000;

// ============================================================================
// CACHE OPERATIONS
// ============================================================================

/**
 * Get cached score for a product
 */
export function getCachedScore(productId: string): CachedProductScore | null {
  const cached = cache.scores.get(productId);
  
  if (!cached) return null;
  
  // Check if cache is stale
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    cache.scores.delete(productId);
    return null;
  }
  
  return cached;
}

/**
 * Set cached score for a product
 */
export function setCachedScore(
  productId: string,
  score: Omit<CachedProductScore, 'timestamp'>
): void {
  cache.scores.set(productId, {
    ...score,
    timestamp: Date.now(),
  });
}

/**
 * Get all cached scores
 */
export function getAllCachedScores(): CachedProductScore[] {
  const now = Date.now();
  const results: CachedProductScore[] = [];
  
  cache.scores.forEach((value, key) => {
    if (now - value.timestamp <= CACHE_TTL) {
      results.push(value);
    } else {
      cache.scores.delete(key);
    }
  });
  
  return results;
}

/**
 * Check if scores are cached for product IDs
 */
export function hasCachedScores(productIds: string[]): boolean {
  return productIds.every((id) => getCachedScore(id) !== null);
}

/**
 * Get uncached product IDs from a list
 */
export function getUncachedProductIds(productIds: string[]): string[] {
  return productIds.filter((id) => getCachedScore(id) === null);
}

/**
 * Clear all cached scores
 */
export function clearCache(): void {
  cache.scores.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  size: number;
  hitRate: number;
  modelLoaded: boolean;
} {
  return {
    size: cache.scores.size,
    hitRate: cache.scores.size > 0 ? 1 : 0,
    modelLoaded: cache.modelLoaded,
  };
}

// ============================================================================
// MODEL STATE MANAGEMENT
// ============================================================================

/**
 * Set model loaded state
 */
export function setModelLoaded(loaded: boolean): void {
  cache.modelLoaded = loaded;
}

/**
 * Check if model is loaded
 */
export function isModelLoaded(): boolean {
  return cache.modelLoaded;
}

/**
 * Set model loading promise (for deduplication)
 */
export function setModelLoadPromise(promise: Promise<void> | null): void {
  cache.modelLoadPromise = promise;
}

/**
 * Get model loading promise
 */
export function getModelLoadPromise(): Promise<void> | null {
  return cache.modelLoadPromise;
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Batch set scores for multiple products
 */
export function batchSetScores(
  scores: Array<Omit<CachedProductScore, 'timestamp'>>
): void {
  const timestamp = Date.now();
  scores.forEach((score) => {
    cache.scores.set(score.productId, { ...score, timestamp });
  });
}

/**
 * Batch get scores for multiple products
 */
export function batchGetScores(
  productIds: string[]
): Map<string, CachedProductScore | null> {
  const results = new Map<string, CachedProductScore | null>();
  productIds.forEach((id) => {
    results.set(id, getCachedScore(id));
  });
  return results;
}

export default {
  getCachedScore,
  setCachedScore,
  getAllCachedScores,
  hasCachedScores,
  getUncachedProductIds,
  clearCache,
  getCacheStats,
  setModelLoaded,
  isModelLoaded,
  setModelLoadPromise,
  getModelLoadPromise,
  batchSetScores,
  batchGetScores,
};
