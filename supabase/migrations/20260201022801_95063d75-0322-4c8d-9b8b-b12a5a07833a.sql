-- =====================================================
-- EXPRESS PRIME DATABASE SCHEMA
-- =====================================================

-- 1. Create role enum
CREATE TYPE public.app_role AS ENUM ('founder', 'admin', 'operator');

-- 2. Create product status enum
CREATE TYPE public.product_status AS ENUM ('active', 'paused', 'killed', 'draft');

-- 3. Create sync status enum
CREATE TYPE public.sync_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- 4. Create order status enum
CREATE TYPE public.order_status AS ENUM ('pending', 'paid', 'fulfilled', 'cancelled', 'refunded');

-- =====================================================
-- PROFILES TABLE
-- =====================================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- USER ROLES TABLE (separate from profiles for security)
-- =====================================================
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SHOPIFY INSTALLATIONS TABLE
-- =====================================================
CREATE TABLE public.shopify_installations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_domain TEXT NOT NULL UNIQUE,
    shop_name TEXT,
    access_token_encrypted TEXT, -- Encrypted via edge function
    scopes TEXT[],
    is_active BOOLEAN NOT NULL DEFAULT true,
    installed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shopify_installations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PRODUCTS TABLE
-- =====================================================
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shopify_installation_id UUID REFERENCES public.shopify_installations(id) ON DELETE CASCADE,
    shopify_product_id TEXT,
    shopify_variant_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    handle TEXT,
    vendor TEXT,
    product_type TEXT,
    status product_status NOT NULL DEFAULT 'draft',
    price DECIMAL(10, 2),
    compare_at_price DECIMAL(10, 2),
    cost DECIMAL(10, 2),
    margin_percent DECIMAL(5, 2),
    inventory_quantity INTEGER DEFAULT 0,
    image_url TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    tags TEXT[],
    is_synced BOOLEAN DEFAULT false,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- COLLECTIONS TABLE
-- =====================================================
CREATE TABLE public.collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shopify_installation_id UUID REFERENCES public.shopify_installations(id) ON DELETE CASCADE,
    shopify_collection_id TEXT,
    title TEXT NOT NULL,
    handle TEXT,
    description TEXT,
    image_url TEXT,
    sort_order TEXT,
    products_count INTEGER DEFAULT 0,
    is_synced BOOLEAN DEFAULT false,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ORDERS TABLE
-- =====================================================
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shopify_installation_id UUID REFERENCES public.shopify_installations(id) ON DELETE CASCADE,
    shopify_order_id TEXT,
    order_number TEXT,
    customer_email TEXT,
    customer_name TEXT,
    status order_status NOT NULL DEFAULT 'pending',
    subtotal DECIMAL(10, 2),
    total_price DECIMAL(10, 2),
    total_tax DECIMAL(10, 2),
    total_discounts DECIMAL(10, 2),
    shipping_cost DECIMAL(10, 2),
    estimated_cost DECIMAL(10, 2),
    estimated_profit DECIMAL(10, 2),
    profit_margin_percent DECIMAL(5, 2),
    line_items JSONB DEFAULT '[]'::jsonb,
    shipping_address JSONB,
    fulfilled_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PERFORMANCE METRICS TABLE
-- =====================================================
CREATE TABLE public.performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    views INTEGER DEFAULT 0,
    add_to_carts INTEGER DEFAULT 0,
    orders_count INTEGER DEFAULT 0,
    units_sold INTEGER DEFAULT 0,
    revenue DECIMAL(10, 2) DEFAULT 0,
    cost DECIMAL(10, 2) DEFAULT 0,
    profit DECIMAL(10, 2) DEFAULT 0,
    refund_count INTEGER DEFAULT 0,
    refund_amount DECIMAL(10, 2) DEFAULT 0,
    ad_spend DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (product_id, date)
);

ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- AI DECISIONS TABLE
-- =====================================================
CREATE TABLE public.ai_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    decision_type TEXT NOT NULL, -- 'pause', 'reprice', 'kill', 'flag', 'activate'
    reason TEXT NOT NULL,
    confidence DECIMAL(3, 2), -- 0.00 to 1.00
    old_value JSONB,
    new_value JSONB,
    was_applied BOOLEAN DEFAULT false,
    applied_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_decisions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SYNC RUNS TABLE
-- =====================================================
CREATE TABLE public.sync_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shopify_installation_id UUID REFERENCES public.shopify_installations(id) ON DELETE CASCADE,
    initiated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    sync_type TEXT NOT NULL, -- 'products', 'orders', 'collections', 'bulk_import'
    status sync_status NOT NULL DEFAULT 'pending',
    total_items INTEGER DEFAULT 0,
    processed_items INTEGER DEFAULT 0,
    successful_items INTEGER DEFAULT 0,
    failed_items INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sync_runs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SYNC ITEMS TABLE
-- =====================================================
CREATE TABLE public.sync_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sync_run_id UUID NOT NULL REFERENCES public.sync_runs(id) ON DELETE CASCADE,
    external_id TEXT,
    item_type TEXT NOT NULL, -- 'product', 'order', 'collection'
    status sync_status NOT NULL DEFAULT 'pending',
    input_data JSONB,
    result_data JSONB,
    error_message TEXT,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sync_items ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- GLOBAL SETTINGS TABLE
-- =====================================================
CREATE TABLE public.global_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER FUNCTIONS (SECURITY DEFINER)
-- =====================================================

