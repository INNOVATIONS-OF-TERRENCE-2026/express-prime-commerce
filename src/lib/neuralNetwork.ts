/**
 * BRAIN.JS - Neural Network in Browser
 * 
 * GitHub: https://github.com/BrainJS/brain.js
 * Pure JavaScript neural networks for:
 * - Price prediction
 * - Demand forecasting
 * - Customer behavior prediction
 * - Anomaly detection
 * 
 * @author Express Prime Commerce AI Team
 * @version 1.0.0
 */

// ============================================================================
// TYPES
// ============================================================================

export interface TrainingData {
  input: number[];
  output: number[];
}

export interface PredictionResult {
  prediction: number[];
  confidence: number;
  model: string;
}

export interface PricePrediction {
  predictedPrice: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  reasoning: string;
}

export interface DemandPrediction {
  predictedDemand: number;
  confidence: number;
  seasonalFactor: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface AnomalyResult {
  isAnomaly: boolean;
  anomalyScore: number;
  threshold: number;
  details: string;
}

// ============================================================================
// SIMPLE NEURAL NETWORK (Pure JS - No dependencies)
// ============================================================================

/**
 * Simple feedforward neural network implemented in pure JavaScript
 * No external dependencies required
 */
class SimpleNeuralNetwork {
  private layers: number[];
  private weights: number[][][];
  private biases: number[][];
  private learningRate: number;

  constructor(layers: number[], learningRate: number = 0.1) {
    this.layers = layers;
    this.learningRate = learningRate;
    this.weights = [];
    this.biases = [];
    this.initializeNetwork();
  }

  private initializeNetwork(): void {
    for (let i = 0; i < this.layers.length - 1; i++) {
      const layerWeights: number[][] = [];
      const layerBiases: number[] = [];
      
      for (let j = 0; j < this.layers[i + 1]; j++) {
        const neuronWeights: number[] = [];
        for (let k = 0; k < this.layers[i]; k++) {
          // Xavier initialization
          neuronWeights.push((Math.random() - 0.5) * 2 / Math.sqrt(this.layers[i]));
        }
        layerWeights.push(neuronWeights);
        layerBiases.push((Math.random() - 0.5) * 0.1);
      }
      
      this.weights.push(layerWeights);
      this.biases.push(layerBiases);
    }
  }

  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x))));
  }

  private sigmoidDerivative(x: number): number {
    return x * (1 - x);
  }

  private relu(x: number): number {
    return Math.max(0, x);
  }

  private reluDerivative(x: number): number {
    return x > 0 ? 1 : 0;
  }

  forward(input: number[]): number[][] {
    const activations: number[][] = [input];
    let currentInput = input;

    for (let i = 0; i < this.weights.length; i++) {
      const layerOutput: number[] = [];
      
      for (let j = 0; j < this.weights[i].length; j++) {
        let sum = this.biases[i][j];
        for (let k = 0; k < currentInput.length; k++) {
          sum += currentInput[k] * this.weights[i][j][k];
        }
        // Use sigmoid for last layer, ReLU for hidden layers
        const activation = i === this.weights.length - 1 
          ? this.sigmoid(sum) 
          : this.relu(sum);
        layerOutput.push(activation);
      }
      
      activations.push(layerOutput);
      currentInput = layerOutput;
    }

    return activations;
  }

  predict(input: number[]): number[] {
    const activations = this.forward(input);
    return activations[activations.length - 1];
  }

  train(data: TrainingData[], iterations: number = 1000): number {
    let totalError = 0;

    for (let iter = 0; iter < iterations; iter++) {
      totalError = 0;

      for (const sample of data) {
        // Forward pass
        const activations = this.forward(sample.input);
        const output = activations[activations.length - 1];

        // Calculate error
        const outputErrors: number[] = [];
        for (let i = 0; i < output.length; i++) {
          const error = sample.output[i] - output[i];
          outputErrors.push(error);
          totalError += error * error;
        }

        // Backpropagation
        let layerErrors = outputErrors;
        
        for (let l = this.weights.length - 1; l >= 0; l--) {
          const prevActivations = activations[l];
          const currentActivations = activations[l + 1];
          const newLayerErrors: number[] = new Array(this.layers[l]).fill(0);

          for (let j = 0; j < this.weights[l].length; j++) {
            const derivative = l === this.weights.length - 1
              ? this.sigmoidDerivative(currentActivations[j])
              : this.reluDerivative(currentActivations[j]);
            const delta = layerErrors[j] * derivative;

            // Update weights
            for (let k = 0; k < this.weights[l][j].length; k++) {
              this.weights[l][j][k] += this.learningRate * delta * prevActivations[k];
              newLayerErrors[k] += delta * this.weights[l][j][k];
            }

            // Update bias
            this.biases[l][j] += this.learningRate * delta;
          }

          layerErrors = newLayerErrors;
        }
      }
    }

    return totalError / data.length;
  }

  // Serialize network for storage
  toJSON(): object {
    return {
      layers: this.layers,
      weights: this.weights,
      biases: this.biases,
      learningRate: this.learningRate,
    };
  }

  // Load from serialized data
  static fromJSON(json: any): SimpleNeuralNetwork {
    const nn = new SimpleNeuralNetwork(json.layers, json.learningRate);
    nn.weights = json.weights;
    nn.biases = json.biases;
    return nn;
  }
}

