/**
 * Performance Optimization Engine
 * 
 * Intelligent caching, lazy loading, code splitting,
 * and performance monitoring for optimal UX.
 * 
 * FEATURES:
 * - Intelligent resource caching
 * - Predictive prefetching
 * - Performance metrics tracking
 * - Bundle size optimization
 * - Core Web Vitals monitoring
 * 
 * @module ai/performanceOptimization
 * @version 1.0.0
 */

// ============================================================================
// TYPES
// ============================================================================

export type CacheStrategy = 
  | 'network-first'
  | 'cache-first'
  | 'stale-while-revalidate'
  | 'network-only'
  | 'cache-only';

export type ResourceType = 
  | 'image'
  | 'script'
  | 'style'
  | 'font'
  | 'data'
  | 'document';

export interface CacheEntry {
  key: string;
  value: unknown;
  timestamp: Date;
  expiresAt: Date;
  size: number;
  hitCount: number;
  strategy: CacheStrategy;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  rating: 'good' | 'needs-improvement' | 'poor';
}

export interface CoreWebVitals {
  // Largest Contentful Paint
  lcp: { value: number; rating: 'good' | 'needs-improvement' | 'poor' };
  // First Input Delay
  fid: { value: number; rating: 'good' | 'needs-improvement' | 'poor' };
  // Cumulative Layout Shift
  cls: { value: number; rating: 'good' | 'needs-improvement' | 'poor' };
  // First Contentful Paint
  fcp: { value: number; rating: 'good' | 'needs-improvement' | 'poor' };
  // Time to First Byte
  ttfb: { value: number; rating: 'good' | 'needs-improvement' | 'poor' };
  // Interaction to Next Paint
  inp: { value: number; rating: 'good' | 'needs-improvement' | 'poor' };
}

export interface BundleInfo {
  name: string;
  size: number;
  gzipSize: number;
  modules: number;
  loadTime: number;
  isLazy: boolean;
}

export interface PrefetchPrediction {
  url: string;
  probability: number;
  priority: 'high' | 'medium' | 'low';
  resourceType: ResourceType;
}

export interface PerformanceReport {
  timestamp: Date;
  url: string;
  // Core Web Vitals
  webVitals: CoreWebVitals;
  // Resource metrics
  totalResources: number;
  totalSize: number;
  cacheHitRate: number;
  // Timing
  domContentLoaded: number;
  windowLoaded: number;
  // Recommendations
  recommendations: PerformanceRecommendation[];
  // Score
  overallScore: number;
}

export interface PerformanceRecommendation {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  category: 'caching' | 'loading' | 'rendering' | 'network' | 'images';
}

export interface ResourceTiming {
  url: string;
  type: ResourceType;
  startTime: number;
  duration: number;
  transferSize: number;
  cached: boolean;
}

// ============================================================================
// STATE
// ============================================================================

const cache: Map<string, CacheEntry> = new Map();
const metrics: PerformanceMetric[] = [];
const resourceTimings: ResourceTiming[] = [];
const prefetchQueue: Set<string> = new Set();

// Cache configuration
const cacheConfig = {
  maxSize: 50 * 1024 * 1024, // 50MB
  maxEntries: 500,
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  strategies: {
    api: 'stale-while-revalidate' as CacheStrategy,
    images: 'cache-first' as CacheStrategy,
    static: 'cache-first' as CacheStrategy,
    dynamic: 'network-first' as CacheStrategy,
  },
};

// Core Web Vitals thresholds
const webVitalsThresholds = {
  lcp: { good: 2500, poor: 4000 }, // ms
  fid: { good: 100, poor: 300 }, // ms
  cls: { good: 0.1, poor: 0.25 }, // score
  fcp: { good: 1800, poor: 3000 }, // ms
  ttfb: { good: 800, poor: 1800 }, // ms
  inp: { good: 200, poor: 500 }, // ms
};

// ============================================================================
// CACHE FUNCTIONS
// ============================================================================

/**
 * Get item from cache
 */
export function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  
  if (!entry) return null;
  
  // Check expiration
  if (entry.expiresAt < new Date()) {
    cache.delete(key);
    return null;
  }
  
  // Update hit count
  entry.hitCount++;
  cache.set(key, entry);
  
  return entry.value as T;
}

/**
 * Set item in cache
 */
