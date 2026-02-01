/**
 * AI Conversion Heatmap Engine
 * 
 * Privacy-safe, cookie-free conversion analytics.
 * Aggregates behavioral data into visual heat zones without
 * individual user tracking or persistent identifiers.
 * 
 * Features:
 * - High-attention zone detection
 * - Drop-off friction identification
 * - Scroll depth analysis
 * - Click density mapping
 * - NO cookies, NO tracking pixels, NO PII
 * 
 * @module conversionHeatmap
 * @version 1.0.0
 */

// ============================================================================
// TYPES
// ============================================================================

export interface HeatZone {
  id: string;
  type: 'product' | 'section' | 'cta' | 'navigation' | 'custom';
  name: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  metrics: ZoneMetrics;
  heatLevel: HeatLevel;
  lastUpdated: number;
}

export interface ZoneMetrics {
  impressions: number;
  clicks: number;
  hovers: number;
  avgHoverDuration: number;
  scrollReaches: number;
  exitRate: number;
  conversionRate: number;
}

export type HeatLevel = 'cold' | 'cool' | 'warm' | 'hot' | 'burning';

export interface ScrollDepthData {
  depth25: number;
  depth50: number;
  depth75: number;
  depth100: number;
  avgMaxDepth: number;
}

export interface FrictionPoint {
  zoneId: string;
  zoneName: string;
  frictionType: FrictionType;
  severity: number;
  suggestion: string;
}

export type FrictionType = 
  | 'high-exit'
  | 'low-engagement'
  | 'scroll-drop'
  | 'click-void'
  | 'hesitation-zone';

export interface HeatmapSnapshot {
  timestamp: number;
  sessionCount: number;
  zones: HeatZone[];
  scrollDepth: ScrollDepthData;
  frictionPoints: FrictionPoint[];
  topPerformers: string[];
  underperformers: string[];
}

