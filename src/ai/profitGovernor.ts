/**
 * Profit Governor - Autonomous Profit Intelligence Engine
 * 
 * An ethical, non-invasive AI system that continuously balances:
 * - Revenue growth
 * - Profit margins
 * - Conversion psychology
 * - Trust & brand integrity
 * 
 * STRICT CONSTRAINTS:
 * ❌ No checkout modification
 * ❌ No dark patterns
 * ❌ No auto price changes
 * ❌ No new database tables
 * ✅ Read-only data analysis
 * ✅ Explainable recommendations
 * ✅ Human approval required for pricing
 * ✅ Performance under 100ms
 * 
 * @module ai/profitGovernor
 * @version 1.0.0
 */

// ============================================================================
// TYPES
// ============================================================================

export type MarginRiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type LeakType = 'ux' | 'pricing' | 'product' | 'supplier' | 'shipping';
export type GuardrailAction = 'approve' | 'reject' | 'escalate';

export interface ProductMarginAnalysis {
  productId: string;
  productTitle: string;
  // Revenue metrics
  basePrice: number;
  estimatedCost: number;
  estimatedShipping: number;
  // Margin calculations
  grossMargin: number;
  effectiveMarginPercent: number;
  marginRiskLevel: MarginRiskLevel;
  profitabilityRank: number;
  // Risk factors
  returnProbability: number;
  supportFrictionScore: number;
  conversionRate: number;
  // Recommendations
  marginHealthy: boolean;
  recommendation: string;
}

export interface PriceElasticityAnalysis {
  productId: string;
  productTitle: string;
  currentPrice: number;
  // Sensitivity signals
  cartAbandonRate: number;
  avgTimeToCheckout: number;
  variantSwitchRate: number;
  buyerIntentScore: number;
  // Price corridor (recommendation only - NO auto-changes)
  optimalPriceRange: {
    floor: number;
    ceiling: number;
    psychological: number;
    current: number;
  };
  // Analysis
  elasticityScore: number; // 0-1, higher = more price sensitive
  priceChangeRisk: 'low' | 'medium' | 'high';
  recommendation: string;
  // Human approval required
  requiresHumanApproval: true;
}

export interface ProfitWeightedProduct {
  productId: string;
  productTitle: string;
  // Composite scoring
  marginScore: number;
  velocityScore: number;
  trustScore: number;
  compositeScore: number;
  // Recommendation weighting
  recommendationWeight: number;
  shouldPromote: boolean;
  promotionReason: string;
}

export interface LossLeak {
  productId: string;
  productTitle: string;
  leakType: LeakType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  // Detection metrics
  viewToConversionRatio: number;
  returnRate: number;
  supportTicketRate: number;
  shippingCostRatio: number;
  // Diagnosis
  rootCause: string;
  estimatedLoss: number;
  // Remediation
  remediation: string[];
  priorityScore: number;
}

export interface GuardrailDecision {
  timestamp: Date;
  action: GuardrailAction;
  requestedOperation: string;
  reason: string;
  riskFactors: string[];
  alternativeSuggestion?: string;
}

export interface ProfitHealthScore {
  overall: number; // 0-100
  components: {
    marginStability: number;
    revenueQuality: number;
    riskExposure: number;
    conversionEfficiency: number;
    inventoryHealth: number;
  };
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  trend: 'improving' | 'stable' | 'declining';
  alerts: string[];
}

export interface ProfitForecast {
  period: '7d' | '30d' | '90d';
  conservative: {
    revenue: number;
    margin: number;
    confidence: number;
  };
  optimized: {
    revenue: number;
    margin: number;
    confidence: number;
    requiredActions: string[];
  };
  risks: string[];
  opportunities: string[];
}

export interface GovernorConfig {
  // Guardrail thresholds
  minAcceptableMargin: number; // Default: 0.15 (15%)
  maxDiscountDepth: number; // Default: 0.40 (40%)
  conversionTradeoffTolerance: number; // Default: 0.10 (10% conversion loss acceptable)
  // Trust boundaries
  trustFirstEnabled: boolean;
  rejectManipulativePricing: boolean;
  // Performance
  cacheTTLSeconds: number;
}

