/**
 * Multi-Currency & International Commerce Engine
 * 
 * Real-time currency conversion, localization, and
 * international pricing optimization.
 * 
 * FEATURES:
 * - Real-time exchange rates
 * - Geo-based currency detection
 * - International tax handling
 * - Localized pricing strategies
 * - Multi-language support
 * 
 * @module ai/multiCurrency
 * @version 1.0.0
 */

// ============================================================================
// TYPES
// ============================================================================

export type CurrencyCode = 
  | 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' 
  | 'JPY' | 'CNY' | 'INR' | 'MXN' | 'BRL';

export type CountryCode = 
  | 'US' | 'GB' | 'CA' | 'AU' | 'DE' | 'FR' | 'JP' | 'CN' | 'IN' | 'MX' | 'BR';

export interface CurrencyInfo {
  code: CurrencyCode;
  name: string;
  symbol: string;
  symbolPosition: 'before' | 'after';
  decimalSeparator: string;
  thousandsSeparator: string;
  decimalPlaces: number;
}

export interface ExchangeRate {
  from: CurrencyCode;
  to: CurrencyCode;
  rate: number;
  lastUpdated: Date;
  source: string;
}

export interface LocalizedPrice {
  amount: number;
  currency: CurrencyCode;
  formatted: string;
  originalAmount?: number;
  originalCurrency?: CurrencyCode;
  exchangeRate?: number;
}

export interface RegionConfig {
  countryCode: CountryCode;
  currency: CurrencyCode;
  language: string;
  taxRate: number;
  taxIncluded: boolean;
  shippingZone: string;
  restrictions?: string[];
}

export interface InternationalPricing {
  productId: string;
  baseCurrency: CurrencyCode;
  basePrice: number;
  // Regional prices
  localizedPrices: Map<CurrencyCode, LocalizedPrice>;
  // Adjustments
  regionAdjustments: Map<CountryCode, number>; // percentage adjustment
  // Tax
  taxByRegion: Map<CountryCode, { rate: number; included: boolean }>;
}

export interface GeoLocation {
  countryCode: CountryCode;
  region?: string;
  city?: string;
  timezone: string;
  currency: CurrencyCode;
  language: string;
}

export interface CurrencyStats {
  mostUsedCurrencies: Array<{ currency: CurrencyCode; transactions: number }>;
  avgConversionByRegion: Map<CountryCode, number>;
  revenueByCountry: Map<CountryCode, number>;
  exchangeRateHistory: ExchangeRate[];
}

// ============================================================================
// STATE
// ============================================================================

let baseCurrency: CurrencyCode = 'USD';
const exchangeRates: Map<string, ExchangeRate> = new Map();
const regionConfigs: Map<CountryCode, RegionConfig> = new Map();
const pricingCache: Map<string, InternationalPricing> = new Map();

