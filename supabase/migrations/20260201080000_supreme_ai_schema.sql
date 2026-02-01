-- ============================================================================
-- SUPREME AI ENGINE - Database Schema Extension
-- Adds all required tables for AI functionality
-- ============================================================================

-- ============================================================================
-- PRODUCT EMBEDDINGS TABLE (for semantic search)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.product_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    embedding VECTOR(384), -- MiniLM-L6 outputs 384-dimensional vectors
    embedding_model TEXT DEFAULT 'all-MiniLM-L6-v2',
    text_hash TEXT, -- Hash of source text to detect changes
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(product_id)
);

-- Enable pgvector extension for embeddings (if not already enabled)
CREATE EXTENSION IF NOT EXISTS vector;

-- Index for fast similarity search
CREATE INDEX IF NOT EXISTS idx_product_embeddings_vector 
ON public.product_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- ============================================================================
-- PRODUCT REVIEWS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.product_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_name TEXT,
    customer_email TEXT,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    content TEXT,
    sentiment_label TEXT,
    sentiment_score DECIMAL(5, 4),
    is_verified_purchase BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT false,
    helpful_votes INTEGER DEFAULT 0,
    shopify_review_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_reviews_product ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON public.product_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_product_reviews_sentiment ON public.product_reviews(sentiment_label);

-- ============================================================================
-- AI ANALYSIS CACHE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ai_analysis_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    analysis_type TEXT NOT NULL, -- 'sentiment', 'classification', 'full', 'price'
    input_hash TEXT NOT NULL, -- Hash of input data to detect changes
    result JSONB NOT NULL,
    model_version TEXT,
    confidence DECIMAL(5, 4),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(product_id, analysis_type, input_hash)
);

CREATE INDEX IF NOT EXISTS idx_ai_analysis_cache_product ON public.ai_analysis_cache(product_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_cache_type ON public.ai_analysis_cache(analysis_type);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_cache_expires ON public.ai_analysis_cache(expires_at);

-- ============================================================================
-- COMPETITOR PRICES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.competitor_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    competitor_name TEXT NOT NULL,
    competitor_url TEXT,
    competitor_price DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    is_in_stock BOOLEAN DEFAULT true,
    scraped_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_competitor_prices_product ON public.competitor_prices(product_id);
CREATE INDEX IF NOT EXISTS idx_competitor_prices_scraped ON public.competitor_prices(scraped_at DESC);

-- ============================================================================
-- PRICE HISTORY TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    old_price DECIMAL(10, 2),
    new_price DECIMAL(10, 2) NOT NULL,
    change_reason TEXT, -- 'manual', 'ai_recommendation', 'promotion', 'competitor_match'
    changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ai_confidence DECIMAL(5, 4),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_price_history_product ON public.price_history(product_id);
CREATE INDEX IF NOT EXISTS idx_price_history_created ON public.price_history(created_at DESC);

-- ============================================================================
-- DEMAND FORECASTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.demand_forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    forecast_date DATE NOT NULL,
    predicted_units INTEGER NOT NULL,
    confidence_low INTEGER,
    confidence_high INTEGER,
    model_version TEXT,
    factors JSONB, -- Seasonal factors, trend data, etc.
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(product_id, forecast_date)
);

CREATE INDEX IF NOT EXISTS idx_demand_forecasts_product ON public.demand_forecasts(product_id);
CREATE INDEX IF NOT EXISTS idx_demand_forecasts_date ON public.demand_forecasts(forecast_date);

-- ============================================================================
-- CUSTOMER SEGMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.customer_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    criteria JSONB NOT NULL, -- Segmentation rules
    customer_count INTEGER DEFAULT 0,
    avg_order_value DECIMAL(10, 2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- CUSTOMER SEGMENT MEMBERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.customer_segment_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    segment_id UUID NOT NULL REFERENCES public.customer_segments(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    score DECIMAL(5, 4), -- Membership score/probability
    added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(segment_id, customer_id)
);

-- ============================================================================
-- PRODUCT RECOMMENDATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.product_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    recommended_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    recommendation_type TEXT NOT NULL, -- 'similar', 'frequently_bought', 'upsell', 'cross_sell'
    score DECIMAL(5, 4) NOT NULL,
    algorithm_version TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(source_product_id, recommended_product_id, recommendation_type)
);

