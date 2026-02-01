/**
 * Visual Saliency Scoring - AI Image-Based Intelligence
 * 
 * Predicts which product images convert better using CLIP-style analysis.
 * Scores contrast, object focus, and visual clarity without uploading images.
 * 
 * @module visualSaliency
 * @version 1.0.0
 */

import {
  getEmbedding,
  setEmbedding,
} from './embeddingsCache';

// ============================================================================
// TYPES
// ============================================================================

export interface VisualSaliencyResult {
  productId: string;
  visualScore: number; // 0-1
  visualTier: 'Hero' | 'Strong' | 'Standard';
  clarity: number;
  contrast: number;
  focusScore: number;
  composition: number;
  colorVibrancy: number;
  analysis: string[];
}

interface ImageAnalysisConfig {
  heroThreshold: number;
  strongThreshold: number;
  minDimension: number;
  sampleSize: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_CONFIG: ImageAnalysisConfig = {
  heroThreshold: 0.75,
  strongThreshold: 0.5,
  minDimension: 200,
  sampleSize: 50,
};

// CLIP model for image embeddings
const CLIP_MODEL_ID = 'Xenova/clip-vit-base-patch32';

// Visual quality text anchors for CLIP similarity
const VISUAL_ANCHORS = {
  professional: 'professional product photography clean white background sharp focus',
  cluttered: 'cluttered messy background multiple objects confusing busy',
  vibrant: 'vibrant colorful eye-catching bright saturated colors',
  dull: 'dull washed out low contrast faded colors bland',
  focused: 'sharp focused clear subject centered composition',
  blurry: 'blurry unfocused out of focus motion blur soft',
};

// ============================================================================
// STATE
// ============================================================================

let clipPipeline: any = null;
let textPipeline: any = null;
let anchorEmbeddings: Record<string, number[]> | null = null;
const config = { ...DEFAULT_CONFIG };

// ============================================================================
// MODEL LOADING
// ============================================================================

async function loadCLIP(): Promise<boolean> {
  if (clipPipeline && textPipeline) return true;

  try {
    const transformers = await import('@xenova/transformers');
    
    // Load CLIP for image features
    clipPipeline = await transformers.pipeline(
      'image-feature-extraction',
      CLIP_MODEL_ID,
      { quantized: true }
    );
    
    // Load text encoder for anchor comparison
    textPipeline = await transformers.pipeline(
      'feature-extraction',
      CLIP_MODEL_ID,
      { quantized: true }
    );

    return true;
  } catch (error) {
    console.warn('CLIP model loading failed, using heuristic fallback:', error);
    return false;
  }
}

async function initializeAnchors(): Promise<void> {
  if (anchorEmbeddings || !textPipeline) return;

  try {
    anchorEmbeddings = {};
    for (const [key, text] of Object.entries(VISUAL_ANCHORS)) {
      const output = await textPipeline(text, { pooling: 'mean', normalize: true });
      anchorEmbeddings[key] = Array.from(output.data);
    }
  } catch (error) {
    console.warn('Failed to initialize visual anchors:', error);
  }
}

// ============================================================================
// HEURISTIC ANALYSIS (Fallback when CLIP unavailable)
// ============================================================================

/**
 * Load image and get pixel data
 */
async function loadImageData(
  imageUrl: string
): Promise<ImageData | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }

        // Sample at smaller size for performance
        const maxSize = 100;
        const scale = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        resolve(imageData);
      } catch {
        resolve(null);
      }
    };

    img.onerror = () => resolve(null);
    img.src = imageUrl;
  });
}

/**
 * Calculate contrast from image data
 */
function calculateContrast(data: Uint8ClampedArray): number {
  const luminances: number[] = [];
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Relative luminance
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    luminances.push(luminance);
  }

  // Standard deviation as contrast measure
  const mean = luminances.reduce((a, b) => a + b, 0) / luminances.length;
  const variance = luminances.reduce((sum, l) => sum + Math.pow(l - mean, 2), 0) / luminances.length;
  const stdDev = Math.sqrt(variance);

  // Normalize to 0-1 (stdDev of 80 is very high contrast)
  return Math.min(stdDev / 80, 1);
}

/**
 * Calculate color vibrancy from image data
 */
function calculateVibrancy(data: Uint8ClampedArray): number {
  let totalSaturation = 0;
  let samples = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;

    // Saturation
    let s = 0;
    if (max !== min) {
      s = l > 0.5
        ? (max - min) / (2 - max - min)
        : (max - min) / (max + min);
    }

    totalSaturation += s;
    samples++;
  }

  return totalSaturation / samples;
}

/**
 * Calculate edge density (proxy for focus/clarity)
 */
