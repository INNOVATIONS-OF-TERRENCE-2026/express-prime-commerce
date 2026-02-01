/**
 * Multi-Source Commerce Module Index
 * 
 * Express Prime: Multi-source commerce operating system
 * Shopify is ONE fulfillment rail — not the platform.
 */

// Types
export * from './types';

// AI Supplier Selection
export {
  calculateSupplierScore,
  selectSupplier,
  getFallbackSupplier,
  shouldShowProduct,
  getVisibilityReason,
  batchSelectSuppliers,
  analyzeMargins,
  SUPPLIER_WEIGHTS,
  MIN_SCORE_THRESHOLD,
  MAX_SHIPPING_DAYS,
  FALLBACK_TIMEOUT_MS,
} from './supplierSelector';

// Native Checkout
export {
  splitCheckoutItems,
  isShopifyOnlyCart,
  isNativeOnlyCart,
  isMixedCart,
  generateOrderNumber,
  calculateOrderTotals,
  buildNativeOrder,
  calculateNativeShipping,
  getEstimatedDelivery,
  determineCheckoutFlow,
  buildShopifyCheckoutUrl,
  validateAddress,
  validateEmail,
  validateCheckoutInput,
  getFulfillmentBadge,
  CHECKOUT_CONFIG,
} from './nativeCheckout';

// Vendor Onboarding
export {
  SUPPLIER_TEMPLATES,
  createSupplierFromTemplate,
  getDefaultShippingProfile,
  estimateShippingDays,
  createExternalProduct,
  calculateRetailPrice,
  createSupplierProductMapping,
  validateSupplierInput,
  validateProductInput,
  DEFAULT_SHIPPING_PROFILES,
  DEFAULT_RELIABILITY_SCORES,
  DEFAULT_SHIPPING_DAYS,
  type SupplierTemplate,
} from './vendorOnboarding';
