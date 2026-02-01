/**
 * AI Bootstrap - Initialization & Coordination for All AI Systems
 * 
 * Orchestrates the loading and initialization of all AI modules.
 * Provides a single entry point for the AI intelligence layer.
 * 
 * @module aiBootstrap
 * @version 1.0.0
 */

import { preloadModel as preloadScorer, isModelReady as isScorerReady } from './productScorer';
import { preloadModel as preloadPrice, isModelReady as isPriceReady } from './priceSensitivity';
import { preloadModel as preloadVisual, isModelReady as isVisualReady } from './visualSaliency';
import { isModelReady as isCollectionsReady } from './smartCollections';
import { configureAutopilot, type AutopilotConfig } from './storefrontAutopilot';
import { cleanupCache, getCacheStats } from './embeddingsCache';
import { configure as configureTrending, type TrendingConfig } from './trendingDetector';

// ============================================================================
// TYPES
// ============================================================================

export interface AIBootstrapConfig {
  preloadModels: boolean;
  preloadScorer: boolean;
  preloadPrice: boolean;
  preloadVisual: boolean;
  autopilot: Partial<AutopilotConfig>;
  trending: Partial<TrendingConfig>;
  onProgress?: (progress: AILoadingProgress) => void;
  onComplete?: (status: AISystemStatus) => void;
  onError?: (error: Error) => void;
}

export interface AILoadingProgress {
  stage: 'initializing' | 'loading-scorer' | 'loading-price' | 'loading-visual' | 'finalizing' | 'complete';
  percent: number;
  message: string;
}

export interface AISystemStatus {
  initialized: boolean;
  scorer: boolean;
  price: boolean;
  visual: boolean;
  collections: boolean;
  trending: boolean;
  cacheSize: number;
  loadTimeMs: number;
}

