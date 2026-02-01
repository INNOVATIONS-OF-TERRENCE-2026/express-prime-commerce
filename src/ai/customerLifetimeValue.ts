/**
 * Customer Lifetime Value (CLV) Predictor
 * 
 * AI-powered prediction of customer lifetime value using
 * behavioral patterns, purchase history, and engagement metrics.
 * 
 * MODELS:
 * - RFM (Recency, Frequency, Monetary) Analysis
 * - Probabilistic CLV with BG/NBD Model
 * - Churn Prediction
 * - Next Purchase Timing
 * 
 * @module ai/customerLifetimeValue
 * @version 1.0.0
 */

// ============================================================================
// TYPES
// ============================================================================

export type CustomerTier = 
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'diamond';

export type ChurnRisk = 'low' | 'medium' | 'high' | 'critical';

export type CustomerStatus = 
  | 'new'
  | 'active'
  | 'at_risk'
  | 'dormant'
  | 'churned'
  | 'reactivated';

export interface CustomerProfile {
  customerId: string;
  email: string;
  name?: string;
  // Purchase history
  totalOrders: number;
  totalSpent: number;
  avgOrderValue: number;
  firstPurchaseDate: Date;
  lastPurchaseDate: Date;
  // Engagement
  totalSessions: number;
  totalPageViews: number;
  lastActivityDate: Date;
  emailEngagementRate: number;
  // Products
  favoriteCategories: string[];
  purchasedProductIds: string[];
  // Status
  tier: CustomerTier;
  status: CustomerStatus;
  isSubscribed: boolean;
  hasAccount: boolean;
}

export interface RFMScores {
  recency: number; // 1-5 (5 = recent)
  frequency: number; // 1-5 (5 = frequent)
  monetary: number; // 1-5 (5 = high value)
  combined: number; // 3-15
  segment: RFMSegment;
}

export type RFMSegment = 
  | 'champions'
  | 'loyal_customers'
  | 'potential_loyalists'
  | 'new_customers'
  | 'promising'
  | 'need_attention'
  | 'about_to_sleep'
  | 'at_risk'
  | 'cant_lose_them'
  | 'hibernating'
  | 'lost';

export interface CLVPrediction {
  customerId: string;
  timestamp: Date;
  // CLV Metrics
  historicalCLV: number;
  predictedCLV12Months: number;
  predictedCLV36Months: number;
  predictedLifetimeCLV: number;
  // Confidence
  confidenceScore: number;
  predictionRange: {
    low: number;
    high: number;
  };
  // Behavioral predictions
  expectedPurchases12Months: number;
  expectedAvgOrderValue: number;
  nextPurchaseProbability: number;
  daysTillNextPurchase: number;
  // Churn analysis
  churnRisk: ChurnRisk;
  churnProbability: number;
  daysToChurn?: number;
  // Recommendations
  recommendations: CLVRecommendation[];
  // Factors
  positiveFactors: string[];
  negativeFactors: string[];
}

export interface CLVRecommendation {
  type: 'engagement' | 'retention' | 'upsell' | 'reactivation' | 'loyalty';
  action: string;
  priority: 'low' | 'medium' | 'high';
  expectedImpact: number;
  channel: 'email' | 'sms' | 'push' | 'onsite' | 'direct';
}

export interface ChurnAnalysis {
  customerId: string;
  churnRisk: ChurnRisk;
  churnProbability: number;
  daysSinceLastPurchase: number;
  avgDaysBetweenPurchases: number;
  purchaseDeclineRate: number;
  engagementDeclineRate: number;
  warningSignals: string[];
  preventionActions: string[];
}

export interface CohortAnalysis {
  cohortMonth: string;
  customersAcquired: number;
  retentionByMonth: number[];
  avgCLV: number;
  avgOrders: number;
  avgOrderValue: number;
}

export interface CLVStats {
  // Overview
  totalCustomers: number;
  avgCLV: number;
  medianCLV: number;
  totalPredictedRevenue: number;
  // Tiers
  tierDistribution: Record<CustomerTier, number>;
  tierRevenue: Record<CustomerTier, number>;
  // Churn
  atRiskCustomers: number;
  churnedLastMonth: number;
  reactivatedLastMonth: number;
  avgChurnRate: number;
  // Segments
  rfmDistribution: Record<RFMSegment, number>;
  // Top customers
  top10Customers: Array<{ customerId: string; clv: number }>;
}