export function setCache<T>(
  key: string,
  value: T,
  options?: {
    ttl?: number;
    strategy?: CacheStrategy;
  }
): void {
  // Calculate size (rough estimate)
  const size = JSON.stringify(value).length * 2; // UTF-16
  
  // Evict if necessary
  ensureCacheSpace(size);
  
  const entry: CacheEntry = {
    key,
    value,
    timestamp: new Date(),
    expiresAt: new Date(Date.now() + (options?.ttl || cacheConfig.defaultTTL)),
    size,
    hitCount: 0,
    strategy: options?.strategy || 'cache-first',
  };
  
  cache.set(key, entry);
}

/**
 * Invalidate cache entries by pattern
 */
export function invalidateCache(pattern: string | RegExp): number {
  let count = 0;
  const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
  
  for (const key of cache.keys()) {
    if (regex.test(key)) {
      cache.delete(key);
      count++;
    }
  }
  
  return count;
}

/**
 * Clear entire cache
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  entries: number;
  size: number;
  hitRate: number;
  topEntries: Array<{ key: string; hits: number; size: number }>;
} {
  const entries = Array.from(cache.values());
  const totalSize = entries.reduce((sum, e) => sum + e.size, 0);
  const totalHits = entries.reduce((sum, e) => sum + e.hitCount, 0);
  const hitRate = entries.length > 0 ? totalHits / entries.length : 0;
  
  const topEntries = entries
    .sort((a, b) => b.hitCount - a.hitCount)
    .slice(0, 10)
    .map(e => ({ key: e.key, hits: e.hitCount, size: e.size }));
  
  return {
    entries: cache.size,
    size: totalSize,
    hitRate,
    topEntries,
  };
}

function ensureCacheSpace(requiredSize: number): void {
  const stats = getCacheStats();
  
  // Check entry count
  if (cache.size >= cacheConfig.maxEntries) {
    evictLeastUsed(10);
  }
  
  // Check size
  while (stats.size + requiredSize > cacheConfig.maxSize && cache.size > 0) {
    evictLeastUsed(5);
  }
}

function evictLeastUsed(count: number): void {
  const entries = Array.from(cache.entries())
    .sort((a, b) => a[1].hitCount - b[1].hitCount);
  
  for (let i = 0; i < Math.min(count, entries.length); i++) {
    cache.delete(entries[i][0]);
  }
}

// ============================================================================
// PREFETCHING
// ============================================================================

/**
 * Predict and prefetch likely next resources
 */
export function predictPrefetch(
  currentUrl: string,
  userBehavior: { scrollDepth: number; timeOnPage: number; clickHistory: string[] }
): PrefetchPrediction[] {
  const predictions: PrefetchPrediction[] = [];
  
  // Analyze click history for patterns
  const lastClicks = userBehavior.clickHistory.slice(-5);
  
  // Common navigation patterns
  const navigationPatterns: Record<string, string[]> = {
    '/': ['/collections', '/products', '/cart'],
    '/collections': ['/products', '/cart'],
    '/products': ['/cart', '/checkout'],
    '/cart': ['/checkout'],
  };
  
  // Get predicted pages
  const basePath = '/' + currentUrl.split('/')[1];
  const predictedPages = navigationPatterns[basePath] || [];
  
  predictedPages.forEach((page, index) => {
    predictions.push({
      url: page,
      probability: 0.8 - (index * 0.2),
      priority: index === 0 ? 'high' : 'medium',
      resourceType: 'document',
    });
  });
  
  // If user has scrolled deep, predict next page content
  if (userBehavior.scrollDepth > 70) {
    predictions.push({
      url: `${currentUrl}?page=2`,
      probability: 0.6,
      priority: 'medium',
      resourceType: 'data',
    });
  }
  
  // Prefetch based on time on page
  if (userBehavior.timeOnPage > 30) {
    predictions.push({
      url: '/api/recommendations',
      probability: 0.5,
      priority: 'low',
      resourceType: 'data',
    });
  }
  
  return predictions.filter(p => !prefetchQueue.has(p.url));
}

/**
 * Execute prefetch for high-probability resources
 */
export function executePrefetch(predictions: PrefetchPrediction[]): void {
  predictions
    .filter(p => p.probability >= 0.5)
    .forEach(prediction => {
      if (prefetchQueue.has(prediction.url)) return;
      
      prefetchQueue.add(prediction.url);
      
      // Create prefetch link
      if (typeof document !== 'undefined') {
        const link = document.createElement('link');
        link.rel = prediction.priority === 'high' ? 'preload' : 'prefetch';
        link.href = prediction.url;
        
        if (prediction.resourceType === 'document') {
          link.as = 'document';
        } else if (prediction.resourceType === 'data') {
          link.as = 'fetch';
        }
        
        document.head.appendChild(link);
      }
    });
}

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

