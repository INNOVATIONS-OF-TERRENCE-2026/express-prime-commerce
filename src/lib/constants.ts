// Express Prime Brand Constants

export const BRAND = {
  name: 'Express Prime',
  tagline: 'Autonomous AI Commerce Engine',
  description: 'Premium products powered by intelligent automation',
  email: 'support@expressprime.com',
  phone: '1-800-EXPRESS',
} as const;

export const COLORS = {
  blue: {
    primary: '#1E3A8A',
    dark: '#172554',
    light: '#3B82F6',
  },
  gold: {
    primary: '#D4AF37',
    light: '#F5D788',
    dark: '#B8960C',
  },
  white: '#FFFFFF',
  black: '#0F172A',
} as const;

export const FREE_SHIPPING_THRESHOLD = 49;

export const PRODUCT_CATEGORIES = [
  { value: 'all', label: 'All Products' },
  { value: 'kitchen-gadgets', label: 'Kitchen Gadgets' },
  { value: 'home-living', label: 'Home & Living' },
  { value: 'health-wellness', label: 'Health & Wellness' },
  { value: 'home-organization', label: 'Home Organization' },
  { value: 'home-appliances', label: 'Home Appliances' },
  { value: 'computer-accessories', label: 'Computer Accessories' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'phone-accessories', label: 'Phone Accessories' },
  { value: 'office-accessories', label: 'Office Accessories' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'sports-outdoors', label: 'Sports & Outdoors' },
] as const;

export const SORT_OPTIONS = [
  { value: 'trending', label: 'Trending' },
  { value: 'best-selling', label: 'Best Selling' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
] as const;

export const TRUST_BADGES = [
  {
    icon: 'Truck',
    title: 'Free Shipping',
    description: `Orders over $${FREE_SHIPPING_THRESHOLD}`,
  },
  {
    icon: 'Shield',
    title: '30-Day Guarantee',
    description: 'Hassle-free returns',
  },
  {
    icon: 'Lock',
    title: 'Secure Checkout',
    description: '256-bit SSL encryption',
  },
  {
    icon: 'Headphones',
    title: 'Fast Support',
    description: 'AI + Human team',
  },
] as const;

export const ADMIN_ROUTES = {
  dashboard: '/admin',
  products: '/admin/products',
  orders: '/admin/orders',
  aiDecisions: '/admin/ai-decisions',
  settings: '/admin/settings',
  bulkImport: '/admin/bulk-import',
} as const;

export const PUBLIC_ROUTES = {
  home: '/',
  collections: '/collections',
  product: '/product',
  cart: '/cart',
  orderTracking: '/order-tracking',
  support: '/support',
  shipping: '/policies/shipping',
  refunds: '/policies/refunds',
  terms: '/policies/terms',
  privacy: '/policies/privacy',
} as const;

// Shopify Storefront API config (client-side)
export const SHOPIFY_STOREFRONT_CONFIG = {
  domain: '', // Will be set from environment/database
  storefrontAccessToken: '', // Will be set from environment/database
  apiVersion: '2024-01',
} as const;

// Profit protection thresholds
export const PROFIT_PROTECTION = {
  minMarginPercent: 20,
  maxRefundRatePercent: 15,
  noSalesKillWindowDays: 14,
  noSalesPauseWindowDays: 7,
} as const;
