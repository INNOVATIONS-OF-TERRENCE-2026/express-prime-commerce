/**
 * Edge Security Hardening Module
 * 
 * Comprehensive security layer for edge functions,
 * API protection, and fraud prevention.
 * 
 * FEATURES:
 * - Request validation and sanitization
 * - Rate limiting with sliding window
 * - JWT token management
 * - CORS configuration
 * - Fraud detection
 * - IP reputation scoring
 * - Request fingerprinting
 * 
 * @module ai/edgeSecurity
 * @version 1.0.0
 */

// ============================================================================
// TYPES
// ============================================================================

export type ThreatLevel = 'none' | 'low' | 'medium' | 'high' | 'critical';
export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS';

export interface SecurityConfig {
  rateLimiting: RateLimitConfig;
  cors: CorsConfig;
  validation: ValidationConfig;
  jwt: JwtConfig;
  fraudDetection: FraudConfig;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests: boolean;
  keyGenerator: 'ip' | 'user' | 'fingerprint';
}

export interface CorsConfig {
  allowedOrigins: string[];
  allowedMethods: RequestMethod[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  credentials: boolean;
  maxAge: number;
}

export interface ValidationConfig {
  maxBodySize: number;
  maxUrlLength: number;
  allowedContentTypes: string[];
  sanitizeHtml: boolean;
  validateJson: boolean;
}

export interface JwtConfig {
  algorithm: 'HS256' | 'RS256';
  expiresIn: number;
  refreshExpiresIn: number;
  issuer: string;
  audience: string;
}

export interface FraudConfig {
  enableFingerprinting: boolean;
  maxFailedAttempts: number;
  blockDuration: number;
  checkVelocity: boolean;
  checkGeoAnomalies: boolean;
}

export interface RateLimitEntry {
  key: string;
  count: number;
  windowStart: Date;
  blocked: boolean;
  blockedUntil?: Date;
}

export interface RequestFingerprint {
  hash: string;
  userAgent: string;
  languages: string[];
  timezone: string;
  screen: string;
  plugins: number;
  platform: string;
  cookieEnabled: boolean;
  doNotTrack: boolean;
}

export interface ThreatAssessment {
  level: ThreatLevel;
  score: number; // 0-100
  factors: ThreatFactor[];
  recommendations: string[];
  shouldBlock: boolean;
}

export interface ThreatFactor {
  name: string;
  severity: ThreatLevel;
  weight: number;
  details: string;
}

export interface IpReputation {
  ip: string;
  score: number; // 0-100, higher is better
  isProxy: boolean;
  isVpn: boolean;
  isTor: boolean;
  isDatacenter: boolean;
  country: string;
  asn: string;
  threatHistory: ThreatIncident[];
}

export interface ThreatIncident {
  type: string;
  timestamp: Date;
  severity: ThreatLevel;
  blocked: boolean;
}

export interface SecurityEvent {
  id: string;
  timestamp: Date;
  type: 'rate_limit' | 'validation_error' | 'auth_failure' | 'fraud_detected' | 'blocked_request';
  ip: string;
  userId?: string;
  path: string;
  method: RequestMethod;
  details: Record<string, unknown>;
  threatLevel: ThreatLevel;
}

export interface SanitizedInput {
  original: string;
  sanitized: string;
  hasXss: boolean;
  hasSqlInjection: boolean;
  hasCommandInjection: boolean;
}

// ============================================================================
// STATE
// ============================================================================

const rateLimitStore: Map<string, RateLimitEntry> = new Map();
const ipReputationCache: Map<string, IpReputation> = new Map();
const securityEvents: SecurityEvent[] = [];
const blockedIps: Set<string> = new Set();

const defaultConfig: SecurityConfig = {
  rateLimiting: {
    windowMs: 60000, // 1 minute
    maxRequests: 100,
    skipSuccessfulRequests: false,
    keyGenerator: 'ip',
  },
  cors: {
    allowedOrigins: ['https://express-prime-commerce.vercel.app', 'http://localhost:3000'],
    allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
    credentials: true,
    maxAge: 86400,
  },
  validation: {
    maxBodySize: 10 * 1024 * 1024, // 10MB
    maxUrlLength: 2048,
    allowedContentTypes: ['application/json', 'multipart/form-data'],
    sanitizeHtml: true,
    validateJson: true,
  },
  jwt: {
    algorithm: 'HS256',
    expiresIn: 3600, // 1 hour
    refreshExpiresIn: 604800, // 7 days
    issuer: 'express-prime-commerce',
    audience: 'epc-users',
  },
  fraudDetection: {
    enableFingerprinting: true,
    maxFailedAttempts: 5,
    blockDuration: 3600000, // 1 hour
    checkVelocity: true,
    checkGeoAnomalies: true,
  },
};

// ============================================================================
// RATE LIMITING
// ============================================================================

/**
 * Check rate limit for a request
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig = defaultConfig.rateLimiting
): { allowed: boolean; remaining: number; resetAt: Date } {
  const now = new Date();
  const entry = rateLimitStore.get(key);
  
  // Check if blocked
  if (entry?.blocked && entry.blockedUntil && entry.blockedUntil > now) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.blockedUntil,
    };
  }
  
  // Check if window has expired
  if (!entry || now.getTime() - entry.windowStart.getTime() > config.windowMs) {
    const newEntry: RateLimitEntry = {
      key,
      count: 1,
      windowStart: now,
      blocked: false,
    };
    rateLimitStore.set(key, newEntry);
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: new Date(now.getTime() + config.windowMs),
    };
  }
  
  // Increment count
  entry.count++;
  
  // Check if over limit
  if (entry.count > config.maxRequests) {
    entry.blocked = true;
    entry.blockedUntil = new Date(now.getTime() + config.windowMs);
    rateLimitStore.set(key, entry);
    
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.blockedUntil,
    };
  }
  
  rateLimitStore.set(key, entry);
  
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: new Date(entry.windowStart.getTime() + config.windowMs),
  };
}

/**
 * Generate rate limit headers
 */
export function getRateLimitHeaders(
  key: string,
  config: RateLimitConfig = defaultConfig.rateLimiting
): Record<string, string> {
  const { remaining, resetAt } = checkRateLimit(key, config);
  
  return {
    'X-RateLimit-Limit': config.maxRequests.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': Math.floor(resetAt.getTime() / 1000).toString(),
  };
}

// ============================================================================
// INPUT VALIDATION & SANITIZATION
// ============================================================================

/**
 * Sanitize input string
 */
export function sanitizeInput(input: string): SanitizedInput {
  let sanitized = input;
  let hasXss = false;
  let hasSqlInjection = false;
  let hasCommandInjection = false;
  
  // XSS patterns
  const xssPatterns = [
    /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[\s\S]*?>/gi,
    /<object[\s\S]*?>/gi,
    /<embed[\s\S]*?>/gi,
  ];
  
  for (const pattern of xssPatterns) {
    if (pattern.test(sanitized)) {
      hasXss = true;
      sanitized = sanitized.replace(pattern, '');
    }
  }
  
  // SQL injection patterns
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE)\b)/gi,
    /('|")\s*(OR|AND)\s*('|")/gi,
    /--/g,
    /;\s*(SELECT|INSERT|UPDATE|DELETE)/gi,
  ];
  
  for (const pattern of sqlPatterns) {
    if (pattern.test(input)) {
      hasSqlInjection = true;
    }
  }
  
  // Command injection patterns
  const cmdPatterns = [
    /[;&|`$]/g,
    /\$\(.*\)/g,
    /`.*`/g,
  ];
  
  for (const pattern of cmdPatterns) {
    if (pattern.test(input)) {
      hasCommandInjection = true;
    }
  }
  
  // HTML encode
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
  
  return {
    original: input,
    sanitized,
    hasXss,
    hasSqlInjection,
    hasCommandInjection,
  };
}

/**
 * Validate JSON payload
 */
export function validateJson(
  payload: unknown,
  schema: {
    required?: string[];
    maxDepth?: number;
    maxKeys?: number;
    allowedTypes?: string[];
  } = {}
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (typeof payload !== 'object' || payload === null) {
    return { valid: false, errors: ['Payload must be an object'] };
  }
  
  const obj = payload as Record<string, unknown>;
  
  // Check required fields
  if (schema.required) {
    for (const field of schema.required) {
      if (!(field in obj)) {
        errors.push(`Missing required field: ${field}`);
      }
    }
  }
  
  // Check max keys
  const keyCount = Object.keys(obj).length;
  if (schema.maxKeys && keyCount > schema.maxKeys) {
    errors.push(`Too many keys: ${keyCount} > ${schema.maxKeys}`);
  }
  
  // Check depth
  if (schema.maxDepth) {
    const depth = getObjectDepth(obj);
    if (depth > schema.maxDepth) {
      errors.push(`Object too deeply nested: ${depth} > ${schema.maxDepth}`);
    }
  }
  
  return { valid: errors.length === 0, errors };
}

function getObjectDepth(obj: unknown, currentDepth = 0): number {
  if (typeof obj !== 'object' || obj === null) {
    return currentDepth;
  }
  
  let maxDepth = currentDepth;
  
  for (const value of Object.values(obj)) {
    const depth = getObjectDepth(value, currentDepth + 1);
    maxDepth = Math.max(maxDepth, depth);
  }
  
  return maxDepth;
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function validateUrl(url: string, allowedProtocols = ['http:', 'https:']): boolean {
  try {
    const parsed = new URL(url);
    return allowedProtocols.includes(parsed.protocol);
  } catch {
    return false;
  }
}

// ============================================================================
// CORS
// ============================================================================

/**
 * Generate CORS headers
 */
export function getCorsHeaders(
  origin: string,
  method: RequestMethod,
  config: CorsConfig = defaultConfig.cors
): Record<string, string> | null {
  // Check if origin is allowed
  if (!config.allowedOrigins.includes(origin) && !config.allowedOrigins.includes('*')) {
    return null;
  }
  
  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': config.allowedMethods.join(', '),
    'Access-Control-Allow-Headers': config.allowedHeaders.join(', '),
    'Access-Control-Expose-Headers': config.exposedHeaders.join(', '),
    'Access-Control-Max-Age': config.maxAge.toString(),
  };
  
  if (config.credentials) {
    headers['Access-Control-Allow-Credentials'] = 'true';
  }
  
  return headers;
}

/**
 * Handle preflight OPTIONS request
 */
export function handlePreflight(
  origin: string,
  method: RequestMethod,
  requestHeaders: string[]
): { allowed: boolean; headers: Record<string, string> } {
  const config = defaultConfig.cors;
  
  // Check origin
  if (!config.allowedOrigins.includes(origin) && !config.allowedOrigins.includes('*')) {
    return { allowed: false, headers: {} };
  }
  
  // Check method
  if (!config.allowedMethods.includes(method)) {
    return { allowed: false, headers: {} };
  }
  
  // Check headers
  const invalidHeaders = requestHeaders.filter(h => 
    !config.allowedHeaders.map(a => a.toLowerCase()).includes(h.toLowerCase())
  );
  
  if (invalidHeaders.length > 0) {
    return { allowed: false, headers: {} };
  }
  
  return {
    allowed: true,
    headers: getCorsHeaders(origin, method, config) || {},
  };
}

// ============================================================================
// FRAUD DETECTION
// ============================================================================

/**
 * Generate request fingerprint
 */
export function generateFingerprint(
  request: {
    userAgent: string;
    languages: string[];
    timezone: string;
    screen?: string;
    plugins?: number;
    platform?: string;
  }
): RequestFingerprint {
  const components = [
    request.userAgent,
    request.languages.join(','),
    request.timezone,
    request.screen || '',
    request.plugins?.toString() || '',
    request.platform || '',
  ];
  
  // Simple hash function
  const hash = components.join('|').split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0).toString(16);
  
  return {
    hash,
    userAgent: request.userAgent,
    languages: request.languages,
    timezone: request.timezone,
    screen: request.screen || 'unknown',
    plugins: request.plugins || 0,
    platform: request.platform || 'unknown',
    cookieEnabled: true,
    doNotTrack: false,
  };
}

/**
 * Assess threat level of a request
 */
export function assessThreat(
  request: {
    ip: string;
    path: string;
    method: RequestMethod;
    body?: unknown;
    headers: Record<string, string>;
    fingerprint?: RequestFingerprint;
  }
): ThreatAssessment {
  const factors: ThreatFactor[] = [];
  let score = 0;
  
  // Check blocked IPs
  if (blockedIps.has(request.ip)) {
    factors.push({
      name: 'blocked_ip',
      severity: 'critical',
      weight: 100,
      details: 'IP is on the blocklist',
    });
    score += 100;
  }
  
  // Check IP reputation
  const reputation = ipReputationCache.get(request.ip);
  if (reputation) {
    if (reputation.isProxy) {
      factors.push({
        name: 'proxy_detected',
        severity: 'medium',
        weight: 20,
        details: 'Request is from a proxy server',
      });
      score += 20;
    }
    if (reputation.isVpn) {
      factors.push({
        name: 'vpn_detected',
        severity: 'low',
        weight: 10,
        details: 'Request is from a VPN',
      });
      score += 10;
    }
    if (reputation.isTor) {
      factors.push({
        name: 'tor_detected',
        severity: 'high',
        weight: 40,
        details: 'Request is from Tor network',
      });
      score += 40;
    }
    if (reputation.isDatacenter) {
      factors.push({
        name: 'datacenter_ip',
        severity: 'medium',
        weight: 15,
        details: 'IP belongs to a datacenter',
      });
      score += 15;
    }
  }
  
  // Check for suspicious patterns in body
  if (request.body) {
    const bodyStr = JSON.stringify(request.body);
    const sanitized = sanitizeInput(bodyStr);
    
    if (sanitized.hasXss) {
      factors.push({
        name: 'xss_attempt',
        severity: 'high',
        weight: 50,
        details: 'XSS attempt detected in request body',
      });
      score += 50;
    }
    if (sanitized.hasSqlInjection) {
      factors.push({
        name: 'sql_injection',
        severity: 'critical',
        weight: 80,
        details: 'SQL injection attempt detected',
      });
      score += 80;
    }
    if (sanitized.hasCommandInjection) {
      factors.push({
        name: 'command_injection',
        severity: 'critical',
        weight: 80,
        details: 'Command injection attempt detected',
      });
      score += 80;
    }
  }
  
  // Check for suspicious headers
  if (!request.headers['user-agent']) {
    factors.push({
      name: 'missing_user_agent',
      severity: 'medium',
      weight: 20,
      details: 'Request missing User-Agent header',
    });
    score += 20;
  }
  
  // Check rate limiting
  const rateLimitResult = checkRateLimit(request.ip);
  if (!rateLimitResult.allowed) {
    factors.push({
      name: 'rate_limited',
      severity: 'high',
      weight: 40,
      details: 'Request exceeded rate limit',
    });
    score += 40;
  }
  
  // Determine threat level
  let level: ThreatLevel = 'none';
  if (score >= 80) level = 'critical';
  else if (score >= 50) level = 'high';
  else if (score >= 30) level = 'medium';
  else if (score >= 10) level = 'low';
  
  // Generate recommendations
  const recommendations: string[] = [];
  if (score >= 50) {
    recommendations.push('Consider blocking this IP address');
    recommendations.push('Log detailed request information for analysis');
  }
  if (factors.some(f => f.name === 'xss_attempt' || f.name === 'sql_injection')) {
    recommendations.push('Alert security team immediately');
  }
  
  return {
    level,
    score: Math.min(score, 100),
    factors,
    recommendations,
    shouldBlock: score >= 70,
  };
}

/**
 * Block an IP address
 */
export function blockIp(ip: string, reason: string): void {
  blockedIps.add(ip);
  
  logSecurityEvent({
    id: `block-${Date.now()}`,
    timestamp: new Date(),
    type: 'blocked_request',
    ip,
    path: 'N/A',
    method: 'GET',
    details: { reason },
    threatLevel: 'high',
  });
}

/**
 * Unblock an IP address
 */
export function unblockIp(ip: string): boolean {
  return blockedIps.delete(ip);
}

/**
 * Get list of blocked IPs
 */
export function getBlockedIps(): string[] {
  return Array.from(blockedIps);
}

// ============================================================================
// IP REPUTATION
// ============================================================================

/**
 * Get IP reputation (mock - would use external service)
 */
export function getIpReputation(ip: string): IpReputation {
  // Check cache
  const cached = ipReputationCache.get(ip);
  if (cached) return cached;
  
  // Mock reputation data
  const reputation: IpReputation = {
    ip,
    score: 50 + Math.floor(Math.random() * 50),
    isProxy: Math.random() < 0.1,
    isVpn: Math.random() < 0.15,
    isTor: Math.random() < 0.02,
    isDatacenter: Math.random() < 0.2,
    country: ['US', 'GB', 'DE', 'FR', 'CA', 'AU'][Math.floor(Math.random() * 6)],
    asn: `AS${Math.floor(Math.random() * 100000)}`,
    threatHistory: [],
  };
  
  ipReputationCache.set(ip, reputation);
  return reputation;
}

// ============================================================================
// SECURITY EVENTS
// ============================================================================

/**
 * Log a security event
 */
export function logSecurityEvent(event: SecurityEvent): void {
  securityEvents.push(event);
  
  // Keep only last 1000 events
  if (securityEvents.length > 1000) {
    securityEvents.shift();
  }
  
  // Console log for critical events
  if (event.threatLevel === 'critical' || event.threatLevel === 'high') {
    console.warn(`[SECURITY] ${event.type}: ${event.ip} - ${event.path}`, event.details);
  }
}

/**
 * Get recent security events
 */
export function getSecurityEvents(
  filters?: {
    type?: SecurityEvent['type'];
    threatLevel?: ThreatLevel;
    startDate?: Date;
    endDate?: Date;
  }
): SecurityEvent[] {
  let events = [...securityEvents];
  
  if (filters?.type) {
    events = events.filter(e => e.type === filters.type);
  }
  if (filters?.threatLevel) {
    events = events.filter(e => e.threatLevel === filters.threatLevel);
  }
  if (filters?.startDate) {
    events = events.filter(e => e.timestamp >= filters.startDate!);
  }
  if (filters?.endDate) {
    events = events.filter(e => e.timestamp <= filters.endDate!);
  }
  
  return events;
}

// ============================================================================
// STATISTICS
// ============================================================================

export function getSecurityStats(): {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsByLevel: Record<ThreatLevel, number>;
  blockedIpCount: number;
  rateLimitedRequests: number;
  averageThreatScore: number;
} {
  const eventsByType: Record<string, number> = {};
  const eventsByLevel: Record<ThreatLevel, number> = {
    none: 0,
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };
  
  let totalThreatScore = 0;
  
  for (const event of securityEvents) {
    eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
    eventsByLevel[event.threatLevel]++;
  }
  
  // Calculate average threat score from recent assessments
  const recentEvents = securityEvents.slice(-100);
  for (const event of recentEvents) {
    totalThreatScore += { none: 0, low: 10, medium: 30, high: 60, critical: 90 }[event.threatLevel];
  }
  
  return {
    totalEvents: securityEvents.length,
    eventsByType,
    eventsByLevel,
    blockedIpCount: blockedIps.size,
    rateLimitedRequests: rateLimitStore.size,
    averageThreatScore: recentEvents.length > 0 ? totalThreatScore / recentEvents.length : 0,
  };
}

// ============================================================================
// MOCK DATA
// ============================================================================

export function generateMockSecurityData(): {
  events: SecurityEvent[];
  stats: ReturnType<typeof getSecurityStats>;
  blockedIps: string[];
} {
  // Generate mock events
  const types: SecurityEvent['type'][] = ['rate_limit', 'validation_error', 'auth_failure', 'fraud_detected', 'blocked_request'];
  const levels: ThreatLevel[] = ['none', 'low', 'medium', 'high', 'critical'];
  
  for (let i = 0; i < 100; i++) {
    const event: SecurityEvent = {
      id: `event-${i}`,
      timestamp: new Date(Date.now() - Math.random() * 86400000 * 7),
      type: types[Math.floor(Math.random() * types.length)],
      ip: `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
      path: ['/api/products', '/api/checkout', '/api/auth', '/api/orders'][Math.floor(Math.random() * 4)],
      method: ['GET', 'POST', 'PUT', 'DELETE'][Math.floor(Math.random() * 4)] as RequestMethod,
      details: { reason: 'Mock security event' },
      threatLevel: levels[Math.floor(Math.random() * levels.length)],
    };
    
    logSecurityEvent(event);
  }
  
  // Add some blocked IPs
  for (let i = 0; i < 5; i++) {
    blockIp(`192.168.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`, 'Mock blocked IP');
  }
  
  return {
    events: getSecurityEvents(),
    stats: getSecurityStats(),
    blockedIps: getBlockedIps(),
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Rate limiting
  checkRateLimit,
  getRateLimitHeaders,
  // Validation
  sanitizeInput,
  validateJson,
  validateEmail,
  validateUrl,
  // CORS
  getCorsHeaders,
  handlePreflight,
  // Fraud detection
  generateFingerprint,
  assessThreat,
  blockIp,
  unblockIp,
  getBlockedIps,
  // IP reputation
  getIpReputation,
  // Events
  logSecurityEvent,
  getSecurityEvents,
  // Stats
  getSecurityStats,
  // Mock
  generateMockSecurityData,
  // Config
  defaultConfig,
};
