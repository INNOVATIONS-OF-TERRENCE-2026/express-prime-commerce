/**
 * AI Brand Trust Scoring Engine
 * 
 * Calculates trust scores for products based on multiple signals.
 * Powers trust badges and "Verified Express Prime Pick" designation.
 * 
 * Signals analyzed:
 * - Price coherence (fair pricing relative to market)
 * - Image quality (professional presentation)
 * - Review density (social proof strength)
 * - Shipping clarity (fulfillment transparency)
 * - Description quality (information completeness)
 * - Brand consistency (cohesive product family)
 * 
 * @module brandTrust
 * @version 1.0.0
 */

// ============================================================================
// TYPES
// ============================================================================

export interface TrustScore {
  productId: string;
  overallScore: number;
  tier: TrustTier;
  signals: TrustSignals;
  badges: TrustBadge[];
  concerns: TrustConcern[];
  verifiedPick: boolean;
  lastCalculated: number;
}

export interface TrustSignals {
  priceCoherence: number;
  imageQuality: number;
  reviewDensity: number;
  shippingClarity: number;
  descriptionQuality: number;
  brandConsistency: number;
}

export type TrustTier = 
  | 'verified'     // 85-100
  | 'trusted'      // 70-84
  | 'standard'     // 50-69
  | 'caution'      // 30-49
  | 'unverified';  // 0-29

export type TrustBadge = 
  | 'verified-pick'
  | 'price-fair'
  | 'fast-shipping'
  | 'quality-images'
  | 'well-reviewed'
  | 'detailed-info'
  | 'established-brand';

export interface TrustConcern {
  type: ConcernType;
  severity: 'low' | 'medium' | 'high';
  message: string;
  impact: number;
}

export type ConcernType =
  | 'price-mismatch'
  | 'low-image-quality'
  | 'no-reviews'
  | 'shipping-unclear'
  | 'sparse-description'
  | 'unknown-brand'
  | 'inconsistent-pricing';

export interface ProductTrustInput {
  id: string;
  title: string;
  price: number;
  compareAtPrice?: number;
  description: string;
  images: string[];
  vendor?: string;
  reviewCount?: number;
  avgRating?: number;
  shippingInfo?: string;
  category?: string;
}