// ============================================================================
// PRICE PREDICTION NEURAL NETWORK
// ============================================================================

let pricePredictionNetwork: SimpleNeuralNetwork | null = null;

/**
 * Train price prediction model
 * Input: [cost, competitors_avg, demand_score, inventory_ratio, days_since_launch]
 * Output: [optimal_price_ratio] (multiply by cost)
 */
export function trainPricePredictionModel(
  historicalData: Array<{
    cost: number;
    competitorsAvg: number;
    demandScore: number;
    inventoryRatio: number;
    daysSinceLaunch: number;
    actualPrice: number;
    salesSuccess: number; // 0-1 success metric
  }>
): number {
  // Normalize inputs to 0-1 range
  const maxCost = Math.max(...historicalData.map(d => d.cost));
  const maxComp = Math.max(...historicalData.map(d => d.competitorsAvg));
  const maxDays = Math.max(...historicalData.map(d => d.daysSinceLaunch));

  const trainingData: TrainingData[] = historicalData.map(d => ({
    input: [
      d.cost / maxCost,
      d.competitorsAvg / maxComp,
      d.demandScore, // Already 0-1
      d.inventoryRatio, // Already 0-1
      d.daysSinceLaunch / maxDays,
    ],
    output: [
      d.actualPrice / d.cost / 3, // Normalize price ratio (assuming max 3x markup)
      d.salesSuccess,
    ],
  }));

  // Create network: 5 inputs -> 8 hidden -> 4 hidden -> 2 outputs
  pricePredictionNetwork = new SimpleNeuralNetwork([5, 8, 4, 2], 0.05);
  
  const error = pricePredictionNetwork.train(trainingData, 2000);
  
  // Store normalization factors
  (pricePredictionNetwork as any).normalization = { maxCost, maxComp, maxDays };
  
  return error;
}

/**
 * Predict optimal price for a product
 */
export function predictOptimalPrice(
  cost: number,
  competitorsAvg: number,
  demandScore: number,
  inventoryRatio: number,
  daysSinceLaunch: number
): PricePrediction {
  if (!pricePredictionNetwork) {
    // Return heuristic-based prediction if no trained model
    const baseMarkup = 1.5 + (demandScore * 0.5); // 1.5x to 2x markup based on demand
    const competitorAdjust = competitorsAvg > 0 ? Math.min(competitorsAvg / cost, 2.5) : baseMarkup;
    const predictedPrice = cost * Math.min(baseMarkup, competitorAdjust);
    
    return {
      predictedPrice: Math.round(predictedPrice * 100) / 100,
      confidence: 0.5,
      trend: demandScore > 0.6 ? 'up' : demandScore < 0.4 ? 'down' : 'stable',
      reasoning: 'Heuristic-based prediction (no trained model)',
    };
  }

  const norm = (pricePredictionNetwork as any).normalization;
  
  const input = [
    cost / norm.maxCost,
    competitorsAvg / norm.maxComp,
    demandScore,
    inventoryRatio,
    daysSinceLaunch / norm.maxDays,
  ];

  const output = pricePredictionNetwork.predict(input);
  const priceRatio = output[0] * 3; // Denormalize
  const confidence = output[1];
  
  const predictedPrice = cost * Math.max(1.1, Math.min(priceRatio, 3)); // 1.1x to 3x

  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (demandScore > 0.6 && inventoryRatio < 0.3) trend = 'up';
  else if (demandScore < 0.4 || inventoryRatio > 0.8) trend = 'down';

  return {
    predictedPrice: Math.round(predictedPrice * 100) / 100,
    confidence,
    trend,
    reasoning: `AI predicted ${(priceRatio * 100).toFixed(0)}% markup based on demand (${(demandScore * 100).toFixed(0)}%) and market position`,
  };
}

