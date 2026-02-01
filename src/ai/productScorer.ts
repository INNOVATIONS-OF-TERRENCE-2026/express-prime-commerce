/**
 * Product Scorer Module - AI-powered product scoring using Xenova/transformers
 * 
 * Converts product attributes into semantic embeddings and generates
 * normalized scores (0.0-1.0) for intelligent ranking.
 * 
 * Model: Xenova/all-MiniLM-L6-v2 (384-dimensional embeddings)
 * 
 * @module productScorer
 * @version 1.0.0
 */

import {
  getCachedScore,
  setCachedScore,
  setModelLoaded,
  isModelLoaded,
  setModelLoadPromise,
  getModelLoadPromise,
  type CachedProductScore,
} from './aiCache';

// ============================================================================
// TYPES
// ============================================================================

export interface ProductInput {
  id: string;
  title: string;
  description?: string | null;
  product_type?: string | null;
  price: number;
  compare_at_price?: number | null;
  vendor?: string | null;
  tags?: string[] | null;
}

export interface ProductScore {
  productId: string;
  aiScore: number;
  aiTags: string[];
  aiTier: 'Featured' | 'Trending' | 'Standard';
  confidence: number;
}

interface FeatureWeights {
  semantic: number;
  priceValue: number;
  discount: number;
  trustSignals: number;
  categoryRelevance: number;
}

// ============================================================================
// MODEL MANAGEMENT
// ============================================================================

let pipeline: any = null;
let featureExtractor: any = null;

const MODEL_ID = 'Xenova/all-MiniLM-L6-v2';

/**
 * Lazily load the transformers pipeline
 */
async function loadModel(): Promise<void> {
  // Check if already loaded
  if (isModelLoaded() && featureExtractor) {
    return;
  }

  // Check if loading is in progress
  const existingPromise = getModelLoadPromise();
  if (existingPromise) {
    await existingPromise;
    return;
  }

  // Start loading
  const loadPromise = (async () => {
    try {
      // Dynamic import for code splitting
      const transformers = await import('@xenova/transformers');
      pipeline = transformers.pipeline;

      // Load feature extraction pipeline
      featureExtractor = await pipeline('feature-extraction', MODEL_ID, {
        quantized: true, // Use quantized model for faster inference
      });

      setModelLoaded(true);
      console.log('✅ AI Model loaded:', MODEL_ID);
    } catch (error) {
      console.error('❌ Failed to load AI model:', error);
      setModelLoaded(false);
      throw error;
    } finally {
      setModelLoadPromise(null);
    }
  })();

  setModelLoadPromise(loadPromise);
  await loadPromise;
}

/**
 * Check if model is ready for inference
 */
export function isModelReady(): boolean {
  return isModelLoaded() && featureExtractor !== null;
}

/**
 * Preload model (call early for faster first inference)
 */
