/**
 * Supply Arbitrage Engine - Autonomous Multi-Supplier Intelligence
 * 
 * AI-driven logistics sovereignty for Express Prime.
 * Dynamically selects optimal supplier per order while preserving
 * customer trust and brand consistency.
 * 
 * CORE PRINCIPLES:
 * - Customer satisfaction FIRST
 * - Brand trust ALWAYS protected
 * - Margin optimization WITHOUT sacrifice
 * - Invisible to customers
 * - Self-learning and self-optimizing
 * 
 * @module ai/supplyArbitrage
 * @version 1.0.0
 */

import { evaluateGuardrail, type GuardrailDecision } from './profitGovernor';

// ============================================================================
// TYPES
// ============================================================================

export type SupplierType = 
  | 'shopify'           // Source of truth
  | 'aliexpress'        // Overseas suppliers
  | 'zendrop'           // US dropshippers
  | 'printful'          // Print-on-demand
  | 'printify'          // Print-on-demand alternative
  | 'spocket'           // US/EU suppliers
  | 'modalyst'          // Brand suppliers
  | 'digital'           // Digital product vendors
  | 'warehouse';        // Own inventory

export type FulfillmentPriority = 
  | 'customer_satisfaction'
  | 'brand_trust'
  | 'margin_optimization'
  | 'speed'
  | 'cost';

export type DecisionOutcome = 
  | 'fulfilled'
  | 'rejected'
  | 'escalated'
  | 'fallback';

export interface SupplierProfile {
  supplierId: string;
  supplierName: string;
  supplierType: SupplierType;
  // Cost metrics
  avgCost: number;
  costVariance: number;
  // Speed metrics
  shippingSpeedScore: number; // 0-100
  avgDeliveryDays: number;
  deliveryVariance: number;
  // Reliability metrics
  reliabilityScore: number; // 0-100
  fulfillmentRate: number; // 0-1
  onTimeRate: number; // 0-1
  // Risk metrics
  returnRiskScore: number; // 0-100 (lower is better)
  defectRate: number; // 0-1
  complaintRate: number; // 0-1
  // Trust metrics
  trustImpactScore: number; // 0-100
  brandAlignmentScore: number; // 0-100
  // Performance tracking
  totalOrders: number;
  successfulOrders: number;
  refundedOrders: number;
  lastUpdated: Date;
  // Status
  isActive: boolean;
  isPrimary: boolean;
  isFallback: boolean;
}

export interface ProductSupplierMapping {
  productId: string;
  productTitle: string;
  availableSuppliers: string[]; // Supplier IDs
  primarySupplier: string;
  fallbackSupplier?: string;
  lastArbitrageDecision?: ArbitrageDecision;
}

export interface ArbitrageContext {
  productId: string;
  productTitle: string;
  productPrice: number;
  quantity: number;
  // Buyer signals
  buyerUrgency: 'low' | 'medium' | 'high';
  buyerLocation: string;
  isRepeatCustomer: boolean;
  cartValue: number;
  // Order context
  isGift: boolean;
  hasExpressShipping: boolean;
  // Business context
  currentInventory?: number;
  demandVelocity?: number;
}

export interface ArbitrageDecision {
  id: string;
  timestamp: Date;
  productId: string;
  productTitle: string;
  // Decision
  selectedSupplier: string;
  selectedSupplierType: SupplierType;
  outcome: DecisionOutcome;
  // Scoring
  scores: {
    cost: number;
    speed: number;
    reliability: number;
    margin: number;
    trust: number;
    composite: number;
  };
  // Reasoning
  reason: string;
  factors: string[];
  // Alternatives
  alternativesConsidered: Array<{
    supplierId: string;
    score: number;
    rejectionReason?: string;
  }>;
  // Financials
  estimatedCost: number;
  estimatedMargin: number;
  estimatedDeliveryDays: number;
  // Guardrails
  guardrailCheck: GuardrailDecision | null;
  humanReviewRequired: boolean;
}

export interface SupplierPerformanceMetrics {
  supplierId: string;
  period: '7d' | '30d' | '90d';
  // Volume
  ordersRouted: number;
  ordersCompleted: number;
  ordersFailed: number;
  // Financials
  totalRevenue: number;
  totalCost: number;
  totalMargin: number;
  avgMarginPercent: number;
  // Performance
  avgDeliveryDays: number;
  onTimePercentage: number;
  returnRate: number;
  complaintRate: number;
  // Trend (matches supplier rankings)
  trend: 'up' | 'down' | 'stable';
  trendScore: number;
}

// Extended stats interface for dashboard
export interface ExtendedArbitrageStats {
  totalDecisions: number;
  fulfilled: number;
  rejected: number;
  fallback: number;
  avgCompositeScore: number;
  avgMargin: number;
  topSuppliers: Array<{ supplierId: string; count: number; avgScore: number }>;
  // Extended metrics for dashboard
  successRate: number;
  avgCostSaving: number;
  activeSuppliers: number;
  avgReliability: number;
  avgSpeed: number;
  avgCostEfficiency: number;
  avgMarginContribution: number;
  avgTrustScore: number;
  decisionsToday: number;
  switchesThisWeek: number;
  totalSavingsThisMonth: number;
  learningIterations: number;
}

// Extended decision for dashboard display
export interface DashboardArbitrageDecision extends ArbitrageDecision {
  approved: boolean;
  productName: string;
  orderId: string;
  finalCost: number;
  expectedMargin: number;
  estimatedDelivery: string;
}