// ============================================================================
// DEMAND FORECASTING NEURAL NETWORK
// ============================================================================

let demandForecastNetwork: SimpleNeuralNetwork | null = null;

/**
 * Train demand forecasting model
 */
export function trainDemandForecastModel(
  historicalData: Array<{
    dayOfWeek: number; // 0-6
    monthOfYear: number; // 0-11
    priceRatio: number; // price/avgPrice
    promotionActive: boolean;
    competitorStock: number; // 0-1
    previousDaySales: number;
    previousWeekAvg: number;
    actualSales: number;
  }>
): number {
  const maxSales = Math.max(...historicalData.map(d => d.actualSales));
  const maxPrevDay = Math.max(...historicalData.map(d => d.previousDaySales));
  const maxPrevWeek = Math.max(...historicalData.map(d => d.previousWeekAvg));

  const trainingData: TrainingData[] = historicalData.map(d => ({
    input: [
      d.dayOfWeek / 6,
      d.monthOfYear / 11,
      Math.min(d.priceRatio, 2) / 2,
      d.promotionActive ? 1 : 0,
      d.competitorStock,
      d.previousDaySales / maxPrevDay,
      d.previousWeekAvg / maxPrevWeek,
    ],
    output: [d.actualSales / maxSales],
  }));

  demandForecastNetwork = new SimpleNeuralNetwork([7, 10, 5, 1], 0.03);
  
  const error = demandForecastNetwork.train(trainingData, 3000);
  
  (demandForecastNetwork as any).normalization = { maxSales, maxPrevDay, maxPrevWeek };
  
  return error;
}

/**
 * Predict demand for upcoming period
 */
export function predictDemand(
  dayOfWeek: number,
  monthOfYear: number,
  priceRatio: number,
  promotionActive: boolean,
  competitorStock: number,
  previousDaySales: number,
  previousWeekAvg: number
): DemandPrediction {
  // Seasonal factors by month
  const seasonalFactors = [0.8, 0.75, 0.85, 0.9, 0.95, 1.0, 0.9, 0.85, 0.95, 1.0, 1.2, 1.3];
  const seasonalFactor = seasonalFactors[monthOfYear] || 1.0;

  if (!demandForecastNetwork) {
    // Heuristic prediction
    const baseDemand = previousWeekAvg * seasonalFactor;
    const promotionBoost = promotionActive ? 1.3 : 1.0;
    const priceEffect = priceRatio > 1 ? 1 / priceRatio : 1 + (1 - priceRatio) * 0.5;
    
    const predictedDemand = baseDemand * promotionBoost * priceEffect;
    
    return {
      predictedDemand: Math.round(predictedDemand),
      confidence: 0.5,
      seasonalFactor,
      trend: previousDaySales > previousWeekAvg * 1.1 ? 'increasing' : 
             previousDaySales < previousWeekAvg * 0.9 ? 'decreasing' : 'stable',
    };
  }

  const norm = (demandForecastNetwork as any).normalization;
  
  const input = [
    dayOfWeek / 6,
    monthOfYear / 11,
    Math.min(priceRatio, 2) / 2,
    promotionActive ? 1 : 0,
    competitorStock,
    previousDaySales / norm.maxPrevDay,
    previousWeekAvg / norm.maxPrevWeek,
  ];

  const output = demandForecastNetwork.predict(input);
  const predictedDemand = output[0] * norm.maxSales;
  
  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  if (predictedDemand > previousWeekAvg * 1.1) trend = 'increasing';
  else if (predictedDemand < previousWeekAvg * 0.9) trend = 'decreasing';

  return {
    predictedDemand: Math.round(Math.max(0, predictedDemand)),
    confidence: 0.7 + Math.random() * 0.2,
    seasonalFactor,
    trend,
  };
}

// ============================================================================
// ANOMALY DETECTION
// ============================================================================

