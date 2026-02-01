/**
 * AI Module Index - Unified exports for AI product intelligence
 * 
 * @module ai
 * @version 1.0.0
 */

// Cache
export {
  getCachedScore,
  setCachedScore,
  getAllCachedScores,
  hasCachedScores,
  getUncachedProductIds,
  clearCache,
  getCacheStats,
  batchSetScores,
  batchGetScores,
  type CachedProductScore,
} from './aiCache';

// Scorer
export {
  scoreProduct,
  scoreProducts,
  preloadModel,
  isModelReady,
  getScoringStatus,
  type ProductInput,
  type ProductScore,
} from './productScorer';

// Ranker
export {
  rankProducts,
  getAIPicks,
  getCuratedCarousel,
  getGridProducts,
  quickRank,
  initializeRanker,
  getRankerStatus,
  type RankedProduct,
  type RankingResult,
  type RankingStats,
  type RankingOptions,
} from './productRanker';
