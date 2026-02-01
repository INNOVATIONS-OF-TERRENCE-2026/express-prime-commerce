-- =====================================================
-- FIX: Enable Realtime on Tables (Not Views)
-- =====================================================
-- product_analytics is a VIEW and cannot have Realtime enabled.
-- This migration creates actual tables for Realtime and enables it.
-- =====================================================

-- =====================================================
-- 1. CREATE REAL-TIME ANALYTICS TABLE
-- =====================================================

-- Drop if exists from previous failed migration
DROP TABLE IF EXISTS realtime_analytics CASCADE;
DROP TABLE IF EXISTS live_visitors CASCADE;
DROP TABLE IF EXISTS realtime_alerts CASCADE;

-- Create a real table for live analytics that CAN have Realtime enabled
CREATE TABLE realtime_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  session_id TEXT,
  visitor_id TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  page_url TEXT,
  referrer TEXT,
  device_type TEXT,
  country TEXT,
  city TEXT,
  revenue DECIMAL(10,2) DEFAULT 0,
  quantity INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_realtime_analytics_event_type ON realtime_analytics(event_type);
CREATE INDEX idx_realtime_analytics_created_at ON realtime_analytics(created_at DESC);
CREATE INDEX idx_realtime_analytics_product_id ON realtime_analytics(product_id);
CREATE INDEX idx_realtime_analytics_session_id ON realtime_analytics(session_id);

-- Enable RLS
ALTER TABLE realtime_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "realtime_analytics_anon_insert" ON realtime_analytics FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "realtime_analytics_auth_insert" ON realtime_analytics FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "realtime_analytics_auth_select" ON realtime_analytics FOR SELECT TO authenticated USING (true);

-- =====================================================
-- 2. CREATE LIVE VISITORS TABLE
-- =====================================================

CREATE TABLE live_visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  visitor_id TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  current_page TEXT,
  device_type TEXT,
  country TEXT,
  city TEXT,
  referrer TEXT,
  cart_value DECIMAL(10,2) DEFAULT 0,
  cart_items INTEGER DEFAULT 0,
  page_views INTEGER DEFAULT 1,
  first_seen TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Create indexes
CREATE INDEX idx_live_visitors_session ON live_visitors(session_id);
CREATE INDEX idx_live_visitors_active ON live_visitors(is_active) WHERE is_active = true;
CREATE INDEX idx_live_visitors_last_seen ON live_visitors(last_seen DESC);

-- Enable RLS
ALTER TABLE live_visitors ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "live_visitors_anon_all" ON live_visitors FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "live_visitors_auth_all" ON live_visitors FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =====================================================
-- 3. CREATE REAL-TIME ALERTS TABLE
-- =====================================================

CREATE TABLE realtime_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  order_id UUID,
  threshold_value DECIMAL(10,2),
  actual_value DECIMAL(10,2),
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_realtime_alerts_type ON realtime_alerts(alert_type);
CREATE INDEX idx_realtime_alerts_severity ON realtime_alerts(severity);
CREATE INDEX idx_realtime_alerts_unread ON realtime_alerts(is_read) WHERE is_read = false;
CREATE INDEX idx_realtime_alerts_created ON realtime_alerts(created_at DESC);

-- Enable RLS
ALTER TABLE realtime_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "realtime_alerts_auth_all" ON realtime_alerts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =====================================================
-- 4. ENABLE REALTIME ON TABLES
-- =====================================================

DO $$
BEGIN
  -- Products
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'products') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE products;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;

  -- Performance metrics
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'performance_metrics') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE performance_metrics;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;

  -- Orders
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'orders') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE orders;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;

  -- New realtime tables
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE realtime_analytics;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE live_visitors;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE realtime_alerts;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- =====================================================
-- 5. HELPER FUNCTIONS
-- =====================================================

