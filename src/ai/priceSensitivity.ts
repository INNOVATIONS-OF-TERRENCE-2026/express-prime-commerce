/**
 * Price Sensitivity Optimizer - AI-Driven Price Perception Analysis
 * 
 * Infers buyer sensitivity to price tiers WITHOUT changing prices.
 * Uses semantic analysis to compare product value vs price positioning.
 * 
 * @module priceSensitivity
 * @version 1.0.0
 */

import {
  getEmbedding,
  setEmbedding,
  batchGetEmbeddings,
} from './embeddingsCache';

// ============================================================================
// TYPES
// ============================================================================

export interface PriceSensitivityResult {
  productId: string;
  priceEfficiency: number; // 0-1 (higher = better value perception)
  priceTier: 'Budget' | 'Value' | 'Mid' | 'Premium' | 'Luxury';
  valueCategory: 'Undervalued' | 'Fair' | 'Premium-Justified' | 'Impulse-Buy';
  suggestedPosition: 'Hero' | 'Featured' | 'Standard' | 'Hidden';
  confidenceScore: number;
}

export interface PriceCluster {
  tier: PriceSensitivityResult['priceTier'];
  minPrice: number;
  maxPrice: number;
  meanPrice: number;
  productCount: number;
  avgSemanticValue: number;
}

interface ProductPriceData {
  id: string;
  title: string;
  description?: string | null;
  price: number;
  compareAtPrice?: number | null;
  productType?: string | null;
  vendor?: string | null;
  tags?: string[] | null;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const PRICE_TIERS = {
  Budget: { min: 0, max: 15 },
  Value: { min: 15, max: 35 },
  Mid: { min: 35, max: 75 },
  Premium: { min: 75, max: 150 },
  Luxury: { min: 150, max: Infinity },
};

// Value anchor texts for semantic comparison
const VALUE_ANCHORS = {
  premium: 'luxury premium high-end exclusive top-quality crafted artisan sophisticated elegant',
  practical: 'useful practical everyday essential functional reliable durable efficient',
  innovative: 'innovative cutting-edge smart technology advanced modern revolutionary',
  affordable: 'affordable budget-friendly economical great value savings deal discount',
};

// ============================================================================
// STATE
// ============================================================================

let pipeline: any = null;
let extractor: any = null;
let anchorEmbeddings: Record<string, number[]> | null = null;
const MODEL_ID = 'Xenova/all-MiniLM-L6-v2';

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
    console.warn('Price sensitivity model loading failed:', error);
    return false;
  }
}

async function initializeAnchors(): Promise<void> {
  if (anchorEmbeddings) return;

  const loaded = await loadModel();
  if (!loaded) return;

  anchorEmbeddings = {};
  for (const [key, text] of Object.entries(VALUE_ANCHORS)) {
    const output = await extractor(text, { pooling: 'mean', normalize: true });
    anchorEmbeddings[key] = Array.from(output.data);
  }
}

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Generate embedding for product text
 */