export async function preloadModel(): Promise<boolean> {
  try {
    await loadModel();
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// FEATURE EXTRACTION
// ============================================================================

/**
 * Generate semantic embedding for text
 */
async function generateEmbedding(text: string): Promise<number[]> {
  if (!featureExtractor) {
    await loadModel();
  }

  try {
    const output = await featureExtractor(text, {
      pooling: 'mean',
      normalize: true,
    });

    // Convert tensor to array
    return Array.from(output.data);
  } catch (error) {
    console.error('Embedding generation failed:', error);
    return [];
  }
}

/**
 * Cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

// ============================================================================
// SCORING FUNCTIONS
// ============================================================================

// Reference embeddings for ideal product qualities
const QUALITY_ANCHORS = {
  premium: 'premium luxury high-end exclusive quality crafted elegant sophisticated',
  trending: 'popular trending viral bestseller hot must-have favorite top-rated',
  value: 'affordable great value best deal savings discount budget-friendly economical',
  trust: 'certified authentic genuine guaranteed verified trusted reliable safe',
};

let anchorEmbeddings: Record<string, number[]> | null = null;

/**
 * Initialize anchor embeddings for scoring
 */
async function initializeAnchors(): Promise<void> {
  if (anchorEmbeddings) return;

  anchorEmbeddings = {};
  for (const [key, text] of Object.entries(QUALITY_ANCHORS)) {
    anchorEmbeddings[key] = await generateEmbedding(text);
  }
}

/**
 * Extract trust signals from product text
 */
function extractTrustSignals(text: string): number {
  const trustKeywords = [
    'certified', 'authentic', 'genuine', 'guaranteed', 'verified',
    'official', 'licensed', 'premium', 'original', 'warranty',
    'FDA', 'organic', 'natural', 'eco-friendly', 'sustainable',
  ];

  const lowerText = text.toLowerCase();
  const matches = trustKeywords.filter((kw) => lowerText.includes(kw));
  return Math.min(matches.length / 5, 1); // Normalize to 0-1
}

/**
 * Calculate price value score
 */
function calculatePriceValueScore(price: number, compareAtPrice?: number | null): number {
  // Price tier scoring (lower prices score slightly higher for value)
  let tierScore = 0;
  if (price < 25) tierScore = 0.9;
  else if (price < 50) tierScore = 0.85;
  else if (price < 100) tierScore = 0.75;
  else if (price < 200) tierScore = 0.65;
  else tierScore = 0.5;

  // Discount boost
  let discountBoost = 0;
  if (compareAtPrice && compareAtPrice > price) {
    const discountPercent = (compareAtPrice - price) / compareAtPrice;
    discountBoost = Math.min(discountPercent, 0.3); // Max 0.3 boost
  }

  return Math.min(tierScore + discountBoost, 1);
}

/**
 * Build product text representation for embedding
 */
function buildProductText(product: ProductInput): string {
  const parts: string[] = [];

  // Title is most important
  parts.push(product.title);

  // Add description (truncated)
  if (product.description) {
    const cleanDesc = product.description
      .replace(/<[^>]*>/g, ' ') // Remove HTML
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 200);
    parts.push(cleanDesc);
  }

  // Add product type
  if (product.product_type) {
    parts.push(product.product_type);
  }

  // Add vendor as quality signal
  if (product.vendor) {
    parts.push(product.vendor);
  }

  // Add tags
  if (product.tags && product.tags.length > 0) {
    parts.push(product.tags.slice(0, 5).join(' '));
  }

  return parts.join(' ').slice(0, 512); // Limit total length
}

/**
 * Score a single product using AI
 */
export async function scoreProduct(product: ProductInput): Promise<ProductScore> {
  // Check cache first
  const cached = getCachedScore(product.id);
  if (cached) {
    return {
      productId: cached.productId,
      aiScore: cached.aiScore,
      aiTags: cached.aiTags,
      aiTier: cached.aiTier,
      confidence: 1,
    };
  }

  try {
    // Ensure model and anchors are loaded
    await loadModel();
    await initializeAnchors();

    // Build product text and generate embedding
    const productText = buildProductText(product);
    const productEmbedding = await generateEmbedding(productText);

    if (productEmbedding.length === 0 || !anchorEmbeddings) {
      return createFallbackScore(product);
    }

    // Calculate semantic similarity scores
    const premiumScore = cosineSimilarity(productEmbedding, anchorEmbeddings.premium);
    const trendingScore = cosineSimilarity(productEmbedding, anchorEmbeddings.trending);
    const valueScore = cosineSimilarity(productEmbedding, anchorEmbeddings.value);
    const trustScore = cosineSimilarity(productEmbedding, anchorEmbeddings.trust);

    // Calculate additional features
    const priceValueScore = calculatePriceValueScore(product.price, product.compare_at_price);
    const trustSignalScore = extractTrustSignals(productText);

    // Weighted combination
    const weights: FeatureWeights = {
      semantic: 0.35,
      priceValue: 0.20,
      discount: 0.15,
      trustSignals: 0.15,
      categoryRelevance: 0.15,
    };

    const semanticAvg = (premiumScore + trendingScore + valueScore + trustScore) / 4;
    const discountScore = product.compare_at_price && product.compare_at_price > product.price
      ? Math.min((product.compare_at_price - product.price) / product.compare_at_price, 1)
      : 0;

    const rawScore =
      semanticAvg * weights.semantic +
      priceValueScore * weights.priceValue +
      discountScore * weights.discount +
      trustSignalScore * weights.trustSignals +
      (trendingScore + valueScore) / 2 * weights.categoryRelevance;

    // Normalize to 0-1 with sigmoid-like smoothing
    const aiScore = Math.min(Math.max(rawScore * 1.5, 0), 1);

    // Determine tier and tags
    const { aiTier, aiTags } = determineTagsAndTier(
      aiScore,
      premiumScore,
      trendingScore,
      valueScore,
      discountScore
    );

    const result: ProductScore = {
      productId: product.id,
      aiScore,
      aiTags,
      aiTier,
      confidence: 0.85,
    };

    // Cache result
    setCachedScore(product.id, {
      productId: product.id,
      aiScore,
      aiTags,
      aiTier,
      embedding: productEmbedding,
    });

    return result;
  } catch (error) {
    console.error('Product scoring failed:', error);
    return createFallbackScore(product);
  }
}

/**
 * Determine AI tags and tier based on scores
 */
function determineTagsAndTier(
  aiScore: number,
  premiumScore: number,
  trendingScore: number,
  valueScore: number,
  discountScore: number
): { aiTier: 'Featured' | 'Trending' | 'Standard'; aiTags: string[] } {
  const tags: string[] = [];
  let tier: 'Featured' | 'Trending' | 'Standard' = 'Standard';

  // Premium/Featured detection
  if (premiumScore > 0.6 && aiScore > 0.7) {
    tags.push('Premium Pick');
    tier = 'Featured';
  }

  // Trending detection
  if (trendingScore > 0.55) {
    tags.push('Trending');
    if (tier === 'Standard') tier = 'Trending';
  }

  // Value detection
  if (valueScore > 0.5 || discountScore > 0.2) {
    tags.push('High Value');
  }

  // Score-based tier override
  if (aiScore > 0.75 && tier === 'Standard') {
    tier = 'Featured';
    if (!tags.includes('Premium Pick')) tags.push('AI Pick');
  } else if (aiScore > 0.55 && tier === 'Standard') {
    tier = 'Trending';
  }

  // Discount tag
  if (discountScore > 0.25) {
    tags.push('Deal');
  }

  // Ensure at least one tag
  if (tags.length === 0) {
    tags.push('Quality');
  }

  return { aiTier: tier, aiTags: tags.slice(0, 3) }; // Max 3 tags
}

/**
 * Create fallback score when AI fails
 */
function createFallbackScore(product: ProductInput): ProductScore {
  // Use heuristic scoring as fallback
  let score = 0.5;

  // Boost for discounts
  if (product.compare_at_price && product.compare_at_price > product.price) {
    score += 0.1;
  }

  // Boost for mid-range pricing
  if (product.price >= 20 && product.price <= 100) {
    score += 0.05;
  }

  // Boost for having description
  if (product.description && product.description.length > 50) {
    score += 0.05;
  }

  return {
    productId: product.id,
    aiScore: Math.min(score, 1),
    aiTags: ['Quality'],
    aiTier: 'Standard',
    confidence: 0.3, // Low confidence for fallback
  };
}

/**
 * Batch score multiple products efficiently
 */
export async function scoreProducts(products: ProductInput[]): Promise<ProductScore[]> {
  // Ensure model is loaded once
  await loadModel();
  await initializeAnchors();

  // Process products (could be parallelized with Promise.all, but
  // sequential is more memory-efficient for large batches)
  const results: ProductScore[] = [];

  for (const product of products) {
    const score = await scoreProduct(product);
    results.push(score);
  }

  return results;
}

/**
 * Get scoring status
 */
export function getScoringStatus(): {
  modelReady: boolean;
  modelId: string;
} {
  return {
    modelReady: isModelReady(),
    modelId: MODEL_ID,
  };
}

export default {
  scoreProduct,
  scoreProducts,
  preloadModel,
  isModelReady,
  getScoringStatus,
};
