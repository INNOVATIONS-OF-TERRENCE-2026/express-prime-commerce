/**
 * Smart Collections - AI Self-Organizing Product Groupings
 * 
 * Replaces static collections with emergent AI groupings based on
 * semantic similarity, trending signals, and price efficiency.
 * Collections update automatically each session.
 * 
 * NO manual rules. NO admin UI. Pure AI organization.
 * 
 * @module smartCollections
 * @version 1.0.0
 */

import { scoreProduct, type ProductInput, type ProductScore } from './productScorer';
import { getTrendingSignal, type TrendingSignal } from './trendingDetector';
import { analyzePriceSensitivity, type PriceSensitivityResult } from './priceSensitivity';
import { analyzeVisualSaliency, type VisualSaliencyResult } from './visualSaliency';
import {
  getEmbedding,
  setEmbedding,
  batchGetEmbeddings,
} from './embeddingsCache';

// ============================================================================
// TYPES
// ============================================================================

export interface SmartCollection {
  id: string;
  name: string;
  description: string;
  icon: string;
  products: SmartCollectionProduct[];
  confidence: number;
  lastUpdated: number;
  isAIGenerated: boolean;
}

export interface SmartCollectionProduct {
  productId: string;
  relevanceScore: number;
  contributingFactors: string[];
}

export interface CollectionGenerationConfig {
  minProducts: number;
  maxProducts: number;
  minConfidence: number;
  similarityThreshold: number;
}

