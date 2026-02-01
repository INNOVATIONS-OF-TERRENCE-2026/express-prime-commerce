/**
 * AI Buyer Intent Prediction Engine
 * 
 * Pre-checkout intent probability scoring based on behavioral signals.
 * NO cookies, NO tracking pixels - pure client-side behavioral analysis.
 * 
 * Signals tracked:
 * - Hover depth (time spent hovering on product)
 * - Scroll velocity (engagement intensity)
 * - Time-on-card (attention duration)
 * - Cart hesitation (time between add-to-cart actions)
 * - Click patterns (detail view engagement)
 * 
 * @module buyerIntent
 * @version 1.0.0
 */

// ============================================================================
// TYPES
// ============================================================================

export interface BehaviorSignal {
  productId: string;
  timestamp: number;
  type: 'hover' | 'scroll' | 'click' | 'view' | 'cart_hover' | 'checkout_start' | 'checkout_abandon';
  duration?: number;
  depth?: number;
  velocity?: number;
}

export interface IntentProfile {
  productId: string;
  intentProbability: number;
  confidence: number;
  signals: {
    hoverScore: number;
    attentionScore: number;
    engagementScore: number;
    hesitationScore: number;
  };
  stage: IntentStage;
  nudgeRecommendation: NudgeType | null;
  lastUpdated: number;
}

export type IntentStage = 
  | 'browsing'      // 0-25% intent
  | 'interested'    // 25-50% intent
  | 'considering'   // 50-75% intent
  | 'ready'         // 75-90% intent
  | 'committed';    // 90%+ intent

export type NudgeType =
  | 'social-proof'     // "X others viewing"
  | 'scarcity-soft'    // "Limited stock"
  | 'value-highlight'  // "Great value"
  | 'trust-signal'     // "Verified seller"
  | 'momentum'         // "Popular choice"
  | null;

export interface IntentConfig {
  hoverThresholdMs: number;
  attentionWindowMs: number;
  hesitationThresholdMs: number;
  decayRatePerMinute: number;
  minConfidenceForNudge: number;
}