-- Function to get live metrics
CREATE OR REPLACE FUNCTION get_live_metrics()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'active_visitors', (SELECT COUNT(*) FROM live_visitors WHERE is_active = true),
    'page_views_last_hour', (SELECT COUNT(*) FROM realtime_analytics WHERE event_type = 'page_view' AND created_at > NOW() - INTERVAL '1 hour'),
    'add_to_carts_last_hour', (SELECT COUNT(*) FROM realtime_analytics WHERE event_type = 'add_to_cart' AND created_at > NOW() - INTERVAL '1 hour'),
    'purchases_last_hour', (SELECT COUNT(*) FROM realtime_analytics WHERE event_type = 'purchase' AND created_at > NOW() - INTERVAL '1 hour'),
    'revenue_last_hour', (SELECT COALESCE(SUM(revenue), 0) FROM realtime_analytics WHERE event_type = 'purchase' AND created_at > NOW() - INTERVAL '1 hour'),
    'unread_alerts', (SELECT COUNT(*) FROM realtime_alerts WHERE is_read = false),
    'updated_at', NOW()
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to track event
CREATE OR REPLACE FUNCTION track_analytics_event(
  p_event_type TEXT,
  p_product_id UUID DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_visitor_id TEXT DEFAULT NULL,
  p_page_url TEXT DEFAULT NULL,
  p_revenue DECIMAL DEFAULT 0,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO realtime_analytics (event_type, product_id, session_id, visitor_id, page_url, revenue, metadata)
  VALUES (p_event_type, p_product_id, p_session_id, p_visitor_id, p_page_url, p_revenue, p_metadata)
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Function to upsert visitor
CREATE OR REPLACE FUNCTION upsert_live_visitor(
  p_session_id TEXT,
  p_current_page TEXT DEFAULT NULL,
  p_visitor_id TEXT DEFAULT NULL,
  p_device_type TEXT DEFAULT NULL,
  p_country TEXT DEFAULT NULL,
  p_cart_value DECIMAL DEFAULT 0,
  p_cart_items INTEGER DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
  visitor_id UUID;
BEGIN
  INSERT INTO live_visitors (session_id, current_page, visitor_id, device_type, country, cart_value, cart_items, last_seen, is_active)
  VALUES (p_session_id, p_current_page, p_visitor_id, p_device_type, p_country, p_cart_value, p_cart_items, NOW(), true)
  ON CONFLICT (session_id) DO UPDATE SET
    current_page = COALESCE(EXCLUDED.current_page, live_visitors.current_page),
    cart_value = COALESCE(EXCLUDED.cart_value, live_visitors.cart_value),
    cart_items = COALESCE(EXCLUDED.cart_items, live_visitors.cart_items),
    page_views = live_visitors.page_views + 1,
    last_seen = NOW(),
    is_active = true
  RETURNING id INTO visitor_id;
  RETURN visitor_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. SEED SAMPLE DATA
-- =====================================================

INSERT INTO live_visitors (session_id, visitor_id, current_page, device_type, country, cart_value, cart_items, page_views)
VALUES 
  ('sess_001', 'vis_abc123', '/products/wireless-earbuds', 'mobile', 'US', 89.99, 1, 5),
  ('sess_002', 'vis_def456', '/collections/electronics', 'desktop', 'UK', 0, 0, 3),
  ('sess_003', 'vis_ghi789', '/cart', 'mobile', 'CA', 249.99, 3, 8),
  ('sess_004', 'vis_jkl012', '/', 'tablet', 'AU', 0, 0, 1),
  ('sess_005', 'vis_mno345', '/products/smart-watch', 'desktop', 'DE', 199.99, 1, 4)
ON CONFLICT (session_id) DO NOTHING;

INSERT INTO realtime_analytics (event_type, session_id, visitor_id, page_url, revenue, metadata)
VALUES 
  ('page_view', 'sess_001', 'vis_abc123', '/', 0, '{"source": "organic"}'),
  ('product_view', 'sess_001', 'vis_abc123', '/products/wireless-earbuds', 0, '{}'),
  ('add_to_cart', 'sess_001', 'vis_abc123', '/products/wireless-earbuds', 0, '{"price": 89.99}'),
  ('page_view', 'sess_002', 'vis_def456', '/', 0, '{"source": "google"}'),
  ('purchase', 'sess_006', 'vis_pqr678', '/checkout/success', 159.99, '{"order_id": "ORD-001"}'),
  ('purchase', 'sess_007', 'vis_stu901', '/checkout/success', 299.99, '{"order_id": "ORD-002"}');

INSERT INTO realtime_alerts (alert_type, severity, title, message, threshold_value, actual_value)
VALUES 
  ('high_traffic', 'info', 'Traffic Spike Detected', 'Visitor count increased by 45%', 100, 145),
  ('low_stock', 'warning', 'Low Stock Alert', 'Wireless Earbuds Pro has only 5 units remaining', 10, 5);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
