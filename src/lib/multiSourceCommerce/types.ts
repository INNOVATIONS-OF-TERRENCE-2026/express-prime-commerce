/**
 * Multi-Source Commerce - Type Definitions
 * 
 * Express Prime is NOT a Shopify store.
 * It's a multi-source commerce operating system.
 * 
 * @module multiSourceCommerce/types
 * @version 1.0.0
 */

// ============================================================================
// ENUMS
// ============================================================================

export type SourceType = 
  | 'shopify'
  | 'aliexpress'
  | 'zendrop'
  | 'us_wholesaler'
  | 'print_on_demand'
  | 'digital';

export type InventoryPolicy = 
  | 'in_stock'
  | 'on_demand'
  | 'digital';

export type OrderSource = 
  | 'shopify'
  | 'native';

export type PaymentStatus = 
  | 'pending'
  | 'authorized'
  | 'captured'
  | 'partially_refunded'
  | 'refunded'
  | 'failed';

export type FulfillmentStatus = 
  | 'unfulfilled'
  | 'partially_fulfilled'
  | 'fulfilled'
  | 'cancelled'
  | 'on_hold';

// ============================================================================
// SUPPLIER
// ============================================================================

export interface Supplier {
  id: string;
  name: string;
  source_type: SourceType;
  api_endpoint?: string;
  contact_email?: string;
  base_country: string;
  reliability_score: number; // 0-100
  avg_shipping_days: number;
  supports_tracking: boolean;
  supports_returns: boolean;
  notes?: string;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface SupplierInput {
  name: string;
  source_type: SourceType;
  api_endpoint?: string;
  contact_email?: string;
  base_country?: string;
  reliability_score?: number;
  avg_shipping_days?: number;
  supports_tracking?: boolean;
  supports_returns?: boolean;
  notes?: string;
}

// ============================================================================
// EXTERNAL PRODUCT
// ============================================================================

export interface ExternalProductImage {
  url: string;
  alt?: string;
  position: number;
}

export interface ExternalProduct {
  id: string;
  title: string;
  description?: string;
  images: ExternalProductImage[];
  category?: string;
  tags: string[];
  source_type: SourceType;
  base_cost: number;
  retail_price: number;
  compare_at_price?: number;
  estimated_shipping_days: number;
  supplier_reliability_score: number;
  inventory_policy: InventoryPolicy;
  fulfillment_notes?: string;
  handle?: string;
  seo_title?: string;
  seo_description?: string;
  active: boolean;
  featured: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ExternalProductInput {
  title: string;
  description?: string;
  images?: ExternalProductImage[];
  category?: string;
  tags?: string[];
  source_type: SourceType;
  base_cost: number;
  retail_price: number;
  compare_at_price?: number;
  estimated_shipping_days?: number;
  inventory_policy?: InventoryPolicy;
  fulfillment_notes?: string;
}

// ============================================================================
// SUPPLIER PRODUCT (Junction)
// ============================================================================

export interface ShippingProfile {
  method: string;
  cost: number;
  estimated_days: number;
  zones?: string[];
}

export interface SupplierProduct {
  id: string;
  supplier_id: string;
  external_product_id: string;
  supplier_cost: number;
  supplier_sku?: string;
  shipping_profile: ShippingProfile;
  priority_weight: number; // 0-100
  min_order_quantity: number;
  lead_time_days: number;
  active: boolean;
  created_at: Date;
  updated_at: Date;
  
  // Joined data
  supplier?: Supplier;
  product?: ExternalProduct;
}

// ============================================================================
// NATIVE ORDER
// ============================================================================

export interface Address {
  first_name: string;
  last_name: string;
  address1: string;
  address2?: string;
  city: string;
  province: string;
  province_code?: string;
  country: string;
  country_code: string;
  zip: string;
  phone?: string;
}

export interface OrderItem {
  product_id: string;
  variant_id?: string;
  title: string;
  quantity: number;
  price: number;
  sku?: string;
  image_url?: string;
  source_type: SourceType;
  selected_supplier_id?: string;
}

export interface NativeOrder {
  id: string;
  order_number: string;
  
  // Customer
  customer_email: string;
  customer_name?: string;
  customer_phone?: string;
  
  // Addresses
  shipping_address: Address;
  billing_address?: Address;
  
  // Items
  items: OrderItem[];
  
  // Pricing
  subtotal: number;
  shipping_cost: number;
  tax: number;
  discount_amount: number;
  total: number;
  currency: string;
  
  // Status
  source_type: OrderSource;
  payment_status: PaymentStatus;
  fulfillment_status: FulfillmentStatus;
  
  // Fulfillment
  selected_supplier?: string;
  supplier_order_id?: string;
  tracking_number?: string;
  tracking_url?: string;
  
  // Meta
  notes?: string;
  tags: string[];
  metadata: Record<string, any>;
  payment_intent_id?: string;
  payment_method?: string;
  
  // Timestamps
  created_at: Date;
  updated_at: Date;
  fulfilled_at?: Date;
  cancelled_at?: Date;
}

export interface NativeOrderInput {
  customer_email: string;
  customer_name?: string;
  customer_phone?: string;
  shipping_address: Address;
  billing_address?: Address;
  items: OrderItem[];
  subtotal: number;
  shipping_cost?: number;
  tax?: number;
  discount_amount?: number;
  currency?: string;
  notes?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// SUPPLIER SELECTION
// ============================================================================

export interface SupplierScore {
  supplier_id: string;
  supplier_name: string;
  supplier_cost: number;
  reliability_score: number;
  shipping_days: number;
  calculated_score: number;
  margin: number;
}

export interface SupplierSelectionResult {
  selected: SupplierScore;
  alternatives: SupplierScore[];
  selection_reason: string;
}

// ============================================================================
// UNIFIED PRODUCT (Shopify + External)
// ============================================================================

export interface UnifiedProduct {
  id: string;
  title: string;
  description?: string;
  images: ExternalProductImage[];
  price: number;
  compare_at_price?: number;
  source_type: SourceType;
  handle: string;
  category?: string;
  tags: string[];
  
  // Source-specific
  shopify_id?: string;
  external_product_id?: string;
  
  // Fulfillment
  inventory_policy: InventoryPolicy;
  estimated_shipping_days: number;
  
  // AI metadata
  ai_score?: number;
  visual_saliency?: number;
}

// ============================================================================
// CHECKOUT ROUTING
// ============================================================================

export interface CheckoutItem {
  product: UnifiedProduct;
  quantity: number;
  source_type: SourceType;
}

export interface CheckoutSplit {
  shopify_items: CheckoutItem[];
  native_items: CheckoutItem[];
}

export interface CheckoutResult {
  success: boolean;
  shopify_checkout_url?: string;
  native_order?: NativeOrder;
  error?: string;
}
