/**
 * AI Module Index - Unified exports for AI product intelligence
 * 
 * COMPLETE AI INTELLIGENCE LAYER
 * Self-optimizing, AI-driven storefront intelligence
 * 
 * @module ai
 * @version 3.0.0 - Commerce Intelligence Edition
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
// BUYER INTENT PREDICTION (NEW)
// ============================================================================

export {
  recordHoverStart,
  recordHoverEnd,
  recordViewStart,
  recordViewEnd,
  recordClick as recordIntentClick,
  recordScroll,
  recordCartHover,
  recordCheckoutStart,
  recordCheckoutAbandon,
  getIntentProfile,
  getIntentProbability,
  getHighIntentProducts,
  getSessionIntent,
  getNudgeRecommendation,
  applyDecay,
  configure as configureIntent,
  resetIntentData,
  getIntentStats,
  startDecayTimer,
  stopDecayTimer,
  type BehaviorSignal,
  type IntentProfile,
  type IntentStage,
  type NudgeType,
  type IntentConfig,
  type SessionIntent,
} from './buyerIntent';

// ============================================================================
// CONVERSION HEATMAP (NEW)
// ============================================================================

export {
  registerZone,
  unregisterZone,
  recordImpression as recordZoneImpression,
  recordClick as recordZoneClick,
  recordHover as recordZoneHover,
  recordScrollDepth,
  recordExit as recordZoneExit,
  recordConversion as recordZoneConversion,
  getZone,
  getAllZones,
  getHeatmapSnapshot,
  identifyFrictionPoints as getFrictionPoints,
  getTopPerformers as getTopPerformingZones,
  getUnderperformers as getUnderperformingZones,
  getScrollDepthData,
  getZonesByHeat,
  getHeatColor,
  configure as configureHeatmap,
  startSession as startHeatmapSession,
  type HeatZone,
  type ZoneMetrics,
  type HeatLevel,
  type ScrollDepthData,
  type FrictionPoint,
  type FrictionType,
  type HeatmapSnapshot,
  type HeatmapConfig,
} from './conversionHeatmap';

// ============================================================================
// PRODUCT NAMING OPTIMIZER (NEW)
// ============================================================================

export {
  analyzeTitle as analyzeProductName,
  batchAnalyzeTitles as batchAnalyzeNames,
  getQuickTitleScore as scoreTitleQuality,
  getProductsNeedingImprovement,
  preloadModel as preloadNamingModel,
  isModelReady as isNamingModelReady,
  configure as configureNaming,
  clearCache as clearNamingCache,
  getNamingStats,
  type NamingAnalysis,
  type TitleSuggestion,
  type SuggestionType,
  type ExtractedKeyword,
  type NamingIssue,
  type IssueType,
  type NamingConfig,
  type CategorySemantics,
} from './productNaming';

// ============================================================================
// BRAND TRUST SCORING (NEW)
// ============================================================================

export {
  calculateTrustScore,
  batchCalculateTrustScores,
  getTrustScore,
  getVerifiedPicks,
  getProductsByTier,
  getProductsWithConcerns,
  getTrustTierColor,
  getTrustBadgeIcon,
  configure as configureTrust,
  clearCache as clearTrustCache,
  getTrustStats,
  type TrustScore,
  type TrustSignals,
  type TrustTier,
  type TrustBadge,
  type TrustConcern,
  type ConcernType,
  type ProductTrustInput,
  type TrustConfig,
} from './brandTrust';

// ============================================================================
// STORE VALUATION ENGINE (NEW)
// ============================================================================

export {
  calculateValuation as calculateStoreValuation,
  getLastValuation,
  getQuickValuation,
  formatValuation,
  getGradeColor as getValuationGradeColor,
  configure as configureValuation,
  exportValuationReport,
  type StoreValuation,
  type ValuationMetrics,
  type StoreHealth,
  type StoreGrade,
  type GrowthTrajectory,
  type MarketComparable,
  type PitchDeckMetrics,
  type ValuationInput,
  type ProductValuationData,
} from './storeValuation';

// ============================================================================
// STORE IQ SCORE SYSTEM (NEW)
// ============================================================================

export {
  calculateStoreIQ,
  generateMockInputData,
  getCalculationStatus,
  invalidateCache,
  calculateDemandIntelligence,
  calculateConversionIntelligence,
  calculateProductIntelligence,
  calculateTrustIntelligence,
  calculateOperationalIntelligence,
  calculateScaleIntelligence,
  type StoreIQOutput,
  type StoreIQInputData,
  type DimensionBreakdown,
  type DemandIntelligence,
  type ConversionIntelligence,
  type ProductIntelligence,
  type TrustIntelligence,
  type OperationalIntelligence,
  type ScaleIntelligence,
  type StoreIQGrade,
  type ProductDataPoint,
  type TrendingDataPoint,
  type CartDataPoint,
  type OperationalMetrics,
  DIMENSION_WEIGHTS,
  SCORE_THRESHOLDS,
  getGradeFromScore,
  getGradeColor,
  getScoreStatus,
} from './storeIQ';

// ============================================================================
// ADVANCED AI MODULES (EXISTING)
// ============================================================================

// Embeddings Cache - IndexedDB persistence for embeddings
export {
  getEmbedding,
  setEmbedding,
  batchGetEmbeddings,
  batchSetEmbeddings,
  cleanupCache,
  clearCache as clearAllEmbeddings,
  getCacheStats,
  hasEmbedding,
  getCachedProductIds,
  type EmbeddingEntry,
  type CacheStats as EmbeddingCacheStats,
} from './embeddingsCache';

// Trending Detector - Velocity-based trending detection
export {
  recordImpression,
  recordClick,
  recordAddToCart,
  getTrendingSignal,
  getTopTrending,
  getAllTrendingSignals as getAllTrends,
  getStats as getTrendingStatus,
  reset as resetTrendingData,
  configure as configureTrending,
  type TrendingSignal,
  type TrendingConfig,
} from './trendingDetector';

// Price Sensitivity - AI-driven price perception
export {
  analyzePriceSensitivity,
  batchAnalyzePriceSensitivity,
  getUndervaluedProducts,
  getPriceClusters,
  preloadModel as preloadPriceModel,
  isModelReady as isPriceModelReady,
  type PriceSensitivityResult,
  type PriceCluster,
} from './priceSensitivity';

// Visual Saliency - CLIP-based image scoring
export {
  analyzeVisualSaliency,
  batchAnalyzeVisualSaliency,
  getHeroImages,
  preloadModel as preloadVisualModel,
  isModelReady as isVisualModelReady,
  type VisualSaliencyResult,
} from './visualSaliency';

// Smart Collections - Self-organizing product groups
export {
  generateSmartCollections,
  getAllSmartCollections,
  getSmartCollection,
  findSimilarProducts,
  refreshCollection,
  getStats as getCollectionStats,
  type SmartCollection,
  type SmartCollectionProduct,
  type CollectionGenerationConfig,
} from './smartCollections';

// Storefront Autopilot - Master orchestration
export {
  runAutopilot,
  configureAutopilot,
  getAutopilotStats,
  recordProductImpression,
  recordProductClick,
  type AutopilotDecisions,
  type AutopilotConfig,
  type AutopilotStats,
  type AutopilotBadge,
  type AutopilotProduct,
} from './storefrontAutopilot';

// Re-export ProductBadge as alias
export type { AutopilotBadge as ProductBadge } from './storefrontAutopilot';

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
// PROFIT GOVERNOR - AUTONOMOUS PROFIT INTELLIGENCE (NEW)
// ============================================================================

export {
  // Margin Intelligence
  calculateProductMargin,
  // Price Elasticity (Recommendations Only)
  analyzePriceElasticity,
  // Profit Weighting
  calculateProfitWeight,
  getProfitOptimizedRecommendations,
  // Loss Detection
  detectLossLeak,
  getAllLossLeaks,
  // Guardrails
  evaluateGuardrail,
  getGuardrailRejections,
  // Executive Outputs
  calculateProfitHealthScore,
  generateProfitForecast,
  // Logging
  logDecision as logGovernorDecision,
  getDecisionLog as getGovernorDecisionLog,
  // Config
  configure as configureGovernor,
  getConfig as getGovernorConfig,
  getGovernorStats,
  generateMockGovernorData,
  // Types
  type MarginRiskLevel,
  type LeakType,
  type GuardrailAction,
  type ProductMarginAnalysis,
  type PriceElasticityAnalysis,
  type ProfitWeightedProduct,
  type LossLeak,
  type GuardrailDecision,
  type ProfitHealthScore,
  type ProfitForecast,
  type GovernorConfig,
  type GovernorDecisionLog,
} from './profitGovernor';

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

// Default export for easy importing
import aiBootstrap from './aiBootstrap';
export default aiBootstrap;
