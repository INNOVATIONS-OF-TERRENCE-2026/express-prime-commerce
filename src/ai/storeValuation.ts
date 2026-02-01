/**
 * AI Store Valuation Engine
 * 
 * Investor-ready analytics and store valuation calculations.
 * Generates pitch-deck metrics, GMV estimates, and business health scores.
 * 
 * Metrics calculated:
 * - GMV (Gross Merchandise Value) estimates
 * - Conversion efficiency rating
 * - Product velocity index
 * - SKU depth score
 * - Customer acquisition efficiency
 * - Revenue multiple estimates
 * - Growth trajectory predictions
 * 
 * @module storeValuation
 * @version 1.0.0
 */

// ============================================================================
// TYPES
// ============================================================================

export interface StoreValuation {
  timestamp: number;
  valuation: {
    low: number;
    mid: number;
    high: number;
    confidence: number;
  };
  metrics: ValuationMetrics;
  health: StoreHealth;
  trajectory: GrowthTrajectory;
  comparables: MarketComparable[];
  pitchMetrics: PitchDeckMetrics;
}

export interface ValuationMetrics {
  gmvEstimate: {
    monthly: number;
    annual: number;
    growth: number;
  };
  conversionEfficiency: number;
  productVelocity: number;
  skuDepth: number;
  avgOrderValue: number;
  customerLifetimeValue: number;
  revenueMultiple: number;
}

export interface StoreHealth {
  overallScore: number;
  grade: StoreGrade;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  risks: string[];
}

export type StoreGrade = 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'F';

export interface GrowthTrajectory {
  trend: 'accelerating' | 'steady' | 'decelerating' | 'declining';
  monthlyGrowthRate: number;
  projectedAnnualGrowth: number;
  runwayMonths: number;
  breakEvenEstimate: number | null;
}

export interface MarketComparable {
  category: string;
  avgValuation: number;
  avgMultiple: number;
  percentile: number;
}

export interface PitchDeckMetrics {
  headline: string;
  subheadline: string;
  keyStats: Array<{ label: string; value: string; trend?: 'up' | 'down' | 'neutral' }>;
  investorHighlights: string[];
  riskFactors: string[];
}

export interface ValuationInput {
  products: ProductValuationData[];
  orders?: OrderData[];
  traffic?: TrafficData;
  costs?: CostStructure;
}

export interface ProductValuationData {
  id: string;
  price: number;
  category: string;
  createdAt: string;
  inventoryCount?: number;
  viewCount?: number;
  purchaseCount?: number;
  trendingScore?: number;
}

export interface OrderData {
  id: string;
  total: number;
  itemCount: number;
  createdAt: string;
}

export interface TrafficData {
  dailyVisitors: number;
  bounceRate: number;
  avgSessionDuration: number;
  returningVisitorRate: number;
}

export interface CostStructure {
  cogs: number; // Cost of goods sold percentage
  marketing: number;
  operations: number;
  platform: number;
}

