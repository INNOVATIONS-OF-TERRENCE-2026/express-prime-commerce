/**
 * XENOVA TRANSFORMERS.JS - Browser-Based Open Source AI
 * 
 * Runs Hugging Face models DIRECTLY in the browser using WebGPU/WASM
 * NO API CALLS - Models run locally, completely free and private
 * 
 * GitHub: https://github.com/xenova/transformers.js
 * 
 * Models Available:
 * - Xenova/all-MiniLM-L6-v2 (embeddings)
 * - Xenova/distilbert-base-uncased-finetuned-sst-2-english (sentiment)
 * - Xenova/nllb-200-distilled-600M (translation)
 * - Xenova/whisper-tiny (speech-to-text)
 * - Xenova/vit-gpt2-image-captioning (image descriptions)
 * 
 * @author Express Prime Commerce AI Team
 * @version 1.0.0 - GitHub Open Source Edition
 */

// Note: These imports will work after installing @xenova/transformers
// For now, we use dynamic imports to avoid build errors if not installed

let pipeline: any = null;
let env: any = null;

// Lazy load transformers.js
async function loadTransformers() {
  if (!pipeline) {
    try {
      const transformers = await import('@xenova/transformers');
      pipeline = transformers.pipeline;
      env = transformers.env;
      
      // Configure for browser usage
      if (env) {
        env.allowLocalModels = false;
        env.useBrowserCache = true;
      }
    } catch (error) {
      console.warn('Transformers.js not available, using fallback');
      return false;
    }
  }
  return true;
}

// ============================================================================
// MODEL CACHE - Persist loaded models for performance
// ============================================================================

const modelCache: Map<string, any> = new Map();

async function getModel(task: string, model: string): Promise<any> {
  const cacheKey = `${task}:${model}`;
  
  if (modelCache.has(cacheKey)) {
    return modelCache.get(cacheKey);
  }
  
  const loaded = await loadTransformers();
  if (!loaded || !pipeline) {
    throw new Error('Transformers.js not available');
  }
  
  console.log(`Loading model: ${model} for task: ${task}`);
  const modelInstance = await pipeline(task, model);
  modelCache.set(cacheKey, modelInstance);
  
  return modelInstance;
}

// ============================================================================
// TYPES
// ============================================================================

export interface LocalSentimentResult {
  label: 'POSITIVE' | 'NEGATIVE';
  score: number;
  model: string;
  processingTime: number;
}

export interface LocalEmbeddingResult {
  embedding: number[];
  dimension: number;
  model: string;
  processingTime: number;
}

export interface LocalClassificationResult {
  label: string;
  score: number;
  allLabels: Array<{ label: string; score: number }>;
  model: string;
  processingTime: number;
}

export interface LocalTextGenerationResult {
  text: string;
  model: string;
  processingTime: number;
}

export interface LocalQuestionAnswerResult {
  answer: string;
  score: number;
  start: number;
  end: number;
  model: string;
  processingTime: number;
}

export interface LocalSummarizationResult {
  summary: string;
  model: string;
  processingTime: number;
}

export interface LocalImageCaptionResult {
  caption: string;
  model: string;
  processingTime: number;
}

// ============================================================================
// SENTIMENT ANALYSIS - Runs 100% in browser
// ============================================================================

/**
 * Analyze sentiment using DistilBERT running locally in browser
 * Model: Xenova/distilbert-base-uncased-finetuned-sst-2-english
 */
export async function localSentimentAnalysis(
  text: string
): Promise<LocalSentimentResult> {
  const startTime = performance.now();
  const modelName = 'Xenova/distilbert-base-uncased-finetuned-sst-2-english';
  
  try {
    const classifier = await getModel('sentiment-analysis', modelName);
    const result = await classifier(text);
    
    const processingTime = performance.now() - startTime;
    
    return {
      label: result[0].label as 'POSITIVE' | 'NEGATIVE',
      score: result[0].score,
      model: modelName,
      processingTime,
    };
  } catch (error) {
    console.error('Local sentiment analysis failed:', error);
    return {
      label: 'POSITIVE',
      score: 0.5,
      model: 'fallback',
      processingTime: performance.now() - startTime,
    };
  }
}