-- Check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- Check if current user is a founder
CREATE OR REPLACE FUNCTION public.is_founder()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.has_role(auth.uid(), 'founder')
$$;

-- Check if current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.has_role(auth.uid(), 'admin')
$$;

-- Check if current user is an operator
CREATE OR REPLACE FUNCTION public.is_operator()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.has_role(auth.uid(), 'operator')
$$;

-- Check if user has any elevated role (founder, admin, or operator)
CREATE OR REPLACE FUNCTION public.has_any_role()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = auth.uid()
    )
$$;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- PROFILES POLICIES
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Founders can view all profiles"
    ON public.profiles FOR SELECT
    USING (public.is_founder());

-- USER ROLES POLICIES
CREATE POLICY "Users can view roles if authenticated"
    ON public.user_roles FOR SELECT
    TO authenticated
    USING (public.has_any_role());

CREATE POLICY "Founders can manage all roles"
    ON public.user_roles FOR ALL
    USING (public.is_founder());

-- SHOPIFY INSTALLATIONS POLICIES
CREATE POLICY "Founders can manage installations"
    ON public.shopify_installations FOR ALL
    USING (public.is_founder());

CREATE POLICY "Admins and operators can view installations"
    ON public.shopify_installations FOR SELECT
    USING (public.is_admin() OR public.is_operator());

-- PRODUCTS POLICIES
CREATE POLICY "All roles can view products"
    ON public.products FOR SELECT
    TO authenticated
    USING (public.has_any_role());

CREATE POLICY "Founders and admins can insert products"
    ON public.products FOR INSERT
    TO authenticated
    WITH CHECK (public.is_founder() OR public.is_admin());

CREATE POLICY "Founders and admins can update products"
    ON public.products FOR UPDATE
    TO authenticated
    USING (public.is_founder() OR public.is_admin());

CREATE POLICY "Founders and admins can delete products"
    ON public.products FOR DELETE
    TO authenticated
    USING (public.is_founder() OR public.is_admin());

-- COLLECTIONS POLICIES
CREATE POLICY "All roles can view collections"
    ON public.collections FOR SELECT
    TO authenticated
    USING (public.has_any_role());

CREATE POLICY "Founders and admins can manage collections"
    ON public.collections FOR ALL
    USING (public.is_founder() OR public.is_admin());

-- ORDERS POLICIES
CREATE POLICY "All roles can view orders"
    ON public.orders FOR SELECT
    TO authenticated
    USING (public.has_any_role());

CREATE POLICY "Founders can manage orders"
    ON public.orders FOR ALL
    USING (public.is_founder());

-- PERFORMANCE METRICS POLICIES
CREATE POLICY "All roles can view metrics"
    ON public.performance_metrics FOR SELECT
    TO authenticated
    USING (public.has_any_role());

CREATE POLICY "Founders and admins can manage metrics"
    ON public.performance_metrics FOR ALL
    USING (public.is_founder() OR public.is_admin());

-- AI DECISIONS POLICIES
CREATE POLICY "All roles can view ai decisions"
    ON public.ai_decisions FOR SELECT
    TO authenticated
    USING (public.has_any_role());

CREATE POLICY "Founders can manage ai decisions"
    ON public.ai_decisions FOR ALL
    USING (public.is_founder());

-- SYNC RUNS POLICIES
CREATE POLICY "All roles can view sync runs"
    ON public.sync_runs FOR SELECT
    TO authenticated
    USING (public.has_any_role());

CREATE POLICY "Founders and admins can manage sync runs"
    ON public.sync_runs FOR ALL
    USING (public.is_founder() OR public.is_admin());

-- SYNC ITEMS POLICIES
CREATE POLICY "All roles can view sync items"
    ON public.sync_items FOR SELECT
    TO authenticated
    USING (public.has_any_role());

CREATE POLICY "Founders and admins can manage sync items"
    ON public.sync_items FOR ALL
    USING (public.is_founder() OR public.is_admin());

-- GLOBAL SETTINGS POLICIES
CREATE POLICY "All roles can view settings"
    ON public.global_settings FOR SELECT
    TO authenticated
    USING (public.has_any_role());

CREATE POLICY "Founders can manage settings"
    ON public.global_settings FOR ALL
    USING (public.is_founder());

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shopify_installations_updated_at
    BEFORE UPDATE ON public.shopify_installations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_collections_updated_at
    BEFORE UPDATE ON public.collections
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Calculate margin when price/cost changes
CREATE OR REPLACE FUNCTION public.calculate_margin()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.price IS NOT NULL AND NEW.cost IS NOT NULL AND NEW.cost > 0 THEN
        NEW.margin_percent = ((NEW.price - NEW.cost) / NEW.price) * 100;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_product_margin
    BEFORE INSERT OR UPDATE OF price, cost ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.calculate_margin();

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_products_status ON public.products(status);
CREATE INDEX idx_products_shopify_id ON public.products(shopify_product_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_shopify_id ON public.orders(shopify_order_id);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX idx_performance_metrics_date ON public.performance_metrics(date DESC);
CREATE INDEX idx_performance_metrics_product ON public.performance_metrics(product_id);
CREATE INDEX idx_ai_decisions_product ON public.ai_decisions(product_id);
CREATE INDEX idx_ai_decisions_created ON public.ai_decisions(created_at DESC);
CREATE INDEX idx_sync_runs_status ON public.sync_runs(status);
CREATE INDEX idx_sync_items_run ON public.sync_items(sync_run_id);
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);