/**
 * AI Module Index - Unified exports for AI product intelligence
 * 
 * COMPLETE AI INTELLIGENCE LAYER
 * Self-optimizing, AI-driven storefront intelligence
 * 
 * @module ai
 * @version 2.0.0
 */

// ============================================================================
// CORE AI MODULES
// ============================================================================

// Cache - In-memory session scoring cache
export {
  getCachedScore,
  setCachedScore,
  getAllCachedScores,
  hasCachedScores,
  getUncachedProductIds,
  clearCache,
  getCacheStats as getScoreCacheStats,
  batchSetScores,
  batchGetScores,
  type CachedProductScore,
} from './aiCache';

// Scorer - ML-based product scoring
export {
  scoreProduct,
  scoreProducts,
  preloadModel,
  isModelReady,
  getScoringStatus,
  type ProductInput,
  type ProductScore,
} from './productScorer';

// Ranker - Product ranking and selection
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

// ============================================================================
// ADVANCED AI MODULES
// ============================================================================

// Embeddings Cache - IndexedDB persistence for embeddings
export {
  getEmbedding,
  setEmbedding,
  batchGetEmbeddings,
  batchSetEmbeddings,
  deleteEmbedding,
  cleanupCache,
  getCacheStats,
  clearAllEmbeddings,
  type EmbeddingEntry,
  type EmbeddingCacheStats,
} from './embeddingsCache';

// Trending Detector - Velocity-based trending detection
export {
  recordImpression,
  recordClick,
  recordAddToCart,
  getTrendingSignal,
  getTopTrending,
  getAllTrends,
  getTrendingStatus,
  resetTrendingData,
  configure as configureTrending,
  type TrendingSignal,
  type TrendStatus,
  type TrendingConfig,
} from './trendingDetector';

// Price Sensitivity - AI-driven price perception
export {
  analyzePriceSensitivity,
  batchAnalyzePriceSensitivity,
  getUndervaluedProducts,
  getPriceEfficiency,
  determinePriceTier,
  preloadModel as preloadPriceModel,
  isModelReady as isPriceModelReady,
  type PriceSensitivityResult,
  type PriceTier,
  type ValueCategory,
} from './priceSensitivity';

// Visual Saliency - CLIP-based image scoring
export {
  analyzeVisualSaliency,
  batchAnalyzeVisualSaliency,
  getHeroImages,
  getVisualScore,
  preloadModel as preloadVisualModel,
  isModelReady as isVisualModelReady,
  type VisualSaliencyResult,
  type VisualTier,
} from './visualSaliency';

// Smart Collections - Self-organizing product groups
export {
  generateSmartCollections,
  getAllSmartCollections,
  getSmartCollection,
  findSimilarProducts,
  regenerateCollections,
  getCollectionStats,
  type SmartCollection,
  type CollectionProduct,
  type CollectionTemplate,
} from './smartCollections';

// Storefront Autopilot - Master orchestration
export {
  runAutopilot,
  configureAutopilot,
  getAutopilotStatus,
  recordProductImpression,
  recordProductClick,
  recordProductAddToCart,
  assignBadges,
  type AutopilotDecisions,
  type AutopilotConfig,
  type AutopilotStats,
  type ProductBadge,
} from './storefrontAutopilot';

// AI Bootstrap - Initialization & coordination
export {
  bootstrapAI,
  quickBootstrap,
  fullBootstrap,
  isAIInitialized,
  getAIStatus,
  getAICapabilities,
  resetAI,
  warmupAI,
  useAIBootstrap,
  type AIBootstrapConfig,
  type AILoadingProgress,
  type AISystemStatus,
  type AICapabilities,
} from './aiBootstrap';

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

// Default export for easy importing
import aiBootstrap from './aiBootstrap';
export default aiBootstrap;
