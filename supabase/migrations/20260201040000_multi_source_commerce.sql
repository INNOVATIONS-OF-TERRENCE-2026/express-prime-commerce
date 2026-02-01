-- Multi-Source Commerce Schema Migration
-- Express Prime: Multi-source commerce operating system
-- 
-- This migration creates tables for:
-- 1. external_products - Non-Shopify products from various suppliers
-- 2. suppliers - Vendor/supplier registry
-- 3. supplier_products - Product-supplier mapping with pricing
-- 4. native_orders - Orders placed through Express Prime native checkout

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

-- Source type for external products
CREATE TYPE source_type_enum AS ENUM (
  'aliexpress',
  'zendrop',
  'us_wholesaler',
  'print_on_demand',
  'digital'
);

-- Inventory policy
CREATE TYPE inventory_policy_enum AS ENUM (
  'in_stock',
  'on_demand',
  'digital'
);

-- Order source type
CREATE TYPE order_source_enum AS ENUM (
  'shopify',
  'native'
);

-- Payment status
CREATE TYPE payment_status_enum AS ENUM (
  'pending',
  'authorized',
  'captured',
  'partially_refunded',
  'refunded',
  'failed'
);

-- Fulfillment status
CREATE TYPE fulfillment_status_enum AS ENUM (
  'unfulfilled',
  'partially_fulfilled',
  'fulfilled',
  'cancelled',
  'on_hold'
);

-- ============================================================================
-- SUPPLIERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  source_type source_type_enum NOT NULL,
  api_endpoint TEXT,
  contact_email TEXT,
  base_country TEXT NOT NULL DEFAULT 'US',
  reliability_score INTEGER NOT NULL DEFAULT 50 CHECK (reliability_score >= 0 AND reliability_score <= 100),
  avg_shipping_days INTEGER NOT NULL DEFAULT 7,
  supports_tracking BOOLEAN NOT NULL DEFAULT true,
  supports_returns BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for active suppliers lookup
CREATE INDEX idx_suppliers_active ON suppliers(active) WHERE active = true;
CREATE INDEX idx_suppliers_source_type ON suppliers(source_type);
CREATE INDEX idx_suppliers_reliability ON suppliers(reliability_score DESC);

-- ============================================================================
-- EXTERNAL PRODUCTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS external_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  images JSONB NOT NULL DEFAULT '[]',
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  source_type source_type_enum NOT NULL,
  base_cost DECIMAL(10,2) NOT NULL,
  retail_price DECIMAL(10,2) NOT NULL,
  compare_at_price DECIMAL(10,2),
  estimated_shipping_days INTEGER NOT NULL DEFAULT 7,
  supplier_reliability_score INTEGER DEFAULT 50 CHECK (supplier_reliability_score >= 0 AND supplier_reliability_score <= 100),
  inventory_policy inventory_policy_enum NOT NULL DEFAULT 'on_demand',
  fulfillment_notes TEXT,
  handle TEXT UNIQUE,
  seo_title TEXT,
  seo_description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_external_products_active ON external_products(active) WHERE active = true;
CREATE INDEX idx_external_products_source ON external_products(source_type);
CREATE INDEX idx_external_products_category ON external_products(category);
CREATE INDEX idx_external_products_featured ON external_products(featured) WHERE featured = true;
CREATE INDEX idx_external_products_handle ON external_products(handle);

-- Full-text search
CREATE INDEX idx_external_products_search ON external_products 
  USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')));

-- ============================================================================
-- SUPPLIER PRODUCTS TABLE (Junction)
-- ============================================================================

CREATE TABLE IF NOT EXISTS supplier_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  external_product_id UUID NOT NULL REFERENCES external_products(id) ON DELETE CASCADE,
  supplier_cost DECIMAL(10,2) NOT NULL,
  supplier_sku TEXT,
  shipping_profile JSONB DEFAULT '{}',
  priority_weight INTEGER NOT NULL DEFAULT 50 CHECK (priority_weight >= 0 AND priority_weight <= 100),
  min_order_quantity INTEGER DEFAULT 1,
  lead_time_days INTEGER DEFAULT 3,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(supplier_id, external_product_id)
);

-- Indexes
CREATE INDEX idx_supplier_products_supplier ON supplier_products(supplier_id);
CREATE INDEX idx_supplier_products_product ON supplier_products(external_product_id);
CREATE INDEX idx_supplier_products_priority ON supplier_products(priority_weight DESC);

