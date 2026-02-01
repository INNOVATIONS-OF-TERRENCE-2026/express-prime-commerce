-- Additional tables for Express Prime Commerce
-- Run after initial schema migrations

-- OAuth states for Shopify OAuth flow
CREATE TABLE IF NOT EXISTS oauth_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state TEXT UNIQUE NOT NULL,
    shop TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

-- Shopify installations
CREATE TABLE IF NOT EXISTS shopify_installations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_domain TEXT UNIQUE NOT NULL,
    access_token TEXT,
    scopes TEXT[],
    webhooks_registered TEXT[],
    is_active BOOLEAN DEFAULT true,
    installed_at TIMESTAMPTZ DEFAULT NOW(),
    uninstalled_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Global settings
CREATE TABLE IF NOT EXISTS global_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS shopify_product_id TEXT,
ADD COLUMN IF NOT EXISTS shop_domain TEXT,
ADD COLUMN IF NOT EXISTS cost DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS margin_percent DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS images TEXT[];

-- Add missing columns to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS shopify_order_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS order_number TEXT,
ADD COLUMN IF NOT EXISTS subtotal_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS total_tax DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS billing_address JSONB,
ADD COLUMN IF NOT EXISTS refund_data JSONB,
ADD COLUMN IF NOT EXISTS shop_domain TEXT;

-- Performance metrics enhancements
ALTER TABLE performance_metrics
ADD COLUMN IF NOT EXISTS refunds_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_order_at TIMESTAMPTZ;

-- AI decisions enhancements
ALTER TABLE ai_decisions
ADD COLUMN IF NOT EXISTS old_value JSONB,
ADD COLUMN IF NOT EXISTS new_value JSONB;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_products_shopify_id ON products(shopify_product_id);
CREATE INDEX IF NOT EXISTS idx_products_handle ON products(handle);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_orders_shopify_id ON orders(shopify_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_ai_decisions_product ON ai_decisions(product_id);
CREATE INDEX IF NOT EXISTS idx_ai_decisions_type ON ai_decisions(decision_type);
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires ON oauth_states(expires_at);

-- RLS policies for new tables
ALTER TABLE oauth_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopify_installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_settings ENABLE ROW LEVEL SECURITY;

-- Service role policies (for edge functions)
CREATE POLICY "Service role full access to oauth_states" ON oauth_states
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to shopify_installations" ON shopify_installations
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to global_settings" ON global_settings
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Admin read access to settings
CREATE POLICY "Admins can read global_settings" ON global_settings
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('founder', 'admin')
        )
    );

-- Insert default profit protection settings
INSERT INTO global_settings (key, value, description)
VALUES (
    'profit_protection',
    '{"minMarginPercent": 20, "maxRefundRatePercent": 10, "noSalesKillWindowDays": 14, "noSalesPauseWindowDays": 7, "rateLimitSafeMode": true, "autoApplyDecisions": false}'::jsonb,
    'Profit protection thresholds and rules'
) ON CONFLICT (key) DO NOTHING;

-- Clean up expired oauth states (can be run periodically)
-- DELETE FROM oauth_states WHERE expires_at < NOW();