export interface SessionIntent {
  sessionStart: number;
  totalProducts: number;
  highIntentCount: number;
  averageIntent: number;
  topIntentProducts: string[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_CONFIG: IntentConfig = {
  hoverThresholdMs: 500,
  attentionWindowMs: 30000,
  hesitationThresholdMs: 5000,
  decayRatePerMinute: 0.1,
  minConfidenceForNudge: 0.6,
};

const SIGNAL_WEIGHTS = {
  hover: 0.15,
  attention: 0.25,
  engagement: 0.35,
  hesitation: 0.25,
};

const INTENT_THRESHOLDS = {
  browsing: 0.25,
  interested: 0.50,
  considering: 0.75,
  ready: 0.90,
};

// ============================================================================
// STATE
// ============================================================================

let config = { ...DEFAULT_CONFIG };
const signalStore = new Map<string, BehaviorSignal[]>();
const intentCache = new Map<string, IntentProfile>();
const hoverTimers = new Map<string, number>();
const viewStartTimes = new Map<string, number>();

// ============================================================================
// SIGNAL RECORDING
// ============================================================================

/**
 * Record hover start on a product
 */
export function recordHoverStart(productId: string): void {
  hoverTimers.set(productId, performance.now());
}

/**
 * Record hover end and calculate duration
 */
export function recordHoverEnd(productId: string): void {
  const startTime = hoverTimers.get(productId);
  if (!startTime) return;

  const duration = performance.now() - startTime;
  hoverTimers.delete(productId);

  if (duration >= config.hoverThresholdMs) {
    addSignal({
      productId,
      timestamp: Date.now(),
      type: 'hover',
      duration,
    });
  }
}

/**
 * Record product view start
 */
export function recordViewStart(productId: string): void {
  viewStartTimes.set(productId, Date.now());
  addSignal({
    productId,
    timestamp: Date.now(),
    type: 'view',
  });
}

/**
 * Record product view end
 */
export function recordViewEnd(productId: string): void {
  const startTime = viewStartTimes.get(productId);
  if (!startTime) return;

  const duration = Date.now() - startTime;
  viewStartTimes.delete(productId);

  // Update the view signal with duration
  const signals = signalStore.get(productId) || [];
  const viewSignal = signals.find(s => s.type === 'view' && !s.duration);
  if (viewSignal) {
    viewSignal.duration = duration;
  }

  recalculateIntent(productId);
}

/**
 * Record click/engagement
 */
export function recordClick(productId: string): void {
  addSignal({
    productId,
    timestamp: Date.now(),
    type: 'click',
  });
}

/**
 * Record scroll behavior
 */
export function recordScroll(productId: string, velocity: number, depth: number): void {
  addSignal({
    productId,
    timestamp: Date.now(),
    type: 'scroll',
    velocity,
    depth,
  });
}

/**
 * Record cart hover (hesitation signal)
 */
export function recordCartHover(productId: string, duration: number): void {
  addSignal({
    productId,
    timestamp: Date.now(),
    type: 'cart_hover',
    duration,
  });
}

/**
 * Record checkout start
 */
export function recordCheckoutStart(productId: string): void {
  addSignal({
    productId,
    timestamp: Date.now(),
    type: 'checkout_start',
  });
}

/**
 * Record checkout abandonment
 */
export function recordCheckoutAbandon(productId: string): void {
  addSignal({
    productId,
    timestamp: Date.now(),
    type: 'checkout_abandon',
  });
}

// ============================================================================
// SIGNAL PROCESSING
// ============================================================================

/**
 * Add signal to store
 */
function addSignal(signal: BehaviorSignal): void {
  const signals = signalStore.get(signal.productId) || [];
  signals.push(signal);
  
  // Keep only recent signals (within attention window)
  const cutoff = Date.now() - config.attentionWindowMs;
  const filtered = signals.filter(s => s.timestamp > cutoff);
  
  signalStore.set(signal.productId, filtered);
  recalculateIntent(signal.productId);
}

/**
 * Calculate hover score from signals
 */
function calculateHoverScore(signals: BehaviorSignal[]): number {
  const hoverSignals = signals.filter(s => s.type === 'hover');
  if (hoverSignals.length === 0) return 0;

  const totalDuration = hoverSignals.reduce((sum, s) => sum + (s.duration || 0), 0);
  const avgDuration = totalDuration / hoverSignals.length;
  
  // Normalize: 2000ms hover = 1.0 score
  return Math.min(1, avgDuration / 2000);
}

/**
 * Calculate attention score from view signals
 */
function calculateAttentionScore(signals: BehaviorSignal[]): number {
  const viewSignals = signals.filter(s => s.type === 'view' && s.duration);
  if (viewSignals.length === 0) return 0;

  const totalDuration = viewSignals.reduce((sum, s) => sum + (s.duration || 0), 0);
  
  // Normalize: 30 seconds = 1.0 score
  return Math.min(1, totalDuration / 30000);
}

/**
 * Calculate engagement score from clicks and scrolls
 */
function calculateEngagementScore(signals: BehaviorSignal[]): number {
  const clickSignals = signals.filter(s => s.type === 'click');
  const scrollSignals = signals.filter(s => s.type === 'scroll');
  
  // Click score: each click adds 0.2, max 1.0
  const clickScore = Math.min(1, clickSignals.length * 0.2);
  
  // Scroll score: based on depth reached
  const maxDepth = scrollSignals.reduce((max, s) => Math.max(max, s.depth || 0), 0);
  const scrollScore = Math.min(1, maxDepth);
  
  return (clickScore * 0.6) + (scrollScore * 0.4);
}

/**
 * Calculate hesitation score (inverse - hesitation reduces intent)
 */
function calculateHesitationScore(signals: BehaviorSignal[]): number {
  const cartHovers = signals.filter(s => s.type === 'cart_hover');
  const checkoutAbandons = signals.filter(s => s.type === 'checkout_abandon');
  const checkoutStarts = signals.filter(s => s.type === 'checkout_start');
  
  // Start with neutral score
  let score = 0.5;
  
  // Cart hover indicates interest but hesitation
  if (cartHovers.length > 0) {
    const avgHesitation = cartHovers.reduce((sum, s) => sum + (s.duration || 0), 0) / cartHovers.length;
    // Long hesitation reduces score
    score -= Math.min(0.3, avgHesitation / config.hesitationThresholdMs * 0.3);
  }
  
  // Checkout abandonment is negative
  score -= checkoutAbandons.length * 0.2;
  
  // Checkout start is positive
  score += checkoutStarts.length * 0.3;
  
  return Math.max(0, Math.min(1, score));
}

/**
 * Recalculate intent for a product
 */
function recalculateIntent(productId: string): void {
  const signals = signalStore.get(productId) || [];
  if (signals.length === 0) {
    intentCache.delete(productId);
    return;
  }

  const hoverScore = calculateHoverScore(signals);
  const attentionScore = calculateAttentionScore(signals);
  const engagementScore = calculateEngagementScore(signals);
  const hesitationScore = calculateHesitationScore(signals);

  // Weighted combination
  const intentProbability = 
    (hoverScore * SIGNAL_WEIGHTS.hover) +
    (attentionScore * SIGNAL_WEIGHTS.attention) +
    (engagementScore * SIGNAL_WEIGHTS.engagement) +
    (hesitationScore * SIGNAL_WEIGHTS.hesitation);

  // Confidence based on signal count
  const confidence = Math.min(1, signals.length / 10);

  // Determine stage
  let stage: IntentStage = 'browsing';
  if (intentProbability >= INTENT_THRESHOLDS.ready) {
    stage = 'committed';
  } else if (intentProbability >= INTENT_THRESHOLDS.considering) {
    stage = 'ready';
  } else if (intentProbability >= INTENT_THRESHOLDS.interested) {
    stage = 'considering';
  } else if (intentProbability >= INTENT_THRESHOLDS.browsing) {
    stage = 'interested';
  }

  // Determine nudge recommendation
  const nudgeRecommendation = determineNudge(intentProbability, confidence, signals);

  const profile: IntentProfile = {
    productId,
    intentProbability,
    confidence,
    signals: {
      hoverScore,
      attentionScore,
      engagementScore,
      hesitationScore,
    },
    stage,
    nudgeRecommendation,
    lastUpdated: Date.now(),
  };

  intentCache.set(productId, profile);
}

/**
 * Determine appropriate nudge based on intent
 */
function determineNudge(
  intent: number, 
  confidence: number, 
  signals: BehaviorSignal[]
): NudgeType | null {
  if (confidence < config.minConfidenceForNudge) return null;

  // High intent - momentum nudge
  if (intent >= 0.75) {
    return 'momentum';
  }

  // Medium-high intent with hesitation - trust signal
  const hasHesitation = signals.some(s => s.type === 'cart_hover' || s.type === 'checkout_abandon');
  if (intent >= 0.5 && hasHesitation) {
    return 'trust-signal';
  }

  // Medium intent - value highlight
  if (intent >= 0.4) {
    return 'value-highlight';
  }

  // Low-medium intent - social proof
  if (intent >= 0.25) {
    return 'social-proof';
  }

  return null;
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Get intent profile for a product
 */
export function getIntentProfile(productId: string): IntentProfile | null {
  return intentCache.get(productId) || null;
}

/**
 * Get intent probability (0-1) for a product
 */
export function getIntentProbability(productId: string): number {
  const profile = intentCache.get(productId);
  return profile?.intentProbability || 0;
}

/**
 * Get all high-intent products
 */
export function getHighIntentProducts(threshold: number = 0.5): IntentProfile[] {
  const results: IntentProfile[] = [];
  
  intentCache.forEach(profile => {
    if (profile.intentProbability >= threshold) {
      results.push(profile);
    }
  });

  return results.sort((a, b) => b.intentProbability - a.intentProbability);
}

/**
 * Get session-level intent summary
 */
export function getSessionIntent(): SessionIntent {
  const profiles = Array.from(intentCache.values());
  const highIntent = profiles.filter(p => p.intentProbability >= 0.5);
  
  return {
    sessionStart: Math.min(...profiles.map(p => p.lastUpdated), Date.now()),
    totalProducts: profiles.length,
    highIntentCount: highIntent.length,
    averageIntent: profiles.length > 0 
      ? profiles.reduce((sum, p) => sum + p.intentProbability, 0) / profiles.length 
      : 0,
    topIntentProducts: highIntent
      .slice(0, 5)
      .map(p => p.productId),
  };
}

/**
 * Get nudge recommendation for a product
 */
export function getNudgeRecommendation(productId: string): NudgeType | null {
  const profile = intentCache.get(productId);
  return profile?.nudgeRecommendation || null;
}

/**
 * Apply time decay to all intent scores
 */
export function applyDecay(): void {
  const now = Date.now();
  
  intentCache.forEach((profile, productId) => {
    const ageMinutes = (now - profile.lastUpdated) / 60000;
    const decayFactor = Math.pow(1 - config.decayRatePerMinute, ageMinutes);
    
    profile.intentProbability *= decayFactor;
    profile.confidence *= decayFactor;
    
    // Remove if too low
    if (profile.intentProbability < 0.05) {
      intentCache.delete(productId);
      signalStore.delete(productId);
    }
  });
}

/**
 * Configure the intent system
 */
export function configure(newConfig: Partial<IntentConfig>): void {
  config = { ...config, ...newConfig };
}

/**
 * Reset all intent data
 */
export function resetIntentData(): void {
  signalStore.clear();
  intentCache.clear();
  hoverTimers.clear();
  viewStartTimes.clear();
}

/**
 * Get intent system stats
 */
export function getIntentStats(): {
  trackedProducts: number;
  totalSignals: number;
  avgIntent: number;
  highIntentProducts: number;
} {
  let totalSignals = 0;
  signalStore.forEach(signals => {
    totalSignals += signals.length;
  });

  const profiles = Array.from(intentCache.values());
  const avgIntent = profiles.length > 0
    ? profiles.reduce((sum, p) => sum + p.intentProbability, 0) / profiles.length
    : 0;

  return {
    trackedProducts: intentCache.size,
    totalSignals,
    avgIntent,
    highIntentProducts: profiles.filter(p => p.intentProbability >= 0.5).length,
  };
}

// ============================================================================
// AUTO-DECAY TIMER
// ============================================================================

let decayInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Start automatic decay timer
 */
export function startDecayTimer(intervalMs: number = 60000): void {
  if (decayInterval) return;
  decayInterval = setInterval(applyDecay, intervalMs);
}

/**
 * Stop automatic decay timer
 */
export function stopDecayTimer(): void {
  if (decayInterval) {
    clearInterval(decayInterval);
    decayInterval = null;
  }
}

export default {
  recordHoverStart,
  recordHoverEnd,
  recordViewStart,
  recordViewEnd,
  recordClick,
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
  configure,
  resetIntentData,
  getIntentStats,
  startDecayTimer,
  stopDecayTimer,
};