function calculateEdgeDensity(data: Uint8ClampedArray, width: number, height: number): number {
  let edgeCount = 0;
  const threshold = 30;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const current = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;

      // Check neighbors
      const right = ((y * width + x + 1) * 4);
      const bottom = (((y + 1) * width + x) * 4);

      const rightVal = (data[right] + data[right + 1] + data[right + 2]) / 3;
      const bottomVal = (data[bottom] + data[bottom + 1] + data[bottom + 2]) / 3;

      if (Math.abs(current - rightVal) > threshold || 
          Math.abs(current - bottomVal) > threshold) {
        edgeCount++;
      }
    }
  }

  // Normalize by image size
  const maxEdges = width * height;
  return Math.min(edgeCount / (maxEdges * 0.3), 1);
}

/**
 * Detect if image has a clean background
 */
function hasCleanBackground(data: Uint8ClampedArray): number {
  // Check corner regions for uniformity
  const cornerSize = Math.floor(Math.sqrt(data.length / 4) * 0.1);
  const corners: number[][] = [];

  // Sample corners
  for (let i = 0; i < cornerSize * 4; i += 4) {
    corners.push([data[i], data[i + 1], data[i + 2]]);
  }

  // Calculate variance in corners
  const avg = corners.reduce(
    (acc, c) => [acc[0] + c[0], acc[1] + c[1], acc[2] + c[2]],
    [0, 0, 0]
  ).map((v) => v / corners.length);

  const variance = corners.reduce(
    (sum, c) =>
      sum +
      Math.pow(c[0] - avg[0], 2) +
      Math.pow(c[1] - avg[1], 2) +
      Math.pow(c[2] - avg[2], 2),
    0
  ) / corners.length;

  // Low variance = clean background
  return Math.max(0, 1 - variance / 5000);
}

// ============================================================================
// CORE ANALYSIS
// ============================================================================

/**
 * Analyze image using heuristics
 */
async function analyzeImageHeuristic(
  imageUrl: string
): Promise<Partial<VisualSaliencyResult>> {
  const imageData = await loadImageData(imageUrl);
  
  if (!imageData) {
    return {
      visualScore: 0.5,
      clarity: 0.5,
      contrast: 0.5,
      focusScore: 0.5,
      composition: 0.5,
      colorVibrancy: 0.5,
    };
  }

  const { data, width, height } = imageData;

  const contrast = calculateContrast(data);
  const colorVibrancy = calculateVibrancy(data);
  const focusScore = calculateEdgeDensity(data, width, height);
  const composition = hasCleanBackground(data);

  // Clarity is a combination of focus and composition
  const clarity = (focusScore * 0.6 + composition * 0.4);

  // Overall visual score
  const visualScore = (
    contrast * 0.25 +
    colorVibrancy * 0.2 +
    focusScore * 0.25 +
    composition * 0.15 +
    clarity * 0.15
  );

  return {
    visualScore,
    clarity,
    contrast,
    focusScore,
    composition,
    colorVibrancy,
  };
}

/**
 * Cosine similarity
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
 * Analyze image using CLIP embeddings
 */
async function analyzeImageCLIP(
  imageUrl: string,
  productId: string
): Promise<Partial<VisualSaliencyResult>> {
  const cacheKey = `visual-${productId}`;
  
  // Check cache
  const cached = await getEmbedding(cacheKey);
  if (cached && anchorEmbeddings) {
    return scoreCLIPEmbedding(cached);
  }

  if (!clipPipeline || !anchorEmbeddings) {
    return {};
  }

  try {
    // Get image embedding
    const output = await clipPipeline(imageUrl);
    const embedding = Array.from(output.data) as number[];

    // Cache it
    await setEmbedding(cacheKey, embedding, 'image', CLIP_MODEL_ID);

    return scoreCLIPEmbedding(embedding);
  } catch (error) {
    console.warn('CLIP analysis failed:', error);
    return {};
  }
}

/**
 * Score CLIP embedding against anchors
 */