async function getProductEmbedding(product: ProductPriceData): Promise<number[]> {
  const cacheKey = `price-${product.id}`;
  
  // Check cache
  const cached = await getEmbedding(cacheKey);
  if (cached) return cached;

  // Generate new embedding
  const loaded = await loadModel();
  if (!loaded || !extractor) return [];

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
function buildProductText(product: ProductPriceData): string {
  const parts: string[] = [product.title];
  
  if (product.description) {
    parts.push(product.description.replace(/<[^>]*>/g, ' ').slice(0, 200));
  }
  if (product.productType) {
    parts.push(product.productType);
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
 * Calculate cosine similarity
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * Determine price tier from price
 */
function determinePriceTier(price: number): PriceSensitivityResult['priceTier'] {
  for (const [tier, range] of Object.entries(PRICE_TIERS)) {
    if (price >= range.min && price < range.max) {
      return tier as PriceSensitivityResult['priceTier'];
    }
  }
  return 'Mid';
}

/**
 * Calculate semantic value score from embedding
 */
function calculateSemanticValue(
  embedding: number[],
  anchors: Record<string, number[]>
): number {
  const premiumSim = cosineSimilarity(embedding, anchors.premium);
  const practicalSim = cosineSimilarity(embedding, anchors.practical);
  const innovativeSim = cosineSimilarity(embedding, anchors.innovative);
  
  // Weighted combination favoring premium and innovative signals
  return (premiumSim * 0.4) + (practicalSim * 0.3) + (innovativeSim * 0.3);
}

/**
 * Determine value category from price efficiency
 */
function determineValueCategory(
  priceEfficiency: number,
  price: number
): PriceSensitivityResult['valueCategory'] {
  const isImpulse = price < 25;
  
  if (priceEfficiency > 0.7) {
    return isImpulse ? 'Impulse-Buy' : 'Undervalued';
  }
  if (priceEfficiency > 0.4) {
    return 'Fair';
  }
  return 'Premium-Justified';
}

/**
 * Determine suggested position based on analysis
 */
function determineSuggestedPosition(
  priceEfficiency: number,
  valueCategory: PriceSensitivityResult['valueCategory'],
  priceTier: PriceSensitivityResult['priceTier']
): PriceSensitivityResult['suggestedPosition'] {
  // High efficiency + undervalued = Hero material
  if (priceEfficiency > 0.7 && valueCategory === 'Undervalued') {
    return 'Hero';
  }
  
  // Good value or impulse buys = Featured
  if (priceEfficiency > 0.5 || valueCategory === 'Impulse-Buy') {
    return 'Featured';
  }
  
  // Premium justified at luxury tier might be hidden from main view
  if (priceTier === 'Luxury' && valueCategory === 'Premium-Justified') {
    return 'Standard';
  }
  
  return 'Standard';
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Analyze price sensitivity for a single product
 */
export async function analyzePriceSensitivity(
  product: ProductPriceData
): Promise<PriceSensitivityResult> {
  await initializeAnchors();
  
  const priceTier = determinePriceTier(product.price);
  
  // Try to get semantic analysis
  let semanticValue = 0.5;
  let confidence = 0.3;
  
  if (anchorEmbeddings) {
    const embedding = await getProductEmbedding(product);
    if (embedding.length > 0) {
      semanticValue = calculateSemanticValue(embedding, anchorEmbeddings);
      confidence = 0.85;
    }
  }
  
  // Calculate price efficiency
  // Higher semantic value + lower relative price = higher efficiency
  const tierMidpoint = (PRICE_TIERS[priceTier].min + 
    Math.min(PRICE_TIERS[priceTier].max, 200)) / 2;
  const priceRatio = Math.min(product.price / tierMidpoint, 2);
  
  // Discount boost
  let discountBoost = 0;
  if (product.compareAtPrice && product.compareAtPrice > product.price) {
    discountBoost = (product.compareAtPrice - product.price) / product.compareAtPrice * 0.2;
  }
  
  const priceEfficiency = Math.min(
    (semanticValue * 0.6 + (1 - priceRatio * 0.3) + discountBoost),
    1
  );
  
  const valueCategory = determineValueCategory(priceEfficiency, product.price);
  const suggestedPosition = determineSuggestedPosition(
    priceEfficiency,
    valueCategory,
    priceTier
  );
  
  return {
    productId: product.id,
    priceEfficiency,
    priceTier,
    valueCategory,
    suggestedPosition,
    confidenceScore: confidence,
  };
}

/**
 * Batch analyze price sensitivity for multiple products
 */
export async function batchAnalyzePriceSensitivity(
  products: ProductPriceData[]
): Promise<Map<string, PriceSensitivityResult>> {
  const results = new Map<string, PriceSensitivityResult>();
  
  // Process in parallel batches
  const batchSize = 10;
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((p) => analyzePriceSensitivity(p))
    );
    
    for (const result of batchResults) {
      results.set(result.productId, result);
    }
  }
  
  return results;
}

/**
 * Get price clusters from products
 */
export function getPriceClusters(products: ProductPriceData[]): PriceCluster[] {
  const clusters: Map<string, ProductPriceData[]> = new Map();
  
  // Group by tier
  for (const product of products) {
    const tier = determinePriceTier(product.price);
    if (!clusters.has(tier)) {
      clusters.set(tier, []);
    }
    clusters.get(tier)!.push(product);
  }
  
  // Build cluster objects
  const result: PriceCluster[] = [];
  
  for (const [tier, tierProducts] of clusters) {
    const prices = tierProducts.map((p) => p.price);
    result.push({
      tier: tier as PriceCluster['tier'],
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      meanPrice: prices.reduce((a, b) => a + b, 0) / prices.length,
      productCount: tierProducts.length,
      avgSemanticValue: 0.5, // Placeholder, would need embeddings
    });
  }
  
  return result.sort((a, b) => a.minPrice - b.minPrice);
}

/**
 * Get undervalued products (best deals)
 */
export async function getUndervaluedProducts(
  products: ProductPriceData[],
  limit: number = 10
): Promise<PriceSensitivityResult[]> {
  const results = await batchAnalyzePriceSensitivity(products);
  
  return Array.from(results.values())
    .filter((r) => r.valueCategory === 'Undervalued')
    .sort((a, b) => b.priceEfficiency - a.priceEfficiency)
    .slice(0, limit);
}

/**
 * Get impulse-buy products
 */
export async function getImpulseBuyProducts(
  products: ProductPriceData[],
  limit: number = 10
): Promise<PriceSensitivityResult[]> {
  const results = await batchAnalyzePriceSensitivity(products);
  
  return Array.from(results.values())
    .filter((r) => r.valueCategory === 'Impulse-Buy')
    .sort((a, b) => b.priceEfficiency - a.priceEfficiency)
    .slice(0, limit);
}

/**
 * Get products by suggested position
 */
export async function getProductsByPosition(
  products: ProductPriceData[],
  position: PriceSensitivityResult['suggestedPosition']
): Promise<PriceSensitivityResult[]> {
  const results = await batchAnalyzePriceSensitivity(products);
  
  return Array.from(results.values())
    .filter((r) => r.suggestedPosition === position)
    .sort((a, b) => b.priceEfficiency - a.priceEfficiency);
}

/**
 * Check if model is ready
 */
export function isModelReady(): boolean {
  return extractor !== null && anchorEmbeddings !== null;
}

/**
 * Preload model for faster analysis
 */
export async function preloadModel(): Promise<boolean> {
  await initializeAnchors();
  return isModelReady();
}

export default {
  analyzePriceSensitivity,
  batchAnalyzePriceSensitivity,
  getPriceClusters,
  getUndervaluedProducts,
  getImpulseBuyProducts,
  getProductsByPosition,
  isModelReady,
  preloadModel,
};
