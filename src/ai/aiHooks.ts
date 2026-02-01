/**
 * AI React Hooks
 * 
 * Production-ready React hooks for AI-powered commerce features.
 * Provides seamless integration of AI modules into React components.
 * 
 * @module aiHooks
 * @version 1.0.0
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  getTrendingSignal, 
  getTopTrending,
  recordImpression as recordTrendImpression,
  recordClick as recordTrendClick,
  type TrendingSignal 
} from './trendingDetector';
import {
  getIntentProfile,
  getIntentProbability,
  getHighIntentProducts,
  recordHoverStart,
  recordHoverEnd,
  recordViewStart,
  recordViewEnd,
  recordClick as recordIntentClick,
  getNudgeRecommendation,
  startDecayTimer,
  stopDecayTimer,
  type IntentProfile,
  type NudgeType,
} from './buyerIntent';
import {
  calculateTrustScore,
  getTrustScore,
  getVerifiedPicks,
  getTrustTierColor,
  getTrustBadgeIcon,
  type TrustScore,
  type ProductTrustInput,
  type TrustBadge,
} from './brandTrust';
import {
  calculateValuation,
  getLastValuation,
  formatValuation,
  getGradeColor,
  type StoreValuation,
  type ValuationInput,
  type StoreGrade,
} from './storeValuation';
import {
  analyzeVisualSaliency,
  type VisualSaliencyResult,
} from './visualSaliency';
import {
  analyzePriceSensitivity,
  type PriceSensitivityResult,
} from './priceSensitivity';
import {
  generateSmartCollections,
  getAllSmartCollections,
  type SmartCollection,
} from './smartCollections';
import {
  runAutopilot,
  type AutopilotDecisions,
} from './storefrontAutopilot';

// ============================================================================
// TRENDING HOOKS
// ============================================================================

export interface UseTrendingScoreOptions {
  autoTrack?: boolean;
}

export interface UseTrendingScoreResult {
  signal: TrendingSignal | null;
  score: number;
  status: string;
  isExploding: boolean;
  isTrending: boolean;
  recordView: () => void;
  recordClick: () => void;
}

/**
 * Hook for tracking and displaying product trending status
 */
export function useTrendingScore(
  productId: string,
  options: UseTrendingScoreOptions = {}
): UseTrendingScoreResult {
  const { autoTrack = true } = options;
  const [signal, setSignal] = useState<TrendingSignal | null>(null);
  const hasTrackedView = useRef(false);

  useEffect(() => {
    // Get current signal
    const currentSignal = getTrendingSignal(productId);
    setSignal(currentSignal);

    // Auto-track impression on mount
    if (autoTrack && !hasTrackedView.current) {
      recordTrendImpression(productId);
      hasTrackedView.current = true;
      setSignal(getTrendingSignal(productId));
    }
  }, [productId, autoTrack]);

  const recordView = useCallback(() => {
    recordTrendImpression(productId);
    setSignal(getTrendingSignal(productId));
  }, [productId]);

  const recordClick = useCallback(() => {
    recordTrendClick(productId);
    setSignal(getTrendingSignal(productId));
  }, [productId]);

  return {
    signal,
    score: signal?.trendingScore || 0,
    status: signal?.status || 'Stable',
    isExploding: signal?.status === 'Exploding',
    isTrending: (signal?.trendingScore || 0) > 50,
    recordView,
    recordClick,
  };
}

/**
 * Hook for getting top trending products
 */
export function useTopTrending(limit: number = 10): TrendingSignal[] {
  const [trending, setTrending] = useState<TrendingSignal[]>([]);

  useEffect(() => {
    setTrending(getTopTrending(limit));
    
    // Refresh periodically
    const interval = setInterval(() => {
      setTrending(getTopTrending(limit));
    }, 30000);

    return () => clearInterval(interval);
  }, [limit]);

  return trending;
}

// ============================================================================
// INTENT PREDICTION HOOKS
// ============================================================================

export interface UseIntentPredictionOptions {
  enableTracking?: boolean;
  onNudgeRecommended?: (nudge: NudgeType) => void;
}

