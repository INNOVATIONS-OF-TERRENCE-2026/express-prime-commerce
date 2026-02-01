/**
 * Native Checkout System
 * 
 * Handles checkout routing for multi-source commerce:
 * - Shopify products → Standard Shopify Checkout
 * - Native products → Express Prime Native Checkout
 * 
 * Customer NEVER sees supplier choice.
 * UI must look identical for both flows.
 * 
 * @module multiSourceCommerce/nativeCheckout
 * @version 1.0.0
 */

import type {
  UnifiedProduct,
  CheckoutItem,
  CheckoutSplit,
  CheckoutResult,
  NativeOrder,
  NativeOrderInput,
  OrderItem,
  Address,
  SourceType,
} from './types';

// ============================================================================
// CHECKOUT SPLITTING
// ============================================================================

/**
 * Split cart items by source for proper routing
 */
export function splitCheckoutItems(items: CheckoutItem[]): CheckoutSplit {
  const shopify_items: CheckoutItem[] = [];
  const native_items: CheckoutItem[] = [];

  for (const item of items) {
    if (item.source_type === 'shopify') {
      shopify_items.push(item);
    } else {
      native_items.push(item);
    }
  }

  return { shopify_items, native_items };
}

/**
 * Check if cart contains only Shopify products
 */
export function isShopifyOnlyCart(items: CheckoutItem[]): boolean {
  return items.every(item => item.source_type === 'shopify');
}

/**
 * Check if cart contains only native products
 */
export function isNativeOnlyCart(items: CheckoutItem[]): boolean {
  return items.every(item => item.source_type !== 'shopify');
}

/**
 * Check if cart is mixed (both Shopify and native)
 */
export function isMixedCart(items: CheckoutItem[]): boolean {
  const hasShopify = items.some(item => item.source_type === 'shopify');
  const hasNative = items.some(item => item.source_type !== 'shopify');
  return hasShopify && hasNative;
}

// ============================================================================
// ORDER CREATION
// ============================================================================

/**
 * Generate order number
 */
export function generateOrderNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `EP-${dateStr}-${random}`;
}

/**
 * Calculate order totals
 */
export function calculateOrderTotals(
  items: OrderItem[],
  shippingCost: number = 0,
  taxRate: number = 0,
  discountAmount: number = 0
): {
  subtotal: number;
  shipping_cost: number;
  tax: number;
  discount_amount: number;
  total: number;
} {
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const tax = Math.round(taxableAmount * taxRate * 100) / 100;

  const total = Math.round(
    (subtotal + shippingCost + tax - discountAmount) * 100
  ) / 100;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    shipping_cost: shippingCost,
    tax,
    discount_amount: discountAmount,
    total: Math.max(0, total),
  };
}

/**
 * Build native order from checkout items
 */
export function buildNativeOrder(
  items: CheckoutItem[],
  customerEmail: string,
  shippingAddress: Address,
  options: {
    customerName?: string;
    customerPhone?: string;
    billingAddress?: Address;
    shippingCost?: number;
    taxRate?: number;
    discountAmount?: number;
    currency?: string;
    notes?: string;
    metadata?: Record<string, any>;
  } = {}
): NativeOrderInput {
  const orderItems: OrderItem[] = items.map(item => ({
    product_id: item.product.id,
    variant_id: undefined,
    title: item.product.title,
    quantity: item.quantity,
    price: item.product.price,
    sku: undefined,
    image_url: item.product.images[0]?.url,
    source_type: item.source_type,
    selected_supplier_id: undefined, // Set during processing
  }));

  const totals = calculateOrderTotals(
    orderItems,
    options.shippingCost || 0,
    options.taxRate || 0,
    options.discountAmount || 0
  );

  return {
    customer_email: customerEmail,
    customer_name: options.customerName,
    customer_phone: options.customerPhone,
    shipping_address: shippingAddress,
    billing_address: options.billingAddress,
    items: orderItems,
    subtotal: totals.subtotal,
    shipping_cost: totals.shipping_cost,
    tax: totals.tax,
    discount_amount: totals.discount_amount,
    currency: options.currency || 'USD',
    notes: options.notes,
    metadata: options.metadata,
  };
}

// ============================================================================
// SHIPPING CALCULATION
// ============================================================================

/**
 * Calculate shipping cost for native items
 */