// Currency definitions
const currencies: Record<CurrencyCode, CurrencyInfo> = {
  USD: { code: 'USD', name: 'US Dollar', symbol: '$', symbolPosition: 'before', decimalSeparator: '.', thousandsSeparator: ',', decimalPlaces: 2 },
  EUR: { code: 'EUR', name: 'Euro', symbol: '€', symbolPosition: 'before', decimalSeparator: ',', thousandsSeparator: '.', decimalPlaces: 2 },
  GBP: { code: 'GBP', name: 'British Pound', symbol: '£', symbolPosition: 'before', decimalSeparator: '.', thousandsSeparator: ',', decimalPlaces: 2 },
  CAD: { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', symbolPosition: 'before', decimalSeparator: '.', thousandsSeparator: ',', decimalPlaces: 2 },
  AUD: { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', symbolPosition: 'before', decimalSeparator: '.', thousandsSeparator: ',', decimalPlaces: 2 },
  JPY: { code: 'JPY', name: 'Japanese Yen', symbol: '¥', symbolPosition: 'before', decimalSeparator: '.', thousandsSeparator: ',', decimalPlaces: 0 },
  CNY: { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', symbolPosition: 'before', decimalSeparator: '.', thousandsSeparator: ',', decimalPlaces: 2 },
  INR: { code: 'INR', name: 'Indian Rupee', symbol: '₹', symbolPosition: 'before', decimalSeparator: '.', thousandsSeparator: ',', decimalPlaces: 2 },
  MXN: { code: 'MXN', name: 'Mexican Peso', symbol: 'MX$', symbolPosition: 'before', decimalSeparator: '.', thousandsSeparator: ',', decimalPlaces: 2 },
  BRL: { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', symbolPosition: 'before', decimalSeparator: ',', thousandsSeparator: '.', decimalPlaces: 2 },
};

// Default exchange rates (would be fetched from API in production)
const defaultRates: Record<CurrencyCode, number> = {
  USD: 1.00,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.36,
  AUD: 1.53,
  JPY: 149.50,
  CNY: 7.24,
  INR: 83.12,
  MXN: 17.15,
  BRL: 4.97,
};

// Default region configurations
const defaultRegionConfigs: RegionConfig[] = [
  { countryCode: 'US', currency: 'USD', language: 'en-US', taxRate: 0, taxIncluded: false, shippingZone: 'domestic' },
  { countryCode: 'GB', currency: 'GBP', language: 'en-GB', taxRate: 0.20, taxIncluded: true, shippingZone: 'europe' },
  { countryCode: 'CA', currency: 'CAD', language: 'en-CA', taxRate: 0.13, taxIncluded: false, shippingZone: 'north_america' },
  { countryCode: 'AU', currency: 'AUD', language: 'en-AU', taxRate: 0.10, taxIncluded: true, shippingZone: 'oceania' },
  { countryCode: 'DE', currency: 'EUR', language: 'de-DE', taxRate: 0.19, taxIncluded: true, shippingZone: 'europe' },
  { countryCode: 'FR', currency: 'EUR', language: 'fr-FR', taxRate: 0.20, taxIncluded: true, shippingZone: 'europe' },
  { countryCode: 'JP', currency: 'JPY', language: 'ja-JP', taxRate: 0.10, taxIncluded: true, shippingZone: 'asia' },
  { countryCode: 'CN', currency: 'CNY', language: 'zh-CN', taxRate: 0.13, taxIncluded: true, shippingZone: 'asia', restrictions: ['certain_electronics'] },
  { countryCode: 'IN', currency: 'INR', language: 'hi-IN', taxRate: 0.18, taxIncluded: true, shippingZone: 'asia' },
  { countryCode: 'MX', currency: 'MXN', language: 'es-MX', taxRate: 0.16, taxIncluded: true, shippingZone: 'north_america' },
  { countryCode: 'BR', currency: 'BRL', language: 'pt-BR', taxRate: 0.17, taxIncluded: true, shippingZone: 'south_america' },
];

// Initialize
defaultRegionConfigs.forEach(config => regionConfigs.set(config.countryCode, config));
initializeExchangeRates();

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Initialize exchange rates
 */
function initializeExchangeRates(): void {
  const allCurrencies = Object.keys(defaultRates) as CurrencyCode[];
  
  for (const from of allCurrencies) {
    for (const to of allCurrencies) {
      if (from === to) continue;
      
      const rate = defaultRates[to] / defaultRates[from];
      const key = `${from}_${to}`;
      
      exchangeRates.set(key, {
        from,
        to,
        rate,
        lastUpdated: new Date(),
        source: 'default',
      });
    }
  }
}

/**
 * Get exchange rate between two currencies
 */
export function getExchangeRate(from: CurrencyCode, to: CurrencyCode): number {
  if (from === to) return 1;
  
  const key = `${from}_${to}`;
  const rate = exchangeRates.get(key);
  
  return rate?.rate || (defaultRates[to] / defaultRates[from]);
}

/**
 * Convert amount between currencies
 */
export function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode
): LocalizedPrice {
  const rate = getExchangeRate(from, to);
  const convertedAmount = amount * rate;
  
  return {
    amount: convertedAmount,
    currency: to,
    formatted: formatPrice(convertedAmount, to),
    originalAmount: amount,
    originalCurrency: from,
    exchangeRate: rate,
  };
}

/**
 * Format price according to currency locale
 */
export function formatPrice(amount: number, currency: CurrencyCode): string {
  const info = currencies[currency];
  
  // Round to appropriate decimal places
  const rounded = Number(amount.toFixed(info.decimalPlaces));
  
  // Format number
  const parts = rounded.toFixed(info.decimalPlaces).split('.');
  const wholePart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, info.thousandsSeparator);
  const decimalPart = parts[1] || '';
  
  const formattedNumber = info.decimalPlaces > 0
    ? `${wholePart}${info.decimalSeparator}${decimalPart}`
    : wholePart;
  
  // Add symbol
  return info.symbolPosition === 'before'
    ? `${info.symbol}${formattedNumber}`
    : `${formattedNumber}${info.symbol}`;
}

/**
 * Get localized pricing for a product
 */
export function getLocalizedPricing(
  productId: string,
  basePrice: number,
  baseCurr: CurrencyCode = baseCurrency
): InternationalPricing {
  // Check cache
  const cacheKey = `${productId}_${basePrice}_${baseCurr}`;
  if (pricingCache.has(cacheKey)) {
    return pricingCache.get(cacheKey)!;
  }
  
  const localizedPrices = new Map<CurrencyCode, LocalizedPrice>();
  const regionAdjustments = new Map<CountryCode, number>();
  const taxByRegion = new Map<CountryCode, { rate: number; included: boolean }>();
  
  // Generate prices for all currencies
  for (const currency of Object.keys(currencies) as CurrencyCode[]) {
    const converted = convertCurrency(basePrice, baseCurr, currency);
    
    // Apply psychological pricing
    converted.amount = applyPsychologicalPricing(converted.amount, currency);
    converted.formatted = formatPrice(converted.amount, currency);
    
    localizedPrices.set(currency, converted);
  }
  
  // Set regional adjustments
  regionConfigs.forEach((config, countryCode) => {
    // Some regions may have price adjustments
    let adjustment = 0;
    
    // Example: Premium pricing in wealthy markets
    if (countryCode === 'JP' || countryCode === 'AU') {
      adjustment = 5; // 5% premium
    }
    // Adjusted pricing in emerging markets
    if (countryCode === 'IN' || countryCode === 'MX' || countryCode === 'BR') {
      adjustment = -10; // 10% discount
    }
    
    regionAdjustments.set(countryCode, adjustment);
    taxByRegion.set(countryCode, {
      rate: config.taxRate,
      included: config.taxIncluded,
    });
  });
  
  const pricing: InternationalPricing = {
    productId,
    baseCurrency: baseCurr,
    basePrice,
    localizedPrices,
    regionAdjustments,
    taxByRegion,
  };
  
  pricingCache.set(cacheKey, pricing);
  return pricing;
}

/**
 * Get price for specific region
 */
export function getPriceForRegion(
  productId: string,
  basePrice: number,
  countryCode: CountryCode
): LocalizedPrice & { tax: number; total: number; totalFormatted: string } {
  const config = regionConfigs.get(countryCode) || regionConfigs.get('US')!;
  const pricing = getLocalizedPricing(productId, basePrice);
  
  const localPrice = pricing.localizedPrices.get(config.currency)!;
  const adjustment = pricing.regionAdjustments.get(countryCode) || 0;
  const taxInfo = pricing.taxByRegion.get(countryCode) || { rate: 0, included: false };
  
  // Apply regional adjustment
  let adjustedAmount = localPrice.amount * (1 + adjustment / 100);
  
  // Calculate tax
  let tax = 0;
  let total = adjustedAmount;
  
  if (taxInfo.included) {
    // Tax is already included in price
    tax = adjustedAmount - (adjustedAmount / (1 + taxInfo.rate));
  } else {
    // Tax needs to be added
    tax = adjustedAmount * taxInfo.rate;
    total = adjustedAmount + tax;
  }
  
  return {
    ...localPrice,
    amount: adjustedAmount,
    formatted: formatPrice(adjustedAmount, config.currency),
    tax,
    total,
    totalFormatted: formatPrice(total, config.currency),
  };
}

/**
 * Detect user's region from various signals
 */
export function detectUserRegion(
  ip?: string,
  browserLanguage?: string,
  timezone?: string
): GeoLocation {
  // In production, would use IP geolocation service
  // Mock implementation based on timezone
  
  const timezoneMap: Record<string, CountryCode> = {
    'America/New_York': 'US',
    'America/Los_Angeles': 'US',
    'America/Chicago': 'US',
    'Europe/London': 'GB',
    'Europe/Paris': 'FR',
    'Europe/Berlin': 'DE',
    'Asia/Tokyo': 'JP',
    'Asia/Shanghai': 'CN',
    'Asia/Kolkata': 'IN',
    'America/Mexico_City': 'MX',
    'America/Sao_Paulo': 'BR',
    'Australia/Sydney': 'AU',
    'America/Toronto': 'CA',
  };
  
  const countryCode = (timezone && timezoneMap[timezone]) || 'US';
  const config = regionConfigs.get(countryCode) || regionConfigs.get('US')!;
  
  return {
    countryCode,
    timezone: timezone || 'America/New_York',
    currency: config.currency,
    language: config.language,
  };
}

/**
 * Update exchange rates (would call external API in production)
 */
export async function updateExchangeRates(): Promise<void> {
  // In production, fetch from API like Open Exchange Rates
  // For now, add slight random fluctuation to simulate live rates
  
  exchangeRates.forEach((rate, key) => {
    const fluctuation = 1 + (Math.random() - 0.5) * 0.02; // ±1% fluctuation
    exchangeRates.set(key, {
      ...rate,
      rate: rate.rate * fluctuation,
      lastUpdated: new Date(),
      source: 'simulated',
    });
  });
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function applyPsychologicalPricing(amount: number, currency: CurrencyCode): number {
  const info = currencies[currency];
  
  if (info.decimalPlaces === 0) {
    // Yen-like currencies: round to nearest 100
    return Math.round(amount / 100) * 100 - 1;
  }
  
  // Other currencies: use .99 or .95 endings
  const wholePart = Math.floor(amount);
  return amount > 10 ? wholePart + 0.99 : wholePart + 0.99;
}

// ============================================================================
// STATISTICS
// ============================================================================

export function getCurrencyStats(): CurrencyStats {
  // Mock stats
  return {
    mostUsedCurrencies: [
      { currency: 'USD', transactions: 1250 },
      { currency: 'EUR', transactions: 480 },
      { currency: 'GBP', transactions: 320 },
      { currency: 'CAD', transactions: 180 },
      { currency: 'AUD', transactions: 150 },
    ],
    avgConversionByRegion: new Map([
      ['US', 0.032],
      ['GB', 0.028],
      ['CA', 0.025],
      ['AU', 0.022],
      ['DE', 0.027],
    ]),
    revenueByCountry: new Map([
      ['US', 125000],
      ['GB', 48000],
      ['CA', 22000],
      ['AU', 18000],
      ['DE', 15000],
    ]),
    exchangeRateHistory: Array.from(exchangeRates.values()).slice(0, 10),
  };
}

export function getSupportedCurrencies(): CurrencyInfo[] {
  return Object.values(currencies);
}

export function getSupportedRegions(): RegionConfig[] {
  return Array.from(regionConfigs.values());
}

export function setBaseCurrency(currency: CurrencyCode): void {
  baseCurrency = currency;
}

export function getBaseCurrency(): CurrencyCode {
  return baseCurrency;
}

// ============================================================================
// MOCK DATA
// ============================================================================

export function generateMockCurrencyData(): {
  currencies: CurrencyInfo[];
  regions: RegionConfig[];
  rates: ExchangeRate[];
  stats: CurrencyStats;
  samplePricing: InternationalPricing[];
} {
  // Generate sample pricing for a few products
  const samplePricing: InternationalPricing[] = [
    getLocalizedPricing('prod-001', 49.99),
    getLocalizedPricing('prod-002', 149.99),
    getLocalizedPricing('prod-003', 299.99),
  ];
  
  return {
    currencies: getSupportedCurrencies(),
    regions: getSupportedRegions(),
    rates: Array.from(exchangeRates.values()),
    stats: getCurrencyStats(),
    samplePricing,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Core functions
  getExchangeRate,
  convertCurrency,
  formatPrice,
  getLocalizedPricing,
  getPriceForRegion,
  detectUserRegion,
  updateExchangeRates,
  // Configuration
  getSupportedCurrencies,
  getSupportedRegions,
  setBaseCurrency,
  getBaseCurrency,
  // Stats
  getCurrencyStats,
  // Mock
  generateMockCurrencyData,
};
