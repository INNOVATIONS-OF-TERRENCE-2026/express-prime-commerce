/**
 * Vendor Onboarding System
 * 
 * Drop-in vendor management without code changes.
 * 
 * Supported Suppliers:
 * - AliExpress
 * - Zendrop
 * - US-based wholesalers
 * - Print-on-Demand
 * - Digital bundle providers
 * 
 * @module multiSourceCommerce/vendorOnboarding
 * @version 1.0.0
 */

import type {
  Supplier,
  SupplierInput,
  ExternalProduct,
  ExternalProductInput,
  SupplierProduct,
  SourceType,
  ShippingProfile,
} from './types';

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

const DEFAULT_SHIPPING_PROFILES: Record<SourceType, ShippingProfile> = {
  shopify: {
    method: 'Standard',
    cost: 0,
    estimated_days: 5,
    zones: ['US', 'CA'],
  },
  aliexpress: {
    method: 'ePacket',
    cost: 0,
    estimated_days: 14,
    zones: ['GLOBAL'],
  },
  zendrop: {
    method: 'Standard',
    cost: 3.99,
    estimated_days: 7,
    zones: ['US', 'CA', 'UK', 'AU'],
  },
  us_wholesaler: {
    method: 'USPS First Class',
    cost: 4.99,
    estimated_days: 5,
    zones: ['US'],
  },
  print_on_demand: {
    method: 'Standard',
    cost: 5.99,
    estimated_days: 10,
    zones: ['US', 'CA', 'UK', 'EU', 'AU'],
  },
  digital: {
    method: 'Instant Delivery',
    cost: 0,
    estimated_days: 0,
    zones: ['GLOBAL'],
  },
};

const DEFAULT_RELIABILITY_SCORES: Record<SourceType, number> = {
  shopify: 95,
  aliexpress: 60,
  zendrop: 75,
  us_wholesaler: 85,
  print_on_demand: 80,
  digital: 99,
};

const DEFAULT_SHIPPING_DAYS: Record<SourceType, number> = {
  shopify: 5,
  aliexpress: 14,
  zendrop: 7,
  us_wholesaler: 5,
  print_on_demand: 10,
  digital: 0,
};

// ============================================================================
// SUPPLIER TEMPLATES
// ============================================================================

export interface SupplierTemplate {
  name: string;
  source_type: SourceType;
  base_country: string;
  reliability_score: number;
  avg_shipping_days: number;
  supports_tracking: boolean;
  supports_returns: boolean;
  description: string;
  setup_notes: string[];
}

export const SUPPLIER_TEMPLATES: Record<SourceType, SupplierTemplate> = {
  shopify: {
    name: 'Shopify Inventory',
    source_type: 'shopify',
    base_country: 'US',
    reliability_score: 95,
    avg_shipping_days: 5,
    supports_tracking: true,
    supports_returns: true,
    description: 'Products already in your Shopify inventory',
    setup_notes: [
      'Products sync automatically from Shopify',
      'No additional setup required',
      'Fulfillment handled through Shopify',
    ],
  },
  aliexpress: {
    name: 'AliExpress Supplier',
    source_type: 'aliexpress',
    base_country: 'CN',
    reliability_score: 60,
    avg_shipping_days: 14,
    supports_tracking: true,
    supports_returns: false,
    description: 'Dropship from AliExpress suppliers',
    setup_notes: [
      'Add supplier contact information',
      'Set up product SKU mappings',
      'Configure ePacket as default shipping',
      'Monitor supplier reliability closely',
    ],
  },
  zendrop: {
    name: 'Zendrop',
    source_type: 'zendrop',
    base_country: 'US',
    reliability_score: 75,
    avg_shipping_days: 7,
    supports_tracking: true,
    supports_returns: true,
    description: 'Automated dropshipping via Zendrop',
    setup_notes: [
      'Connect Zendrop API (optional)',
      'Map product IDs to Zendrop catalog',
      'Configure auto-fulfillment rules',
    ],
  },
  us_wholesaler: {
    name: 'US Wholesaler',
    source_type: 'us_wholesaler',
    base_country: 'US',
    reliability_score: 85,
    avg_shipping_days: 5,
    supports_tracking: true,
    supports_returns: true,
    description: 'Domestic US-based wholesale supplier',
    setup_notes: [
      'Add wholesale account credentials',
      'Set minimum order quantities',
      'Configure wholesale pricing tiers',
    ],
  },
  print_on_demand: {
    name: 'Print-on-Demand',
    source_type: 'print_on_demand',
    base_country: 'US',
    reliability_score: 80,
    avg_shipping_days: 10,
    supports_tracking: true,
    supports_returns: true,
    description: 'Custom printed products on demand',
    setup_notes: [
      'Upload design files per product',
      'Set print specifications',
      'Configure mockup images',
      'Test print quality before launch',
    ],
  },
  digital: {
    name: 'Digital Products',
    source_type: 'digital',
    base_country: 'US',
    reliability_score: 99,
    avg_shipping_days: 0,
    supports_tracking: false,
    supports_returns: false,
    description: 'Instant delivery digital products',
    setup_notes: [
      'Upload digital files or links',
      'Configure access delivery method',
      'Set up download protection',
    ],
  },
};

// ============================================================================
// SUPPLIER CREATION HELPERS
// ============================================================================

/**
 * Create supplier with template defaults
 */