export interface UseIntentPredictionResult {
  intent: number;
  profile: IntentProfile | null;
  stage: string;
  nudge: NudgeType | null;
  isHighIntent: boolean;
  handlers: {
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onClick: () => void;
  };
}

/**
 * Hook for tracking and predicting buyer intent
 */
export function useIntentPrediction(
  productId: string,
  options: UseIntentPredictionOptions = {}
): UseIntentPredictionResult {
  const { enableTracking = true, onNudgeRecommended } = options;
  const [profile, setProfile] = useState<IntentProfile | null>(null);
  const lastNudge = useRef<NudgeType | null>(null);

  // Start decay timer on mount
  useEffect(() => {
    startDecayTimer();
    return () => stopDecayTimer();
  }, []);

  // Track view
  useEffect(() => {
    if (enableTracking) {
      recordViewStart(productId);
      return () => recordViewEnd(productId);
    }
  }, [productId, enableTracking]);

  // Update profile periodically
  useEffect(() => {
    const updateProfile = () => {
      const newProfile = getIntentProfile(productId);
      setProfile(newProfile);

      // Check for nudge changes
      const nudge = getNudgeRecommendation(productId);
      if (nudge && nudge !== lastNudge.current) {
        lastNudge.current = nudge;
        onNudgeRecommended?.(nudge);
      }
    };

    updateProfile();
    const interval = setInterval(updateProfile, 2000);
    return () => clearInterval(interval);
  }, [productId, onNudgeRecommended]);

  const handlers = useMemo(() => ({
    onMouseEnter: () => {
      if (enableTracking) {
        recordHoverStart(productId);
      }
    },
    onMouseLeave: () => {
      if (enableTracking) {
        recordHoverEnd(productId);
        setProfile(getIntentProfile(productId));
      }
    },
    onClick: () => {
      if (enableTracking) {
        recordIntentClick(productId);
        setProfile(getIntentProfile(productId));
      }
    },
  }), [productId, enableTracking]);

  return {
    intent: profile?.intentProbability || 0,
    profile,
    stage: profile?.stage || 'browsing',
    nudge: profile?.nudgeRecommendation || null,
    isHighIntent: (profile?.intentProbability || 0) >= 0.5,
    handlers,
  };
}

/**
 * Hook for getting all high intent products
 */
export function useHighIntentProducts(threshold: number = 0.5): IntentProfile[] {
  const [products, setProducts] = useState<IntentProfile[]>([]);

  useEffect(() => {
    const update = () => setProducts(getHighIntentProducts(threshold));
    update();
    const interval = setInterval(update, 5000);
    return () => clearInterval(interval);
  }, [threshold]);

  return products;
}

// ============================================================================
// TRUST SCORE HOOKS
// ============================================================================

export interface UseTrustScoreResult {
  score: TrustScore | null;
  overallScore: number;
  tier: string;
  isVerified: boolean;
  badges: TrustBadge[];
  tierColor: string;
  loading: boolean;
}

/**
 * Hook for calculating and displaying trust scores
 */
export function useTrustScore(product: ProductTrustInput | null): UseTrustScoreResult {
  const [score, setScore] = useState<TrustScore | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!product) {
      setScore(null);
      return;
    }

    // Check cache first
    const cached = getTrustScore(product.id);
    if (cached) {
      setScore(cached);
      return;
    }

    // Calculate
    setLoading(true);
    const calculated = calculateTrustScore(product);
    setScore(calculated);
    setLoading(false);
  }, [product]);

  return {
    score,
    overallScore: score?.overallScore || 0,
    tier: score?.tier || 'unverified',
    isVerified: score?.verifiedPick || false,
    badges: score?.badges || [],
    tierColor: getTrustTierColor(score?.tier || 'unverified'),
    loading,
  };
}

/**
 * Hook for getting verified picks
 */
export function useVerifiedPicks(): TrustScore[] {
  const [picks, setPicks] = useState<TrustScore[]>([]);

  useEffect(() => {
    setPicks(getVerifiedPicks());
  }, []);

  return picks;
}

// ============================================================================
// VALUATION HOOKS
// ============================================================================

export interface UseStoreValuationResult {
  valuation: StoreValuation | null;
  loading: boolean;
  error: Error | null;
  refresh: () => void;
  formatValue: (value: number) => string;
  gradeColor: string;
}

