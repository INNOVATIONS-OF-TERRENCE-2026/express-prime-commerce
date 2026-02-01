/**
 * Trending Detector - Velocity-Based Product Trending Intelligence
 * 
 * Detects products with accelerating interest, not just raw popularity.
 * Uses session-based impressions, click velocity, and time-decay weighting.
 * 
 * @module trendingDetector
 * @version 1.0.0
 */

// ============================================================================
// TYPES
// ============================================================================

export interface TrendingSignal {
  productId: string;
  trendScore: number; // 0-1 normalized
  trendStatus: 'Exploding' | 'Rising' | 'Stable' | 'Cooling';
  velocity: number; // Rate of change
  impressions: number;
  clicks: number;
  lastInteraction: number;
}

export interface TrendingConfig {
  decayHalfLife: number; // milliseconds
  velocityWindow: number; // milliseconds
  minImpressions: number;
  explosionThreshold: number;
  risingThreshold: number;
  coolingThreshold: number;
}

interface InteractionEvent {
  productId: string;
  type: 'impression' | 'click' | 'addToCart' | 'view';
  timestamp: number;
  weight: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_CONFIG: TrendingConfig = {
  decayHalfLife: 30 * 60 * 1000, // 30 minutes
  velocityWindow: 5 * 60 * 1000, // 5 minutes
  minImpressions: 2,
  explosionThreshold: 0.8,
  risingThreshold: 0.5,
  coolingThreshold: 0.3,
};

const EVENT_WEIGHTS: Record<InteractionEvent['type'], number> = {
  impression: 1,
  click: 5,
  view: 3,
  addToCart: 10,
};

// ============================================================================
// STATE
// ============================================================================

const interactionLog: InteractionEvent[] = [];
const productSignals = new Map<string, TrendingSignal>();
let config = { ...DEFAULT_CONFIG };
let catalogMedian = 0.5;

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Calculate time-decay factor using exponential decay
 */
function calculateDecay(timestamp: number, now: number): number {
  const age = now - timestamp;
  return Math.pow(0.5, age / config.decayHalfLife);
}

/**
 * Calculate velocity (rate of change) for a product
 */
function calculateVelocity(productId: string, now: number): number {
  const recentEvents = interactionLog.filter(
    (e) =>
      e.productId === productId &&
      now - e.timestamp < config.velocityWindow
  );

  const olderEvents = interactionLog.filter(
    (e) =>
      e.productId === productId &&
      now - e.timestamp >= config.velocityWindow &&
      now - e.timestamp < config.velocityWindow * 2
  );

  const recentScore = recentEvents.reduce(
    (sum, e) => sum + e.weight * calculateDecay(e.timestamp, now),
    0
  );

  const olderScore = olderEvents.reduce(
    (sum, e) => sum + e.weight * calculateDecay(e.timestamp, now),
    0
  );

  // Velocity = (recent - older) / max(older, 1) to avoid division by zero
  return (recentScore - olderScore) / Math.max(olderScore, 1);
}

/**
 * Calculate raw trend score for a product
 */
function calculateRawScore(productId: string, now: number): number {
  const events = interactionLog.filter((e) => e.productId === productId);

  if (events.length === 0) return 0;

  // Weighted sum with time decay
  const weightedSum = events.reduce(
    (sum, e) => sum + e.weight * calculateDecay(e.timestamp, now),
    0
  );

  // Add velocity bonus
  const velocity = calculateVelocity(productId, now);
  const velocityBonus = Math.max(0, velocity) * 0.3;

  return weightedSum + velocityBonus;
}

/**
 * Normalize scores against catalog median
 */
function normalizeScore(rawScore: number): number {
  if (catalogMedian === 0) return Math.min(rawScore, 1);
  
  // Sigmoid normalization centered on median
  const x = (rawScore - catalogMedian) / Math.max(catalogMedian, 0.1);
  return 1 / (1 + Math.exp(-2 * x));
}

/**
 * Determine trend status from score and velocity
 */
function determineTrendStatus(
  score: number,
  velocity: number
): TrendingSignal['trendStatus'] {
  if (score >= config.explosionThreshold && velocity > 0.5) {
    return 'Exploding';
  }
  if (score >= config.risingThreshold && velocity > 0) {
    return 'Rising';
  }
  if (score < config.coolingThreshold || velocity < -0.3) {
    return 'Cooling';
  }
  return 'Stable';
}

/**
 * Update catalog median for normalization
 */
function updateCatalogMedian(): void {
  const scores = Array.from(productSignals.values()).map((s) => s.trendScore);
  if (scores.length === 0) {
    catalogMedian = 0.5;
    return;
  }
  
  scores.sort((a, b) => a - b);
  const mid = Math.floor(scores.length / 2);
  catalogMedian = scores.length % 2 === 0
    ? (scores[mid - 1] + scores[mid]) / 2
    : scores[mid];
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Record a product interaction
 */
export function recordInteraction(
  productId: string,
  type: InteractionEvent['type']
): void {
  const event: InteractionEvent = {
    productId,
    type,
    timestamp: Date.now(),
    weight: EVENT_WEIGHTS[type],
  };

  interactionLog.push(event);

  // Prune old events (older than 2x velocity window)
  const cutoff = Date.now() - config.velocityWindow * 4;
  while (interactionLog.length > 0 && interactionLog[0].timestamp < cutoff) {
    interactionLog.shift();
  }

  // Update signal for this product
  updateProductSignal(productId);
}

/**
 * Record impression for a product
 */
export function recordImpression(productId: string): void {
  recordInteraction(productId, 'impression');
}

/**
 * Record click for a product
 */
export function recordClick(productId: string): void {
  recordInteraction(productId, 'click');
}

/**
 * Record add to cart for a product
 */
export function recordAddToCart(productId: string): void {
  recordInteraction(productId, 'addToCart');
}

/**
 * Record product view for a product
 */
export function recordProductView(productId: string): void {
  recordInteraction(productId, 'view');
}

/**
 * Update trending signal for a single product
 */
export function updateProductSignal(productId: string): TrendingSignal {
  const now = Date.now();
  const events = interactionLog.filter((e) => e.productId === productId);

  const impressions = events.filter((e) => e.type === 'impression').length;
  const clicks = events.filter((e) => e.type === 'click').length;
  const lastInteraction = events.length > 0
    ? Math.max(...events.map((e) => e.timestamp))
    : 0;

  const rawScore = calculateRawScore(productId, now);
  const velocity = calculateVelocity(productId, now);
  const trendScore = normalizeScore(rawScore);
  const trendStatus = determineTrendStatus(trendScore, velocity);

  const signal: TrendingSignal = {
    productId,
    trendScore,
    trendStatus,
    velocity,
    impressions,
    clicks,
    lastInteraction,
  };

  productSignals.set(productId, signal);
  return signal;
}

/**
 * Get trending signal for a product
 */
export function getTrendingSignal(productId: string): TrendingSignal | null {
  return productSignals.get(productId) || null;
}

/**
 * Get all trending signals
 */
export function getAllTrendingSignals(): TrendingSignal[] {
  return Array.from(productSignals.values());
}

/**
 * Get top trending products
 */
export function getTopTrending(limit: number = 10): TrendingSignal[] {
  return Array.from(productSignals.values())
    .filter((s) => s.impressions >= config.minImpressions)
    .sort((a, b) => b.trendScore - a.trendScore)
    .slice(0, limit);
}

/**
 * Get exploding products (highest velocity)
 */
export function getExplodingProducts(): TrendingSignal[] {
  return Array.from(productSignals.values())
    .filter((s) => s.trendStatus === 'Exploding')
    .sort((a, b) => b.velocity - a.velocity);
}

/**
 * Get rising products
 */
export function getRisingProducts(): TrendingSignal[] {
  return Array.from(productSignals.values())
    .filter((s) => s.trendStatus === 'Rising')
    .sort((a, b) => b.trendScore - a.trendScore);
}

/**
 * Batch update signals for multiple products
 */
export function batchUpdateSignals(productIds: string[]): Map<string, TrendingSignal> {
  const results = new Map<string, TrendingSignal>();
  
  for (const productId of productIds) {
    const signal = updateProductSignal(productId);
    results.set(productId, signal);
  }

  // Update catalog median after batch
  updateCatalogMedian();

  return results;
}

/**
 * Initialize products with zero signals
 */
export function initializeProducts(productIds: string[]): void {
  for (const productId of productIds) {
    if (!productSignals.has(productId)) {
      productSignals.set(productId, {
        productId,
        trendScore: 0.5,
        trendStatus: 'Stable',
        velocity: 0,
        impressions: 0,
        clicks: 0,
        lastInteraction: 0,
      });
    }
  }
}

/**
 * Configure trending detector
 */
export function configure(newConfig: Partial<TrendingConfig>): void {
  config = { ...config, ...newConfig };
}

/**
 * Reset all trending data
 */
export function reset(): void {
  interactionLog.length = 0;
  productSignals.clear();
  catalogMedian = 0.5;
}

/**
 * Get trending statistics
 */
export function getStats(): {
  totalProducts: number;
  exploding: number;
  rising: number;
  stable: number;
  cooling: number;
  totalInteractions: number;
  catalogMedian: number;
} {
  const signals = Array.from(productSignals.values());
  
  return {
    totalProducts: signals.length,
    exploding: signals.filter((s) => s.trendStatus === 'Exploding').length,
    rising: signals.filter((s) => s.trendStatus === 'Rising').length,
    stable: signals.filter((s) => s.trendStatus === 'Stable').length,
    cooling: signals.filter((s) => s.trendStatus === 'Cooling').length,
    totalInteractions: interactionLog.length,
    catalogMedian,
  };
}

export default {
  recordInteraction,
  recordImpression,
  recordClick,
  recordAddToCart,
  recordProductView,
  getTrendingSignal,
  getAllTrendingSignals,
  getTopTrending,
  getExplodingProducts,
  getRisingProducts,
  batchUpdateSignals,
  initializeProducts,
  configure,
  reset,
  getStats,
};