/**
 * Batch sentiment analysis - process multiple texts
 */
export async function localBatchSentiment(
  texts: string[]
): Promise<LocalSentimentResult[]> {
  const results: LocalSentimentResult[] = [];
  
  for (const text of texts) {
    const result = await localSentimentAnalysis(text);
    results.push(result);
  }
  
  return results;
}

// ============================================================================
// EMBEDDINGS - For semantic search
// ============================================================================

/**
 * Generate embeddings using all-MiniLM-L6-v2 running locally
 * Model: Xenova/all-MiniLM-L6-v2 (384 dimensions)
 */
export async function localGenerateEmbedding(
  text: string
): Promise<LocalEmbeddingResult> {
  const startTime = performance.now();
  const modelName = 'Xenova/all-MiniLM-L6-v2';
  
  try {
    const embedder = await getModel('feature-extraction', modelName);
    const result = await embedder(text, { pooling: 'mean', normalize: true });
    
    const embedding = Array.from(result.data);
    const processingTime = performance.now() - startTime;
    
    return {
      embedding: embedding as number[],
      dimension: embedding.length,
      model: modelName,
      processingTime,
    };
  } catch (error) {
    console.error('Local embedding generation failed:', error);
    return {
      embedding: new Array(384).fill(0),
      dimension: 384,
      model: 'fallback',
      processingTime: performance.now() - startTime,
    };
  }
}

/**
 * Calculate cosine similarity between two embeddings
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Find similar texts using embeddings
 */
export async function localFindSimilar(
  query: string,
  candidates: string[],
  topK: number = 5
): Promise<Array<{ text: string; similarity: number; index: number }>> {
  const queryEmbedding = await localGenerateEmbedding(query);
  
  const similarities: Array<{ text: string; similarity: number; index: number }> = [];
  
  for (let i = 0; i < candidates.length; i++) {
    const candidateEmbedding = await localGenerateEmbedding(candidates[i]);
    const similarity = cosineSimilarity(queryEmbedding.embedding, candidateEmbedding.embedding);
    similarities.push({ text: candidates[i], similarity, index: i });
  }
  
  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}

// ============================================================================
// ZERO-SHOT CLASSIFICATION
// ============================================================================

/**
 * Classify text into categories without training
 * Model: Xenova/bart-large-mnli
 */
export async function localZeroShotClassification(
  text: string,
  labels: string[]
): Promise<LocalClassificationResult> {
  const startTime = performance.now();
  const modelName = 'Xenova/bart-large-mnli';
  
  try {
    const classifier = await getModel('zero-shot-classification', modelName);
    const result = await classifier(text, labels);
    
    const processingTime = performance.now() - startTime;
    
    const allLabels = result.labels.map((label: string, i: number) => ({
      label,
      score: result.scores[i],
    }));
    
    return {
      label: result.labels[0],
      score: result.scores[0],
      allLabels,
      model: modelName,
      processingTime,
    };
  } catch (error) {
    console.error('Local classification failed:', error);
    return {
      label: labels[0] || 'Unknown',
      score: 0,
      allLabels: labels.map(l => ({ label: l, score: 0 })),
      model: 'fallback',
      processingTime: performance.now() - startTime,
    };
  }
}

// ============================================================================
// TEXT GENERATION
// ============================================================================

/**
 * Generate text using GPT-2
 * Model: Xenova/gpt2
 */
export async function localGenerateText(
  prompt: string,
  maxLength: number = 100
): Promise<LocalTextGenerationResult> {
  const startTime = performance.now();
  const modelName = 'Xenova/gpt2';
  
  try {
    const generator = await getModel('text-generation', modelName);
    const result = await generator(prompt, {
      max_new_tokens: maxLength,
      temperature: 0.7,
      do_sample: true,
    });
    
    const processingTime = performance.now() - startTime;
    
    return {
      text: result[0].generated_text,
      model: modelName,
      processingTime,
    };
  } catch (error) {
    console.error('Local text generation failed:', error);
    return {
      text: prompt,
      model: 'fallback',
      processingTime: performance.now() - startTime,
    };
  }
}