/**
 * Hook for store valuation calculations
 */
export function useStoreValuation(input: ValuationInput | null): UseStoreValuationResult {
  const [valuation, setValuation] = useState<StoreValuation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const calculate = useCallback(() => {
    if (!input || input.products.length === 0) {
      setValuation(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = calculateValuation(input);
      setValuation(result);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Valuation failed'));
    } finally {
      setLoading(false);
    }
  }, [input]);

  useEffect(() => {
    calculate();
  }, [calculate]);

  return {
    valuation,
    loading,
    error,
    refresh: calculate,
    formatValue: formatValuation,
    gradeColor: getGradeColor(valuation?.health.grade || 'C'),
  };
}

// ============================================================================
// VISUAL SALIENCY HOOKS
// ============================================================================

export interface UseVisualSaliencyResult {
  result: VisualSaliencyResult | null;
  score: number;
  tier: string;
  isHero: boolean;
  loading: boolean;
}

/**
 * Hook for analyzing image visual saliency
 */
export function useVisualSaliency(
  productId: string,
  imageUrl: string | null
): UseVisualSaliencyResult {
  const [result, setResult] = useState<VisualSaliencyResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!imageUrl) {
      setResult(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    analyzeVisualSaliency(productId, imageUrl)
      .then(r => {
        if (!cancelled) {
          setResult(r);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [productId, imageUrl]);

  return {
    result,
    score: result?.visualScore || 0,
    tier: result?.visualTier || 'Standard',
    isHero: result?.visualTier === 'Hero',
    loading,
  };
}

// ============================================================================
// PRICE SENSITIVITY HOOKS
// ============================================================================

export interface UsePriceSensitivityResult {
  result: PriceSensitivityResult | null;
  efficiency: number;
  tier: string;
  valueCategory: string;
  loading: boolean;
}

/**
 * Hook for price sensitivity analysis
 */
export function usePriceSensitivity(
  productId: string,
  title: string,
  price: number,
  category: string,
  compareAtPrice?: number
): UsePriceSensitivityResult {
  const [result, setResult] = useState<PriceSensitivityResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    analyzePriceSensitivity(productId, title, price, category, compareAtPrice)
      .then(r => {
        if (!cancelled) {
          setResult(r);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [productId, title, price, category, compareAtPrice]);

  return {
    result,
    efficiency: result?.priceEfficiency || 0,
    tier: result?.priceTier || 'Mid-Range',
    valueCategory: result?.valueCategory || 'Fair Value',
    loading,
  };
}

// ============================================================================
// SMART COLLECTIONS HOOKS
// ============================================================================

export interface UseSmartCollectionsResult {
  collections: SmartCollection[];
  loading: boolean;
  refresh: () => Promise<void>;
}

/**
 * Hook for AI-generated smart collections
 */
export function useSmartCollections(
  products: Array<{ id: string; title: string; price: number; category: string; imageUrl?: string }>
): UseSmartCollectionsResult {
  const [collections, setCollections] = useState<SmartCollection[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (products.length === 0) {
      setCollections([]);
      return;
    }

    setLoading(true);
    try {
      await generateSmartCollections(products);
      setCollections(getAllSmartCollections());
    } catch (e) {
      console.error('Smart collections error:', e);
    } finally {
      setLoading(false);
    }
  }, [products]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    collections,
    loading,
    refresh,
  };
}

// ============================================================================
// AUTOPILOT HOOKS
// ============================================================================

export interface UseAutopilotResult {
  decisions: AutopilotDecisions | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * Hook for storefront autopilot decisions
 */
export function useAutopilot(
  products: Array<{ id: string; title: string; price: number; category: string; imageUrl?: string }>
): UseAutopilotResult {
  const [decisions, setDecisions] = useState<AutopilotDecisions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (products.length === 0) {
      setDecisions(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await runAutopilot(products);
      setDecisions(result);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Autopilot failed'));
    } finally {
      setLoading(false);
    }
  }, [products]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    decisions,
    loading,
    error,
    refresh,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  getTrustBadgeIcon,
  getTrustTierColor,
  formatValuation,
  getGradeColor,
};