/**
 * Measure and record Core Web Vitals
 */
export function measureWebVitals(): CoreWebVitals {
  // In production, would use web-vitals library
  // Mock implementation with simulated values
  
  const measure = (value: number, thresholds: { good: number; poor: number }): {
    value: number;
    rating: 'good' | 'needs-improvement' | 'poor';
  } => {
    let rating: 'good' | 'needs-improvement' | 'poor';
    if (value <= thresholds.good) rating = 'good';
    else if (value <= thresholds.poor) rating = 'needs-improvement';
    else rating = 'poor';
    return { value, rating };
  };
  
  // Simulated values (would come from Performance API in production)
  return {
    lcp: measure(1800 + Math.random() * 1500, webVitalsThresholds.lcp),
    fid: measure(50 + Math.random() * 100, webVitalsThresholds.fid),
    cls: measure(0.05 + Math.random() * 0.1, webVitalsThresholds.cls),
    fcp: measure(1200 + Math.random() * 1000, webVitalsThresholds.fcp),
    ttfb: measure(400 + Math.random() * 600, webVitalsThresholds.ttfb),
    inp: measure(100 + Math.random() * 150, webVitalsThresholds.inp),
  };
}

/**
 * Record a performance metric
 */
export function recordMetric(
  name: string,
  value: number,
  unit: string,
  thresholds?: { good: number; poor: number }
): void {
  let rating: 'good' | 'needs-improvement' | 'poor' = 'good';
  
  if (thresholds) {
    if (value > thresholds.poor) rating = 'poor';
    else if (value > thresholds.good) rating = 'needs-improvement';
  }
  
  metrics.push({
    name,
    value,
    unit,
    timestamp: new Date(),
    rating,
  });
  
  // Keep only last 1000 metrics
  if (metrics.length > 1000) {
    metrics.shift();
  }
}

/**
 * Get resource timing information
 */
export function getResourceTimings(): ResourceTiming[] {
  if (typeof performance === 'undefined') return [];
  
  const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  
  return entries.map(entry => {
    let type: ResourceType = 'document';
    
    if (entry.initiatorType === 'img') type = 'image';
    else if (entry.initiatorType === 'script') type = 'script';
    else if (entry.initiatorType === 'css' || entry.initiatorType === 'link') type = 'style';
    else if (entry.name.includes('.woff') || entry.name.includes('.ttf')) type = 'font';
    else if (entry.initiatorType === 'fetch' || entry.initiatorType === 'xmlhttprequest') type = 'data';
    
    return {
      url: entry.name,
      type,
      startTime: entry.startTime,
      duration: entry.duration,
      transferSize: entry.transferSize,
      cached: entry.transferSize === 0 && entry.decodedBodySize > 0,
    };
  });
}

// ============================================================================
// PERFORMANCE REPORT
// ============================================================================

/**
 * Generate comprehensive performance report
 */
export function generatePerformanceReport(url: string): PerformanceReport {
  const webVitals = measureWebVitals();
  const resources = getResourceTimings();
  const cacheStats = getCacheStats();
  
  // Calculate totals
  const totalResources = resources.length;
  const totalSize = resources.reduce((sum, r) => sum + r.transferSize, 0);
  const cachedResources = resources.filter(r => r.cached).length;
  const cacheHitRate = totalResources > 0 ? cachedResources / totalResources : 0;
  
  // Get timing metrics
  let domContentLoaded = 0;
  let windowLoaded = 0;
  
  if (typeof performance !== 'undefined') {
    const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navEntry) {
      domContentLoaded = navEntry.domContentLoadedEventEnd;
      windowLoaded = navEntry.loadEventEnd;
    }
  }
  
  // Generate recommendations
  const recommendations = generateRecommendations(webVitals, resources, cacheStats);
  
  // Calculate overall score (0-100)
  let score = 100;
  
  // Deduct for poor web vitals
  Object.values(webVitals).forEach(metric => {
    if (metric.rating === 'poor') score -= 15;
    else if (metric.rating === 'needs-improvement') score -= 8;
  });
  
  // Deduct for low cache hit rate
  if (cacheHitRate < 0.5) score -= 10;
  
  // Deduct for slow load time
  if (windowLoaded > 5000) score -= 10;
  else if (windowLoaded > 3000) score -= 5;
  
  return {
    timestamp: new Date(),
    url,
    webVitals,
    totalResources,
    totalSize,
    cacheHitRate,
    domContentLoaded,
    windowLoaded,
    recommendations,
    overallScore: Math.max(0, score),
  };
}