// ============================================================================
// QUESTION ANSWERING
// ============================================================================

/**
 * Answer questions based on context
 * Model: Xenova/distilbert-base-cased-distilled-squad
 */
export async function localQuestionAnswer(
  question: string,
  context: string
): Promise<LocalQuestionAnswerResult> {
  const startTime = performance.now();
  const modelName = 'Xenova/distilbert-base-cased-distilled-squad';
  
  try {
    const qa = await getModel('question-answering', modelName);
    const result = await qa(question, context);
    
    const processingTime = performance.now() - startTime;
    
    return {
      answer: result.answer,
      score: result.score,
      start: result.start,
      end: result.end,
      model: modelName,
      processingTime,
    };
  } catch (error) {
    console.error('Local QA failed:', error);
    return {
      answer: 'Unable to answer',
      score: 0,
      start: 0,
      end: 0,
      model: 'fallback',
      processingTime: performance.now() - startTime,
    };
  }
}

// ============================================================================
// SUMMARIZATION
// ============================================================================

/**
 * Summarize text
 * Model: Xenova/distilbart-cnn-6-6
 */
export async function localSummarize(
  text: string,
  maxLength: number = 150
): Promise<LocalSummarizationResult> {
  const startTime = performance.now();
  const modelName = 'Xenova/distilbart-cnn-6-6';
  
  try {
    const summarizer = await getModel('summarization', modelName);
    const result = await summarizer(text, {
      max_length: maxLength,
      min_length: 30,
    });
    
    const processingTime = performance.now() - startTime;
    
    return {
      summary: result[0].summary_text,
      model: modelName,
      processingTime,
    };
  } catch (error) {
    console.error('Local summarization failed:', error);
    return {
      summary: text.slice(0, maxLength),
      model: 'fallback',
      processingTime: performance.now() - startTime,
    };
  }
}

// ============================================================================
// FILL-MASK (for suggestions)
// ============================================================================

/**
 * Fill in masked text - useful for suggestions
 * Model: Xenova/bert-base-uncased
 */
export async function localFillMask(
  maskedText: string
): Promise<Array<{ token: string; score: number }>> {
  const modelName = 'Xenova/bert-base-uncased';
  
  try {
    const filler = await getModel('fill-mask', modelName);
    const result = await filler(maskedText);
    
    return result.map((r: any) => ({
      token: r.token_str,
      score: r.score,
    }));
  } catch (error) {
    console.error('Local fill-mask failed:', error);
    return [];
  }
}

// ============================================================================
// NAMED ENTITY RECOGNITION
// ============================================================================

/**
 * Extract entities from text
 * Model: Xenova/bert-base-NER
 */
export async function localExtractEntities(
  text: string
): Promise<Array<{ word: string; entity: string; score: number }>> {
  const modelName = 'Xenova/bert-base-NER';
  
  try {
    const ner = await getModel('token-classification', modelName);
    const result = await ner(text);
    
    return result.map((r: any) => ({
      word: r.word,
      entity: r.entity,
      score: r.score,
    }));
  } catch (error) {
    console.error('Local NER failed:', error);
    return [];
  }
}

// ============================================================================
// IMAGE CAPTIONING
// ============================================================================

/**
 * Generate captions for images
 * Model: Xenova/vit-gpt2-image-captioning
 */
export async function localCaptionImage(
  imageUrl: string
): Promise<LocalImageCaptionResult> {
  const startTime = performance.now();
  const modelName = 'Xenova/vit-gpt2-image-captioning';
  
  try {
    const captioner = await getModel('image-to-text', modelName);
    const result = await captioner(imageUrl);
    
    const processingTime = performance.now() - startTime;
    
    return {
      caption: result[0].generated_text,
      model: modelName,
      processingTime,
    };
  } catch (error) {
    console.error('Local image captioning failed:', error);
    return {
      caption: 'Product image',
      model: 'fallback',
      processingTime: performance.now() - startTime,
    };
  }
}

// ============================================================================
// PRODUCT-SPECIFIC FUNCTIONS
// ============================================================================

/**
 * Analyze a product listing using multiple local models
 */
