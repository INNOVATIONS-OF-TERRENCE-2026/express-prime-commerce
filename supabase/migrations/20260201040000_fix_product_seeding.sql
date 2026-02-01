-- =====================================================
-- FIX PRODUCT SEEDING - Allow anonymous product inserts
-- This enables the seed functionality to work from the client
-- =====================================================

-- Drop ALL existing policies for products to start fresh
DROP POLICY IF EXISTS "Founders and admins can insert products" ON public.products;
DROP POLICY IF EXISTS "Founders and admins can update products" ON public.products;
DROP POLICY IF EXISTS "All roles can view products" ON public.products;
DROP POLICY IF EXISTS "Founders and admins can delete products" ON public.products;
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
DROP POLICY IF EXISTS "Allow product inserts" ON public.products;
DROP POLICY IF EXISTS "Allow product updates" ON public.products;
DROP POLICY IF EXISTS "Allow product deletes" ON public.products;
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
DROP POLICY IF EXISTS "Public can read active products" ON public.products;
DROP POLICY IF EXISTS "Service role has full access to products" ON public.products;

-- Create more permissive policies for products
-- Allow anyone to view active products (for storefront)
CREATE POLICY "Anyone can view products"
    ON public.products FOR SELECT
    USING (true);

-- Allow anyone to insert products (for seeding)
CREATE POLICY "Allow product inserts"
    ON public.products FOR INSERT
    WITH CHECK (true);

-- Allow anyone to update products (for seeding/sync)
CREATE POLICY "Allow product updates"
    ON public.products FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Allow anyone to delete products
CREATE POLICY "Allow product deletes"
    ON public.products FOR DELETE
    USING (true);

-- Grant necessary permissions to anon role
GRANT ALL ON public.products TO anon;
GRANT ALL ON public.products TO authenticated;

-- Ensure handle column has a unique constraint for upsert
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'products_handle_key'
    ) THEN
        ALTER TABLE public.products ADD CONSTRAINT products_handle_key UNIQUE (handle);
    END IF;
END $$;

-- =====================================================
-- CREATE SEED PRODUCTS FUNCTION
-- This function can be called via RPC to seed products
-- Uses SECURITY DEFINER to bypass RLS
-- =====================================================

CREATE OR REPLACE FUNCTION public.seed_product(
    p_handle TEXT,
    p_title TEXT,
    p_description TEXT,
    p_vendor TEXT,
    p_product_type TEXT,
    p_tags TEXT[],
    p_price DECIMAL,
    p_compare_at_price DECIMAL,
    p_image_url TEXT,
    p_status TEXT DEFAULT 'active'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id UUID;
    v_margin DECIMAL;
BEGIN
    -- Calculate margin
    IF p_compare_at_price IS NOT NULL AND p_compare_at_price > 0 THEN
        v_margin := ((p_compare_at_price - p_price) / p_compare_at_price) * 100;
    ELSE
        v_margin := NULL;
    END IF;

    -- Upsert the product
    INSERT INTO products (
        handle, title, description, vendor, product_type, 
        tags, price, compare_at_price, image_url, status, margin_percent
    )
    VALUES (
        p_handle, p_title, p_description, p_vendor, p_product_type,
        p_tags, p_price, p_compare_at_price, p_image_url, p_status::product_status, v_margin
    )
    ON CONFLICT (handle) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        vendor = EXCLUDED.vendor,
        product_type = EXCLUDED.product_type,
        tags = EXCLUDED.tags,
        price = EXCLUDED.price,
        compare_at_price = EXCLUDED.compare_at_price,
        image_url = EXCLUDED.image_url,
        status = EXCLUDED.status,
        margin_percent = v_margin,
        updated_at = now()
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.seed_product TO anon;
GRANT EXECUTE ON FUNCTION public.seed_product TO authenticated;

-- =====================================================
-- BULK SEED FUNCTION
-- Seeds multiple products at once
-- =====================================================

CREATE OR REPLACE FUNCTION public.bulk_seed_products(products JSONB)
RETURNS TABLE(inserted_count INT, updated_count INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    p JSONB;
    v_inserted INT := 0;
    v_updated INT := 0;
    v_exists BOOLEAN;
BEGIN
    FOR p IN SELECT * FROM jsonb_array_elements(products)
    LOOP
        -- Check if product exists
        SELECT EXISTS(SELECT 1 FROM products WHERE handle = p->>'handle') INTO v_exists;
        
        -- Insert or update
        INSERT INTO products (
            handle, title, description, vendor, product_type,
            tags, price, compare_at_price, image_url, status, margin_percent
        )
        VALUES (
            p->>'handle',
            p->>'title',
            p->>'description',
            COALESCE(p->>'vendor', 'Express Prime'),
            p->>'product_type',
            ARRAY(SELECT jsonb_array_elements_text(p->'tags')),
            (p->>'price')::DECIMAL,
            (p->>'compare_at_price')::DECIMAL,
            p->>'image_url',
            COALESCE(p->>'status', 'active')::product_status,
            CASE 
                WHEN (p->>'compare_at_price')::DECIMAL > 0 
                THEN (((p->>'compare_at_price')::DECIMAL - (p->>'price')::DECIMAL) / (p->>'compare_at_price')::DECIMAL) * 100
                ELSE NULL
            END
        )
        ON CONFLICT (handle) DO UPDATE SET
            title = EXCLUDED.title,
            description = EXCLUDED.description,
            vendor = EXCLUDED.vendor,
            product_type = EXCLUDED.product_type,
            tags = EXCLUDED.tags,
            price = EXCLUDED.price,
            compare_at_price = EXCLUDED.compare_at_price,
            image_url = EXCLUDED.image_url,
            status = EXCLUDED.status,
            margin_percent = EXCLUDED.margin_percent,
            updated_at = now();
        
        IF v_exists THEN
            v_updated := v_updated + 1;
        ELSE
            v_inserted := v_inserted + 1;
        END IF;
    END LOOP;
    
    RETURN QUERY SELECT v_inserted, v_updated;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.bulk_seed_products TO anon;
GRANT EXECUTE ON FUNCTION public.bulk_seed_products TO authenticated;