function generateRecommendations(
  webVitals: CoreWebVitals,
  resources: ResourceTiming[],
  cacheStats: ReturnType<typeof getCacheStats>
): PerformanceRecommendation[] {
  const recommendations: PerformanceRecommendation[] = [];
  
  // LCP recommendations
  if (webVitals.lcp.rating !== 'good') {
    recommendations.push({
      id: 'lcp-images',
      title: 'Optimize Largest Contentful Paint',
      description: 'Preload hero images and optimize image formats (WebP/AVIF)',
      impact: 'high',
      effort: 'medium',
      category: 'images',
    });
  }
  
  // CLS recommendations
  if (webVitals.cls.rating !== 'good') {
    recommendations.push({
      id: 'cls-dimensions',
      title: 'Reduce Cumulative Layout Shift',
      description: 'Add explicit width/height to images and embeds',
      impact: 'high',
      effort: 'low',
      category: 'rendering',
    });
  }
  
  // FID/INP recommendations
  if (webVitals.fid.rating !== 'good' || webVitals.inp.rating !== 'good') {
    recommendations.push({
      id: 'js-optimization',
      title: 'Optimize JavaScript Execution',
      description: 'Split large bundles and defer non-critical scripts',
      impact: 'high',
      effort: 'high',
      category: 'loading',
    });
  }
  
  // TTFB recommendations
  if (webVitals.ttfb.rating !== 'good') {
    recommendations.push({
      id: 'server-response',
      title: 'Improve Server Response Time',
      description: 'Enable server-side caching and use a CDN',
      impact: 'high',
      effort: 'medium',
      category: 'network',
    });
  }
  
  // Cache recommendations
  if (cacheStats.hitRate < 0.5) {
    recommendations.push({
      id: 'caching-strategy',
      title: 'Implement Better Caching',
      description: 'Use aggressive caching for static assets and stale-while-revalidate for API calls',
      impact: 'medium',
      effort: 'low',
      category: 'caching',
    });
  }
  
  // Image recommendations
  const largeImages = resources.filter(r => r.type === 'image' && r.transferSize > 200000);
  if (largeImages.length > 0) {
    recommendations.push({
      id: 'image-optimization',
      title: 'Compress Large Images',
      description: `${largeImages.length} images are over 200KB. Consider compression and responsive images.`,
      impact: 'high',
      effort: 'low',
      category: 'images',
    });
  }
  
  return recommendations;
}

// ============================================================================
// LAZY LOADING
// ============================================================================

/**
 * Create intersection observer for lazy loading
 */
export function createLazyLoadObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionObserverInit
): IntersectionObserver | null {
  if (typeof IntersectionObserver === 'undefined') return null;
  
  return new IntersectionObserver(callback, {
    root: null,
    rootMargin: '100px',
    threshold: 0,
    ...options,
  });
}

/**
 * Lazy load images in viewport
 */
export function lazyLoadImages(): void {
  if (typeof document === 'undefined') return;
  
  const images = document.querySelectorAll('img[data-src]');
  
  const observer = createLazyLoadObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        const src = img.getAttribute('data-src');
        
        if (src) {
          img.src = src;
          img.removeAttribute('data-src');
        }
        
        observer?.unobserve(img);
      }
    });
  });
  
  if (observer) {
    images.forEach(img => observer.observe(img));
  }
}

// ============================================================================
// BUNDLE ANALYSIS
// ============================================================================

/**
 * Get bundle information (mock - would integrate with bundler)
 */
export function getBundleInfo(): BundleInfo[] {
  // In production, this would come from build-time analysis
  return [
    { name: 'main', size: 245000, gzipSize: 78000, modules: 120, loadTime: 450, isLazy: false },
    { name: 'vendor', size: 380000, gzipSize: 125000, modules: 85, loadTime: 620, isLazy: false },
    { name: 'admin', size: 180000, gzipSize: 58000, modules: 45, loadTime: 0, isLazy: true },
    { name: 'charts', size: 95000, gzipSize: 32000, modules: 12, loadTime: 0, isLazy: true },
    { name: 'ai-modules', size: 120000, gzipSize: 42000, modules: 28, loadTime: 0, isLazy: true },
  ];
}

/**
 * Analyze bundle for optimization opportunities
 */