export interface GovernorDecisionLog {
  id: string;
  timestamp: Date;
  decisionType: 'promotion' | 'pricing' | 'inventory' | 'guardrail';
  productId?: string;
  productTitle?: string;
  decision: string;
  reasoning: string;
  confidence: number;
  wasApplied: boolean;
  humanReviewRequired: boolean;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: GovernorConfig = {
  minAcceptableMargin: 0.15,
  maxDiscountDepth: 0.40,
  conversionTradeoffTolerance: 0.10,
  trustFirstEnabled: true,
  rejectManipulativePricing: true,
  cacheTTLSeconds: 300,
};

let config: GovernorConfig = { ...DEFAULT_CONFIG };

// ============================================================================
// IN-MEMORY STORES (No database changes)
// ============================================================================

const marginCache = new Map<string, ProductMarginAnalysis>();
const elasticityCache = new Map<string, PriceElasticityAnalysis>();
const leakCache = new Map<string, LossLeak>();
const decisionLog: GovernorDecisionLog[] = [];
const guardrailLog: GuardrailDecision[] = [];

let lastHealthScore: ProfitHealthScore | null = null;
let lastForecast: Map<string, ProfitForecast> = new Map();

// ============================================================================
// 1️⃣ DYNAMIC MARGIN INTELLIGENCE ENGINE
// ============================================================================

/**
 * Calculate real-time effective margin per product
 * Uses safe heuristics when supplier cost unknown
 */
export function calculateProductMargin(
  productId: string,
  productTitle: string,
  price: number,
  options?: {
    supplierCost?: number;
    shippingClass?: 'standard' | 'expedited' | 'heavy';
    category?: string;
    historicalReturnRate?: number;
    supportTickets?: number;
    views?: number;
    conversions?: number;
  }
): ProductMarginAnalysis {
  // Estimate cost if not provided (safe heuristics)
  const estimatedCost = options?.supplierCost ?? estimateCostFromPrice(price, options?.category);
  
  // Estimate shipping based on class
  const shippingClassCosts: Record<string, number> = {
    standard: 5.99,
    expedited: 12.99,
    heavy: 19.99,
  };
  const estimatedShipping = shippingClassCosts[options?.shippingClass ?? 'standard'];
  
  // Calculate gross margin
  const grossMargin = price - estimatedCost - estimatedShipping;
  const effectiveMarginPercent = price > 0 ? grossMargin / price : 0;
  
  // Calculate return probability
  const returnProbability = options?.historicalReturnRate ?? estimateReturnProbability(price, options?.category);
  
  // Calculate support friction
  const supportFrictionScore = calculateSupportFriction(
    options?.supportTickets ?? 0,
    options?.conversions ?? 1
  );
  
  // Calculate conversion rate
  const conversionRate = (options?.views && options?.conversions)
    ? options.conversions / options.views
    : 0.02; // Default 2%
  
  // Determine risk level
  const marginRiskLevel = getMarginRiskLevel(effectiveMarginPercent, returnProbability);
  
  // Calculate profitability rank (0-100)
  const profitabilityRank = calculateProfitabilityRank(
    effectiveMarginPercent,
    conversionRate,
    returnProbability,
    supportFrictionScore
  );
  
  // Generate recommendation
  const marginHealthy = effectiveMarginPercent >= config.minAcceptableMargin;
  const recommendation = generateMarginRecommendation(
    effectiveMarginPercent,
    marginRiskLevel,
    conversionRate
  );
  
  const analysis: ProductMarginAnalysis = {
    productId,
    productTitle,
    basePrice: price,
    estimatedCost,
    estimatedShipping,
    grossMargin,
    effectiveMarginPercent,
    marginRiskLevel,
    profitabilityRank,
    returnProbability,
    supportFrictionScore,
    conversionRate,
    marginHealthy,
    recommendation,
  };
  
  marginCache.set(productId, analysis);
  return analysis;
}

function estimateCostFromPrice(price: number, category?: string): number {
  // Conservative cost estimation based on category
  const categoryMultipliers: Record<string, number> = {
    electronics: 0.65,
    clothing: 0.45,
    accessories: 0.40,
    home: 0.50,
    beauty: 0.35,
    default: 0.50,
  };
  const multiplier = categoryMultipliers[category ?? 'default'];
  return price * multiplier;
}

function estimateReturnProbability(price: number, category?: string): number {
  // Higher price items tend to have higher return rates
  const baseRate = 0.08; // 8% base
  const priceAdjustment = Math.min(0.10, price / 1000); // Up to 10% for expensive items
  const categoryRates: Record<string, number> = {
    clothing: 0.15, // Clothing has high returns
    electronics: 0.08,
    accessories: 0.05,
    default: 0.08,
  };
  return (categoryRates[category ?? 'default'] || baseRate) + priceAdjustment;
}

function calculateSupportFriction(tickets: number, conversions: number): number {
  if (conversions === 0) return 0.5; // Unknown
  const ticketRate = tickets / conversions;
  // Score from 0 (low friction) to 1 (high friction)
  return Math.min(1, ticketRate * 5);
}

function getMarginRiskLevel(margin: number, returnRate: number): MarginRiskLevel {
  const adjustedMargin = margin * (1 - returnRate);
  if (adjustedMargin >= 0.25) return 'low';
  if (adjustedMargin >= 0.15) return 'medium';
  if (adjustedMargin >= 0.05) return 'high';
  return 'critical';
}

function calculateProfitabilityRank(
  margin: number,
  conversionRate: number,
  returnRate: number,
  frictionScore: number
): number {
  // Weighted scoring
  const marginScore = Math.min(100, margin * 200); // 50% margin = 100
  const conversionScore = Math.min(100, conversionRate * 2000); // 5% = 100
  const returnScore = Math.max(0, 100 - returnRate * 500); // Lower is better
  const frictionScore2 = Math.max(0, 100 - frictionScore * 100);
  
  return Math.round(
    marginScore * 0.40 +
    conversionScore * 0.30 +
    returnScore * 0.15 +
    frictionScore2 * 0.15
  );
}

function generateMarginRecommendation(
  margin: number,
  risk: MarginRiskLevel,
  conversionRate: number
): string {
  if (risk === 'critical') {
    return 'Critical margin - consider discontinuing or negotiating supplier costs';
  }
  if (risk === 'high' && conversionRate < 0.02) {
    return 'High risk with low conversion - not recommended for promotion';
  }
  if (risk === 'high') {
    return 'Monitor closely - high conversion may offset thin margins';
  }
  if (margin > 0.40 && conversionRate > 0.03) {
    return 'Strong performer - prioritize for promotion';
  }
  return 'Healthy margin - maintain current strategy';
}

// ============================================================================
// 2️⃣ PRICE ELASTICITY AWARENESS (NO AUTO-PRICE CHANGES)
// ============================================================================

/**
 * Analyze price sensitivity - RECOMMENDATIONS ONLY
 * Human approval required for any price changes
 */
export function analyzePriceElasticity(
  productId: string,
  productTitle: string,
  currentPrice: number,
  options?: {
    cartAbandonRate?: number;
    avgTimeToCheckout?: number;
    variantSwitchRate?: number;
    buyerIntentScore?: number;
    competitorPrices?: number[];
  }
): PriceElasticityAnalysis {
  const cartAbandonRate = options?.cartAbandonRate ?? 0.70; // Default 70%
  const avgTimeToCheckout = options?.avgTimeToCheckout ?? 180; // Default 3 min
  const variantSwitchRate = options?.variantSwitchRate ?? 0.15;
  const buyerIntentScore = options?.buyerIntentScore ?? 0.50;
  
  // Calculate elasticity score (0-1, higher = more price sensitive)
  const elasticityScore = calculateElasticityScore(
    cartAbandonRate,
    avgTimeToCheckout,
    variantSwitchRate,
    buyerIntentScore
  );
  
  // Calculate optimal price corridor
  const optimalPriceRange = calculatePriceCorridor(
    currentPrice,
    elasticityScore,
    options?.competitorPrices
  );
  
  // Determine risk of price change
  const priceChangeRisk = elasticityScore > 0.7 ? 'high' :
                          elasticityScore > 0.4 ? 'medium' : 'low';
  
  const recommendation = generatePriceRecommendation(
    currentPrice,
    optimalPriceRange,
    elasticityScore,
    priceChangeRisk
  );
  
  const analysis: PriceElasticityAnalysis = {
    productId,
    productTitle,
    currentPrice,
    cartAbandonRate,
    avgTimeToCheckout,
    variantSwitchRate,
    buyerIntentScore,
    optimalPriceRange,
    elasticityScore,
    priceChangeRisk,
    recommendation,
    requiresHumanApproval: true, // ALWAYS require human approval
  };
  
  elasticityCache.set(productId, analysis);
  return analysis;
}

function calculateElasticityScore(
  cartAbandonRate: number,
  timeToCheckout: number,
  variantSwitchRate: number,
  intentScore: number
): number {
  // High abandon + long checkout + high variant switching = price sensitive
  const abandonFactor = cartAbandonRate;
  const timeFactor = Math.min(1, timeToCheckout / 300); // Normalize to 5 min
  const switchFactor = variantSwitchRate * 2; // Weight switching heavily
  const intentFactor = 1 - intentScore; // Low intent = price sensitive
  
  return (abandonFactor * 0.35 + timeFactor * 0.20 + switchFactor * 0.25 + intentFactor * 0.20);
}

function calculatePriceCorridor(
  currentPrice: number,
  elasticity: number,
  competitorPrices?: number[]
): { floor: number; ceiling: number; psychological: number; current: number } {
  // Floor: minimum price based on margin requirements
  const floor = currentPrice * (1 - config.maxDiscountDepth);
  
  // Ceiling: maximum price market will bear
  const ceilingMultiplier = elasticity > 0.6 ? 1.05 : elasticity > 0.3 ? 1.15 : 1.25;
  const ceiling = currentPrice * ceilingMultiplier;
  
  // Psychological price anchor
  const psychological = findPsychologicalPrice(currentPrice);
  
  return { floor, ceiling, psychological, current: currentPrice };
}

function findPsychologicalPrice(price: number): number {
  // Find nearest .99 or .95 price point
  if (price < 10) return Math.floor(price) - 0.01;
  if (price < 100) return Math.round(price / 5) * 5 - 0.01;
  return Math.round(price / 10) * 10 - 0.01;
}

function generatePriceRecommendation(
  currentPrice: number,
  corridor: { floor: number; ceiling: number; psychological: number },
  elasticity: number,
  risk: string
): string {
  if (elasticity > 0.7) {
    return `High price sensitivity detected. Maintain current price of $${currentPrice.toFixed(2)} to preserve conversion. Any increase risks significant volume loss.`;
  }
  if (currentPrice < corridor.psychological && elasticity < 0.4) {
    return `Opportunity: Price could potentially increase to $${corridor.psychological.toFixed(2)} (psychological anchor). Requires human approval.`;
  }
  if (risk === 'low') {
    return `Price appears optimized. Room to test $${corridor.ceiling.toFixed(2)} ceiling in limited capacity.`;
  }
  return `Current pricing within optimal corridor. Monitor competitor pricing for adjustments.`;
}

// ============================================================================
// 3️⃣ PROFIT-SAFE RECOMMENDATION WEIGHTING
// ============================================================================

/**
 * Calculate profit-weighted recommendation score
 * Balances margin × velocity × trust
 */
export function calculateProfitWeight(
  productId: string,
  productTitle: string,
  options: {
    marginPercent: number;
    velocity: number; // Units sold per day
    trustScore: number; // 0-1
    viewCount?: number;
  }
): ProfitWeightedProduct {
  const { marginPercent, velocity, trustScore, viewCount = 0 } = options;
  
  // Normalize scores to 0-100
  const marginScore = Math.min(100, marginPercent * 200);
  const velocityScore = Math.min(100, velocity * 10); // 10 units/day = 100
  const trustScoreNorm = trustScore * 100;
  
  // Composite scoring with weights
  // Margin: 40%, Velocity: 35%, Trust: 25%
  const compositeScore = 
    marginScore * 0.40 +
    velocityScore * 0.35 +
    trustScoreNorm * 0.25;
  
  // Calculate recommendation weight (0-1)
  const recommendationWeight = compositeScore / 100;
  
  // Should promote? Only if all criteria met
  const shouldPromote = 
    marginPercent >= config.minAcceptableMargin &&
    trustScore >= 0.6 &&
    compositeScore >= 50;
  
  // Generate promotion reason
  let promotionReason = '';
  if (shouldPromote) {
    if (marginScore > 70 && velocityScore > 60) {
      promotionReason = 'High profit resilience with strong velocity';
    } else if (trustScoreNorm > 80) {
      promotionReason = 'Verified quality with healthy margins';
    } else {
      promotionReason = 'Balanced performance across all metrics';
    }
  } else if (marginPercent < config.minAcceptableMargin) {
    promotionReason = 'Below minimum margin threshold - not recommended for promotion';
  } else if (trustScore < 0.6) {
    promotionReason = 'Trust score below threshold - improve product quality first';
  } else {
    promotionReason = 'Composite score too low for priority promotion';
  }
  
  return {
    productId,
    productTitle,
    marginScore,
    velocityScore,
    trustScore: trustScoreNorm,
    compositeScore,
    recommendationWeight,
    shouldPromote,
    promotionReason,
  };
}

/**
 * Get profit-optimized product recommendations
 */
export function getProfitOptimizedRecommendations(
  products: Array<{
    productId: string;
    productTitle: string;
    marginPercent: number;
    velocity: number;
    trustScore: number;
  }>,
  limit: number = 10
): ProfitWeightedProduct[] {
  const weighted = products.map(p => calculateProfitWeight(
    p.productId,
    p.productTitle,
    { marginPercent: p.marginPercent, velocity: p.velocity, trustScore: p.trustScore }
  ));
  
  return weighted
    .filter(p => p.shouldPromote)
    .sort((a, b) => b.compositeScore - a.compositeScore)
    .slice(0, limit);
}

// ============================================================================
// 4️⃣ LOSS-LEAK DETECTION ENGINE
// ============================================================================

/**
 * Detect silent profit killers
 */
export function detectLossLeak(
  productId: string,
  productTitle: string,
  metrics: {
    views: number;
    conversions: number;
    returns: number;
    supportTickets: number;
    shippingCost: number;
    price: number;
  }
): LossLeak | null {
  const { views, conversions, returns, supportTickets, shippingCost, price } = metrics;
  
  const viewToConversionRatio = views > 0 ? conversions / views : 0;
  const returnRate = conversions > 0 ? returns / conversions : 0;
  const supportTicketRate = conversions > 0 ? supportTickets / conversions : 0;
  const shippingCostRatio = price > 0 ? shippingCost / price : 0;
  
  // Detect leak type
  let leakType: LeakType | null = null;
  let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
  let rootCause = '';
  const remediation: string[] = [];
  
  // High views, low conversion = UX or pricing issue
  if (views > 100 && viewToConversionRatio < 0.01) {
    if (shippingCostRatio > 0.15) {
      leakType = 'shipping';
      rootCause = 'Shipping cost is disproportionately high relative to product price';
      remediation.push('Consider bundling or free shipping threshold');
      remediation.push('Negotiate better shipping rates');
    } else {
      leakType = 'ux';
      rootCause = 'High traffic but low conversion suggests UX friction';
      remediation.push('Review product page layout and images');
      remediation.push('Check mobile experience');
      remediation.push('Simplify checkout flow');
    }
    severity = viewToConversionRatio < 0.005 ? 'high' : 'medium';
  }
  
  // High return rate = product issue
  if (returnRate > 0.15) {
    leakType = 'product';
    severity = returnRate > 0.25 ? 'critical' : 'high';
    rootCause = 'Return rate exceeds acceptable threshold';
    remediation.push('Review product descriptions for accuracy');
    remediation.push('Check product quality consistency');
    remediation.push('Analyze return reasons');
  }
  
  // High support tickets = product or supplier issue
  if (supportTicketRate > 0.10) {
    leakType = leakType ?? 'supplier';
    severity = supportTicketRate > 0.20 ? 'high' : 'medium';
    rootCause = rootCause || 'High support burden indicates product issues';
    remediation.push('Categorize support tickets by type');
    remediation.push('Update FAQ or product descriptions');
    if (supportTicketRate > 0.20) {
      remediation.push('Consider supplier change or product discontinuation');
    }
  }
  
  if (!leakType) return null;
  
  // Calculate estimated loss
  const avgOrderValue = price * 0.8; // Conservative estimate
  const lostConversions = views * 0.02 - conversions; // Expected vs actual
  const returnCost = returns * (price * 0.3); // 30% of price per return
  const supportCost = supportTickets * 5; // $5 per ticket estimate
  const estimatedLoss = Math.max(0, lostConversions * avgOrderValue + returnCost + supportCost);
  
  const leak: LossLeak = {
    productId,
    productTitle,
    leakType,
    severity,
    viewToConversionRatio,
    returnRate,
    supportTicketRate,
    shippingCostRatio,
    rootCause,
    estimatedLoss,
    remediation,
    priorityScore: calculateLeakPriority(severity, estimatedLoss),
  };
  
  leakCache.set(productId, leak);
  return leak;
}

function calculateLeakPriority(severity: string, estimatedLoss: number): number {
  const severityScore: Record<string, number> = {
    critical: 100,
    high: 75,
    medium: 50,
    low: 25,
  };
  const lossScore = Math.min(100, estimatedLoss / 100);
  return Math.round((severityScore[severity] || 50) * 0.6 + lossScore * 0.4);
}

/**
 * Get all detected loss leaks sorted by priority
 */
export function getAllLossLeaks(): LossLeak[] {
  return Array.from(leakCache.values())
    .sort((a, b) => b.priorityScore - a.priorityScore);
}

// ============================================================================
// 5️⃣ PROFIT GUARDRAILS (THE "GOVERNOR")
// ============================================================================

/**
 * Evaluate an action against guardrails
 * The AI must refuse harmful actions
 */
export function evaluateGuardrail(
  operation: string,
  context: {
    productId?: string;
    proposedMargin?: number;
    proposedDiscount?: number;
    affectsTrust?: boolean;
    isManipulative?: boolean;
  }
): GuardrailDecision {
  const riskFactors: string[] = [];
  let action: GuardrailAction = 'approve';
  let reason = '';
  let alternativeSuggestion: string | undefined;
  
  // Check minimum margin
  if (context.proposedMargin !== undefined && context.proposedMargin < config.minAcceptableMargin) {
    riskFactors.push(`Margin ${(context.proposedMargin * 100).toFixed(1)}% below minimum ${(config.minAcceptableMargin * 100).toFixed(1)}%`);
    action = 'reject';
    reason = 'Proposed action would result in margin below acceptable threshold';
    alternativeSuggestion = `Consider minimum price that maintains ${(config.minAcceptableMargin * 100).toFixed(0)}% margin`;
  }
  
  // Check discount depth
  if (context.proposedDiscount !== undefined && context.proposedDiscount > config.maxDiscountDepth) {
    riskFactors.push(`Discount ${(context.proposedDiscount * 100).toFixed(1)}% exceeds maximum ${(config.maxDiscountDepth * 100).toFixed(1)}%`);
    action = 'reject';
    reason = 'Discount exceeds maximum allowed depth';
    alternativeSuggestion = `Maximum discount should be ${(config.maxDiscountDepth * 100).toFixed(0)}%`;
  }
  
  // Check trust impact
  if (config.trustFirstEnabled && context.affectsTrust) {
    riskFactors.push('Action may negatively impact brand trust');
    action = action === 'reject' ? 'reject' : 'escalate';
    reason = reason || 'Action requires trust impact review';
  }
  
  // Reject manipulative pricing
  if (config.rejectManipulativePricing && context.isManipulative) {
    riskFactors.push('Detected potentially manipulative pricing pattern');
    action = 'reject';
    reason = 'Action rejected due to potential manipulation concerns';
    alternativeSuggestion = 'Use transparent pricing that builds customer trust';
  }
  
  if (action === 'approve') {
    reason = 'Action passes all guardrail checks';
  }
  
  const decision: GuardrailDecision = {
    timestamp: new Date(),
    action,
    requestedOperation: operation,
    reason,
    riskFactors,
    alternativeSuggestion,
  };
  
  guardrailLog.push(decision);
  
  // Log rejection for audit
  if (action === 'reject') {
    logDecision({
      id: `gr-${Date.now()}`,
      timestamp: new Date(),
      decisionType: 'guardrail',
      productId: context.productId,
      decision: `REJECTED: ${operation}`,
      reasoning: reason,
      confidence: 1.0,
      wasApplied: false,
      humanReviewRequired: true,
    });
  }
  
  return decision;
}

// ============================================================================
// 📊 EXECUTIVE OUTPUTS
// ============================================================================

/**
 * Calculate Profit Health Score (0-100)
 */
export function calculateProfitHealthScore(
  metrics: {
    avgMargin: number;
    marginVariance: number;
    revenueGrowthRate: number;
    conversionRate: number;
    returnRate: number;
    inventoryTurnover: number;
  }
): ProfitHealthScore {
  const { avgMargin, marginVariance, revenueGrowthRate, conversionRate, returnRate, inventoryTurnover } = metrics;
  
  // Calculate components
  const marginStability = Math.max(0, 100 - marginVariance * 200);
  const revenueQuality = Math.min(100, 50 + revenueGrowthRate * 100);
  const riskExposure = Math.max(0, 100 - returnRate * 400);
  const conversionEfficiency = Math.min(100, conversionRate * 2000);
  const inventoryHealth = Math.min(100, inventoryTurnover * 10);
  
  // Overall score (weighted)
  const overall = Math.round(
    marginStability * 0.25 +
    revenueQuality * 0.25 +
    riskExposure * 0.20 +
    conversionEfficiency * 0.20 +
    inventoryHealth * 0.10
  );
  
  // Grade
  const grade = overall >= 90 ? 'A+' :
                overall >= 80 ? 'A' :
                overall >= 70 ? 'B' :
                overall >= 60 ? 'C' :
                overall >= 50 ? 'D' : 'F';
  
  // Trend (compare to last)
  const trend = lastHealthScore
    ? (overall > lastHealthScore.overall + 2 ? 'improving' :
       overall < lastHealthScore.overall - 2 ? 'declining' : 'stable')
    : 'stable';
  
  // Alerts
  const alerts: string[] = [];
  if (avgMargin < config.minAcceptableMargin) {
    alerts.push(`Average margin ${(avgMargin * 100).toFixed(1)}% below target`);
  }
  if (returnRate > 0.15) {
    alerts.push(`Return rate ${(returnRate * 100).toFixed(1)}% exceeds threshold`);
  }
  if (conversionRate < 0.02) {
    alerts.push('Conversion rate below industry average');
  }
  
  const score: ProfitHealthScore = {
    overall,
    components: {
      marginStability,
      revenueQuality,
      riskExposure,
      conversionEfficiency,
      inventoryHealth,
    },
    grade,
    trend,
    alerts,
  };
  
  lastHealthScore = score;
  return score;
}

/**
 * Generate Profit Forecast
 */
export function generateProfitForecast(
  currentMetrics: {
    dailyRevenue: number;
    avgMargin: number;
    growthRate: number;
  },
  period: '7d' | '30d' | '90d'
): ProfitForecast {
  const { dailyRevenue, avgMargin, growthRate } = currentMetrics;
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  
  // Conservative scenario (no improvement)
  const conservativeRevenue = dailyRevenue * days * (1 + growthRate * 0.5);
  const conservativeMargin = avgMargin * 0.95; // 5% margin compression
  
  // Optimized scenario (with AI improvements)
  const optimizedRevenue = dailyRevenue * days * (1 + growthRate * 1.2);
  const optimizedMargin = avgMargin * 1.05; // 5% margin improvement
  
  const forecast: ProfitForecast = {
    period,
    conservative: {
      revenue: conservativeRevenue,
      margin: conservativeMargin,
      confidence: 0.85,
    },
    optimized: {
      revenue: optimizedRevenue,
      margin: optimizedMargin,
      confidence: 0.65,
      requiredActions: [
        'Implement profit-weighted recommendations',
        'Address top 3 loss leaks',
        'Optimize underperforming product mix',
      ],
    },
    risks: [
      'Market demand fluctuation',
      'Supplier cost increases',
      'Competitive pricing pressure',
    ],
    opportunities: [
      'Margin improvement through supplier negotiation',
      'Conversion optimization via UX improvements',
      'Premium product mix adjustment',
    ],
  };
  
  lastForecast.set(period, forecast);
  return forecast;
}

// ============================================================================
// DECISION LOGGING
// ============================================================================

/**
 * Log a decision for audit trail
 */
export function logDecision(decision: GovernorDecisionLog): void {
  decisionLog.unshift(decision);
  // Keep last 1000 decisions
  if (decisionLog.length > 1000) {
    decisionLog.pop();
  }
}

/**
 * Get decision log
 */
export function getDecisionLog(limit: number = 50): GovernorDecisionLog[] {
  return decisionLog.slice(0, limit);
}

/**
 * Get guardrail rejections
 */
export function getGuardrailRejections(): GuardrailDecision[] {
  return guardrailLog.filter(d => d.action === 'reject');
}

// ============================================================================
// CONFIGURATION
// ============================================================================

export function configure(newConfig: Partial<GovernorConfig>): void {
  config = { ...config, ...newConfig };
}

export function getConfig(): GovernorConfig {
  return { ...config };
}

// ============================================================================
// AGGREGATE STATS
// ============================================================================

export function getGovernorStats(): {
  totalProductsAnalyzed: number;
  avgMargin: number;
  leaksDetected: number;
  guardrailRejections: number;
  lastHealthScore: ProfitHealthScore | null;
} {
  const margins = Array.from(marginCache.values());
  const avgMargin = margins.length > 0
    ? margins.reduce((sum, m) => sum + m.effectiveMarginPercent, 0) / margins.length
    : 0;
  
  return {
    totalProductsAnalyzed: marginCache.size,
    avgMargin,
    leaksDetected: leakCache.size,
    guardrailRejections: guardrailLog.filter(d => d.action === 'reject').length,
    lastHealthScore,
  };
}

/**
 * Generate mock data for demonstration
 */
export function generateMockGovernorData(): {
  healthScore: ProfitHealthScore;
  forecast7d: ProfitForecast;
  forecast30d: ProfitForecast;
  forecast90d: ProfitForecast;
  leaks: LossLeak[];
  topProducts: ProfitWeightedProduct[];
} {
  // Generate health score
  const healthScore = calculateProfitHealthScore({
    avgMargin: 0.32,
    marginVariance: 0.08,
    revenueGrowthRate: 0.12,
    conversionRate: 0.035,
    returnRate: 0.08,
    inventoryTurnover: 6.5,
  });
  
  // Generate forecasts
  const forecast7d = generateProfitForecast({
    dailyRevenue: 2450,
    avgMargin: 0.32,
    growthRate: 0.03,
  }, '7d');
  
  const forecast30d = generateProfitForecast({
    dailyRevenue: 2450,
    avgMargin: 0.32,
    growthRate: 0.03,
  }, '30d');
  
  const forecast90d = generateProfitForecast({
    dailyRevenue: 2450,
    avgMargin: 0.32,
    growthRate: 0.03,
  }, '90d');
  
  // Generate sample leaks
  const leaks: LossLeak[] = [
    {
      productId: 'prod-001',
      productTitle: 'Premium Wireless Earbuds',
      leakType: 'ux',
      severity: 'medium',
      viewToConversionRatio: 0.008,
      returnRate: 0.05,
      supportTicketRate: 0.02,
      shippingCostRatio: 0.08,
      rootCause: 'Mobile checkout friction detected',
      estimatedLoss: 1250,
      remediation: ['Optimize mobile checkout', 'Add Apple Pay support'],
      priorityScore: 68,
    },
    {
      productId: 'prod-002',
      productTitle: 'Smart Watch Pro',
      leakType: 'shipping',
      severity: 'high',
      viewToConversionRatio: 0.015,
      returnRate: 0.12,
      supportTicketRate: 0.08,
      shippingCostRatio: 0.22,
      rootCause: 'Shipping cost disproportionate to price',
      estimatedLoss: 890,
      remediation: ['Bundle with accessories', 'Negotiate carrier rates'],
      priorityScore: 75,
    },
  ];
  
  // Generate top products
  const topProducts: ProfitWeightedProduct[] = [
    {
      productId: 'top-001',
      productTitle: 'Luxury Leather Wallet',
      marginScore: 85,
      velocityScore: 72,
      trustScore: 92,
      compositeScore: 82.9,
      recommendationWeight: 0.829,
      shouldPromote: true,
      promotionReason: 'High profit resilience with strong velocity',
    },
    {
      productId: 'top-002',
      productTitle: 'Premium Sunglasses',
      marginScore: 78,
      velocityScore: 65,
      trustScore: 88,
      compositeScore: 76.2,
      recommendationWeight: 0.762,
      shouldPromote: true,
      promotionReason: 'Verified quality with healthy margins',
    },
    {
      productId: 'top-003',
      productTitle: 'Designer Phone Case',
      marginScore: 72,
      velocityScore: 80,
      trustScore: 75,
      compositeScore: 75.55,
      recommendationWeight: 0.7555,
      shouldPromote: true,
      promotionReason: 'Balanced performance across all metrics',
    },
  ];
  
  return {
    healthScore,
    forecast7d,
    forecast30d,
    forecast90d,
    leaks,
    topProducts,
  };
}

export default {
  // Margin Intelligence
  calculateProductMargin,
  // Price Elasticity
  analyzePriceElasticity,
  // Profit Weighting
  calculateProfitWeight,
  getProfitOptimizedRecommendations,
  // Loss Detection
  detectLossLeak,
  getAllLossLeaks,
  // Guardrails
  evaluateGuardrail,
  getGuardrailRejections,
  // Executive Outputs
  calculateProfitHealthScore,
  generateProfitForecast,
  // Logging
  logDecision,
  getDecisionLog,
  // Config
  configure,
  getConfig,
  getGovernorStats,
  generateMockGovernorData,
};