-- ============================================================================
-- NATIVE ORDERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS native_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  
  -- Customer info
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  
  -- Shipping address
  shipping_address JSONB NOT NULL DEFAULT '{}',
  billing_address JSONB,
  
  -- Order items
  items JSONB NOT NULL DEFAULT '[]',
  
  -- Pricing
  subtotal DECIMAL(10,2) NOT NULL,
  shipping_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  
  -- Source and fulfillment
  source_type order_source_enum NOT NULL DEFAULT 'native',
  payment_status payment_status_enum NOT NULL DEFAULT 'pending',
  fulfillment_status fulfillment_status_enum NOT NULL DEFAULT 'unfulfilled',
  
  -- Supplier selection
  selected_supplier UUID REFERENCES suppliers(id),
  supplier_order_id TEXT,
  tracking_number TEXT,
  tracking_url TEXT,
  
  -- Metadata
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  
  -- Payment info (Shopify/Stripe reference)
  payment_intent_id TEXT,
  payment_method TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fulfilled_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_native_orders_customer ON native_orders(customer_email);
CREATE INDEX idx_native_orders_status ON native_orders(payment_status, fulfillment_status);
CREATE INDEX idx_native_orders_source ON native_orders(source_type);
CREATE INDEX idx_native_orders_created ON native_orders(created_at DESC);
CREATE INDEX idx_native_orders_supplier ON native_orders(selected_supplier);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE native_orders ENABLE ROW LEVEL SECURITY;

-- Suppliers: Public read (active only), admin write
CREATE POLICY "Public read active suppliers"
  ON suppliers FOR SELECT
  USING (active = true);

CREATE POLICY "Admin full access suppliers"
  ON suppliers FOR ALL
  USING (auth.role() = 'authenticated' AND auth.jwt()->>'role' = 'admin');

-- External Products: Public read (active only), admin write
CREATE POLICY "Public read active products"
  ON external_products FOR SELECT
  USING (active = true);

CREATE POLICY "Admin full access products"
  ON external_products FOR ALL
  USING (auth.role() = 'authenticated' AND auth.jwt()->>'role' = 'admin');

-- Supplier Products: Public read (active only), admin write
CREATE POLICY "Public read active supplier products"
  ON supplier_products FOR SELECT
  USING (active = true);

CREATE POLICY "Admin full access supplier products"
  ON supplier_products FOR ALL
  USING (auth.role() = 'authenticated' AND auth.jwt()->>'role' = 'admin');

-- Native Orders: Admin and system access
CREATE POLICY "Admin read orders"
  ON native_orders FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin and system write orders"
  ON native_orders FOR ALL
  USING (auth.role() = 'authenticated');

-- Allow service role full access (for edge functions)
CREATE POLICY "Service role full access suppliers"
  ON suppliers FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access products"
  ON external_products FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access supplier products"
  ON supplier_products FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access orders"
  ON native_orders FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_external_products_updated_at
  BEFORE UPDATE ON external_products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supplier_products_updated_at
  BEFORE UPDATE ON supplier_products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_native_orders_updated_at
  BEFORE UPDATE ON native_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  counter INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO counter FROM native_orders;
  new_number := 'EP-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(counter::TEXT, 5, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Get best supplier for a product
CREATE OR REPLACE FUNCTION get_best_supplier(product_id UUID)
RETURNS TABLE (
  supplier_id UUID,
  supplier_name TEXT,
  supplier_cost DECIMAL,
  reliability_score INTEGER,
  shipping_days INTEGER,
  calculated_score DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id AS supplier_id,
    s.name AS supplier_name,
    sp.supplier_cost,
    s.reliability_score,
    s.avg_shipping_days AS shipping_days,
    (
      (s.reliability_score * 0.35) +
      ((14 - LEAST(s.avg_shipping_days, 14)) / 14.0 * 100 * 0.30) +
      ((1 - (sp.supplier_cost / ep.retail_price)) * 100 * 0.20) +
      (sp.priority_weight * 0.15)
    )::DECIMAL AS calculated_score
  FROM supplier_products sp
  JOIN suppliers s ON s.id = sp.supplier_id
  JOIN external_products ep ON ep.id = sp.external_product_id
  WHERE sp.external_product_id = product_id
    AND sp.active = true
    AND s.active = true
  ORDER BY calculated_score DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql;