CREATE INDEX IF NOT EXISTS idx_product_recommendations_source ON public.product_recommendations(source_product_id);
CREATE INDEX IF NOT EXISTS idx_product_recommendations_type ON public.product_recommendations(recommendation_type);

-- ============================================================================
-- MARKETING CAMPAIGNS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    campaign_type TEXT, -- 'email', 'social', 'paid_search', 'display'
    status TEXT DEFAULT 'draft', -- 'draft', 'active', 'paused', 'completed'
    budget DECIMAL(10, 2),
    spent DECIMAL(10, 2) DEFAULT 0,
    start_date DATE,
    end_date DATE,
    target_segment_id UUID REFERENCES public.customer_segments(id),
    metrics JSONB, -- Impressions, clicks, conversions, etc.
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- CART ABANDONMENT TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.cart_abandonments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_email TEXT,
    cart_items JSONB NOT NULL,
    cart_value DECIMAL(10, 2) NOT NULL,
    abandoned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    recovery_email_sent BOOLEAN DEFAULT false,
    recovery_email_sent_at TIMESTAMPTZ,
    was_recovered BOOLEAN DEFAULT false,
    recovered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cart_abandonments_session ON public.cart_abandonments(session_id);
CREATE INDEX IF NOT EXISTS idx_cart_abandonments_customer ON public.cart_abandonments(customer_id);
CREATE INDEX IF NOT EXISTS idx_cart_abandonments_recovered ON public.cart_abandonments(was_recovered);

-- ============================================================================
-- INVENTORY ALERTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.inventory_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL, -- 'low_stock', 'out_of_stock', 'overstock'
    threshold INTEGER,
    current_quantity INTEGER,
    is_acknowledged BOOLEAN DEFAULT false,
    acknowledged_by UUID REFERENCES auth.users(id),
    acknowledged_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_alerts_product ON public.inventory_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_type ON public.inventory_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_acknowledged ON public.inventory_alerts(is_acknowledged);

-- ============================================================================
-- A/B TESTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ab_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    test_type TEXT NOT NULL, -- 'price', 'title', 'description', 'image'
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    variant_a JSONB NOT NULL,
    variant_b JSONB NOT NULL,
    traffic_split DECIMAL(3, 2) DEFAULT 0.5, -- Percentage to variant B
    status TEXT DEFAULT 'draft', -- 'draft', 'running', 'paused', 'completed'
    winner TEXT, -- 'A', 'B', null
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    results JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- RLS POLICIES FOR NEW TABLES
-- ============================================================================

ALTER TABLE public.product_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_analysis_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demand_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_segment_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_abandonments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_tests ENABLE ROW LEVEL SECURITY;

-- Service role full access for all tables
CREATE POLICY "Service role access product_embeddings" ON public.product_embeddings FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role access product_reviews" ON public.product_reviews FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role access ai_analysis_cache" ON public.ai_analysis_cache FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role access competitor_prices" ON public.competitor_prices FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role access price_history" ON public.price_history FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role access demand_forecasts" ON public.demand_forecasts FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role access customer_segments" ON public.customer_segments FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role access customer_segment_members" ON public.customer_segment_members FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role access product_recommendations" ON public.product_recommendations FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role access marketing_campaigns" ON public.marketing_campaigns FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role access cart_abandonments" ON public.cart_abandonments FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role access inventory_alerts" ON public.inventory_alerts FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role access ab_tests" ON public.ab_tests FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Public read for product reviews
CREATE POLICY "Anyone can read approved reviews" ON public.product_reviews 
FOR SELECT TO anon, authenticated 
USING (is_approved = true);

-- Authenticated users can create reviews
CREATE POLICY "Authenticated users can create reviews" ON public.product_reviews 
FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = customer_id);

