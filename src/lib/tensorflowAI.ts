/**
 * TensorFlow.js Integration - GPU-Accelerated ML in Browser
 * 
 * GitHub: https://github.com/tensorflow/tfjs
 * 
 * Features:
 * - GPU acceleration via WebGL
 * - Pre-trained models for image/text
 * - Custom model training in browser
 * - Transfer learning support
 * 
 * @author Express Prime Commerce AI Team
 * @version 1.0.0
 */

// ============================================================================
// LAZY IMPORT - Only load TensorFlow when needed
// ============================================================================

let tf: any = null;
let mobilenet: any = null;
let toxicity: any = null;
let qna: any = null;

async function loadTensorFlow(): Promise<boolean> {
  if (tf) return true;
  
  try {
    tf = await import('@tensorflow/tfjs');
    // Set backend to WebGL for GPU acceleration
    await tf.setBackend('webgl');
    await tf.ready();
    return true;
  } catch (error) {
    console.warn('TensorFlow.js not available:', error);
    return false;
  }
}

async function loadMobilenet(): Promise<boolean> {
  if (mobilenet) return true;
  
  try {
    const loaded = await loadTensorFlow();
    if (!loaded) return false;
    
    mobilenet = await import('@tensorflow-models/mobilenet');
    return true;
  } catch (error) {
    console.warn('MobileNet not available:', error);
    return false;
  }
}

async function loadToxicity(): Promise<boolean> {
  // Toxicity model has dependency conflicts - use custom implementation
  console.info('Using custom toxicity detection (TF toxicity model has peer dep conflicts)');
  return false;
}

async function loadQnA(): Promise<boolean> {
  if (qna) return true;
  
  try {
    const loaded = await loadTensorFlow();
    if (!loaded) return false;
    
    qna = await import('@tensorflow-models/qna');
    return true;
  } catch (error) {
    console.warn('QnA model not available:', error);
    return false;
  }
}

// ============================================================================
// TYPES
// ============================================================================

export interface ImageClassification {
  className: string;
  probability: number;
}

export interface ToxicityResult {
  label: string;
  match: boolean;
  probabilities: { true: number; false: number };
}

export interface QnAResult {
  text: string;
  startIndex: number;
  endIndex: number;
  score: number;
}

export interface TimeSeriesPrediction {
  predictions: number[];
  confidence: number;
  model: string;
}

// ============================================================================
// MODEL CACHE
// ============================================================================

let mobilenetModel: any = null;
let toxicityModel: any = null;
let qnaModel: any = null;

// ============================================================================
// IMAGE CLASSIFICATION
// ============================================================================

/**
 * Classify product images using MobileNet
 * Pre-trained on ImageNet (1000 categories)
 */
export async function classifyProductImage(
  imageElement: HTMLImageElement | HTMLCanvasElement
): Promise<ImageClassification[]> {
  const available = await loadMobilenet();
  if (!available) {
    return [{ className: 'unknown', probability: 0 }];
  }
  
  try {
    if (!mobilenetModel) {
      mobilenetModel = await mobilenet.load();
    }
    
    const predictions = await mobilenetModel.classify(imageElement);
    
    return predictions.map((p: any) => ({
      className: p.className,
      probability: p.probability,
    }));
  } catch (error) {
    console.error('Image classification failed:', error);
    return [{ className: 'error', probability: 0 }];
  }
}

/**
 * Get image embeddings for similarity search
 */
export async function getImageEmbedding(
  imageElement: HTMLImageElement | HTMLCanvasElement
): Promise<number[]> {
  const available = await loadMobilenet();
  if (!available || !tf) {
    return [];
  }
  
  try {
    if (!mobilenetModel) {
      mobilenetModel = await mobilenet.load();
    }
    
    // Get embeddings from the model
    const embedding = await mobilenetModel.infer(imageElement, true);
    const data = await embedding.data();
    embedding.dispose();
    
    return Array.from(data);
  } catch (error) {
    console.error('Image embedding failed:', error);
    return [];
  }
}