export interface TrustConfig {
  verifiedPickThreshold: number;
  trustedThreshold: number;
  cautionThreshold: number;
  weights: {
    priceCoherence: number;
    imageQuality: number;
    reviewDensity: number;
    shippingClarity: number;
    descriptionQuality: number;
    brandConsistency: number;
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_CONFIG: TrustConfig = {
  verifiedPickThreshold: 85,
  trustedThreshold: 70,
  cautionThreshold: 30,
  weights: {
    priceCoherence: 0.20,
    imageQuality: 0.20,
    reviewDensity: 0.15,
    shippingClarity: 0.15,
    descriptionQuality: 0.15,
    brandConsistency: 0.15,
  },
};

const KNOWN_BRANDS = new Set([
  'apple', 'samsung', 'sony', 'lg', 'philips', 'bose', 'nike', 'adidas',
  'dyson', 'kitchenaid', 'cuisinart', 'vitamix', 'ninja', 'instant pot',
  'yeti', 'hydro flask', 'fitbit', 'garmin', 'anker', 'belkin', 'logitech',
]);

const PRICE_RANGES: Record<string, { min: number; max: number; avg: number }> = {
  'electronics': { min: 15, max: 500, avg: 75 },
  'home': { min: 10, max: 300, avg: 50 },
  'kitchen': { min: 10, max: 400, avg: 60 },
  'fitness': { min: 15, max: 200, avg: 45 },
  'health': { min: 10, max: 150, avg: 35 },
  'default': { min: 10, max: 200, avg: 50 },
};

// ============================================================================
// STATE
// ============================================================================

let config = { ...DEFAULT_CONFIG };
const trustCache = new Map<string, TrustScore>();
const brandProductCounts = new Map<string, number>();

// ============================================================================
// SIGNAL CALCULATIONS
// ============================================================================

/**
 * Calculate price coherence score
 */
function calculatePriceCoherence(
  price: number,
  compareAtPrice: number | undefined,
  category: string
): { score: number; concerns: TrustConcern[] } {
  const concerns: TrustConcern[] = [];
  const range = PRICE_RANGES[category.toLowerCase()] || PRICE_RANGES.default;

  // Check if price is within reasonable range
  let rangeScore = 1;
  if (price < range.min * 0.5) {
    rangeScore = 0.5;
    concerns.push({
      type: 'price-mismatch',
      severity: 'medium',
      message: 'Price significantly below market average',
      impact: -0.15,
    });
  } else if (price > range.max * 1.5) {
    rangeScore = 0.7;
    concerns.push({
      type: 'price-mismatch',
      severity: 'low',
      message: 'Price significantly above market average',
      impact: -0.1,
    });
  }

  // Check compare-at price validity
  let compareScore = 1;
  if (compareAtPrice) {
    const discount = (compareAtPrice - price) / compareAtPrice;
    if (discount > 0.7) {
      compareScore = 0.6;
      concerns.push({
        type: 'inconsistent-pricing',
        severity: 'medium',
        message: 'Discount seems unrealistically high',
        impact: -0.15,
      });
    } else if (discount < 0) {
      compareScore = 0.8;
    }
  }

  return {
    score: (rangeScore + compareScore) / 2,
    concerns,
  };
}

/**
 * Calculate image quality score
 */
function calculateImageQuality(
  images: string[]
): { score: number; concerns: TrustConcern[] } {
  const concerns: TrustConcern[] = [];

  // No images = major trust issue
  if (images.length === 0) {
    concerns.push({
      type: 'low-image-quality',
      severity: 'high',
      message: 'No product images available',
      impact: -0.3,
    });
    return { score: 0.1, concerns };
  }

  // Score based on image count (more angles = better)
  let countScore = Math.min(1, images.length / 4);

  // Check for CDN/professional hosting (heuristic)
  const professionalHosts = ['shopify', 'cloudinary', 'imgix', 'fastly', 'cdn'];
  const hasProfessionalHosting = images.some(img => 
    professionalHosts.some(host => img.toLowerCase().includes(host))
  );
  const hostingScore = hasProfessionalHosting ? 1 : 0.7;

  // Check for variety (different URLs suggest different angles)
  const uniqueImages = new Set(images.map(img => img.split('?')[0]));
  const varietyScore = uniqueImages.size >= 2 ? 1 : 0.6;

  if (images.length < 2) {
    concerns.push({
      type: 'low-image-quality',
      severity: 'low',
      message: 'Limited product imagery',
      impact: -0.1,
    });
  }

  return {
    score: (countScore + hostingScore + varietyScore) / 3,
    concerns,
  };
}

/**
 * Calculate review density score
 */
function calculateReviewDensity(
  reviewCount: number | undefined,
  avgRating: number | undefined
): { score: number; concerns: TrustConcern[] } {
  const concerns: TrustConcern[] = [];

  if (!reviewCount || reviewCount === 0) {
    concerns.push({
      type: 'no-reviews',
      severity: 'medium',
      message: 'No customer reviews available',
      impact: -0.15,
    });
    return { score: 0.3, concerns };
  }

  // Review count score (logarithmic scale)
  const countScore = Math.min(1, Math.log10(reviewCount + 1) / 2);

  // Rating score
  let ratingScore = 0.5;
  if (avgRating) {
    ratingScore = avgRating / 5;
    if (avgRating < 3.5) {
      concerns.push({
        type: 'no-reviews',
        severity: 'low',
        message: 'Below average customer rating',
        impact: -0.1,
      });
    }
  }

  return {
    score: (countScore * 0.6) + (ratingScore * 0.4),
    concerns,
  };
}

/**
 * Calculate shipping clarity score
 */
function calculateShippingClarity(
  shippingInfo: string | undefined
): { score: number; concerns: TrustConcern[] } {
  const concerns: TrustConcern[] = [];

  if (!shippingInfo || shippingInfo.trim().length === 0) {
    concerns.push({
      type: 'shipping-unclear',
      severity: 'medium',
      message: 'Shipping information not provided',
      impact: -0.15,
    });
    return { score: 0.4, concerns };
  }

  const info = shippingInfo.toLowerCase();
  
  // Check for specific shipping mentions
  const hasTimeframe = /(\d+[-–]\d+\s*days?|next\s*day|overnight|express|standard)/i.test(info);
  const hasFreeShipping = /free\s*shipping/i.test(info);
  const hasTracking = /track/i.test(info);

  let score = 0.5;
  if (hasTimeframe) score += 0.2;
  if (hasFreeShipping) score += 0.2;
  if (hasTracking) score += 0.1;

  if (!hasTimeframe) {
    concerns.push({
      type: 'shipping-unclear',
      severity: 'low',
      message: 'Delivery timeframe not specified',
      impact: -0.1,
    });
  }

  return { score: Math.min(1, score), concerns };
}

/**
 * Calculate description quality score
 */
function calculateDescriptionQuality(
  description: string,
  title: string
): { score: number; concerns: TrustConcern[] } {
  const concerns: TrustConcern[] = [];

  if (!description || description.trim().length < 20) {
    concerns.push({
      type: 'sparse-description',
      severity: 'high',
      message: 'Product description is missing or very brief',
      impact: -0.2,
    });
    return { score: 0.2, concerns };
  }

  // Word count score
  const words = description.split(/\s+/).length;
  const wordScore = Math.min(1, words / 100);

  // Check for key information
  const hasFeatures = /features?|includes?|specifications?|specs/i.test(description);
  const hasBenefits = /benefits?|perfect for|ideal for|great for/i.test(description);
  const hasDimensions = /\d+\s*(cm|mm|inch|"|'|x|×)/i.test(description);
  const hasMaterials = /material|made of|crafted|constructed/i.test(description);

  let infoScore = 0.5;
  if (hasFeatures) infoScore += 0.15;
  if (hasBenefits) infoScore += 0.15;
  if (hasDimensions) infoScore += 0.1;
  if (hasMaterials) infoScore += 0.1;

  // Readability (sentences vs word soup)
  const sentences = description.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const readabilityScore = sentences.length >= 3 ? 1 : 0.6;

  if (words < 50) {
    concerns.push({
      type: 'sparse-description',
      severity: 'low',
      message: 'Description could be more detailed',
      impact: -0.1,
    });
  }

  return {
    score: (wordScore * 0.3) + (infoScore * 0.4) + (readabilityScore * 0.3),
    concerns,
  };
}

/**
 * Calculate brand consistency score
 */
function calculateBrandConsistency(
  vendor: string | undefined
): { score: number; concerns: TrustConcern[] } {
  const concerns: TrustConcern[] = [];

  if (!vendor || vendor.trim().length === 0) {
    concerns.push({
      type: 'unknown-brand',
      severity: 'medium',
      message: 'Brand/vendor not specified',
      impact: -0.15,
    });
    return { score: 0.4, concerns };
  }

  const vendorLower = vendor.toLowerCase();

  // Check if known brand
  const isKnownBrand = KNOWN_BRANDS.has(vendorLower);
  const brandScore = isKnownBrand ? 1 : 0.6;

  // Check if brand has multiple products (consistency)
  const productCount = brandProductCounts.get(vendorLower) || 1;
  const consistencyScore = Math.min(1, Math.log2(productCount + 1) / 3);

  return {
    score: (brandScore * 0.6) + (consistencyScore * 0.4),
    concerns,
  };
}

// ============================================================================
// BADGE DETERMINATION
// ============================================================================

/**
 * Determine badges based on signals
 */
function determineBadges(signals: TrustSignals, overallScore: number): TrustBadge[] {
  const badges: TrustBadge[] = [];

  if (overallScore >= config.verifiedPickThreshold) {
    badges.push('verified-pick');
  }
  if (signals.priceCoherence >= 0.85) {
    badges.push('price-fair');
  }
  if (signals.shippingClarity >= 0.8) {
    badges.push('fast-shipping');
  }
  if (signals.imageQuality >= 0.85) {
    badges.push('quality-images');
  }
  if (signals.reviewDensity >= 0.7) {
    badges.push('well-reviewed');
  }
  if (signals.descriptionQuality >= 0.8) {
    badges.push('detailed-info');
  }
  if (signals.brandConsistency >= 0.85) {
    badges.push('established-brand');
  }

  return badges;
}

/**
 * Determine trust tier
 */
function determineTier(score: number): TrustTier {
  if (score >= config.verifiedPickThreshold) return 'verified';
  if (score >= config.trustedThreshold) return 'trusted';
  if (score >= 50) return 'standard';
  if (score >= config.cautionThreshold) return 'caution';
  return 'unverified';
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Calculate trust score for a product
 */
export function calculateTrustScore(product: ProductTrustInput): TrustScore {
  // Check cache
  const cached = trustCache.get(product.id);
  if (cached && Date.now() - cached.lastCalculated < 3600000) {
    return cached;
  }

  // Update brand product count
  if (product.vendor) {
    const vendorLower = product.vendor.toLowerCase();
    brandProductCounts.set(vendorLower, (brandProductCounts.get(vendorLower) || 0) + 1);
  }

  const category = product.category || 'default';

  // Calculate all signals
  const priceResult = calculatePriceCoherence(product.price, product.compareAtPrice, category);
  const imageResult = calculateImageQuality(product.images);
  const reviewResult = calculateReviewDensity(product.reviewCount, product.avgRating);
  const shippingResult = calculateShippingClarity(product.shippingInfo);
  const descriptionResult = calculateDescriptionQuality(product.description, product.title);
  const brandResult = calculateBrandConsistency(product.vendor);

  const signals: TrustSignals = {
    priceCoherence: priceResult.score,
    imageQuality: imageResult.score,
    reviewDensity: reviewResult.score,
    shippingClarity: shippingResult.score,
    descriptionQuality: descriptionResult.score,
    brandConsistency: brandResult.score,
  };

  // Weighted overall score
  const overallScore = Math.round(
    (signals.priceCoherence * config.weights.priceCoherence +
     signals.imageQuality * config.weights.imageQuality +
     signals.reviewDensity * config.weights.reviewDensity +
     signals.shippingClarity * config.weights.shippingClarity +
     signals.descriptionQuality * config.weights.descriptionQuality +
     signals.brandConsistency * config.weights.brandConsistency) * 100
  );

  // Collect concerns
  const concerns = [
    ...priceResult.concerns,
    ...imageResult.concerns,
    ...reviewResult.concerns,
    ...shippingResult.concerns,
    ...descriptionResult.concerns,
    ...brandResult.concerns,
  ];

  // Determine badges and tier
  const badges = determineBadges(signals, overallScore);
  const tier = determineTier(overallScore);

  const trustScore: TrustScore = {
    productId: product.id,
    overallScore,
    tier,
    signals,
    badges,
    concerns: concerns.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    }),
    verifiedPick: overallScore >= config.verifiedPickThreshold,
    lastCalculated: Date.now(),
  };

  trustCache.set(product.id, trustScore);
  return trustScore;
}

/**
 * Batch calculate trust scores
 */
export function batchCalculateTrustScores(
  products: ProductTrustInput[]
): TrustScore[] {
  return products.map(p => calculateTrustScore(p));
}

/**
 * Get trust score for a product
 */
export function getTrustScore(productId: string): TrustScore | null {
  return trustCache.get(productId) || null;
}

/**
 * Get all verified picks
 */
export function getVerifiedPicks(): TrustScore[] {
  const results: TrustScore[] = [];
  trustCache.forEach(score => {
    if (score.verifiedPick) {
      results.push(score);
    }
  });
  return results.sort((a, b) => b.overallScore - a.overallScore);
}

/**
 * Get products by trust tier
 */
export function getProductsByTier(tier: TrustTier): TrustScore[] {
  const results: TrustScore[] = [];
  trustCache.forEach(score => {
    if (score.tier === tier) {
      results.push(score);
    }
  });
  return results;
}

/**
 * Get products with concerns
 */
export function getProductsWithConcerns(
  minSeverity: 'low' | 'medium' | 'high' = 'medium'
): TrustScore[] {
  const severityOrder = { high: 0, medium: 1, low: 2 };
  const threshold = severityOrder[minSeverity];

  const results: TrustScore[] = [];
  trustCache.forEach(score => {
    const hasConcern = score.concerns.some(c => severityOrder[c.severity] <= threshold);
    if (hasConcern) {
      results.push(score);
    }
  });
  return results.sort((a, b) => a.overallScore - b.overallScore);
}

/**
 * Get trust tier color
 */
export function getTrustTierColor(tier: TrustTier): string {
  const colors: Record<TrustTier, string> = {
    verified: '#22c55e',   // Green
    trusted: '#3b82f6',    // Blue
    standard: '#6b7280',   // Gray
    caution: '#f59e0b',    // Amber
    unverified: '#ef4444', // Red
  };
  return colors[tier];
}

/**
 * Get trust badge icon
 */
export function getTrustBadgeIcon(badge: TrustBadge): string {
  const icons: Record<TrustBadge, string> = {
    'verified-pick': '✓',
    'price-fair': '💰',
    'fast-shipping': '🚚',
    'quality-images': '📷',
    'well-reviewed': '⭐',
    'detailed-info': '📋',
    'established-brand': '🏷️',
  };
  return icons[badge];
}

/**
 * Configure trust engine
 */
export function configure(newConfig: Partial<TrustConfig>): void {
  config = { 
    ...config, 
    ...newConfig,
    weights: { ...config.weights, ...newConfig.weights },
  };
}

/**
 * Clear trust cache
 */
export function clearCache(): void {
  trustCache.clear();
}

/**
 * Get trust engine stats
 */
export function getTrustStats(): {
  totalProducts: number;
  avgScore: number;
  verifiedPicks: number;
  byTier: Record<TrustTier, number>;
  topConcerns: Array<{ type: ConcernType; count: number }>;
} {
  const scores = Array.from(trustCache.values());
  const avgScore = scores.length > 0
    ? scores.reduce((sum, s) => sum + s.overallScore, 0) / scores.length
    : 0;

  const byTier: Record<TrustTier, number> = {
    verified: 0,
    trusted: 0,
    standard: 0,
    caution: 0,
    unverified: 0,
  };
  scores.forEach(s => byTier[s.tier]++);

  const concernCounts = new Map<ConcernType, number>();
  scores.forEach(s => {
    s.concerns.forEach(c => {
      concernCounts.set(c.type, (concernCounts.get(c.type) || 0) + 1);
    });
  });

  const topConcerns = Array.from(concernCounts.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalProducts: scores.length,
    avgScore,
    verifiedPicks: byTier.verified,
    byTier,
    topConcerns,
  };
}

export default {
  calculateTrustScore,
  batchCalculateTrustScores,
  getTrustScore,
  getVerifiedPicks,
  getProductsByTier,
  getProductsWithConcerns,
  getTrustTierColor,
  getTrustBadgeIcon,
  configure,
  clearCache,
  getTrustStats,
};