-- Public read for product recommendations
CREATE POLICY "Anyone can read recommendations" ON public.product_recommendations 
FOR SELECT TO anon, authenticated 
USING (true);

-- Admin access to management tables
CREATE POLICY "Admins can manage customer_segments" ON public.customer_segments 
FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('founder', 'admin')));

CREATE POLICY "Admins can manage marketing_campaigns" ON public.marketing_campaigns 
FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('founder', 'admin')));

CREATE POLICY "Admins can manage ab_tests" ON public.ab_tests 
FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('founder', 'admin')));

CREATE POLICY "Admins can view inventory_alerts" ON public.inventory_alerts 
FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('founder', 'admin', 'operator')));

-- ============================================================================
-- ADD AI SETTINGS TO GLOBAL_SETTINGS
-- ============================================================================
INSERT INTO public.global_settings (key, value, description)
VALUES (
    'ai_settings',
    '{
        "enabled": true,
        "huggingfaceModel": "distilbert-base-uncased-finetuned-sst-2-english",
        "classificationModel": "facebook/bart-large-mnli",
        "embeddingModel": "sentence-transformers/all-MiniLM-L6-v2",
        "confidenceThreshold": 0.7,
        "cacheExpiryHours": 24,
        "batchSize": 10,
        "autoClassify": true,
        "autoGenerateDescriptions": false,
        "sentimentAnalysisEnabled": true,
        "priceOptimizationEnabled": true,
        "demandForecastingEnabled": true,
        "semanticSearchEnabled": true
    }'::jsonb,
    'AI engine configuration settings'
) ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value,
    updated_at = now();

-- ============================================================================
-- FUNCTIONS FOR AI OPERATIONS
-- ============================================================================

-- Function to search products by embedding similarity
CREATE OR REPLACE FUNCTION search_products_by_embedding(
    query_embedding VECTOR(384),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 10
)
RETURNS TABLE (
    product_id UUID,
    title TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id AS product_id,
        p.title,
        1 - (pe.embedding <=> query_embedding) AS similarity
    FROM public.products p
    JOIN public.product_embeddings pe ON p.id = pe.product_id
    WHERE p.status = 'active'
    AND 1 - (pe.embedding <=> query_embedding) > match_threshold
    ORDER BY pe.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Function to get AI-recommended products
CREATE OR REPLACE FUNCTION get_ai_recommendations(
    source_id UUID,
    rec_type TEXT DEFAULT 'similar',
    limit_count INT DEFAULT 5
)
RETURNS TABLE (
    product_id UUID,
    title TEXT,
    price DECIMAL,
    image_url TEXT,
    score FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id AS product_id,
        p.title,
        p.price,
        p.image_url,
        pr.score::FLOAT
    FROM public.product_recommendations pr
    JOIN public.products p ON pr.recommended_product_id = p.id
    WHERE pr.source_product_id = source_id
    AND pr.recommendation_type = rec_type
    AND p.status = 'active'
    ORDER BY pr.score DESC
    LIMIT limit_count;
END;
$$;

-- ============================================================================
-- TRIGGER TO UPDATE TIMESTAMPS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at column
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
        AND table_schema = 'public'
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_%I_updated_at ON public.%I;
            CREATE TRIGGER update_%I_updated_at
            BEFORE UPDATE ON public.%I
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        ', t, t, t, t);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE public.product_embeddings IS 'Stores vector embeddings for semantic product search using pgvector';
COMMENT ON TABLE public.product_reviews IS 'Customer reviews with AI sentiment analysis';
COMMENT ON TABLE public.ai_analysis_cache IS 'Cache for AI analysis results to reduce API calls';
COMMENT ON TABLE public.competitor_prices IS 'Track competitor pricing for dynamic pricing';
COMMENT ON TABLE public.demand_forecasts IS 'AI-generated demand forecasts by product';
COMMENT ON TABLE public.product_recommendations IS 'AI-generated product recommendations';
COMMENT ON TABLE public.ab_tests IS 'A/B test configurations and results';