// ============================================================================
// TOXICITY DETECTION (for reviews/comments)
// ============================================================================

// Simple bad word list for fallback toxicity detection
const TOXIC_PATTERNS = [
  /\b(spam|scam|fake|fraud)\b/gi,
  /\b(stupid|idiot|moron|dumb)\b/gi,
];

/**
 * Check if text contains toxic content
 * Useful for moderating product reviews
 * Uses simple pattern matching as TF toxicity model has peer dep conflicts
 */
export async function detectToxicity(
  texts: string[],
  threshold: number = 0.9
): Promise<Map<string, ToxicityResult[]>> {
  const results = new Map<string, ToxicityResult[]>();
  
  texts.forEach((text) => {
    const textResults: ToxicityResult[] = [];
    const lowerText = text.toLowerCase();
    
    // Simple heuristic-based toxicity check
    const hasToxicPatterns = TOXIC_PATTERNS.some(pattern => pattern.test(text));
    const hasExcessiveCaps = text.length > 10 && 
      (text.match(/[A-Z]/g)?.length || 0) / text.length > 0.7;
    const hasExcessivePunctuation = (text.match(/[!?]{3,}/g)?.length || 0) > 0;
    
    const toxicityScore = (hasToxicPatterns ? 0.6 : 0) + 
                          (hasExcessiveCaps ? 0.2 : 0) + 
                          (hasExcessivePunctuation ? 0.1 : 0);
    
    textResults.push({
      label: 'toxicity',
      match: toxicityScore >= threshold,
      probabilities: { true: toxicityScore, false: 1 - toxicityScore },
    });
    
    textResults.push({
      label: 'spam',
      match: hasToxicPatterns,
      probabilities: { true: hasToxicPatterns ? 0.9 : 0.1, false: hasToxicPatterns ? 0.1 : 0.9 },
    });
    
    results.set(text, textResults);
  });
  
  return results;
}

/**
 * Check if a review is appropriate for display
 */
export async function isReviewAppropriate(
  reviewText: string
): Promise<{ appropriate: boolean; reasons: string[] }> {
  const results = await detectToxicity([reviewText], 0.85);
  const analysis = results.get(reviewText);
  
  if (!analysis) {
    return { appropriate: true, reasons: [] };
  }
  
  const inappropriate = analysis.filter(r => r.match);
  
  return {
    appropriate: inappropriate.length === 0,
    reasons: inappropriate.map(r => r.label),
  };
}

// ============================================================================
// QUESTION ANSWERING
// ============================================================================

/**
 * Answer questions about product descriptions
 */
export async function answerProductQuestion(
  question: string,
  productDescription: string
): Promise<QnAResult[]> {
  const available = await loadQnA();
  if (!available) {
    return [];
  }
  
  try {
    if (!qnaModel) {
      qnaModel = await qna.load();
    }
    
    const answers = await qnaModel.findAnswers(question, productDescription);
    
    return answers.map((a: any) => ({
      text: a.text,
      startIndex: a.startIndex,
      endIndex: a.endIndex,
      score: a.score,
    }));
  } catch (error) {
    console.error('QnA failed:', error);
    return [];
  }
}

// ============================================================================
// TIME SERIES PREDICTION (Custom LSTM)
// ============================================================================

let timeSeriesModel: any = null;

/**
 * Create and train a simple LSTM model for time series prediction
 */