export async function localAnalyzeProduct(
  title: string,
  description: string,
  imageUrl?: string
): Promise<{
  sentiment: LocalSentimentResult;
  category: LocalClassificationResult;
  embedding: LocalEmbeddingResult;
  imageCaption?: LocalImageCaptionResult;
  totalProcessingTime: number;
}> {
  const startTime = performance.now();
  
  const fullText = `${title}. ${description}`;
  
  // Run analyses in parallel
  const [sentiment, category, embedding] = await Promise.all([
    localSentimentAnalysis(fullText),
    localZeroShotClassification(fullText, [
      'Electronics',
      'Health & Wellness',
      'Home & Living',
      'Kitchen',
      'Office',
      'Fitness',
      'Beauty',
      'Outdoor',
      'Pet Supplies',
      'Toys',
    ]),
    localGenerateEmbedding(fullText),
  ]);
  
  let imageCaption: LocalImageCaptionResult | undefined;
  if (imageUrl) {
    try {
      imageCaption = await localCaptionImage(imageUrl);
    } catch (e) {
      // Image captioning is optional
    }
  }
  
  const totalProcessingTime = performance.now() - startTime;
  
  return {
    sentiment,
    category,
    embedding,
    imageCaption,
    totalProcessingTime,
  };
}

/**
 * Generate smart product description suggestions
 */
export async function localGenerateProductSuggestions(
  title: string,
  features: string[]
): Promise<{
  description: string;
  bulletPoints: string[];
  keywords: string[];
}> {
  const featureText = features.join('. ');
  const prompt = `Product: ${title}\nFeatures: ${featureText}\n\nDescription:`;
  
  try {
    const generated = await localGenerateText(prompt, 150);
    
    // Extract keywords using NER
    const entities = await localExtractEntities(`${title} ${featureText}`);
    const keywords = entities
      .filter(e => e.score > 0.8)
      .map(e => e.word)
      .filter((w, i, arr) => arr.indexOf(w) === i);
    
    return {
      description: generated.text.replace(prompt, '').trim(),
      bulletPoints: features.map(f => `• ${f}`),
      keywords,
    };
  } catch (error) {
    return {
      description: `${title} - ${features.join(', ')}`,
      bulletPoints: features.map(f => `• ${f}`),
      keywords: title.split(' ').filter(w => w.length > 3),
    };
  }
}

/**
 * Find similar products using embeddings
 */
export async function localFindSimilarProducts(
  productDescription: string,
  allProducts: Array<{ id: string; title: string; description: string }>,
  topK: number = 5
): Promise<Array<{ id: string; title: string; similarity: number }>> {
  const queryEmbedding = await localGenerateEmbedding(productDescription);
  
  const similarities: Array<{ id: string; title: string; similarity: number }> = [];
  
  for (const product of allProducts) {
    const productEmbedding = await localGenerateEmbedding(
      `${product.title}. ${product.description}`
    );
    const similarity = cosineSimilarity(
      queryEmbedding.embedding,
      productEmbedding.embedding
    );
    similarities.push({ id: product.id, title: product.title, similarity });
  }
  
  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}

// ============================================================================
// UTILITY: Check if Transformers.js is available
// ============================================================================

export async function isTransformersAvailable(): Promise<boolean> {
  return await loadTransformers();
}

export function clearModelCache(): void {
  modelCache.clear();
}

export function getLoadedModels(): string[] {
  return Array.from(modelCache.keys());
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  // Sentiment
  localSentimentAnalysis,
  localBatchSentiment,
  
  // Embeddings
  localGenerateEmbedding,
  localFindSimilar,
  cosineSimilarity,
  
  // Classification
  localZeroShotClassification,
  
  // Generation
  localGenerateText,
  localSummarize,
  localFillMask,
  
  // QA
  localQuestionAnswer,
  
  // NER
  localExtractEntities,
  
  // Vision
  localCaptionImage,
  
  // Product-specific
  localAnalyzeProduct,
  localGenerateProductSuggestions,
  localFindSimilarProducts,
  
  // Utilities
  isTransformersAvailable,
  clearModelCache,
  getLoadedModels,
};