export function calculateNativeShipping(
  items: CheckoutItem[],
  destination: string = 'US'
): number {
  // Base shipping rates
  const BASE_RATE = 4.99;
  const PER_ITEM_RATE = 1.50;
  const FREE_SHIPPING_THRESHOLD = 50;

  // Calculate subtotal
  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  // Free shipping over threshold
  if (subtotal >= FREE_SHIPPING_THRESHOLD) {
    return 0;
  }

  // Count total items
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  // Calculate shipping
  const shipping = BASE_RATE + (Math.max(0, totalItems - 1) * PER_ITEM_RATE);

  // International surcharge
  const isInternational = destination !== 'US';
  const internationalSurcharge = isInternational ? 9.99 : 0;

  return Math.round((shipping + internationalSurcharge) * 100) / 100;
}

/**
 * Get estimated delivery date range
 */
export function getEstimatedDelivery(
  items: CheckoutItem[]
): {
  min_days: number;
  max_days: number;
  display: string;
} {
  // Find the longest shipping time
  const maxShippingDays = Math.max(
    ...items.map(item => item.product.estimated_shipping_days || 7)
  );

  // Add processing time
  const processingDays = 2;
  const min_days = processingDays + Math.max(3, maxShippingDays - 3);
  const max_days = processingDays + maxShippingDays + 2;

  // Generate display string
  const today = new Date();
  const minDate = new Date(today.getTime() + min_days * 24 * 60 * 60 * 1000);
  const maxDate = new Date(today.getTime() + max_days * 24 * 60 * 60 * 1000);

  const formatDate = (d: Date) => d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return {
    min_days,
    max_days,
    display: `${formatDate(minDate)} - ${formatDate(maxDate)}`,
  };
}

// ============================================================================
// CHECKOUT ROUTING LOGIC
// ============================================================================

/**
 * Determine checkout flow based on cart contents
 */
export function determineCheckoutFlow(
  items: CheckoutItem[]
): 'shopify' | 'native' | 'split' {
  if (items.length === 0) {
    return 'native'; // Empty cart - native handles error
  }

  if (isShopifyOnlyCart(items)) {
    return 'shopify';
  }

  if (isNativeOnlyCart(items)) {
    return 'native';
  }

  return 'split';
}

/**
 * Build Shopify checkout URL
 */
export function buildShopifyCheckoutUrl(
  items: CheckoutItem[],
  shopDomain: string
): string {
  // Build variant IDs and quantities for Shopify checkout
  const lineItems = items
    .filter(item => item.product.shopify_id)
    .map(item => {
      // Extract variant ID from Shopify GID
      const variantId = item.product.shopify_id?.split('/').pop();
      return `${variantId}:${item.quantity}`;
    })
    .join(',');

  return `https://${shopDomain}/cart/${lineItems}`;
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate address for native checkout
 */
export function validateAddress(address: Partial<Address>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!address.first_name?.trim()) {
    errors.push('First name is required');
  }
  if (!address.last_name?.trim()) {
    errors.push('Last name is required');
  }
  if (!address.address1?.trim()) {
    errors.push('Address is required');
  }
  if (!address.city?.trim()) {
    errors.push('City is required');
  }
  if (!address.province?.trim()) {
    errors.push('State/Province is required');
  }
  if (!address.country?.trim()) {
    errors.push('Country is required');
  }
  if (!address.zip?.trim()) {
    errors.push('ZIP/Postal code is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate native checkout input
 */
export function validateCheckoutInput(
  input: Partial<NativeOrderInput>
): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!input.customer_email || !validateEmail(input.customer_email)) {
    errors.push('Valid email is required');
  }

  if (!input.items || input.items.length === 0) {
    errors.push('Cart is empty');
  }

  if (input.shipping_address) {
    const addressValidation = validateAddress(input.shipping_address);
    errors.push(...addressValidation.errors);
  } else {
    errors.push('Shipping address is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// FULFILLMENT DISPLAY
// ============================================================================

/**
 * Get fulfillment badge text
 */
export function getFulfillmentBadge(sourceType: SourceType): {
  text: string;
  variant: 'fast' | 'standard' | 'digital';
} {
  switch (sourceType) {
    case 'shopify':
      return { text: 'Fulfilled by Express Prime', variant: 'fast' };
    case 'digital':
      return { text: 'Instant Digital Delivery', variant: 'digital' };
    case 'us_wholesaler':
      return { text: 'Ships from USA', variant: 'fast' };
    case 'print_on_demand':
      return { text: 'Made to Order', variant: 'standard' };
    default:
      return { text: 'Standard Shipping', variant: 'standard' };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const CHECKOUT_CONFIG = {
  FREE_SHIPPING_THRESHOLD: 50,
  DEFAULT_TAX_RATE: 0,
  BASE_SHIPPING_RATE: 4.99,
  PROCESSING_DAYS: 2,
};