export async function trainTimeSeriesModel(
  data: number[],
  lookback: number = 7,
  epochs: number = 50
): Promise<boolean> {
  const available = await loadTensorFlow();
  if (!available) return false;
  
  try {
    // Prepare training data
    const xs: number[][] = [];
    const ys: number[] = [];
    
    for (let i = lookback; i < data.length; i++) {
      xs.push(data.slice(i - lookback, i));
      ys.push(data[i]);
    }
    
    // Normalize data
    const max = Math.max(...data);
    const normalizedXs = xs.map(x => x.map(v => v / max));
    const normalizedYs = ys.map(y => y / max);
    
    // Convert to tensors
    const xTensor = tf.tensor3d(normalizedXs.map(x => x.map(v => [v])));
    const yTensor = tf.tensor2d(normalizedYs.map(y => [y]));
    
    // Build LSTM model
    timeSeriesModel = tf.sequential();
    
    timeSeriesModel.add(tf.layers.lstm({
      units: 32,
      inputShape: [lookback, 1],
      returnSequences: false,
    }));
    
    timeSeriesModel.add(tf.layers.dense({ units: 16, activation: 'relu' }));
    timeSeriesModel.add(tf.layers.dense({ units: 1 }));
    
    timeSeriesModel.compile({
      optimizer: tf.train.adam(0.01),
      loss: 'meanSquaredError',
    });
    
    // Train
    await timeSeriesModel.fit(xTensor, yTensor, {
      epochs,
      batchSize: 16,
      shuffle: true,
      verbose: 0,
    });
    
    // Store normalization factor
    (timeSeriesModel as any).maxValue = max;
    (timeSeriesModel as any).lookback = lookback;
    
    // Cleanup
    xTensor.dispose();
    yTensor.dispose();
    
    return true;
  } catch (error) {
    console.error('Time series training failed:', error);
    return false;
  }
}

/**
 * Predict future values using trained LSTM
 */
export async function predictTimeSeries(
  recentData: number[],
  stepsAhead: number = 7
): Promise<TimeSeriesPrediction> {
  if (!timeSeriesModel || !tf) {
    // Fallback to simple moving average
    const avg = recentData.reduce((a, b) => a + b, 0) / recentData.length;
    return {
      predictions: new Array(stepsAhead).fill(Math.round(avg)),
      confidence: 0.3,
      model: 'fallback-average',
    };
  }
  
  try {
    const lookback = (timeSeriesModel as any).lookback;
    const max = (timeSeriesModel as any).maxValue;
    
    let currentInput = recentData.slice(-lookback).map(v => v / max);
    const predictions: number[] = [];
    
    for (let i = 0; i < stepsAhead; i++) {
      const inputTensor = tf.tensor3d([[currentInput.map(v => [v])]]);
      const predTensor = timeSeriesModel.predict(inputTensor) as any;
      const predValue = (await predTensor.data())[0] * max;
      
      predictions.push(Math.round(Math.max(0, predValue)));
      
      // Slide window
      currentInput = [...currentInput.slice(1), predValue / max];
      
      inputTensor.dispose();
      predTensor.dispose();
    }
    
    return {
      predictions,
      confidence: 0.75,
      model: 'lstm-custom',
    };
  } catch (error) {
    console.error('Time series prediction failed:', error);
    return {
      predictions: [],
      confidence: 0,
      model: 'error',
    };
  }
}

// ============================================================================
// UTILITIES
// ============================================================================

export async function isTensorFlowAvailable(): Promise<boolean> {
  return await loadTensorFlow();
}

export function disposeModels(): void {
  if (mobilenetModel) {
    mobilenetModel = null;
  }
  if (toxicityModel) {
    toxicityModel = null;
  }
  if (qnaModel) {
    qnaModel = null;
  }
  if (timeSeriesModel) {
    timeSeriesModel.dispose();
    timeSeriesModel = null;
  }
  if (tf) {
    tf.disposeVariables();
  }
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  // Image
  classifyProductImage,
  getImageEmbedding,
  
  // Toxicity
  detectToxicity,
  isReviewAppropriate,
  
  // QnA
  answerProductQuestion,
  
  // Time Series
  trainTimeSeriesModel,
  predictTimeSeries,
  
  // Utilities
  isTensorFlowAvailable,
  disposeModels,
};