export function createSupplierFromTemplate(
  sourceType: SourceType,
  overrides: Partial<SupplierInput> = {}
): SupplierInput {
  const template = SUPPLIER_TEMPLATES[sourceType];
  
  return {
    name: overrides.name || template.name,
    source_type: sourceType,
    api_endpoint: overrides.api_endpoint,
    contact_email: overrides.contact_email,
    base_country: overrides.base_country || template.base_country,
    reliability_score: overrides.reliability_score || template.reliability_score,
    avg_shipping_days: overrides.avg_shipping_days || template.avg_shipping_days,
    supports_tracking: overrides.supports_tracking ?? template.supports_tracking,
    supports_returns: overrides.supports_returns ?? template.supports_returns,
    notes: overrides.notes,
  };
}

/**
 * Get default shipping profile for source type
 */
export function getDefaultShippingProfile(sourceType: SourceType): ShippingProfile {
  return { ...DEFAULT_SHIPPING_PROFILES[sourceType] };
}

/**
 * Calculate estimated shipping days based on destination
 */
export function estimateShippingDays(
  supplier: Supplier,
  destinationCountry: string
): number {
  const basedays = supplier.avg_shipping_days;
  
  // Add extra days for international
  if (supplier.base_country !== destinationCountry) {
    if (supplier.source_type === 'us_wholesaler') {
      return basedays + 10; // US wholesaler to international
    }
    return basedays + 3; // Small buffer for customs
  }
  
  return basedays;
}

// ============================================================================
// PRODUCT CREATION HELPERS
// ============================================================================

/**
 * Create external product with defaults
 */
export function createExternalProduct(
  input: ExternalProductInput
): Omit<ExternalProduct, 'id' | 'created_at' | 'updated_at'> {
  return {
    title: input.title,
    description: input.description,
    images: input.images || [],
    category: input.category,
    tags: input.tags || [],
    source_type: input.source_type,
    base_cost: input.base_cost,
    retail_price: input.retail_price,
    compare_at_price: input.compare_at_price,
    estimated_shipping_days: input.estimated_shipping_days || DEFAULT_SHIPPING_DAYS[input.source_type],
    supplier_reliability_score: DEFAULT_RELIABILITY_SCORES[input.source_type],
    inventory_policy: input.inventory_policy || (input.source_type === 'digital' ? 'digital' : 'on_demand'),
    fulfillment_notes: input.fulfillment_notes,
    handle: generateHandle(input.title),
    seo_title: input.title,
    seo_description: input.description?.slice(0, 160),
    active: true,
    featured: false,
  };
}

/**
 * Generate URL handle from title
 */
function generateHandle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
}

/**
 * Calculate recommended retail price with margin
 */
export function calculateRetailPrice(
  baseCost: number,
  targetMarginPercent: number = 40
): number {
  const margin = targetMarginPercent / 100;
  const price = baseCost / (1 - margin);
  
  // Round to .99 pricing
  return Math.ceil(price) - 0.01;
}

// ============================================================================
// SUPPLIER MAPPING HELPERS
// ============================================================================

/**
 * Create supplier-product mapping
 */
export function createSupplierProductMapping(
  supplierId: string,
  productId: string,
  supplierCost: number,
  options: {
    supplierSku?: string;
    shippingProfile?: ShippingProfile;
    priorityWeight?: number;
    minOrderQuantity?: number;
    leadTimeDays?: number;
  } = {}
): Omit<SupplierProduct, 'id' | 'created_at' | 'updated_at' | 'supplier' | 'product'> {
  return {
    supplier_id: supplierId,
    external_product_id: productId,
    supplier_cost: supplierCost,
    supplier_sku: options.supplierSku,
    shipping_profile: options.shippingProfile || { method: 'Standard', cost: 0, estimated_days: 7 },
    priority_weight: options.priorityWeight || 50,
    min_order_quantity: options.minOrderQuantity || 1,
    lead_time_days: options.leadTimeDays || 3,
    active: true,
  };
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate supplier input
 */
export function validateSupplierInput(input: SupplierInput): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!input.name?.trim()) {
    errors.push('Supplier name is required');
  }

  if (!input.source_type) {
    errors.push('Source type is required');
  }

  if (input.reliability_score !== undefined) {
    if (input.reliability_score < 0 || input.reliability_score > 100) {
      errors.push('Reliability score must be between 0 and 100');
    }
  }

  if (input.avg_shipping_days !== undefined) {
    if (input.avg_shipping_days < 0) {
      errors.push('Shipping days must be non-negative');
    }
  }

  if (input.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.contact_email)) {
    errors.push('Invalid contact email format');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate product input
 */
export function validateProductInput(input: ExternalProductInput): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!input.title?.trim()) {
    errors.push('Product title is required');
  }

  if (!input.source_type) {
    errors.push('Source type is required');
  }

  if (input.base_cost === undefined || input.base_cost < 0) {
    errors.push('Valid base cost is required');
  }

  if (input.retail_price === undefined || input.retail_price <= 0) {
    errors.push('Valid retail price is required');
  }

  if (input.base_cost >= input.retail_price) {
    errors.push('Retail price must be greater than base cost');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// EXPORT ALL
// ============================================================================

export {
  DEFAULT_SHIPPING_PROFILES,
  DEFAULT_RELIABILITY_SCORES,
  DEFAULT_SHIPPING_DAYS,
};