export interface AICapabilities {
  productScoring: boolean;
  productRanking: boolean;
  trendDetection: boolean;
  priceAnalysis: boolean;
  visualAnalysis: boolean;
  smartCollections: boolean;
  storefrontAutopilot: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_CONFIG: AIBootstrapConfig = {
  preloadModels: true,
  preloadScorer: true,
  preloadPrice: true,
  preloadVisual: false, // Expensive, disabled by default
  autopilot: {},
  trending: {},
};

// ============================================================================
// STATE
// ============================================================================

let isInitialized = false;
let initPromise: Promise<AISystemStatus> | null = null;
let systemStatus: AISystemStatus = {
  initialized: false,
  scorer: false,
  price: false,
  visual: false,
  collections: false,
  trending: true, // Always available (no model needed)
  cacheSize: 0,
  loadTimeMs: 0,
};

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Report loading progress
 */
function reportProgress(
  config: AIBootstrapConfig,
  stage: AILoadingProgress['stage'],
  percent: number,
  message: string
): void {
  config.onProgress?.({
    stage,
    percent,
    message,
  });
}

/**
 * Initialize the AI system
 */
async function initializeAI(
  config: AIBootstrapConfig
): Promise<AISystemStatus> {
  const startTime = performance.now();

  try {
    reportProgress(config, 'initializing', 0, 'Starting AI systems...');

    // Configure subsystems
    if (Object.keys(config.autopilot).length > 0) {
      configureAutopilot(config.autopilot);
    }
    if (Object.keys(config.trending).length > 0) {
      configureTrending(config.trending);
    }

    // Load models
    if (config.preloadModels) {
      // Scorer (primary model)
      if (config.preloadScorer) {
        reportProgress(config, 'loading-scorer', 20, 'Loading product intelligence...');
        try {
          await preloadScorer();
          systemStatus.scorer = true;
        } catch (error) {
          console.warn('Scorer preload failed:', error);
        }
      }

      // Price sensitivity
      if (config.preloadPrice) {
        reportProgress(config, 'loading-price', 50, 'Loading price intelligence...');
        try {
          await preloadPrice();
          systemStatus.price = true;
        } catch (error) {
          console.warn('Price model preload failed:', error);
        }
      }

      // Visual analysis
      if (config.preloadVisual) {
        reportProgress(config, 'loading-visual', 70, 'Loading visual intelligence...');
        try {
          await preloadVisual();
          systemStatus.visual = true;
        } catch (error) {
          console.warn('Visual model preload failed:', error);
        }
      }
    }

    // Finalize
    reportProgress(config, 'finalizing', 90, 'Finalizing AI systems...');

    // Get cache stats
    const cacheStats = await getCacheStats();
    systemStatus.cacheSize = cacheStats.totalEntries;

    // Update status
    systemStatus.initialized = true;
    systemStatus.collections = systemStatus.scorer; // Depends on scorer
    systemStatus.loadTimeMs = Math.round(performance.now() - startTime);

    isInitialized = true;

    reportProgress(config, 'complete', 100, 'AI systems ready');
    config.onComplete?.(systemStatus);

    console.log('✅ AI Bootstrap complete:', systemStatus);

    return systemStatus;
  } catch (error) {
    console.error('AI Bootstrap failed:', error);
    config.onError?.(error instanceof Error ? error : new Error('AI initialization failed'));
    throw error;
  }
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Bootstrap the AI system
 */
export async function bootstrapAI(
  config: Partial<AIBootstrapConfig> = {}
): Promise<AISystemStatus> {
  // Merge config
  const fullConfig: AIBootstrapConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    autopilot: { ...DEFAULT_CONFIG.autopilot, ...config.autopilot },
    trending: { ...DEFAULT_CONFIG.trending, ...config.trending },
  };

  // Return existing promise if already initializing
  if (initPromise) {
    return initPromise;
  }

  // Return status if already initialized
  if (isInitialized) {
    return systemStatus;
  }

  // Start initialization
  initPromise = initializeAI(fullConfig);

  try {
    return await initPromise;
  } finally {
    initPromise = null;
  }
}

/**
 * Quick bootstrap - minimal initialization
 */
export async function quickBootstrap(): Promise<AISystemStatus> {
  return bootstrapAI({
    preloadModels: true,
    preloadScorer: true,
    preloadPrice: false,
    preloadVisual: false,
  });
}

/**
 * Full bootstrap - all models
 */
export async function fullBootstrap(): Promise<AISystemStatus> {
  return bootstrapAI({
    preloadModels: true,
    preloadScorer: true,
    preloadPrice: true,
    preloadVisual: true,
  });
}

/**
 * Check if AI is initialized
 */
export function isAIInitialized(): boolean {
  return isInitialized;
}

/**
 * Get current AI system status
 */
export function getAIStatus(): AISystemStatus {
  return { ...systemStatus };
}

/**
 * Get AI capabilities
 */
export function getAICapabilities(): AICapabilities {
  return {
    productScoring: systemStatus.scorer,
    productRanking: systemStatus.scorer,
    trendDetection: systemStatus.trending,
    priceAnalysis: systemStatus.price,
    visualAnalysis: systemStatus.visual,
    smartCollections: systemStatus.collections,
    storefrontAutopilot: systemStatus.scorer,
  };
}

/**
 * Reset AI system
 */
export async function resetAI(): Promise<void> {
  isInitialized = false;
  initPromise = null;
  systemStatus = {
    initialized: false,
    scorer: false,
    price: false,
    visual: false,
    collections: false,
    trending: true,
    cacheSize: 0,
    loadTimeMs: 0,
  };

  await cleanupCache();
}

/**
 * Warmup AI with product data
 */
export async function warmupAI(productIds: string[]): Promise<void> {
  // Preload embeddings cache
  // This helps with cold start performance
  console.log(`Warming up AI with ${productIds.length} products...`);
}

/**
 * React hook compatible bootstrap
 */
export function useAIBootstrap(
  config?: Partial<AIBootstrapConfig>
): {
  status: AISystemStatus;
  isLoading: boolean;
  error: Error | null;
  bootstrap: () => Promise<AISystemStatus>;
} {
  // This is a synchronous hook wrapper
  // Actual async logic should be in useEffect
  return {
    status: systemStatus,
    isLoading: initPromise !== null,
    error: null,
    bootstrap: () => bootstrapAI(config),
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

// Re-export core modules for convenience
export { runAutopilot, recordProductImpression, recordProductClick } from './storefrontAutopilot';
export { scoreProduct, scoreProducts } from './productScorer';
export { rankProducts, getAIPicks, getCuratedCarousel } from './productRanker';
export { getTrendingSignal, getTopTrending, recordImpression, recordClick } from './trendingDetector';
export { analyzePriceSensitivity, getUndervaluedProducts } from './priceSensitivity';
export { analyzeVisualSaliency, getHeroImages } from './visualSaliency';
export { generateSmartCollections, getAllSmartCollections, findSimilarProducts } from './smartCollections';

export default {
  bootstrapAI,
  quickBootstrap,
  fullBootstrap,
  isAIInitialized,
  getAIStatus,
  getAICapabilities,
  resetAI,
  warmupAI,
  useAIBootstrap,
};