interface ProductAnalysis {
  id: string;
  title: string;
  embedding: number[];
  aiScore: ProductScore;
  trendingSignal: TrendingSignal | null;
  priceAnalysis: PriceSensitivityResult | null;
  visualAnalysis: VisualSaliencyResult | null;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_CONFIG: CollectionGenerationConfig = {
  minProducts: 3,
  maxProducts: 12,
  minConfidence: 0.5,
  similarityThreshold: 0.6,
};

// Collection templates with semantic anchors
const COLLECTION_TEMPLATES = [
  {
    id: 'ai-picks',
    name: 'AI Picks',
    description: 'Intelligently curated by our AI for maximum value',
    icon: '🤖',
    anchor: 'premium quality best value intelligent recommendation top rated excellent',
    criteria: (p: ProductAnalysis) => p.aiScore.aiScore > 0.7,
    sortBy: (p: ProductAnalysis) => p.aiScore.aiScore,
  },
  {
    id: 'high-value-tech',
    name: 'High-Value Tech',
    description: 'Best technology deals with exceptional value',
    icon: '💻',
    anchor: 'technology electronics smart gadget device tech innovation digital',
    criteria: (p: ProductAnalysis) =>
      p.priceAnalysis?.valueCategory === 'Undervalued' ||
      p.priceAnalysis?.priceEfficiency > 0.6,
    sortBy: (p: ProductAnalysis) => p.priceAnalysis?.priceEfficiency ?? 0,
  },
  {
    id: 'trending-home',
    name: 'Trending Home',
    description: 'Hot home products gaining momentum',
    icon: '🏠',
    anchor: 'home living decor furniture interior design house apartment',
    criteria: (p: ProductAnalysis) =>
      (p.trendingSignal?.trendStatus === 'Rising' ||
        p.trendingSignal?.trendStatus === 'Exploding') &&
      p.trendingSignal.trendScore > 0.5,
    sortBy: (p: ProductAnalysis) => p.trendingSignal?.trendScore ?? 0,
  },
  {
    id: 'premium-essentials',
    name: 'Premium Essentials',
    description: 'High-quality everyday must-haves',
    icon: '✨',
    anchor: 'essential everyday premium quality reliable trusted daily use',
    criteria: (p: ProductAnalysis) =>
      p.priceAnalysis?.valueCategory === 'Premium-Justified' &&
      p.aiScore.aiScore > 0.5,
    sortBy: (p: ProductAnalysis) => p.aiScore.aiScore,
  },
  {
    id: 'impulse-deals',
    name: 'Quick Wins',
    description: 'Great finds under $25',
    icon: '⚡',
    anchor: 'affordable cheap budget deal discount bargain low price value',
    criteria: (p: ProductAnalysis) =>
      p.priceAnalysis?.valueCategory === 'Impulse-Buy',
    sortBy: (p: ProductAnalysis) => p.priceAnalysis?.priceEfficiency ?? 0,
  },
  {
    id: 'visual-standouts',
    name: 'Visual Standouts',
    description: 'Products with stunning presentation',
    icon: '📸',
    anchor: 'beautiful visual stunning gorgeous aesthetic appealing attractive',
    criteria: (p: ProductAnalysis) =>
      p.visualAnalysis?.visualTier === 'Hero',
    sortBy: (p: ProductAnalysis) => p.visualAnalysis?.visualScore ?? 0,
  },
  {
    id: 'rising-stars',
    name: 'Rising Stars',
    description: 'Products gaining rapid popularity',
    icon: '🚀',
    anchor: 'popular trending viral hot must-have rising new',
    criteria: (p: ProductAnalysis) =>
      p.trendingSignal?.trendStatus === 'Exploding',
    sortBy: (p: ProductAnalysis) => p.trendingSignal?.velocity ?? 0,
  },
  {
    id: 'health-wellness',
    name: 'Health & Wellness',
    description: 'Products for a healthier lifestyle',
    icon: '💪',
    anchor: 'health wellness fitness exercise nutrition self-care wellbeing',
    criteria: (p: ProductAnalysis) => true, // Semantic match only
    sortBy: (p: ProductAnalysis) => p.aiScore.aiScore,
  },
];

// ============================================================================
// STATE
// ============================================================================

let pipeline: any = null;
let extractor: any = null;
const MODEL_ID = 'Xenova/all-MiniLM-L6-v2';
const generatedCollections = new Map<string, SmartCollection>();
let templateEmbeddings: Map<string, number[]> | null = null;
const config = { ...DEFAULT_CONFIG };

// ============================================================================
// MODEL LOADING
// ============================================================================

async function loadModel(): Promise<boolean> {
  if (extractor) return true;

  try {
    const transformers = await import('@xenova/transformers');
    pipeline = transformers.pipeline;
    extractor = await pipeline('feature-extraction', MODEL_ID, {
      quantized: true,
    });
    return true;
  } catch (error) {
    console.warn('Smart collections model loading failed:', error);
    return false;
  }
}

async function initializeTemplateEmbeddings(): Promise<void> {
  if (templateEmbeddings) return;

  const loaded = await loadModel();
  if (!loaded || !extractor) return;

  templateEmbeddings = new Map();

  for (const template of COLLECTION_TEMPLATES) {
    const output = await extractor(template.anchor, {
      pooling: 'mean',
      normalize: true,
    });
    templateEmbeddings.set(template.id, Array.from(output.data));
  }
}

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;

  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Get or generate product embedding
 */
async function getProductEmbedding(
  product: ProductInput
): Promise<number[]> {
  const cacheKey = `smart-${product.id}`;

  // Check cache
  const cached = await getEmbedding(cacheKey);
  if (cached) return cached;

  // Generate new embedding
  if (!extractor) {
    await loadModel();
    if (!extractor) return [];
  }

  const text = buildProductText(product);
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  const embedding = Array.from(output.data) as number[];

  // Cache it
  await setEmbedding(cacheKey, embedding, 'product', MODEL_ID);

  return embedding;
}

/**
 * Build product text for embedding
 */
function buildProductText(product: ProductInput): string {
  const parts: string[] = [product.title];

  if (product.description) {
    parts.push(product.description.replace(/<[^>]*>/g, ' ').slice(0, 200));
  }
  if (product.product_type) {
    parts.push(product.product_type);
  }
  if (product.vendor) {
    parts.push(product.vendor);
  }
  if (product.tags?.length) {
    parts.push(product.tags.slice(0, 5).join(' '));
  }

  return parts.join(' ').slice(0, 512);
}

/**
 * Analyze products and gather all signals
 */
async function analyzeProducts(
  products: ProductInput[]
): Promise<ProductAnalysis[]> {
  const analyses: ProductAnalysis[] = [];

  for (const product of products) {
    const embedding = await getProductEmbedding(product);
    const aiScore = await scoreProduct(product);
    const trendingSignal = getTrendingSignal(product.id);

    // These can be expensive, so we'll make them optional
    let priceAnalysis: PriceSensitivityResult | null = null;
    let visualAnalysis: VisualSaliencyResult | null = null;

    try {
      priceAnalysis = await analyzePriceSensitivity({
        id: product.id,
        title: product.title,
        description: product.description,
        price: product.price,
        compareAtPrice: product.compare_at_price,
        productType: product.product_type,
        vendor: product.vendor,
        tags: product.tags,
      });
    } catch {
      // Ignore price analysis errors
    }

    analyses.push({
      id: product.id,
      title: product.title,
      embedding,
      aiScore,
      trendingSignal,
      priceAnalysis,
      visualAnalysis,
    });
  }

  return analyses;
}

/**
 * Generate a single collection from template
 */
function generateCollection(
  template: typeof COLLECTION_TEMPLATES[0],
  analyses: ProductAnalysis[],
  templateEmbedding: number[] | undefined
): SmartCollection | null {
  // Filter products matching criteria
  let matchingProducts = analyses.filter(template.criteria);

  // If we have a template embedding, also filter by semantic similarity
  if (templateEmbedding && templateEmbedding.length > 0) {
    matchingProducts = matchingProducts.filter((p) => {
      if (p.embedding.length === 0) return true;
      const similarity = cosineSimilarity(p.embedding, templateEmbedding);
      return similarity > config.similarityThreshold * 0.5; // Relaxed threshold
    });
  }

  // Not enough products
  if (matchingProducts.length < config.minProducts) {
    return null;
  }

  // Sort by template's sort criteria
  matchingProducts.sort((a, b) => template.sortBy(b) - template.sortBy(a));

  // Take top N
  const topProducts = matchingProducts.slice(0, config.maxProducts);

  // Calculate collection confidence
  const avgScore =
    topProducts.reduce((sum, p) => sum + template.sortBy(p), 0) /
    topProducts.length;

  // Build collection products
  const collectionProducts: SmartCollectionProduct[] = topProducts.map((p) => {
    const factors: string[] = [];

    if (p.aiScore.aiScore > 0.7) factors.push('High AI Score');
    if (p.trendingSignal?.trendStatus === 'Exploding') factors.push('Exploding');
    if (p.trendingSignal?.trendStatus === 'Rising') factors.push('Trending');
    if (p.priceAnalysis?.valueCategory === 'Undervalued') factors.push('Great Value');
    if (p.priceAnalysis?.valueCategory === 'Impulse-Buy') factors.push('Impulse Buy');
    if (p.visualAnalysis?.visualTier === 'Hero') factors.push('Visual Hero');

    return {
      productId: p.id,
      relevanceScore: template.sortBy(p),
      contributingFactors: factors.length > 0 ? factors : ['Semantic Match'],
    };
  });

  return {
    id: template.id,
    name: template.name,
    description: template.description,
    icon: template.icon,
    products: collectionProducts,
    confidence: Math.min(avgScore, 1),
    lastUpdated: Date.now(),
    isAIGenerated: true,
  };
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Generate all smart collections for products
 */
export async function generateSmartCollections(
  products: ProductInput[]
): Promise<SmartCollection[]> {
  await loadModel();
  await initializeTemplateEmbeddings();

  // Analyze all products
  const analyses = await analyzeProducts(products);

  // Generate each collection
  const collections: SmartCollection[] = [];

  for (const template of COLLECTION_TEMPLATES) {
    const templateEmb = templateEmbeddings?.get(template.id);
    const collection = generateCollection(template, analyses, templateEmb);

    if (collection && collection.confidence >= config.minConfidence) {
      collections.push(collection);
      generatedCollections.set(collection.id, collection);
    }
  }

  // Sort by confidence
  collections.sort((a, b) => b.confidence - a.confidence);

  return collections;
}

/**
 * Get a specific smart collection
 */
export function getSmartCollection(id: string): SmartCollection | null {
  return generatedCollections.get(id) || null;
}

/**
 * Get all generated collections
 */
export function getAllSmartCollections(): SmartCollection[] {
  return Array.from(generatedCollections.values()).sort(
    (a, b) => b.confidence - a.confidence
  );
}

/**
 * Get collection by type
 */
export function getCollectionByType(
  type: 'ai-picks' | 'trending' | 'value' | 'premium'
): SmartCollection | null {
  const mapping: Record<string, string> = {
    'ai-picks': 'ai-picks',
    trending: 'rising-stars',
    value: 'high-value-tech',
    premium: 'premium-essentials',
  };

  const id = mapping[type];
  return id ? generatedCollections.get(id) || null : null;
}

/**
 * Find similar products using embeddings
 */
export async function findSimilarProducts(
  productId: string,
  allProducts: ProductInput[],
  limit: number = 6
): Promise<SmartCollectionProduct[]> {
  await loadModel();

  // Get source product embedding
  const sourceProduct = allProducts.find((p) => p.id === productId);
  if (!sourceProduct) return [];

  const sourceEmbedding = await getProductEmbedding(sourceProduct);
  if (sourceEmbedding.length === 0) return [];

  // Compare with all other products
  const similarities: Array<{ id: string; score: number }> = [];

  for (const product of allProducts) {
    if (product.id === productId) continue;

    const embedding = await getProductEmbedding(product);
    if (embedding.length === 0) continue;

    const similarity = cosineSimilarity(sourceEmbedding, embedding);
    similarities.push({ id: product.id, score: similarity });
  }

  // Sort and take top N
  similarities.sort((a, b) => b.score - a.score);
  const top = similarities.slice(0, limit);

  return top.map((s) => ({
    productId: s.id,
    relevanceScore: s.score,
    contributingFactors: ['Semantic Similarity'],
  }));
}

/**
 * Get recommended collection for user
 */
export function getRecommendedCollection(): SmartCollection | null {
  const collections = getAllSmartCollections();
  
  // Return highest confidence collection
  return collections.length > 0 ? collections[0] : null;
}

/**
 * Refresh a single collection
 */
export async function refreshCollection(
  collectionId: string,
  products: ProductInput[]
): Promise<SmartCollection | null> {
  await loadModel();
  await initializeTemplateEmbeddings();

  const template = COLLECTION_TEMPLATES.find((t) => t.id === collectionId);
  if (!template) return null;

  const analyses = await analyzeProducts(products);
  const templateEmb = templateEmbeddings?.get(template.id);
  const collection = generateCollection(template, analyses, templateEmb);

  if (collection) {
    generatedCollections.set(collectionId, collection);
  }

  return collection;
}

/**
 * Clear all generated collections
 */
export function clearCollections(): void {
  generatedCollections.clear();
}

/**
 * Configure collection generation
 */
export function configure(newConfig: Partial<CollectionGenerationConfig>): void {
  Object.assign(config, newConfig);
}

/**
 * Check if model is ready
 */
export function isModelReady(): boolean {
  return extractor !== null;
}

/**
 * Get collection statistics
 */
export function getStats(): {
  totalCollections: number;
  totalProducts: number;
  avgConfidence: number;
  lastGenerated: number;
} {
  const collections = getAllSmartCollections();
  const totalProducts = collections.reduce(
    (sum, c) => sum + c.products.length,
    0
  );
  const avgConfidence =
    collections.length > 0
      ? collections.reduce((sum, c) => sum + c.confidence, 0) / collections.length
      : 0;
  const lastGenerated =
    collections.length > 0
      ? Math.max(...collections.map((c) => c.lastUpdated))
      : 0;

  return {
    totalCollections: collections.length,
    totalProducts,
    avgConfidence,
    lastGenerated,
  };
}

export default {
  generateSmartCollections,
  getSmartCollection,
  getAllSmartCollections,
  getCollectionByType,
  findSimilarProducts,
  getRecommendedCollection,
  refreshCollection,
  clearCollections,
  configure,
  isModelReady,
  getStats,
};