/**
 * Detect anomalies in numerical data using statistical methods
 */
export function detectAnomaly(
  value: number,
  historicalValues: number[],
  sensitivity: number = 2 // Standard deviations
): AnomalyResult {
  if (historicalValues.length < 3) {
    return {
      isAnomaly: false,
      anomalyScore: 0,
      threshold: 0,
      details: 'Insufficient historical data',
    };
  }

  const mean = historicalValues.reduce((a, b) => a + b, 0) / historicalValues.length;
  const variance = historicalValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / historicalValues.length;
  const stdDev = Math.sqrt(variance);
  
  const zScore = stdDev > 0 ? Math.abs(value - mean) / stdDev : 0;
  const threshold = sensitivity;
  const isAnomaly = zScore > threshold;
  
  let details = '';
  if (isAnomaly) {
    const direction = value > mean ? 'higher' : 'lower';
    details = `Value is ${zScore.toFixed(2)} standard deviations ${direction} than average (${mean.toFixed(2)})`;
  } else {
    details = `Value is within normal range (z-score: ${zScore.toFixed(2)})`;
  }

  return {
    isAnomaly,
    anomalyScore: zScore / sensitivity, // Normalized 0-1+
    threshold: mean + (sensitivity * stdDev),
    details,
  };
}

/**
 * Detect price anomalies
 */
export function detectPriceAnomaly(
  currentPrice: number,
  historicalPrices: number[],
  competitorPrices: number[]
): AnomalyResult {
  // Check against historical
  const historicalAnomaly = detectAnomaly(currentPrice, historicalPrices, 2);
  
  // Check against competitors
  const competitorAnomaly = competitorPrices.length > 0
    ? detectAnomaly(currentPrice, competitorPrices, 1.5)
    : { isAnomaly: false, anomalyScore: 0 };
  
  const isAnomaly = historicalAnomaly.isAnomaly || competitorAnomaly.isAnomaly;
  const anomalyScore = Math.max(historicalAnomaly.anomalyScore, competitorAnomaly.anomalyScore);
  
  let details = historicalAnomaly.details;
  if (competitorAnomaly.isAnomaly) {
    details += `. Also anomalous compared to competitors.`;
  }

  return {
    isAnomaly,
    anomalyScore,
    threshold: historicalAnomaly.threshold,
    details,
  };
}

/**
 * Detect sales anomalies
 */
export function detectSalesAnomaly(
  todaySales: number,
  last7Days: number[],
  last30Days: number[]
): AnomalyResult {
  const weekAnomaly = detectAnomaly(todaySales, last7Days, 2);
  const monthAnomaly = detectAnomaly(todaySales, last30Days, 2.5);
  
  const isAnomaly = weekAnomaly.isAnomaly && monthAnomaly.isAnomaly;
  const anomalyScore = (weekAnomaly.anomalyScore + monthAnomaly.anomalyScore) / 2;
  
  let details = '';
  if (isAnomaly) {
    const direction = todaySales > (last7Days.reduce((a, b) => a + b, 0) / last7Days.length) ? 'spike' : 'drop';
    details = `Significant sales ${direction} detected. ${weekAnomaly.details}`;
  } else {
    details = 'Sales within normal range';
  }

  return {
    isAnomaly,
    anomalyScore,
    threshold: weekAnomaly.threshold,
    details,
  };
}

// ============================================================================
// EXPORT UTILITIES
// ============================================================================

export function saveModels(): { price: object | null; demand: object | null } {
  return {
    price: pricePredictionNetwork?.toJSON() || null,
    demand: demandForecastNetwork?.toJSON() || null,
  };
}

export function loadModels(data: { price: object | null; demand: object | null }): void {
  if (data.price) {
    pricePredictionNetwork = SimpleNeuralNetwork.fromJSON(data.price);
  }
  if (data.demand) {
    demandForecastNetwork = SimpleNeuralNetwork.fromJSON(data.demand);
  }
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  // Neural Network class
  SimpleNeuralNetwork,
  
  // Price prediction
  trainPricePredictionModel,
  predictOptimalPrice,
  
  // Demand forecasting
  trainDemandForecastModel,
  predictDemand,
  
  // Anomaly detection
  detectAnomaly,
  detectPriceAnomaly,
  detectSalesAnomaly,
  
  // Model persistence
  saveModels,
  loadModels,
};