// ============================================================================
// STATE
// ============================================================================

const customerProfiles: Map<string, CustomerProfile> = new Map();
const clvPredictions: Map<string, CLVPrediction> = new Map();
const churnAnalyses: Map<string, ChurnAnalysis> = new Map();

// Model parameters (would be trained in production)
const modelParams = {
  // BG/NBD model parameters
  bgNbd: {
    r: 0.24,
    alpha: 4.41,
    a: 0.79,
    b: 2.43,
  },
  // Average customer lifespan in months
  avgLifespanMonths: 36,
  // Discount rate for NPV calculation
  discountRate: 0.1,
};

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Calculate RFM scores for a customer
 */
export function calculateRFMScores(profile: CustomerProfile): RFMScores {
  const now = new Date();
  
  // Recency: Days since last purchase (lower = better)
  const daysSinceLastPurchase = Math.floor(
    (now.getTime() - profile.lastPurchaseDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  // Score recency (1-5)
  let recency: number;
  if (daysSinceLastPurchase <= 7) recency = 5;
  else if (daysSinceLastPurchase <= 30) recency = 4;
  else if (daysSinceLastPurchase <= 90) recency = 3;
  else if (daysSinceLastPurchase <= 180) recency = 2;
  else recency = 1;
  
  // Score frequency (1-5)
  let frequency: number;
  if (profile.totalOrders >= 10) frequency = 5;
  else if (profile.totalOrders >= 5) frequency = 4;
  else if (profile.totalOrders >= 3) frequency = 3;
  else if (profile.totalOrders >= 2) frequency = 2;
  else frequency = 1;
  
  // Score monetary (1-5)
  let monetary: number;
  if (profile.totalSpent >= 1000) monetary = 5;
  else if (profile.totalSpent >= 500) monetary = 4;
  else if (profile.totalSpent >= 200) monetary = 3;
  else if (profile.totalSpent >= 100) monetary = 2;
  else monetary = 1;
  
  const combined = recency + frequency + monetary;
  
  // Determine segment
  const segment = determineRFMSegment(recency, frequency, monetary);
  
  return { recency, frequency, monetary, combined, segment };
}

/**
 * Predict CLV for a customer
 */
export function predictCLV(profile: CustomerProfile): CLVPrediction {
  const rfm = calculateRFMScores(profile);
  const now = new Date();
  
  // Historical CLV
  const historicalCLV = profile.totalSpent;
  
  // Customer tenure in months
  const tenureMonths = Math.max(1, Math.floor(
    (now.getTime() - profile.firstPurchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
  ));
  
  // Purchase frequency per month
  const purchaseFrequency = profile.totalOrders / tenureMonths;
  
  // Expected purchases in next 12 months
  const expectedPurchases12Months = purchaseFrequency * 12 * (rfm.recency / 3);
  
  // Expected AOV (with slight growth assumption)
  const expectedAvgOrderValue = profile.avgOrderValue * 1.05;
  
  // Predicted 12-month CLV
  const predictedCLV12Months = expectedPurchases12Months * expectedAvgOrderValue;
  
  // Predicted 36-month CLV (with decay)
  const predictedCLV36Months = predictedCLV12Months + 
    (predictedCLV12Months * 0.8) + // Year 2
    (predictedCLV12Months * 0.6);  // Year 3
  
  // Lifetime CLV (NPV of future purchases)
  const avgPurchasesPerYear = purchaseFrequency * 12;
  const avgRevenuePerYear = avgPurchasesPerYear * expectedAvgOrderValue;
  const predictedLifetimeCLV = calculateNPV(avgRevenuePerYear, modelParams.avgLifespanMonths / 12, modelParams.discountRate);
  
  // Calculate churn analysis
  const churn = analyzeChurn(profile);
  
  // Next purchase probability
  const daysSinceLastPurchase = Math.floor(
    (now.getTime() - profile.lastPurchaseDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const avgDaysBetweenPurchases = profile.totalOrders > 1 
    ? tenureMonths * 30 / profile.totalOrders 
    : 60;
  
  const nextPurchaseProbability = Math.max(0, Math.min(1, 
    1 - (daysSinceLastPurchase / (avgDaysBetweenPurchases * 2))
  ));
  
  const daysTillNextPurchase = Math.max(0, avgDaysBetweenPurchases - daysSinceLastPurchase);
  
  // Confidence score
  const confidenceScore = calculateConfidenceScore(profile, tenureMonths);
  
  // Prediction range
  const predictionRange = {
    low: predictedCLV12Months * 0.7,
    high: predictedCLV12Months * 1.4,
  };
  
  // Generate recommendations
  const recommendations = generateCLVRecommendations(profile, rfm, churn);
  
  // Identify factors
  const { positiveFactors, negativeFactors } = identifyFactors(profile, rfm, churn);
  
  const prediction: CLVPrediction = {
    customerId: profile.customerId,
    timestamp: now,
    historicalCLV,
    predictedCLV12Months,
    predictedCLV36Months,
    predictedLifetimeCLV,
    confidenceScore,
    predictionRange,
    expectedPurchases12Months,
    expectedAvgOrderValue,
    nextPurchaseProbability,
    daysTillNextPurchase,
    churnRisk: churn.churnRisk,
    churnProbability: churn.churnProbability,
    daysToChurn: churn.churnRisk === 'critical' ? 14 : churn.churnRisk === 'high' ? 30 : undefined,
    recommendations,
    positiveFactors,
    negativeFactors,
  };
  
  clvPredictions.set(profile.customerId, prediction);
  return prediction;
}

/**
 * Analyze churn risk for a customer
 */
export function analyzeChurn(profile: CustomerProfile): ChurnAnalysis {
  const now = new Date();
  
  const daysSinceLastPurchase = Math.floor(
    (now.getTime() - profile.lastPurchaseDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  const tenureMonths = Math.max(1, Math.floor(
    (now.getTime() - profile.firstPurchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
  ));
  
  const avgDaysBetweenPurchases = profile.totalOrders > 1 
    ? tenureMonths * 30 / profile.totalOrders 
    : 60;
  
  // Calculate churn probability
  const recencyFactor = daysSinceLastPurchase / avgDaysBetweenPurchases;
  const frequencyFactor = profile.totalOrders < 2 ? 0.3 : 0;
  const engagementFactor = profile.emailEngagementRate < 0.1 ? 0.2 : 0;
  
  let churnProbability = Math.min(1, (recencyFactor * 0.5) + frequencyFactor + engagementFactor);
  
  // Determine churn risk
  let churnRisk: ChurnRisk;
  if (churnProbability >= 0.8) churnRisk = 'critical';
  else if (churnProbability >= 0.5) churnRisk = 'high';
  else if (churnProbability >= 0.25) churnRisk = 'medium';
  else churnRisk = 'low';
  
  // Warning signals
  const warningSignals: string[] = [];
  if (daysSinceLastPurchase > avgDaysBetweenPurchases * 1.5) {
    warningSignals.push('Extended time since last purchase');
  }
  if (profile.emailEngagementRate < 0.1) {
    warningSignals.push('Low email engagement');
  }
  if (profile.totalOrders === 1) {
    warningSignals.push('Single purchase only');
  }
  const daysSinceLastActivity = Math.floor(
    (now.getTime() - profile.lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysSinceLastActivity > 30) {
    warningSignals.push('No recent site activity');
  }
  
  // Prevention actions
  const preventionActions: string[] = [];
  if (churnRisk === 'critical') {
    preventionActions.push('Send personalized win-back email with exclusive offer');
    preventionActions.push('Direct outreach via phone/personal email');
    preventionActions.push('Offer loyalty bonus or free gift');
  } else if (churnRisk === 'high') {
    preventionActions.push('Send re-engagement email series');
    preventionActions.push('Offer time-limited discount');
    preventionActions.push('Show personalized product recommendations');
  } else if (churnRisk === 'medium') {
    preventionActions.push('Increase email frequency with relevant content');
    preventionActions.push('Highlight new arrivals in their preferred categories');
    preventionActions.push('Send satisfaction survey');
  }
  
  const analysis: ChurnAnalysis = {
    customerId: profile.customerId,
    churnRisk,
    churnProbability,
    daysSinceLastPurchase,
    avgDaysBetweenPurchases,
    purchaseDeclineRate: 0, // Would calculate from order history
    engagementDeclineRate: profile.emailEngagementRate < 0.2 ? 0.3 : 0,
    warningSignals,
    preventionActions,
  };
  
  churnAnalyses.set(profile.customerId, analysis);
  return analysis;
}

/**
 * Determine customer tier based on CLV and behavior
 */
export function determineCustomerTier(profile: CustomerProfile, prediction?: CLVPrediction): CustomerTier {
  const clv = prediction?.predictedCLV12Months || profile.totalSpent;
  const orders = profile.totalOrders;
  
  // Scoring matrix
  let score = 0;
  
  // CLV contribution
  if (clv >= 1000) score += 40;
  else if (clv >= 500) score += 30;
  else if (clv >= 250) score += 20;
  else if (clv >= 100) score += 10;
  else score += 5;
  
  // Frequency contribution
  if (orders >= 10) score += 30;
  else if (orders >= 5) score += 20;
  else if (orders >= 3) score += 10;
  else if (orders >= 2) score += 5;
  
  // Engagement contribution
  if (profile.emailEngagementRate >= 0.4) score += 20;
  else if (profile.emailEngagementRate >= 0.2) score += 10;
  else if (profile.emailEngagementRate >= 0.1) score += 5;
  
  // Account bonus
  if (profile.hasAccount) score += 5;
  if (profile.isSubscribed) score += 5;
  
  // Determine tier
  if (score >= 80) return 'diamond';
  if (score >= 60) return 'platinum';
  if (score >= 40) return 'gold';
  if (score >= 25) return 'silver';
  return 'bronze';
}

/**
 * Batch process CLV predictions for all customers
 */
export function batchPredictCLV(profiles: CustomerProfile[]): Map<string, CLVPrediction> {
  const predictions = new Map<string, CLVPrediction>();
  
  for (const profile of profiles) {
    const prediction = predictCLV(profile);
    predictions.set(profile.customerId, prediction);
    
    // Update tier
    profile.tier = determineCustomerTier(profile, prediction);
    customerProfiles.set(profile.customerId, profile);
  }
  
  return predictions;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function determineRFMSegment(r: number, f: number, m: number): RFMSegment {
  const combined = r + f + m;
  
  // Champions: Recent, frequent, high value
  if (r >= 4 && f >= 4 && m >= 4) return 'champions';
  
  // Loyal customers: Frequent buyers
  if (f >= 4) return 'loyal_customers';
  
  // Potential loyalists: Recent with moderate frequency
  if (r >= 4 && f >= 2) return 'potential_loyalists';
  
  // New customers: Very recent, low frequency
  if (r >= 4 && f === 1) return 'new_customers';
  
  // Promising: Recent, moderate value
  if (r >= 3 && m >= 3) return 'promising';
  
  // Need attention: Above average but not recent
  if (r === 3 && combined >= 9) return 'need_attention';
  
  // About to sleep: Below average recency and frequency
  if (r === 2 && f === 2) return 'about_to_sleep';
  
  // At risk: Once loyal but haven't purchased recently
  if (r <= 2 && f >= 3) return 'at_risk';
  
  // Can't lose them: High value but not recent
  if (r <= 2 && m >= 4) return 'cant_lose_them';
  
  // Hibernating: Low recency and frequency
  if (r <= 2 && f <= 2) return 'hibernating';
  
  // Lost
  return 'lost';
}

function calculateNPV(annualCashFlow: number, years: number, discountRate: number): number {
  let npv = 0;
  for (let t = 1; t <= years; t++) {
    npv += annualCashFlow / Math.pow(1 + discountRate, t);
  }
  return npv;
}

function calculateConfidenceScore(profile: CustomerProfile, tenureMonths: number): number {
  let confidence = 0.5;
  
  // More data = more confidence
  if (profile.totalOrders >= 5) confidence += 0.15;
  if (profile.totalOrders >= 10) confidence += 0.1;
  if (tenureMonths >= 6) confidence += 0.1;
  if (tenureMonths >= 12) confidence += 0.1;
  if (profile.hasAccount) confidence += 0.05;
  
  return Math.min(0.95, confidence);
}

function generateCLVRecommendations(
  profile: CustomerProfile,
  rfm: RFMScores,
  churn: ChurnAnalysis
): CLVRecommendation[] {
  const recommendations: CLVRecommendation[] = [];
  
  // Churn prevention
  if (churn.churnRisk === 'high' || churn.churnRisk === 'critical') {
    recommendations.push({
      type: 'retention',
      action: 'Send personalized win-back campaign with exclusive offer',
      priority: 'high',
      expectedImpact: profile.avgOrderValue * 0.3,
      channel: 'email',
    });
  }
  
  // Upsell opportunities
  if (rfm.monetary <= 3 && rfm.frequency >= 3) {
    recommendations.push({
      type: 'upsell',
      action: 'Recommend premium products based on purchase history',
      priority: 'medium',
      expectedImpact: profile.avgOrderValue * 0.25,
      channel: 'email',
    });
  }
  
  // Loyalty program
  if (rfm.frequency >= 4 && profile.tier !== 'diamond') {
    recommendations.push({
      type: 'loyalty',
      action: 'Invite to VIP loyalty program',
      priority: 'high',
      expectedImpact: profile.avgOrderValue * 0.4,
      channel: 'email',
    });
  }
  
  // Engagement boost
  if (profile.emailEngagementRate < 0.2) {
    recommendations.push({
      type: 'engagement',
      action: 'A/B test email subject lines and send times',
      priority: 'medium',
      expectedImpact: profile.avgOrderValue * 0.1,
      channel: 'email',
    });
  }
  
  // Reactivation
  if (rfm.recency <= 2 && rfm.segment !== 'lost') {
    recommendations.push({
      type: 'reactivation',
      action: 'Launch reactivation campaign with incentive',
      priority: 'high',
      expectedImpact: profile.avgOrderValue * 0.5,
      channel: 'email',
    });
  }
  
  return recommendations;
}

function identifyFactors(
  profile: CustomerProfile,
  rfm: RFMScores,
  churn: ChurnAnalysis
): { positiveFactors: string[]; negativeFactors: string[] } {
  const positiveFactors: string[] = [];
  const negativeFactors: string[] = [];
  
  // Positive
  if (rfm.recency >= 4) positiveFactors.push('Recent purchase activity');
  if (rfm.frequency >= 4) positiveFactors.push('High purchase frequency');
  if (rfm.monetary >= 4) positiveFactors.push('High order values');
  if (profile.hasAccount) positiveFactors.push('Registered account');
  if (profile.isSubscribed) positiveFactors.push('Email subscriber');
  if (profile.emailEngagementRate >= 0.3) positiveFactors.push('Strong email engagement');
  if (profile.totalOrders >= 5) positiveFactors.push('Repeat customer');
  
  // Negative
  if (rfm.recency <= 2) negativeFactors.push('Long time since last purchase');
  if (rfm.frequency <= 2) negativeFactors.push('Low purchase frequency');
  if (rfm.monetary <= 2) negativeFactors.push('Low order values');
  if (!profile.hasAccount) negativeFactors.push('No registered account');
  if (profile.emailEngagementRate < 0.1) negativeFactors.push('Poor email engagement');
  if (churn.churnProbability > 0.5) negativeFactors.push('High churn risk');
  
  return { positiveFactors, negativeFactors };
}

// ============================================================================
// STATISTICS & ANALYTICS
// ============================================================================

export function getCLVStats(): CLVStats {
  const profiles = Array.from(customerProfiles.values());
  const predictions = Array.from(clvPredictions.values());
  
  if (profiles.length === 0) {
    return {
      totalCustomers: 0,
      avgCLV: 0,
      medianCLV: 0,
      totalPredictedRevenue: 0,
      tierDistribution: { bronze: 0, silver: 0, gold: 0, platinum: 0, diamond: 0 },
      tierRevenue: { bronze: 0, silver: 0, gold: 0, platinum: 0, diamond: 0 },
      atRiskCustomers: 0,
      churnedLastMonth: 0,
      reactivatedLastMonth: 0,
      avgChurnRate: 0,
      rfmDistribution: {} as Record<RFMSegment, number>,
      top10Customers: [],
    };
  }
  
  // Calculate CLV metrics
  const clvValues = predictions.map(p => p.predictedCLV12Months).sort((a, b) => a - b);
  const avgCLV = clvValues.reduce((sum, v) => sum + v, 0) / clvValues.length;
  const medianCLV = clvValues[Math.floor(clvValues.length / 2)];
  const totalPredictedRevenue = clvValues.reduce((sum, v) => sum + v, 0);
  
  // Tier distribution
  const tierDistribution: Record<CustomerTier, number> = { bronze: 0, silver: 0, gold: 0, platinum: 0, diamond: 0 };
  const tierRevenue: Record<CustomerTier, number> = { bronze: 0, silver: 0, gold: 0, platinum: 0, diamond: 0 };
  
  profiles.forEach(p => {
    tierDistribution[p.tier]++;
    const pred = clvPredictions.get(p.customerId);
    if (pred) {
      tierRevenue[p.tier] += pred.predictedCLV12Months;
    }
  });
  
  // Churn metrics
  const atRiskCustomers = predictions.filter(p => p.churnRisk === 'high' || p.churnRisk === 'critical').length;
  const avgChurnRate = predictions.reduce((sum, p) => sum + p.churnProbability, 0) / predictions.length;
  
  // RFM distribution
  const rfmDistribution: Record<RFMSegment, number> = {} as Record<RFMSegment, number>;
  profiles.forEach(p => {
    const rfm = calculateRFMScores(p);
    rfmDistribution[rfm.segment] = (rfmDistribution[rfm.segment] || 0) + 1;
  });
  
  // Top 10 customers
  const top10Customers = [...predictions]
    .sort((a, b) => b.predictedCLV12Months - a.predictedCLV12Months)
    .slice(0, 10)
    .map(p => ({ customerId: p.customerId, clv: p.predictedCLV12Months }));
  
  return {
    totalCustomers: profiles.length,
    avgCLV,
    medianCLV,
    totalPredictedRevenue,
    tierDistribution,
    tierRevenue,
    atRiskCustomers,
    churnedLastMonth: 0, // Would calculate from status history
    reactivatedLastMonth: 0,
    avgChurnRate,
    rfmDistribution,
    top10Customers,
  };
}

export function getCustomerProfile(customerId: string): CustomerProfile | undefined {
  return customerProfiles.get(customerId);
}

export function getCLVPrediction(customerId: string): CLVPrediction | undefined {
  return clvPredictions.get(customerId);
}

export function getChurnAnalysis(customerId: string): ChurnAnalysis | undefined {
  return churnAnalyses.get(customerId);
}

// ============================================================================
// MOCK DATA
// ============================================================================

export function generateMockCustomerData(): {
  profiles: CustomerProfile[];
  predictions: CLVPrediction[];
  stats: CLVStats;
} {
  const tiers: CustomerTier[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
  const statuses: CustomerStatus[] = ['new', 'active', 'at_risk', 'dormant'];
  const categories = ['Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Beauty'];
  
  const profiles: CustomerProfile[] = [];
  
  for (let i = 0; i < 50; i++) {
    const totalOrders = Math.floor(Math.random() * 15) + 1;
    const avgOrderValue = Math.random() * 150 + 30;
    const totalSpent = totalOrders * avgOrderValue;
    const firstPurchaseDate = new Date(Date.now() - Math.random() * 365 * 2 * 24 * 60 * 60 * 1000);
    const lastPurchaseDate = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000);
    
    const profile: CustomerProfile = {
      customerId: `cust-${1000 + i}`,
      email: `customer${i}@example.com`,
      name: ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'][i % 5] + ` ${['Smith', 'Jones', 'Brown', 'Wilson', 'Davis'][i % 5]}`,
      totalOrders,
      totalSpent,
      avgOrderValue,
      firstPurchaseDate,
      lastPurchaseDate,
      totalSessions: Math.floor(Math.random() * 50) + totalOrders * 2,
      totalPageViews: Math.floor(Math.random() * 200) + totalOrders * 10,
      lastActivityDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      emailEngagementRate: Math.random() * 0.5,
      favoriteCategories: [categories[i % 5], categories[(i + 1) % 5]],
      purchasedProductIds: Array.from({ length: totalOrders }, (_, j) => `prod-${i}-${j}`),
      tier: tiers[Math.min(Math.floor(totalSpent / 200), 4)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      isSubscribed: Math.random() > 0.3,
      hasAccount: Math.random() > 0.2,
    };
    
    customerProfiles.set(profile.customerId, profile);
    profiles.push(profile);
  }
  
  // Generate predictions
  const predictionsMap = batchPredictCLV(profiles);
  const predictions = Array.from(predictionsMap.values());
  
  return {
    profiles,
    predictions,
    stats: getCLVStats(),
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Core functions
  calculateRFMScores,
  predictCLV,
  analyzeChurn,
  determineCustomerTier,
  batchPredictCLV,
  // Data access
  getCLVStats,
  getCustomerProfile,
  getCLVPrediction,
  getChurnAnalysis,
  // Mock data
  generateMockCustomerData,
};