export interface ArbitrageConfig {
  // Weights for decision scoring
  weights: {
    cost: number;
    speed: number;
    reliability: number;
    margin: number;
    trust: number;
  };
  // Thresholds
  minReliabilityScore: number;
  minTrustScore: number;
  maxDeliveryDays: number;
  minMarginPercent: number;
  // Behavior
  preferDomesticSuppliers: boolean;
  allowOverseasForLowUrgency: boolean;
  enableSelfLearning: boolean;
  // Fallback
  fallbackToShopify: boolean;
  logAllDecisions: boolean;
}

export interface SupplierRiskAlert {
  supplierId: string;
  supplierName: string;
  alertType: 'volatility' | 'margin_compression' | 'trust_degradation' | 'reliability_drop' | 'cost_spike';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  detectedAt: Date;
  metrics: Record<string, number>;
  recommendation: string;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: ArbitrageConfig = {
  weights: {
    cost: 0.20,
    speed: 0.25,
    reliability: 0.25,
    margin: 0.15,
    trust: 0.15,
  },
  minReliabilityScore: 60,
  minTrustScore: 50,
  maxDeliveryDays: 14,
  minMarginPercent: 0.10,
  preferDomesticSuppliers: true,
  allowOverseasForLowUrgency: true,
  enableSelfLearning: true,
  fallbackToShopify: true,
  logAllDecisions: true,
};

let config: ArbitrageConfig = { ...DEFAULT_CONFIG };

// ============================================================================
// IN-MEMORY STORES (No database changes)
// ============================================================================

const supplierProfiles = new Map<string, SupplierProfile>();
const productMappings = new Map<string, ProductSupplierMapping>();
const decisionLog: ArbitrageDecision[] = [];
const riskAlerts: SupplierRiskAlert[] = [];
const performanceCache = new Map<string, SupplierPerformanceMetrics[]>();

// ============================================================================
// 1️⃣ MULTI-SUPPLIER INTELLIGENCE MAP
// ============================================================================

/**
 * Register a supplier profile
 */
export function registerSupplier(profile: Omit<SupplierProfile, 'lastUpdated'>): void {
  const fullProfile: SupplierProfile = {
    ...profile,
    lastUpdated: new Date(),
  };
  supplierProfiles.set(profile.supplierId, fullProfile);
}

/**
 * Update supplier metrics based on order outcome
 */
export function updateSupplierMetrics(
  supplierId: string,
  outcome: {
    orderCompleted: boolean;
    deliveryDays?: number;
    wasReturned?: boolean;
    hadComplaint?: boolean;
    actualCost?: number;
  }
): void {
  const supplier = supplierProfiles.get(supplierId);
  if (!supplier) return;

  // Update totals
  supplier.totalOrders++;
  if (outcome.orderCompleted) {
    supplier.successfulOrders++;
  }
  if (outcome.wasReturned) {
    supplier.refundedOrders++;
  }

  // Recalculate rolling metrics (exponential moving average)
  const alpha = 0.1; // Learning rate

  if (outcome.deliveryDays !== undefined) {
    supplier.avgDeliveryDays = supplier.avgDeliveryDays * (1 - alpha) + outcome.deliveryDays * alpha;
  }

  // Update rates
  supplier.fulfillmentRate = supplier.successfulOrders / supplier.totalOrders;
  supplier.defectRate = supplier.refundedOrders / supplier.totalOrders;

  // Recalculate composite scores
  supplier.reliabilityScore = calculateReliabilityScore(supplier);
  supplier.shippingSpeedScore = calculateSpeedScore(supplier);
  supplier.returnRiskScore = calculateReturnRiskScore(supplier);

  supplier.lastUpdated = new Date();
  supplierProfiles.set(supplierId, supplier);

  // Check for risk alerts
  detectSupplierRisks(supplier);
}

function calculateReliabilityScore(supplier: SupplierProfile): number {
  const fulfillmentWeight = 0.5;
  const onTimeWeight = 0.3;
  const defectWeight = 0.2;

  return Math.round(
    supplier.fulfillmentRate * 100 * fulfillmentWeight +
    supplier.onTimeRate * 100 * onTimeWeight +
    (1 - supplier.defectRate) * 100 * defectWeight
  );
}

function calculateSpeedScore(supplier: SupplierProfile): number {
  // Score based on average delivery days
  // 2 days = 100, 7 days = 70, 14 days = 40, 21+ days = 10
  if (supplier.avgDeliveryDays <= 2) return 100;
  if (supplier.avgDeliveryDays <= 5) return 85;
  if (supplier.avgDeliveryDays <= 7) return 70;
  if (supplier.avgDeliveryDays <= 10) return 55;
  if (supplier.avgDeliveryDays <= 14) return 40;
  if (supplier.avgDeliveryDays <= 21) return 25;
  return 10;
}

function calculateReturnRiskScore(supplier: SupplierProfile): number {
  // Lower is better (0 = no risk, 100 = high risk)
  return Math.round(
    supplier.defectRate * 50 +
    supplier.complaintRate * 30 +
    (1 - supplier.fulfillmentRate) * 20
  ) * 100;
}

/**
 * Get supplier profile
 */
export function getSupplier(supplierId: string): SupplierProfile | null {
  return supplierProfiles.get(supplierId) ?? null;
}

/**
 * Get all active suppliers
 */
export function getAllSuppliers(): SupplierProfile[] {
  return Array.from(supplierProfiles.values()).filter(s => s.isActive);
}

/**
 * Get suppliers for a product
 */
export function getSuppliersForProduct(productId: string): SupplierProfile[] {
  const mapping = productMappings.get(productId);
  if (!mapping) return [];

  return mapping.availableSuppliers
    .map(id => supplierProfiles.get(id))
    .filter((s): s is SupplierProfile => s !== undefined && s.isActive);
}

// ============================================================================
// 2️⃣ REAL-TIME ARBITRAGE DECISION ENGINE
// ============================================================================

/**
 * Make an arbitrage decision for an order
 * This is the core intelligence function
 */
export function makeArbitrageDecision(context: ArbitrageContext): ArbitrageDecision {
  const startTime = performance.now();
  
  // Get available suppliers for this product
  const availableSuppliers = getSuppliersForProduct(context.productId);
  
  // If no suppliers, use fallback
  if (availableSuppliers.length === 0) {
    return createFallbackDecision(context, 'No suppliers available');
  }

  // Score each supplier
  const scoredSuppliers = availableSuppliers.map(supplier => ({
    supplier,
    scores: scoreSupplier(supplier, context),
  }));

  // Filter by minimum thresholds
  const eligibleSuppliers = scoredSuppliers.filter(({ supplier, scores }) => {
    if (supplier.reliabilityScore < config.minReliabilityScore) return false;
    if (supplier.trustImpactScore < config.minTrustScore) return false;
    if (supplier.avgDeliveryDays > config.maxDeliveryDays) return false;
    
    // Check margin
    const estimatedMargin = (context.productPrice - supplier.avgCost) / context.productPrice;
    if (estimatedMargin < config.minMarginPercent) return false;
    
    // Check urgency vs overseas
    if (context.buyerUrgency === 'high' && supplier.supplierType === 'aliexpress') return false;
    if (!config.allowOverseasForLowUrgency && supplier.supplierType === 'aliexpress') return false;
    
    return true;
  });

  // If no eligible suppliers, check guardrails and possibly reject
  if (eligibleSuppliers.length === 0) {
    const guardrailCheck = evaluateGuardrail('supplier_selection', {
      affectsTrust: true,
    });
    
    if (config.fallbackToShopify) {
      return createFallbackDecision(context, 'No eligible suppliers - falling back to Shopify');
    }
    
    return createRejectedDecision(context, 'No suppliers meet minimum requirements', guardrailCheck);
  }

  // Sort by composite score (descending)
  eligibleSuppliers.sort((a, b) => b.scores.composite - a.scores.composite);

  // Select the best supplier
  const best = eligibleSuppliers[0];
  const estimatedCost = best.supplier.avgCost * context.quantity;
  const estimatedMargin = (context.productPrice * context.quantity - estimatedCost) / (context.productPrice * context.quantity);

  // Generate decision factors
  const factors = generateDecisionFactors(best.supplier, best.scores, context);

  // Check guardrails
  const guardrailCheck = evaluateGuardrail('supplier_arbitrage', {
    proposedMargin: estimatedMargin,
    affectsTrust: best.supplier.trustImpactScore < 70,
  });

  if (guardrailCheck.action === 'reject') {
    return createRejectedDecision(context, guardrailCheck.reason, guardrailCheck);
  }

  const decision: ArbitrageDecision = {
    id: `arb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    productId: context.productId,
    productTitle: context.productTitle,
    selectedSupplier: best.supplier.supplierId,
    selectedSupplierType: best.supplier.supplierType,
    outcome: 'fulfilled',
    scores: best.scores,
    reason: generateDecisionReason(best.supplier, best.scores, context),
    factors,
    alternativesConsidered: eligibleSuppliers.slice(1, 4).map(({ supplier, scores }) => ({
      supplierId: supplier.supplierId,
      score: scores.composite,
      rejectionReason: `Score ${scores.composite.toFixed(0)} vs winner ${best.scores.composite.toFixed(0)}`,
    })),
    estimatedCost,
    estimatedMargin,
    estimatedDeliveryDays: best.supplier.avgDeliveryDays,
    guardrailCheck,
    humanReviewRequired: guardrailCheck.action === 'escalate',
  };

  // Log decision
  if (config.logAllDecisions) {
    logDecision(decision);
  }

  // Performance check
  const elapsed = performance.now() - startTime;
  if (elapsed > 120) {
    console.warn(`Arbitrage decision took ${elapsed.toFixed(0)}ms (target: <120ms)`);
  }

  return decision;
}

function scoreSupplier(
  supplier: SupplierProfile,
  context: ArbitrageContext
): ArbitrageDecision['scores'] {
  // Cost score (lower cost = higher score)
  const maxCost = context.productPrice * 0.8; // 80% of price = minimum margin
  const costScore = Math.max(0, Math.min(100, (1 - supplier.avgCost / maxCost) * 100));

  // Speed score
  let speedScore = supplier.shippingSpeedScore;
  // Boost speed score for urgent orders
  if (context.buyerUrgency === 'high') {
    speedScore = speedScore * 1.2;
  }
  speedScore = Math.min(100, speedScore);

  // Reliability score
  const reliabilityScore = supplier.reliabilityScore;

  // Margin score
  const estimatedMargin = (context.productPrice - supplier.avgCost) / context.productPrice;
  const marginScore = Math.min(100, estimatedMargin * 200); // 50% margin = 100

  // Trust score
  let trustScore = supplier.trustImpactScore;
  // Boost trust for repeat customers
  if (context.isRepeatCustomer) {
    trustScore = Math.min(100, trustScore * 1.1);
  }
  // Boost trust for high-value carts
  if (context.cartValue > 100) {
    trustScore = Math.min(100, trustScore * 1.05);
  }

  // Composite score (weighted)
  const composite =
    costScore * config.weights.cost +
    speedScore * config.weights.speed +
    reliabilityScore * config.weights.reliability +
    marginScore * config.weights.margin +
    trustScore * config.weights.trust;

  return {
    cost: Math.round(costScore),
    speed: Math.round(speedScore),
    reliability: Math.round(reliabilityScore),
    margin: Math.round(marginScore),
    trust: Math.round(trustScore),
    composite: Math.round(composite),
  };
}

function generateDecisionFactors(
  supplier: SupplierProfile,
  scores: ArbitrageDecision['scores'],
  context: ArbitrageContext
): string[] {
  const factors: string[] = [];

  if (scores.speed >= 80) {
    factors.push(`Fast delivery (${supplier.avgDeliveryDays.toFixed(0)} days avg)`);
  }
  if (scores.reliability >= 85) {
    factors.push(`High reliability (${supplier.reliabilityScore}% score)`);
  }
  if (scores.margin >= 70) {
    factors.push(`Strong margin (${((context.productPrice - supplier.avgCost) / context.productPrice * 100).toFixed(0)}%)`);
  }
  if (supplier.supplierType === 'zendrop' || supplier.supplierType === 'warehouse') {
    factors.push('US-based fulfillment');
  }
  if (context.buyerUrgency === 'high' && scores.speed >= 75) {
    factors.push('Meets urgent delivery requirement');
  }
  if (context.isRepeatCustomer && scores.trust >= 80) {
    factors.push('High trust for repeat customer');
  }
  if (supplier.isPrimary) {
    factors.push('Primary supplier preference');
  }

  return factors;
}

function generateDecisionReason(
  supplier: SupplierProfile,
  scores: ArbitrageDecision['scores'],
  context: ArbitrageContext
): string {
  const marginPercent = ((context.productPrice - supplier.avgCost) / context.productPrice * 100).toFixed(0);
  
  if (context.buyerUrgency === 'high' && supplier.supplierType !== 'aliexpress') {
    return `Order routed to ${supplier.supplierName} for urgent delivery (${supplier.avgDeliveryDays.toFixed(0)} days) with ${marginPercent}% margin.`;
  }
  
  if (scores.reliability >= 90) {
    return `Order routed to ${supplier.supplierName} for exceptional reliability (${supplier.reliabilityScore}% score) with ${marginPercent}% margin.`;
  }
  
  if (scores.margin >= 80) {
    return `Order routed to ${supplier.supplierName} for optimal margin (${marginPercent}%) while maintaining ${supplier.avgDeliveryDays.toFixed(0)}-day delivery.`;
  }
  
  return `Order routed to ${supplier.supplierName} with composite score ${scores.composite.toFixed(0)} (speed: ${scores.speed}, reliability: ${scores.reliability}, margin: ${marginPercent}%).`;
}

function createFallbackDecision(context: ArbitrageContext, reason: string): ArbitrageDecision {
  const decision: ArbitrageDecision = {
    id: `arb-fallback-${Date.now()}`,
    timestamp: new Date(),
    productId: context.productId,
    productTitle: context.productTitle,
    selectedSupplier: 'shopify-default',
    selectedSupplierType: 'shopify',
    outcome: 'fallback',
    scores: { cost: 50, speed: 50, reliability: 100, margin: 50, trust: 100, composite: 70 },
    reason: `Fallback to Shopify: ${reason}`,
    factors: ['Shopify source of truth', 'No alternative suppliers available'],
    alternativesConsidered: [],
    estimatedCost: context.productPrice * 0.6,
    estimatedMargin: 0.40,
    estimatedDeliveryDays: 7,
    guardrailCheck: null,
    humanReviewRequired: false,
  };

  if (config.logAllDecisions) {
    logDecision(decision);
  }

  return decision;
}

function createRejectedDecision(
  context: ArbitrageContext,
  reason: string,
  guardrailCheck: GuardrailDecision | null
): ArbitrageDecision {
  const decision: ArbitrageDecision = {
    id: `arb-rejected-${Date.now()}`,
    timestamp: new Date(),
    productId: context.productId,
    productTitle: context.productTitle,
    selectedSupplier: 'NONE',
    selectedSupplierType: 'shopify',
    outcome: 'rejected',
    scores: { cost: 0, speed: 0, reliability: 0, margin: 0, trust: 0, composite: 0 },
    reason: `Fulfillment rejected: ${reason}`,
    factors: ['No eligible suppliers', 'Guardrails prevented fulfillment'],
    alternativesConsidered: [],
    estimatedCost: 0,
    estimatedMargin: 0,
    estimatedDeliveryDays: 0,
    guardrailCheck,
    humanReviewRequired: true,
  };

  if (config.logAllDecisions) {
    logDecision(decision);
  }

  return decision;
}

// ============================================================================
// 3️⃣ INVISIBLE SUPPLIER SWITCHING
// ============================================================================

/**
 * Map a product to available suppliers
 */
export function mapProductToSuppliers(
  productId: string,
  productTitle: string,
  supplierIds: string[],
  primarySupplierId?: string
): void {
  const mapping: ProductSupplierMapping = {
    productId,
    productTitle,
    availableSuppliers: supplierIds.filter(id => supplierProfiles.has(id)),
    primarySupplier: primarySupplierId ?? supplierIds[0],
    fallbackSupplier: supplierIds.find(id => {
      const s = supplierProfiles.get(id);
      return s?.isFallback;
    }),
  };

  productMappings.set(productId, mapping);
}

/**
 * Get product mapping
 */
export function getProductMapping(productId: string): ProductSupplierMapping | null {
  return productMappings.get(productId) ?? null;
}

/**
 * Process an order through the arbitrage engine
 * Returns supplier routing info (invisible to customer)
 */
export function routeOrder(
  orderId: string,
  items: Array<{
    productId: string;
    productTitle: string;
    price: number;
    quantity: number;
  }>,
  context: {
    buyerUrgency: 'low' | 'medium' | 'high';
    buyerLocation: string;
    isRepeatCustomer: boolean;
    totalCartValue: number;
  }
): Array<{
  productId: string;
  decision: ArbitrageDecision;
}> {
  return items.map(item => ({
    productId: item.productId,
    decision: makeArbitrageDecision({
      productId: item.productId,
      productTitle: item.productTitle,
      productPrice: item.price,
      quantity: item.quantity,
      buyerUrgency: context.buyerUrgency,
      buyerLocation: context.buyerLocation,
      isRepeatCustomer: context.isRepeatCustomer,
      cartValue: context.totalCartValue,
      isGift: false,
      hasExpressShipping: context.buyerUrgency === 'high',
    }),
  }));
}

// ============================================================================
// 4️⃣ PROFIT GOVERNOR INTEGRATION
// ============================================================================

// Already integrated via evaluateGuardrail calls in makeArbitrageDecision

// ============================================================================
// 5️⃣ SELF-LEARNING SUPPLIER RANKING
// ============================================================================

/**
 * Record order outcome for learning
 */
export function recordOrderOutcome(
  supplierId: string,
  outcome: {
    orderId: string;
    wasSuccessful: boolean;
    deliveryDays?: number;
    wasReturned: boolean;
    hadComplaint: boolean;
    customerSatisfaction?: number; // 1-5
  }
): void {
  if (!config.enableSelfLearning) return;

  updateSupplierMetrics(supplierId, {
    orderCompleted: outcome.wasSuccessful,
    deliveryDays: outcome.deliveryDays,
    wasReturned: outcome.wasReturned,
    hadComplaint: outcome.hadComplaint,
  });
}

/**
 * Get supplier rankings
 */
export function getSupplierRankings(): Array<{
  supplier: SupplierProfile;
  rank: number;
  overallScore: number;
  trend: 'up' | 'down' | 'stable';
}> {
  const suppliers = getAllSuppliers();
  
  // Calculate overall scores
  const scored = suppliers.map(supplier => {
    const overallScore = 
      supplier.reliabilityScore * 0.35 +
      supplier.shippingSpeedScore * 0.25 +
      supplier.trustImpactScore * 0.25 +
      (100 - supplier.returnRiskScore) * 0.15;
    
    return { supplier, overallScore };
  });

  // Sort by score
  scored.sort((a, b) => b.overallScore - a.overallScore);

  // Assign ranks and trends
  return scored.map((item, index) => ({
    supplier: item.supplier,
    rank: index + 1,
    overallScore: Math.round(item.overallScore),
    trend: calculateSupplierTrend(item.supplier),
  }));
}

function calculateSupplierTrend(supplier: SupplierProfile): 'up' | 'down' | 'stable' {
  // Simplified trend based on recent fulfillment rate
  if (supplier.totalOrders < 10) return 'stable';
  
  const recentSuccessRate = supplier.successfulOrders / supplier.totalOrders;
  if (recentSuccessRate > 0.95) return 'up';
  if (recentSuccessRate < 0.85) return 'down';
  return 'stable';
}

// ============================================================================
// RISK DETECTION
// ============================================================================

function detectSupplierRisks(supplier: SupplierProfile): void {
  // Check for reliability drop
  if (supplier.reliabilityScore < 60 && supplier.totalOrders > 20) {
    addRiskAlert({
      supplierId: supplier.supplierId,
      supplierName: supplier.supplierName,
      alertType: 'reliability_drop',
      severity: supplier.reliabilityScore < 40 ? 'critical' : 'high',
      message: `${supplier.supplierName} reliability dropped to ${supplier.reliabilityScore}%`,
      detectedAt: new Date(),
      metrics: { reliability: supplier.reliabilityScore, orders: supplier.totalOrders },
      recommendation: supplier.reliabilityScore < 40 
        ? 'Consider removing from active supplier pool'
        : 'Monitor closely and reduce order volume',
    });
  }

  // Check for trust degradation
  if (supplier.trustImpactScore < 50) {
    addRiskAlert({
      supplierId: supplier.supplierId,
      supplierName: supplier.supplierName,
      alertType: 'trust_degradation',
      severity: 'high',
      message: `${supplier.supplierName} trust score below threshold (${supplier.trustImpactScore}%)`,
      detectedAt: new Date(),
      metrics: { trust: supplier.trustImpactScore },
      recommendation: 'Review customer feedback and consider supplier change',
    });
  }

  // Check for cost volatility (would need historical data)
  if (supplier.costVariance > 0.2) {
    addRiskAlert({
      supplierId: supplier.supplierId,
      supplierName: supplier.supplierName,
      alertType: 'cost_spike',
      severity: 'medium',
      message: `${supplier.supplierName} showing cost volatility (${(supplier.costVariance * 100).toFixed(0)}% variance)`,
      detectedAt: new Date(),
      metrics: { costVariance: supplier.costVariance },
      recommendation: 'Review pricing agreements and consider alternative suppliers',
    });
  }
}

function addRiskAlert(alert: SupplierRiskAlert): void {
  // Avoid duplicate alerts
  const existing = riskAlerts.find(
    a => a.supplierId === alert.supplierId && 
         a.alertType === alert.alertType &&
         Date.now() - a.detectedAt.getTime() < 24 * 60 * 60 * 1000 // Within 24 hours
  );
  
  if (!existing) {
    riskAlerts.unshift(alert);
    // Keep last 100 alerts
    if (riskAlerts.length > 100) {
      riskAlerts.pop();
    }
  }
}

/**
 * Get active risk alerts
 */
export function getRiskAlerts(severity?: SupplierRiskAlert['severity']): SupplierRiskAlert[] {
  if (severity) {
    return riskAlerts.filter(a => a.severity === severity);
  }
  return [...riskAlerts];
}

// ============================================================================
// DECISION LOGGING
// ============================================================================

function logDecision(decision: ArbitrageDecision): void {
  decisionLog.unshift(decision);
  // Keep last 1000 decisions
  if (decisionLog.length > 1000) {
    decisionLog.pop();
  }
}

/**
 * Get decision log
 */
export function getDecisionLog(limit: number = 50): ArbitrageDecision[] {
  return decisionLog.slice(0, limit);
}

/**
 * Get decisions by product
 */
export function getDecisionsByProduct(productId: string, limit: number = 10): ArbitrageDecision[] {
  return decisionLog.filter(d => d.productId === productId).slice(0, limit);
}

/**
 * Get decisions by supplier
 */
export function getDecisionsBySupplier(supplierId: string, limit: number = 10): ArbitrageDecision[] {
  return decisionLog.filter(d => d.selectedSupplier === supplierId).slice(0, limit);
}

// ============================================================================
// ANALYTICS
// ============================================================================

/**
 * Get supplier performance metrics
 */
export function getSupplierPerformance(
  supplierId: string,
  period: '7d' | '30d' | '90d' = '30d'
): SupplierPerformanceMetrics | null {
  const supplier = supplierProfiles.get(supplierId);
  if (!supplier) return null;

  // Get decisions for this supplier in the period
  const now = Date.now();
  const periodMs = period === '7d' ? 7 * 24 * 60 * 60 * 1000 :
                   period === '30d' ? 30 * 24 * 60 * 60 * 1000 :
                   90 * 24 * 60 * 60 * 1000;

  const decisions = decisionLog.filter(
    d => d.selectedSupplier === supplierId && 
         now - d.timestamp.getTime() < periodMs
  );

  const fulfilled = decisions.filter(d => d.outcome === 'fulfilled');
  const failed = decisions.filter(d => d.outcome === 'rejected');

  const totalRevenue = fulfilled.reduce((sum, d) => sum + (d.estimatedCost / (1 - d.estimatedMargin)), 0);
  const totalCost = fulfilled.reduce((sum, d) => sum + d.estimatedCost, 0);
  const totalMargin = totalRevenue - totalCost;

  return {
    supplierId,
    period,
    ordersRouted: decisions.length,
    ordersCompleted: fulfilled.length,
    ordersFailed: failed.length,
    totalRevenue,
    totalCost,
    totalMargin,
    avgMarginPercent: fulfilled.length > 0 
      ? fulfilled.reduce((sum, d) => sum + d.estimatedMargin, 0) / fulfilled.length
      : 0,
    avgDeliveryDays: supplier.avgDeliveryDays,
    onTimePercentage: supplier.onTimeRate * 100,
    returnRate: supplier.defectRate * 100,
    complaintRate: supplier.complaintRate * 100,
    trend: calculateSupplierTrend(supplier),
    trendScore: supplier.reliabilityScore,
  };
}

/**
 * Get arbitrage statistics
 */
export function getArbitrageStats(): {
  totalDecisions: number;
  fulfilled: number;
  rejected: number;
  fallback: number;
  avgCompositeScore: number;
  avgMargin: number;
  topSuppliers: Array<{ supplierId: string; count: number; avgScore: number }>;
} {
  const fulfilled = decisionLog.filter(d => d.outcome === 'fulfilled');
  const rejected = decisionLog.filter(d => d.outcome === 'rejected');
  const fallback = decisionLog.filter(d => d.outcome === 'fallback');

  const avgCompositeScore = fulfilled.length > 0
    ? fulfilled.reduce((sum, d) => sum + d.scores.composite, 0) / fulfilled.length
    : 0;

  const avgMargin = fulfilled.length > 0
    ? fulfilled.reduce((sum, d) => sum + d.estimatedMargin, 0) / fulfilled.length
    : 0;

  // Count by supplier
  const supplierCounts = new Map<string, { count: number; totalScore: number }>();
  fulfilled.forEach(d => {
    const existing = supplierCounts.get(d.selectedSupplier) || { count: 0, totalScore: 0 };
    existing.count++;
    existing.totalScore += d.scores.composite;
    supplierCounts.set(d.selectedSupplier, existing);
  });

  const topSuppliers = Array.from(supplierCounts.entries())
    .map(([supplierId, data]) => ({
      supplierId,
      count: data.count,
      avgScore: data.totalScore / data.count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalDecisions: decisionLog.length,
    fulfilled: fulfilled.length,
    rejected: rejected.length,
    fallback: fallback.length,
    avgCompositeScore,
    avgMargin,
    topSuppliers,
  };
}

/**
 * Get extended arbitrage statistics for dashboard
 */
export function getExtendedArbitrageStats(): ExtendedArbitrageStats {
  const baseStats = getArbitrageStats();
  const suppliers = getAllSuppliers();
  const activeSuppliers = suppliers.filter(s => s.isActive);
  
  // Calculate averages across active suppliers
  const avgReliability = activeSuppliers.length > 0
    ? activeSuppliers.reduce((sum, s) => sum + s.reliabilityScore, 0) / activeSuppliers.length / 100
    : 0;
  const avgSpeed = activeSuppliers.length > 0
    ? activeSuppliers.reduce((sum, s) => sum + s.shippingSpeedScore, 0) / activeSuppliers.length / 100
    : 0;
  const avgTrustScore = activeSuppliers.length > 0
    ? activeSuppliers.reduce((sum, s) => sum + s.trustImpactScore, 0) / activeSuppliers.length / 100
    : 0;
  
  // Cost efficiency based on variance (lower variance = higher efficiency)
  const avgCostEfficiency = activeSuppliers.length > 0
    ? 1 - (activeSuppliers.reduce((sum, s) => sum + s.costVariance, 0) / activeSuppliers.length)
    : 0;
  
  // Margin contribution from average margin
  const avgMarginContribution = baseStats.avgMargin;
  
  // Success rate
  const successRate = baseStats.totalDecisions > 0
    ? (baseStats.fulfilled / baseStats.totalDecisions) * 100
    : 100;
  
  // Estimated cost savings (assuming 15% savings on average vs default pricing)
  const avgCostSaving = baseStats.avgMargin * 25; // Rough estimate based on margin
  
  // Mock metrics (in production, these would come from actual tracking)
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const decisionsToday = decisionLog.filter(d => d.timestamp >= today).length;
  
  return {
    ...baseStats,
    successRate,
    avgCostSaving,
    activeSuppliers: activeSuppliers.length,
    avgReliability,
    avgSpeed,
    avgCostEfficiency,
    avgMarginContribution,
    avgTrustScore,
    decisionsToday,
    switchesThisWeek: Math.floor(baseStats.totalDecisions * 0.3), // Mock: 30% are switches
    totalSavingsThisMonth: avgCostSaving * baseStats.fulfilled,
    learningIterations: baseStats.totalDecisions * 2, // Each decision updates multiple suppliers
  };
}

/**
 * Get dashboard-formatted arbitrage decisions
 */
export function getDashboardDecisions(limit: number = 10): DashboardArbitrageDecision[] {
  return decisionLog.slice(0, limit).map((decision, idx) => ({
    ...decision,
    approved: decision.outcome === 'fulfilled' || decision.outcome === 'fallback',
    productName: decision.productTitle,
    orderId: `ORD-${String(1000 + idx).padStart(5, '0')}`,
    finalCost: decision.estimatedCost,
    expectedMargin: decision.estimatedMargin,
    estimatedDelivery: `${decision.estimatedDeliveryDays} days`,
  }));
}

// ============================================================================
// CONFIGURATION
// ============================================================================

export function configure(newConfig: Partial<ArbitrageConfig>): void {
  config = { ...config, ...newConfig };
}

export function getConfig(): ArbitrageConfig {
  return { ...config };
}

// ============================================================================
// MOCK DATA GENERATION
// ============================================================================

/**
 * Generate mock supplier data for demonstration
 */
export function generateMockSuppliers(): void {
  // Clear existing
  supplierProfiles.clear();
  productMappings.clear();

  // Register mock suppliers
  const mockSuppliers: Omit<SupplierProfile, 'lastUpdated'>[] = [
    {
      supplierId: 'sup-shopify-001',
      supplierName: 'Shopify Native',
      supplierType: 'shopify',
      avgCost: 25.00,
      costVariance: 0.05,
      shippingSpeedScore: 85,
      avgDeliveryDays: 5,
      deliveryVariance: 1.2,
      reliabilityScore: 95,
      fulfillmentRate: 0.98,
      onTimeRate: 0.94,
      returnRiskScore: 15,
      defectRate: 0.02,
      complaintRate: 0.01,
      trustImpactScore: 95,
      brandAlignmentScore: 100,
      totalOrders: 1250,
      successfulOrders: 1225,
      refundedOrders: 25,
      isActive: true,
      isPrimary: true,
      isFallback: true,
    },
    {
      supplierId: 'sup-zendrop-001',
      supplierName: 'Zendrop US',
      supplierType: 'zendrop',
      avgCost: 18.50,
      costVariance: 0.08,
      shippingSpeedScore: 78,
      avgDeliveryDays: 4,
      deliveryVariance: 1.5,
      reliabilityScore: 88,
      fulfillmentRate: 0.94,
      onTimeRate: 0.89,
      returnRiskScore: 22,
      defectRate: 0.04,
      complaintRate: 0.03,
      trustImpactScore: 85,
      brandAlignmentScore: 88,
      totalOrders: 680,
      successfulOrders: 639,
      refundedOrders: 27,
      isActive: true,
      isPrimary: false,
      isFallback: false,
    },
    {
      supplierId: 'sup-spocket-001',
      supplierName: 'Spocket EU/US',
      supplierType: 'spocket',
      avgCost: 22.00,
      costVariance: 0.06,
      shippingSpeedScore: 82,
      avgDeliveryDays: 5,
      deliveryVariance: 1.3,
      reliabilityScore: 91,
      fulfillmentRate: 0.96,
      onTimeRate: 0.92,
      returnRiskScore: 18,
      defectRate: 0.03,
      complaintRate: 0.02,
      trustImpactScore: 90,
      brandAlignmentScore: 92,
      totalOrders: 420,
      successfulOrders: 403,
      refundedOrders: 13,
      isActive: true,
      isPrimary: false,
      isFallback: false,
    },
    {
      supplierId: 'sup-aliexpress-001',
      supplierName: 'AliExpress Standard',
      supplierType: 'aliexpress',
      avgCost: 8.50,
      costVariance: 0.15,
      shippingSpeedScore: 35,
      avgDeliveryDays: 18,
      deliveryVariance: 5.0,
      reliabilityScore: 72,
      fulfillmentRate: 0.88,
      onTimeRate: 0.70,
      returnRiskScore: 35,
      defectRate: 0.08,
      complaintRate: 0.06,
      trustImpactScore: 60,
      brandAlignmentScore: 55,
      totalOrders: 890,
      successfulOrders: 783,
      refundedOrders: 71,
      isActive: true,
      isPrimary: false,
      isFallback: false,
    },
    {
      supplierId: 'sup-printful-001',
      supplierName: 'Printful POD',
      supplierType: 'printful',
      avgCost: 15.00,
      costVariance: 0.03,
      shippingSpeedScore: 75,
      avgDeliveryDays: 6,
      deliveryVariance: 1.8,
      reliabilityScore: 93,
      fulfillmentRate: 0.97,
      onTimeRate: 0.91,
      returnRiskScore: 12,
      defectRate: 0.02,
      complaintRate: 0.01,
      trustImpactScore: 92,
      brandAlignmentScore: 95,
      totalOrders: 320,
      successfulOrders: 310,
      refundedOrders: 6,
      isActive: true,
      isPrimary: false,
      isFallback: false,
    },
  ];

  mockSuppliers.forEach(registerSupplier);

  // Create mock product mappings
  const mockProducts = [
    { id: 'prod-001', title: 'Premium Wireless Earbuds', suppliers: ['sup-shopify-001', 'sup-zendrop-001', 'sup-aliexpress-001'] },
    { id: 'prod-002', title: 'Smart Watch Pro', suppliers: ['sup-shopify-001', 'sup-spocket-001', 'sup-zendrop-001'] },
    { id: 'prod-003', title: 'Custom T-Shirt', suppliers: ['sup-printful-001', 'sup-shopify-001'] },
    { id: 'prod-004', title: 'Leather Wallet', suppliers: ['sup-spocket-001', 'sup-shopify-001', 'sup-aliexpress-001'] },
    { id: 'prod-005', title: 'Phone Case', suppliers: ['sup-aliexpress-001', 'sup-zendrop-001', 'sup-shopify-001'] },
  ];

  mockProducts.forEach(p => {
    mapProductToSuppliers(p.id, p.title, p.suppliers, p.suppliers[0]);
  });

  // Generate some mock decisions
  generateMockDecisions();
}

function generateMockDecisions(): void {
  const contexts: ArbitrageContext[] = [
    { productId: 'prod-001', productTitle: 'Premium Wireless Earbuds', productPrice: 79.99, quantity: 1, buyerUrgency: 'high', buyerLocation: 'US', isRepeatCustomer: true, cartValue: 79.99, isGift: false, hasExpressShipping: true },
    { productId: 'prod-002', productTitle: 'Smart Watch Pro', productPrice: 149.99, quantity: 1, buyerUrgency: 'medium', buyerLocation: 'US', isRepeatCustomer: false, cartValue: 149.99, isGift: false, hasExpressShipping: false },
    { productId: 'prod-003', productTitle: 'Custom T-Shirt', productPrice: 34.99, quantity: 2, buyerUrgency: 'low', buyerLocation: 'US', isRepeatCustomer: true, cartValue: 69.98, isGift: true, hasExpressShipping: false },
    { productId: 'prod-004', productTitle: 'Leather Wallet', productPrice: 59.99, quantity: 1, buyerUrgency: 'medium', buyerLocation: 'CA', isRepeatCustomer: false, cartValue: 59.99, isGift: false, hasExpressShipping: false },
    { productId: 'prod-005', productTitle: 'Phone Case', productPrice: 24.99, quantity: 3, buyerUrgency: 'low', buyerLocation: 'US', isRepeatCustomer: true, cartValue: 74.97, isGift: false, hasExpressShipping: false },
  ];

  contexts.forEach(ctx => makeArbitrageDecision(ctx));
}

/**
 * Get mock arbitrage data for demonstration
 */
export function getMockArbitrageData(): {
  suppliers: SupplierProfile[];
  rankings: ReturnType<typeof getSupplierRankings>;
  recentDecisions: ArbitrageDecision[];
  stats: ReturnType<typeof getArbitrageStats>;
  alerts: SupplierRiskAlert[];
} {
  // Ensure mock data exists
  if (supplierProfiles.size === 0) {
    generateMockSuppliers();
  }

  return {
    suppliers: getAllSuppliers(),
    rankings: getSupplierRankings(),
    recentDecisions: getDecisionLog(10),
    stats: getArbitrageStats(),
    alerts: getRiskAlerts(),
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Supplier Management
  registerSupplier,
  updateSupplierMetrics,
  getSupplier,
  getAllSuppliers,
  getSuppliersForProduct,
  // Arbitrage Decisions
  makeArbitrageDecision,
  routeOrder,
  // Product Mapping
  mapProductToSuppliers,
  getProductMapping,
  // Learning
  recordOrderOutcome,
  getSupplierRankings,
  // Risk
  getRiskAlerts,
  // Logging
  getDecisionLog,
  getDecisionsByProduct,
  getDecisionsBySupplier,
  getDashboardDecisions,
  // Analytics
  getSupplierPerformance,
  getArbitrageStats,
  getExtendedArbitrageStats,
  // Config
  configure,
  getConfig,
  // Mock
  generateMockSuppliers,
  getMockArbitrageData,
};