export function analyzeBundles(): {
  totalSize: number;
  totalGzipSize: number;
  lazyLoadedSize: number;
  recommendations: string[];
} {
  const bundles = getBundleInfo();
  
  const totalSize = bundles.reduce((sum, b) => sum + b.size, 0);
  const totalGzipSize = bundles.reduce((sum, b) => sum + b.gzipSize, 0);
  const lazyLoadedSize = bundles.filter(b => b.isLazy).reduce((sum, b) => sum + b.size, 0);
  
  const recommendations: string[] = [];
  
  // Check for large bundles
  const largeBundles = bundles.filter(b => b.size > 300000 && !b.isLazy);
  if (largeBundles.length > 0) {
    recommendations.push(`Consider splitting large bundles: ${largeBundles.map(b => b.name).join(', ')}`);
  }
  
  // Check lazy loading ratio
  const lazyRatio = lazyLoadedSize / totalSize;
  if (lazyRatio < 0.3) {
    recommendations.push('Consider lazy loading more components (current ratio: ' + (lazyRatio * 100).toFixed(1) + '%)');
  }
  
  // Check vendor bundle
  const vendorBundle = bundles.find(b => b.name === 'vendor');
  if (vendorBundle && vendorBundle.size > 400000) {
    recommendations.push('Vendor bundle is large. Consider tree-shaking or replacing heavy dependencies.');
  }
  
  return {
    totalSize,
    totalGzipSize,
    lazyLoadedSize,
    recommendations,
  };
}

// ============================================================================
// STATISTICS
// ============================================================================

export function getPerformanceStats(): {
  avgLcp: number;
  avgFid: number;
  avgCls: number;
  avgLoadTime: number;
  cacheHitRate: number;
  metricsCount: number;
} {
  const recentMetrics = metrics.slice(-100);
  
  const lcpMetrics = recentMetrics.filter(m => m.name === 'lcp');
  const fidMetrics = recentMetrics.filter(m => m.name === 'fid');
  const clsMetrics = recentMetrics.filter(m => m.name === 'cls');
  const loadMetrics = recentMetrics.filter(m => m.name === 'load');
  
  const avg = (arr: PerformanceMetric[]) => 
    arr.length > 0 ? arr.reduce((sum, m) => sum + m.value, 0) / arr.length : 0;
  
  return {
    avgLcp: avg(lcpMetrics),
    avgFid: avg(fidMetrics),
    avgCls: avg(clsMetrics),
    avgLoadTime: avg(loadMetrics),
    cacheHitRate: getCacheStats().hitRate,
    metricsCount: metrics.length,
  };
}

// ============================================================================
// MOCK DATA
// ============================================================================

export function generateMockPerformanceData(): {
  report: PerformanceReport;
  cacheStats: ReturnType<typeof getCacheStats>;
  bundleAnalysis: ReturnType<typeof analyzeBundles>;
  stats: ReturnType<typeof getPerformanceStats>;
} {
  // Seed some cache entries
  for (let i = 0; i < 50; i++) {
    setCache(`api/products/${i}`, { id: i, name: `Product ${i}` }, { ttl: 300000 });
    cache.get(`api/products/${i}`)!.hitCount = Math.floor(Math.random() * 20);
  }
  
  // Record some metrics
  for (let i = 0; i < 20; i++) {
    recordMetric('lcp', 1500 + Math.random() * 2000, 'ms', webVitalsThresholds.lcp);
    recordMetric('fid', 50 + Math.random() * 150, 'ms', webVitalsThresholds.fid);
    recordMetric('cls', 0.05 + Math.random() * 0.15, 'score', webVitalsThresholds.cls);
    recordMetric('load', 2000 + Math.random() * 3000, 'ms');
  }
  
  return {
    report: generatePerformanceReport('/'),
    cacheStats: getCacheStats(),
    bundleAnalysis: analyzeBundles(),
    stats: getPerformanceStats(),
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Cache
  getCached,
  setCache,
  invalidateCache,
  clearCache,
  getCacheStats,
  // Prefetch
  predictPrefetch,
  executePrefetch,
  // Monitoring
  measureWebVitals,
  recordMetric,
  getResourceTimings,
  generatePerformanceReport,
  // Lazy loading
  createLazyLoadObserver,
  lazyLoadImages,
  // Bundle
  getBundleInfo,
  analyzeBundles,
  // Stats
  getPerformanceStats,
  // Mock
  generateMockPerformanceData,
};