export interface HeatmapConfig {
  aggregationWindowMs: number;
  minImpressionsForHeat: number;
  exitRateThreshold: number;
  engagementThreshold: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_CONFIG: HeatmapConfig = {
  aggregationWindowMs: 300000, // 5 minutes
  minImpressionsForHeat: 3,
  exitRateThreshold: 0.3,
  engagementThreshold: 0.2,
};

const HEAT_THRESHOLDS = {
  cold: 0.2,
  cool: 0.4,
  warm: 0.6,
  hot: 0.8,
};

// ============================================================================
// STATE
// ============================================================================

let config = { ...DEFAULT_CONFIG };
const zoneRegistry = new Map<string, HeatZone>();
const scrollData: number[] = [];
const sessionEvents: Array<{ type: string; zoneId: string; timestamp: number }> = [];
let sessionCount = 0;

// ============================================================================
// ZONE MANAGEMENT
// ============================================================================

/**
 * Register a trackable zone
 */
export function registerZone(
  id: string,
  type: HeatZone['type'],
  name: string,
  bounds: HeatZone['bounds']
): void {
  if (zoneRegistry.has(id)) return;

  zoneRegistry.set(id, {
    id,
    type,
    name,
    bounds,
    metrics: {
      impressions: 0,
      clicks: 0,
      hovers: 0,
      avgHoverDuration: 0,
      scrollReaches: 0,
      exitRate: 0,
      conversionRate: 0,
    },
    heatLevel: 'cold',
    lastUpdated: Date.now(),
  });
}

/**
 * Unregister a zone
 */
export function unregisterZone(id: string): void {
  zoneRegistry.delete(id);
}

/**
 * Update zone bounds (for responsive layouts)
 */
export function updateZoneBounds(id: string, bounds: HeatZone['bounds']): void {
  const zone = zoneRegistry.get(id);
  if (zone) {
    zone.bounds = bounds;
  }
}

// ============================================================================
// EVENT RECORDING
// ============================================================================

/**
 * Record zone impression (entered viewport)
 */
export function recordImpression(zoneId: string): void {
  const zone = zoneRegistry.get(zoneId);
  if (!zone) return;

  zone.metrics.impressions++;
  zone.lastUpdated = Date.now();
  
  sessionEvents.push({ type: 'impression', zoneId, timestamp: Date.now() });
  recalculateHeat(zoneId);
}

/**
 * Record click in zone
 */
export function recordClick(zoneId: string): void {
  const zone = zoneRegistry.get(zoneId);
  if (!zone) return;

  zone.metrics.clicks++;
  zone.lastUpdated = Date.now();
  
  sessionEvents.push({ type: 'click', zoneId, timestamp: Date.now() });
  recalculateHeat(zoneId);
}

/**
 * Record hover with duration
 */
export function recordHover(zoneId: string, durationMs: number): void {
  const zone = zoneRegistry.get(zoneId);
  if (!zone) return;

  const prevTotal = zone.metrics.avgHoverDuration * zone.metrics.hovers;
  zone.metrics.hovers++;
  zone.metrics.avgHoverDuration = (prevTotal + durationMs) / zone.metrics.hovers;
  zone.lastUpdated = Date.now();
  
  sessionEvents.push({ type: 'hover', zoneId, timestamp: Date.now() });
  recalculateHeat(zoneId);
}

/**
 * Record scroll reaching a zone
 */
export function recordScrollReach(zoneId: string): void {
  const zone = zoneRegistry.get(zoneId);
  if (!zone) return;

  zone.metrics.scrollReaches++;
  zone.lastUpdated = Date.now();
  recalculateHeat(zoneId);
}

/**
 * Record scroll depth (0-1)
 */
export function recordScrollDepth(depth: number): void {
  scrollData.push(Math.max(0, Math.min(1, depth)));
  
  // Keep only recent data
  if (scrollData.length > 1000) {
    scrollData.splice(0, 500);
  }
}

/**
 * Record exit from zone
 */
export function recordExit(zoneId: string): void {
  const zone = zoneRegistry.get(zoneId);
  if (!zone) return;

  // Calculate exit rate as exits / impressions
  const exits = sessionEvents.filter(e => e.type === 'exit' && e.zoneId === zoneId).length + 1;
  zone.metrics.exitRate = zone.metrics.impressions > 0 
    ? exits / zone.metrics.impressions 
    : 0;
  zone.lastUpdated = Date.now();
  
  sessionEvents.push({ type: 'exit', zoneId, timestamp: Date.now() });
  recalculateHeat(zoneId);
}

/**
 * Record conversion in zone
 */
export function recordConversion(zoneId: string): void {
  const zone = zoneRegistry.get(zoneId);
  if (!zone) return;

  const conversions = sessionEvents.filter(e => e.type === 'conversion' && e.zoneId === zoneId).length + 1;
  zone.metrics.conversionRate = zone.metrics.impressions > 0
    ? conversions / zone.metrics.impressions
    : 0;
  zone.lastUpdated = Date.now();
  
  sessionEvents.push({ type: 'conversion', zoneId, timestamp: Date.now() });
  recalculateHeat(zoneId);
}

/**
 * Start new session
 */
export function startSession(): void {
  sessionCount++;
}

// ============================================================================
// HEAT CALCULATION
// ============================================================================

/**
 * Calculate engagement score for a zone
 */
function calculateEngagementScore(metrics: ZoneMetrics): number {
  if (metrics.impressions === 0) return 0;

  const clickRate = metrics.clicks / metrics.impressions;
  const hoverRate = metrics.hovers / metrics.impressions;
  const hoverQuality = Math.min(1, metrics.avgHoverDuration / 3000); // 3s = max quality
  const reachRate = metrics.scrollReaches / Math.max(1, sessionCount);

  // Weighted engagement score
  return (
    (clickRate * 0.35) +
    (hoverRate * 0.20) +
    (hoverQuality * 0.25) +
    (reachRate * 0.20)
  );
}

/**
 * Determine heat level from engagement score
 */
function determineHeatLevel(score: number): HeatLevel {
  if (score >= HEAT_THRESHOLDS.hot) return 'burning';
  if (score >= HEAT_THRESHOLDS.warm) return 'hot';
  if (score >= HEAT_THRESHOLDS.cool) return 'warm';
  if (score >= HEAT_THRESHOLDS.cold) return 'cool';
  return 'cold';
}

/**
 * Recalculate heat level for a zone
 */
function recalculateHeat(zoneId: string): void {
  const zone = zoneRegistry.get(zoneId);
  if (!zone) return;

  if (zone.metrics.impressions < config.minImpressionsForHeat) {
    zone.heatLevel = 'cold';
    return;
  }

  const engagement = calculateEngagementScore(zone.metrics);
  zone.heatLevel = determineHeatLevel(engagement);
}

// ============================================================================
// ANALYSIS
// ============================================================================

/**
 * Get scroll depth analytics
 */
export function getScrollDepthData(): ScrollDepthData {
  if (scrollData.length === 0) {
    return {
      depth25: 0,
      depth50: 0,
      depth75: 0,
      depth100: 0,
      avgMaxDepth: 0,
    };
  }

  const sorted = [...scrollData].sort((a, b) => b - a);
  const maxDepths = sorted.slice(0, Math.ceil(sorted.length / 10)); // Top 10% as max depths

  return {
    depth25: scrollData.filter(d => d >= 0.25).length / scrollData.length,
    depth50: scrollData.filter(d => d >= 0.50).length / scrollData.length,
    depth75: scrollData.filter(d => d >= 0.75).length / scrollData.length,
    depth100: scrollData.filter(d => d >= 0.95).length / scrollData.length,
    avgMaxDepth: maxDepths.reduce((sum, d) => sum + d, 0) / maxDepths.length,
  };
}

/**
 * Identify friction points
 */
export function identifyFrictionPoints(): FrictionPoint[] {
  const frictionPoints: FrictionPoint[] = [];

  zoneRegistry.forEach(zone => {
    // High exit rate
    if (zone.metrics.exitRate > config.exitRateThreshold) {
      frictionPoints.push({
        zoneId: zone.id,
        zoneName: zone.name,
        frictionType: 'high-exit',
        severity: zone.metrics.exitRate,
        suggestion: `Users frequently leave at "${zone.name}". Consider simplifying or repositioning.`,
      });
    }

    // Low engagement despite impressions
    const engagement = calculateEngagementScore(zone.metrics);
    if (zone.metrics.impressions >= config.minImpressionsForHeat && engagement < config.engagementThreshold) {
      frictionPoints.push({
        zoneId: zone.id,
        zoneName: zone.name,
        frictionType: 'low-engagement',
        severity: 1 - engagement,
        suggestion: `"${zone.name}" gets views but low engagement. Consider more compelling content.`,
      });
    }

    // Click void (impressions but no clicks)
    if (zone.metrics.impressions > 10 && zone.metrics.clicks === 0) {
      frictionPoints.push({
        zoneId: zone.id,
        zoneName: zone.name,
        frictionType: 'click-void',
        severity: 0.8,
        suggestion: `"${zone.name}" receives attention but no clicks. Add clearer CTAs.`,
      });
    }
  });

  // Scroll drop analysis
  const scrollDepth = getScrollDepthData();
  if (scrollDepth.depth50 < 0.5 && scrollDepth.depth25 > 0.7) {
    frictionPoints.push({
      zoneId: 'page-scroll',
      zoneName: 'Page Scroll',
      frictionType: 'scroll-drop',
      severity: 1 - scrollDepth.depth50,
      suggestion: 'Significant scroll drop-off at 50%. Content below fold needs improvement.',
    });
  }

  return frictionPoints.sort((a, b) => b.severity - a.severity);
}

/**
 * Get top performing zones
 */
export function getTopPerformers(limit: number = 5): HeatZone[] {
  const zones = Array.from(zoneRegistry.values());
  return zones
    .filter(z => z.metrics.impressions >= config.minImpressionsForHeat)
    .sort((a, b) => calculateEngagementScore(b.metrics) - calculateEngagementScore(a.metrics))
    .slice(0, limit);
}

/**
 * Get underperforming zones
 */
export function getUnderperformers(limit: number = 5): HeatZone[] {
  const zones = Array.from(zoneRegistry.values());
  return zones
    .filter(z => z.metrics.impressions >= config.minImpressionsForHeat)
    .sort((a, b) => calculateEngagementScore(a.metrics) - calculateEngagementScore(b.metrics))
    .slice(0, limit);
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Get heatmap snapshot
 */
export function getHeatmapSnapshot(): HeatmapSnapshot {
  const zones = Array.from(zoneRegistry.values());
  const topPerformers = getTopPerformers();
  const underperformers = getUnderperformers();

  return {
    timestamp: Date.now(),
    sessionCount,
    zones,
    scrollDepth: getScrollDepthData(),
    frictionPoints: identifyFrictionPoints(),
    topPerformers: topPerformers.map(z => z.id),
    underperformers: underperformers.map(z => z.id),
  };
}

/**
 * Get zone by ID
 */
export function getZone(id: string): HeatZone | null {
  return zoneRegistry.get(id) || null;
}

/**
 * Get all zones
 */
export function getAllZones(): HeatZone[] {
  return Array.from(zoneRegistry.values());
}

/**
 * Get zones by heat level
 */
export function getZonesByHeat(level: HeatLevel): HeatZone[] {
  return Array.from(zoneRegistry.values()).filter(z => z.heatLevel === level);
}

/**
 * Get heat color for visualization
 */
export function getHeatColor(level: HeatLevel): string {
  const colors: Record<HeatLevel, string> = {
    cold: 'rgba(59, 130, 246, 0.3)',      // Blue
    cool: 'rgba(34, 197, 94, 0.4)',       // Green
    warm: 'rgba(234, 179, 8, 0.5)',       // Yellow
    hot: 'rgba(249, 115, 22, 0.6)',       // Orange
    burning: 'rgba(239, 68, 68, 0.7)',    // Red
  };
  return colors[level];
}

/**
 * Configure heatmap system
 */
export function configure(newConfig: Partial<HeatmapConfig>): void {
  config = { ...config, ...newConfig };
}

/**
 * Reset all heatmap data
 */
export function resetHeatmapData(): void {
  zoneRegistry.clear();
  scrollData.length = 0;
  sessionEvents.length = 0;
  sessionCount = 0;
}

/**
 * Get heatmap stats
 */
export function getHeatmapStats(): {
  totalZones: number;
  totalImpressions: number;
  totalClicks: number;
  avgEngagement: number;
  sessionCount: number;
} {
  const zones = Array.from(zoneRegistry.values());
  const totalImpressions = zones.reduce((sum, z) => sum + z.metrics.impressions, 0);
  const totalClicks = zones.reduce((sum, z) => sum + z.metrics.clicks, 0);
  const avgEngagement = zones.length > 0
    ? zones.reduce((sum, z) => sum + calculateEngagementScore(z.metrics), 0) / zones.length
    : 0;

  return {
    totalZones: zones.length,
    totalImpressions,
    totalClicks,
    avgEngagement,
    sessionCount,
  };
}

export default {
  registerZone,
  unregisterZone,
  updateZoneBounds,
  recordImpression,
  recordClick,
  recordHover,
  recordScrollReach,
  recordScrollDepth,
  recordExit,
  recordConversion,
  startSession,
  getScrollDepthData,
  identifyFrictionPoints,
  getTopPerformers,
  getUnderperformers,
  getHeatmapSnapshot,
  getZone,
  getAllZones,
  getZonesByHeat,
  getHeatColor,
  configure,
  resetHeatmapData,
  getHeatmapStats,
};