function scoreCLIPEmbedding(
  embedding: number[]
): Partial<VisualSaliencyResult> {
  if (!anchorEmbeddings) return {};

  // Positive similarities
  const professional = cosineSimilarity(embedding, anchorEmbeddings.professional);
  const vibrant = cosineSimilarity(embedding, anchorEmbeddings.vibrant);
  const focused = cosineSimilarity(embedding, anchorEmbeddings.focused);

  // Negative similarities (things we want to avoid)
  const cluttered = cosineSimilarity(embedding, anchorEmbeddings.cluttered);
  const dull = cosineSimilarity(embedding, anchorEmbeddings.dull);
  const blurry = cosineSimilarity(embedding, anchorEmbeddings.blurry);

  // Calculate scores
  const clarity = Math.max(0, (focused - blurry + 1) / 2);
  const contrast = Math.max(0, (vibrant - dull + 1) / 2);
  const composition = Math.max(0, (professional - cluttered + 1) / 2);

  const visualScore = (
    professional * 0.3 +
    vibrant * 0.2 +
    focused * 0.3 +
    (1 - cluttered) * 0.1 +
    (1 - blurry) * 0.1
  );

  return {
    visualScore: Math.max(0, Math.min(1, visualScore)),
    clarity,
    contrast,
    composition,
    focusScore: focused,
    colorVibrancy: vibrant,
  };
}

/**
 * Determine visual tier from score
 */
function determineVisualTier(score: number): VisualSaliencyResult['visualTier'] {
  if (score >= config.heroThreshold) return 'Hero';
  if (score >= config.strongThreshold) return 'Strong';
  return 'Standard';
}

/**
 * Generate analysis descriptions
 */
function generateAnalysis(result: Partial<VisualSaliencyResult>): string[] {
  const analysis: string[] = [];

  if ((result.clarity ?? 0) > 0.7) {
    analysis.push('Sharp and clear image');
  } else if ((result.clarity ?? 0) < 0.4) {
    analysis.push('Could benefit from sharper focus');
  }

  if ((result.contrast ?? 0) > 0.7) {
    analysis.push('High visual contrast');
  }

  if ((result.colorVibrancy ?? 0) > 0.6) {
    analysis.push('Vibrant colors');
  }

  if ((result.composition ?? 0) > 0.7) {
    analysis.push('Clean professional composition');
  }

  if (analysis.length === 0) {
    analysis.push('Standard product image');
  }

  return analysis;
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Analyze visual saliency for a product image
 */
export async function analyzeVisualSaliency(
  productId: string,
  imageUrl: string
): Promise<VisualSaliencyResult> {
  // Try CLIP first
  const clipLoaded = await loadCLIP();
  if (clipLoaded) {
    await initializeAnchors();
  }

  // Get CLIP results if available
  const clipResults = clipLoaded
    ? await analyzeImageCLIP(imageUrl, productId)
    : {};

  // Get heuristic results as fallback/supplement
  const heuristicResults = await analyzeImageHeuristic(imageUrl);

  // Merge results (prefer CLIP if available)
  const merged = {
    visualScore: clipResults.visualScore ?? heuristicResults.visualScore ?? 0.5,
    clarity: clipResults.clarity ?? heuristicResults.clarity ?? 0.5,
    contrast: clipResults.contrast ?? heuristicResults.contrast ?? 0.5,
    focusScore: clipResults.focusScore ?? heuristicResults.focusScore ?? 0.5,
    composition: clipResults.composition ?? heuristicResults.composition ?? 0.5,
    colorVibrancy: clipResults.colorVibrancy ?? heuristicResults.colorVibrancy ?? 0.5,
  };

  const visualTier = determineVisualTier(merged.visualScore);
  const analysis = generateAnalysis(merged);

  return {
    productId,
    ...merged,
    visualTier,
    analysis,
  };
}

/**
 * Batch analyze visual saliency for multiple products
 */
export async function batchAnalyzeVisualSaliency(
  products: Array<{ id: string; imageUrl: string }>
): Promise<Map<string, VisualSaliencyResult>> {
  const results = new Map<string, VisualSaliencyResult>();

  // Process in parallel batches
  const batchSize = 5;
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((p) => analyzeVisualSaliency(p.id, p.imageUrl))
    );

    for (const result of batchResults) {
      results.set(result.productId, result);
    }
  }

  return results;
}

/**
 * Get hero-tier images
 */
export async function getHeroImages(
  products: Array<{ id: string; imageUrl: string }>,
  limit: number = 6
): Promise<VisualSaliencyResult[]> {
  const results = await batchAnalyzeVisualSaliency(products);

  return Array.from(results.values())
    .filter((r) => r.visualTier === 'Hero')
    .sort((a, b) => b.visualScore - a.visualScore)
    .slice(0, limit);
}

/**
 * Check if CLIP model is loaded
 */
export function isModelReady(): boolean {
  return clipPipeline !== null;
}

/**
 * Preload CLIP model
 */
export async function preloadModel(): Promise<boolean> {
  const loaded = await loadCLIP();
  if (loaded) {
    await initializeAnchors();
  }
  return loaded;
}

export default {
  analyzeVisualSaliency,
  batchAnalyzeVisualSaliency,
  getHeroImages,
  isModelReady,
  preloadModel,
};