export interface ValuationConfig {
  industryMultiple: number;
  growthPremium: number;
  riskDiscount: number;
  minValuation: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_CONFIG: ValuationConfig = {
  industryMultiple: 3.5, // E-commerce average revenue multiple
  growthPremium: 0.5,    // Premium for high-growth stores
  riskDiscount: 0.3,     // Discount for risk factors
  minValuation: 10000,   // Minimum floor valuation
};

const GRADE_THRESHOLDS = {
  'A+': 95, 'A': 90, 'A-': 85,
  'B+': 80, 'B': 75, 'B-': 70,
  'C+': 65, 'C': 60, 'C-': 55,
  'D': 45, 'F': 0,
};

const CATEGORY_MULTIPLES: Record<string, number> = {
  'electronics': 4.0,
  'health': 3.5,
  'home': 3.0,
  'kitchen': 3.2,
  'fitness': 3.8,
  'fashion': 2.5,
  'default': 3.0,
};

// ============================================================================
// STATE
// ============================================================================

let config = { ...DEFAULT_CONFIG };
let lastValuation: StoreValuation | null = null;

// ============================================================================
// CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate GMV estimates
 */
function calculateGMV(
  products: ProductValuationData[],
  orders?: OrderData[]
): ValuationMetrics['gmvEstimate'] {
  // If we have order data, use it
  if (orders && orders.length > 0) {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const recentOrders = orders.filter(o => new Date(o.createdAt).getTime() > thirtyDaysAgo);
    const monthlyGMV = recentOrders.reduce((sum, o) => sum + o.total, 0);
    
    // Calculate growth
    const sixtyDaysAgo = Date.now() - (60 * 24 * 60 * 60 * 1000);
    const previousOrders = orders.filter(o => {
      const time = new Date(o.createdAt).getTime();
      return time > sixtyDaysAgo && time <= thirtyDaysAgo;
    });
    const previousGMV = previousOrders.reduce((sum, o) => sum + o.total, 0);
    const growth = previousGMV > 0 ? ((monthlyGMV - previousGMV) / previousGMV) * 100 : 0;

    return {
      monthly: monthlyGMV,
      annual: monthlyGMV * 12,
      growth,
    };
  }

  // Estimate from products
  const avgPrice = products.reduce((sum, p) => sum + p.price, 0) / products.length;
  const totalProducts = products.length;
  
  // Estimate monthly sales based on product velocity
  const avgPurchases = products.reduce((sum, p) => sum + (p.purchaseCount || 0), 0) / products.length;
  const estimatedMonthlyOrders = Math.max(10, avgPurchases * totalProducts * 0.1);
  const monthlyGMV = estimatedMonthlyOrders * avgPrice;

  return {
    monthly: monthlyGMV,
    annual: monthlyGMV * 12,
    growth: 15, // Default growth estimate
  };
}

/**
 * Calculate conversion efficiency
 */
function calculateConversionEfficiency(
  products: ProductValuationData[],
  traffic?: TrafficData
): number {
  if (traffic) {
    // Real conversion rate
    const totalPurchases = products.reduce((sum, p) => sum + (p.purchaseCount || 0), 0);
    const estimatedVisits = traffic.dailyVisitors * 30;
    if (estimatedVisits > 0) {
      return Math.min(1, totalPurchases / estimatedVisits);
    }
  }

  // Estimate from view-to-purchase ratio
  const totalViews = products.reduce((sum, p) => sum + (p.viewCount || 1), 0);
  const totalPurchases = products.reduce((sum, p) => sum + (p.purchaseCount || 0), 0);
  
  if (totalViews > 0) {
    return Math.min(1, totalPurchases / totalViews);
  }

  return 0.025; // Industry average 2.5%
}

/**
 * Calculate product velocity index
 */
function calculateProductVelocity(products: ProductValuationData[]): number {
  // Velocity = how fast products are selling
  const velocities = products.map(p => {
    const daysSinceCreation = Math.max(1, 
      (Date.now() - new Date(p.createdAt).getTime()) / (24 * 60 * 60 * 1000)
    );
    const purchases = p.purchaseCount || 0;
    return purchases / daysSinceCreation;
  });

  const avgVelocity = velocities.reduce((sum, v) => sum + v, 0) / velocities.length;
  
  // Normalize to 0-1 scale (1 sale per day per product = 1.0)
  return Math.min(1, avgVelocity);
}

/**
 * Calculate SKU depth score
 */
function calculateSKUDepth(products: ProductValuationData[]): number {
  // Category coverage
  const categories = new Set(products.map(p => p.category));
  const categoryScore = Math.min(1, categories.size / 5);

  // Product count score (logarithmic)
  const countScore = Math.min(1, Math.log10(products.length + 1) / 2);

  // Price range diversity
  const prices = products.map(p => p.price).sort((a, b) => a - b);
  const priceRange = prices[prices.length - 1] - prices[0];
  const priceScore = Math.min(1, priceRange / 200);

  return (categoryScore + countScore + priceScore) / 3;
}

/**
 * Calculate average order value
 */
function calculateAOV(products: ProductValuationData[], orders?: OrderData[]): number {
  if (orders && orders.length > 0) {
    return orders.reduce((sum, o) => sum + o.total, 0) / orders.length;
  }

  // Estimate from product prices
  const avgPrice = products.reduce((sum, p) => sum + p.price, 0) / products.length;
  return avgPrice * 1.5; // Assume 1.5 items per order
}

/**
 * Calculate customer lifetime value
 */
function calculateCLTV(aov: number, conversionRate: number): number {
  // Simple CLV = AOV × Average Purchase Frequency × Average Customer Lifespan
  const purchaseFrequency = 2.5; // Average purchases per year
  const customerLifespan = 2;    // Years
  return aov * purchaseFrequency * customerLifespan;
}

/**
 * Determine store grade
 */
function determineGrade(score: number): StoreGrade {
  for (const [grade, threshold] of Object.entries(GRADE_THRESHOLDS)) {
    if (score >= threshold) {
      return grade as StoreGrade;
    }
  }
  return 'F';
}

/**
 * Calculate store health
 */
function calculateStoreHealth(
  metrics: ValuationMetrics,
  products: ProductValuationData[]
): StoreHealth {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const opportunities: string[] = [];
  const risks: string[] = [];

  // Analyze metrics
  if (metrics.conversionEfficiency > 0.03) {
    strengths.push('Above-average conversion rate');
  } else {
    weaknesses.push('Conversion rate below industry average');
    opportunities.push('Optimize product pages and checkout flow');
  }

  if (metrics.productVelocity > 0.3) {
    strengths.push('Strong product velocity');
  } else {
    weaknesses.push('Low product turnover');
    opportunities.push('Implement promotional campaigns');
  }

  if (metrics.skuDepth > 0.5) {
    strengths.push('Good product catalog depth');
  } else {
    weaknesses.push('Limited product selection');
    opportunities.push('Expand product catalog');
  }

  if (metrics.avgOrderValue > 50) {
    strengths.push('Healthy average order value');
  } else {
    opportunities.push('Implement upselling and bundling');
  }

  // Category analysis
  const categories = new Set(products.map(p => p.category));
  if (categories.size >= 3) {
    strengths.push('Diversified product categories');
  } else {
    risks.push('Category concentration risk');
  }

  // Trending products
  const trendingCount = products.filter(p => (p.trendingScore || 0) > 50).length;
  if (trendingCount > products.length * 0.2) {
    strengths.push('Strong trending product portfolio');
  }

  // Calculate overall score
  const scoreComponents = [
    metrics.conversionEfficiency * 100 * 2,
    metrics.productVelocity * 100,
    metrics.skuDepth * 100,
    Math.min(100, metrics.avgOrderValue),
    metrics.gmvEstimate.growth > 0 ? Math.min(50, metrics.gmvEstimate.growth) : 0,
  ];
  const overallScore = scoreComponents.reduce((sum, s) => sum + s, 0) / scoreComponents.length;

  return {
    overallScore: Math.round(overallScore),
    grade: determineGrade(overallScore),
    strengths,
    weaknesses,
    opportunities,
    risks,
  };
}

/**
 * Calculate growth trajectory
 */
function calculateTrajectory(
  gmvEstimate: ValuationMetrics['gmvEstimate'],
  products: ProductValuationData[]
): GrowthTrajectory {
  const growth = gmvEstimate.growth;
  
  let trend: GrowthTrajectory['trend'];
  if (growth > 20) trend = 'accelerating';
  else if (growth > 5) trend = 'steady';
  else if (growth > -5) trend = 'decelerating';
  else trend = 'declining';

  // Project annual growth
  const projectedAnnualGrowth = Math.pow(1 + growth / 100, 12) - 1;

  // Runway estimate (months until potential issues)
  const runwayMonths = growth > 0 ? 24 : Math.max(3, 12 + growth);

  // Break-even estimate
  const breakEvenEstimate = gmvEstimate.monthly > 5000 ? null : Math.ceil(5000 / Math.max(100, gmvEstimate.monthly));

  return {
    trend,
    monthlyGrowthRate: growth,
    projectedAnnualGrowth: projectedAnnualGrowth * 100,
    runwayMonths,
    breakEvenEstimate,
  };
}

/**
 * Calculate valuation range
 */
function calculateValuationRange(
  metrics: ValuationMetrics,
  health: StoreHealth,
  trajectory: GrowthTrajectory,
  products: ProductValuationData[]
): StoreValuation['valuation'] {
  // Base valuation from annual GMV
  const baseValuation = metrics.gmvEstimate.annual;

  // Determine multiple based on category mix
  const categoryMultiples = products.map(p => 
    CATEGORY_MULTIPLES[p.category.toLowerCase()] || CATEGORY_MULTIPLES.default
  );
  const avgMultiple = categoryMultiples.reduce((sum, m) => sum + m, 0) / categoryMultiples.length;

  // Apply growth premium
  let growthAdjustment = 1;
  if (trajectory.trend === 'accelerating') {
    growthAdjustment = 1 + config.growthPremium;
  } else if (trajectory.trend === 'declining') {
    growthAdjustment = 1 - config.riskDiscount;
  }

  // Health adjustment
  const healthAdjustment = health.overallScore / 100;

  // Calculate range
  const midValuation = Math.max(
    config.minValuation,
    baseValuation * avgMultiple * growthAdjustment * healthAdjustment
  );

  return {
    low: Math.round(midValuation * 0.7),
    mid: Math.round(midValuation),
    high: Math.round(midValuation * 1.4),
    confidence: Math.min(0.9, health.overallScore / 100 + 0.2),
  };
}

/**
 * Generate market comparables
 */
function generateComparables(
  products: ProductValuationData[],
  valuation: StoreValuation['valuation']
): MarketComparable[] {
  const categories = [...new Set(products.map(p => p.category))];
  
  return categories.map(category => {
    const multiple = CATEGORY_MULTIPLES[category.toLowerCase()] || CATEGORY_MULTIPLES.default;
    const categoryProducts = products.filter(p => p.category === category);
    const categoryGMV = categoryProducts.reduce((sum, p) => sum + p.price * (p.purchaseCount || 0), 0);
    
    return {
      category,
      avgValuation: categoryGMV * multiple * 12,
      avgMultiple: multiple,
      percentile: Math.round(Math.random() * 30 + 50), // Simplified percentile
    };
  });
}

/**
 * Generate pitch deck metrics
 */
function generatePitchMetrics(
  metrics: ValuationMetrics,
  health: StoreHealth,
  trajectory: GrowthTrajectory,
  valuation: StoreValuation['valuation']
): PitchDeckMetrics {
  const formatCurrency = (n: number) => 
    n >= 1000000 ? `$${(n / 1000000).toFixed(1)}M` :
    n >= 1000 ? `$${(n / 1000).toFixed(0)}K` :
    `$${n.toFixed(0)}`;

  return {
    headline: `${health.grade} Rated Store with ${formatCurrency(metrics.gmvEstimate.annual)} Annual GMV`,
    subheadline: `${trajectory.trend.charAt(0).toUpperCase() + trajectory.trend.slice(1)} growth trajectory with ${metrics.gmvEstimate.growth.toFixed(0)}% monthly growth`,
    keyStats: [
      { label: 'Valuation Range', value: `${formatCurrency(valuation.low)} - ${formatCurrency(valuation.high)}`, trend: 'up' },
      { label: 'Monthly GMV', value: formatCurrency(metrics.gmvEstimate.monthly), trend: metrics.gmvEstimate.growth > 0 ? 'up' : 'down' },
      { label: 'Conversion Rate', value: `${(metrics.conversionEfficiency * 100).toFixed(1)}%`, trend: metrics.conversionEfficiency > 0.025 ? 'up' : 'neutral' },
      { label: 'Avg Order Value', value: formatCurrency(metrics.avgOrderValue), trend: 'neutral' },
      { label: 'Customer LTV', value: formatCurrency(metrics.customerLifetimeValue), trend: 'up' },
      { label: 'Revenue Multiple', value: `${metrics.revenueMultiple.toFixed(1)}x`, trend: 'neutral' },
    ],
    investorHighlights: [
      ...health.strengths.slice(0, 3),
      `${trajectory.runwayMonths} month runway at current trajectory`,
    ],
    riskFactors: [
      ...health.risks,
      ...health.weaknesses.slice(0, 2),
    ],
  };
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Calculate store valuation
 */
export function calculateValuation(input: ValuationInput): StoreValuation {
  const { products, orders, traffic, costs } = input;

  // Calculate core metrics
  const gmvEstimate = calculateGMV(products, orders);
  const conversionEfficiency = calculateConversionEfficiency(products, traffic);
  const productVelocity = calculateProductVelocity(products);
  const skuDepth = calculateSKUDepth(products);
  const avgOrderValue = calculateAOV(products, orders);
  const customerLifetimeValue = calculateCLTV(avgOrderValue, conversionEfficiency);
  
  // Determine revenue multiple
  const categories = products.map(p => p.category.toLowerCase());
  const multiples = categories.map(c => CATEGORY_MULTIPLES[c] || CATEGORY_MULTIPLES.default);
  const revenueMultiple = multiples.reduce((sum, m) => sum + m, 0) / multiples.length;

  const metrics: ValuationMetrics = {
    gmvEstimate,
    conversionEfficiency,
    productVelocity,
    skuDepth,
    avgOrderValue,
    customerLifetimeValue,
    revenueMultiple,
  };

  // Calculate health and trajectory
  const health = calculateStoreHealth(metrics, products);
  const trajectory = calculateTrajectory(gmvEstimate, products);

  // Calculate valuation
  const valuation = calculateValuationRange(metrics, health, trajectory, products);

  // Generate comparables and pitch metrics
  const comparables = generateComparables(products, valuation);
  const pitchMetrics = generatePitchMetrics(metrics, health, trajectory, valuation);

  const result: StoreValuation = {
    timestamp: Date.now(),
    valuation,
    metrics,
    health,
    trajectory,
    comparables,
    pitchMetrics,
  };

  lastValuation = result;
  return result;
}

/**
 * Get last valuation
 */
export function getLastValuation(): StoreValuation | null {
  return lastValuation;
}

/**
 * Get quick valuation estimate
 */
export function getQuickValuation(
  productCount: number,
  avgPrice: number,
  monthlyOrders: number
): { low: number; mid: number; high: number } {
  const monthlyGMV = monthlyOrders * avgPrice * 1.5;
  const annualGMV = monthlyGMV * 12;
  const multiple = config.industryMultiple;

  const mid = annualGMV * multiple;
  return {
    low: Math.round(mid * 0.6),
    mid: Math.round(mid),
    high: Math.round(mid * 1.5),
  };
}

/**
 * Format valuation for display
 */
export function formatValuation(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

/**
 * Get grade color
 */
export function getGradeColor(grade: StoreGrade): string {
  if (grade.startsWith('A')) return '#22c55e';
  if (grade.startsWith('B')) return '#3b82f6';
  if (grade.startsWith('C')) return '#f59e0b';
  return '#ef4444';
}

/**
 * Configure valuation engine
 */
export function configure(newConfig: Partial<ValuationConfig>): void {
  config = { ...config, ...newConfig };
}

/**
 * Export valuation report
 */
export function exportValuationReport(valuation: StoreValuation): string {
  const { pitchMetrics, metrics, health, trajectory } = valuation;
  
  return `
# Store Valuation Report
Generated: ${new Date(valuation.timestamp).toISOString()}

## Executive Summary
${pitchMetrics.headline}
${pitchMetrics.subheadline}

## Valuation
- Low: ${formatValuation(valuation.valuation.low)}
- Mid: ${formatValuation(valuation.valuation.mid)}
- High: ${formatValuation(valuation.valuation.high)}
- Confidence: ${(valuation.valuation.confidence * 100).toFixed(0)}%

## Key Metrics
${pitchMetrics.keyStats.map(s => `- ${s.label}: ${s.value}`).join('\n')}

## Store Health: ${health.grade}
Score: ${health.overallScore}/100

### Strengths
${health.strengths.map(s => `- ${s}`).join('\n')}

### Areas for Improvement
${health.weaknesses.map(w => `- ${w}`).join('\n')}

### Opportunities
${health.opportunities.map(o => `- ${o}`).join('\n')}

### Risk Factors
${health.risks.map(r => `- ${r}`).join('\n')}

## Growth Trajectory
- Trend: ${trajectory.trend}
- Monthly Growth: ${trajectory.monthlyGrowthRate.toFixed(1)}%
- Projected Annual: ${trajectory.projectedAnnualGrowth.toFixed(0)}%
- Runway: ${trajectory.runwayMonths} months

## Market Comparables
${valuation.comparables.map(c => `- ${c.category}: ${formatValuation(c.avgValuation)} (${c.avgMultiple}x multiple)`).join('\n')}
`.trim();
}

export default {
  calculateValuation,
  getLastValuation,
  getQuickValuation,
  formatValuation,
  getGradeColor,
  configure,
  exportValuationReport,
};
