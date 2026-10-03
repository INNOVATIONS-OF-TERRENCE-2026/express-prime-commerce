-- Security remediation: restore least-privilege access to products and seed RPCs.
-- This migration supersedes the permissive product seeding policy migration.

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow product inserts" ON public.products;
DROP POLICY IF EXISTS "Allow product updates" ON public.products;
DROP POLICY IF EXISTS "Allow product deletes" ON public.products;
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
DROP POLICY IF EXISTS "All roles can view products" ON public.products;
DROP POLICY IF EXISTS "Founders and admins can insert products" ON public.products;
DROP POLICY IF EXISTS "Founders and admins can update products" ON public.products;
DROP POLICY IF EXISTS "Founders and admins can delete products" ON public.products;

REVOKE ALL ON TABLE public.products FROM anon;
REVOKE ALL ON TABLE public.products FROM authenticated;

GRANT SELECT ON TABLE public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.products TO authenticated;

CREATE POLICY "Public can view active products"
  ON public.products
  FOR SELECT
  TO anon
  USING (status = 'active');

CREATE POLICY "Authenticated users can view products"
  ON public.products
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Founders and admins can insert products"
  ON public.products
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_founder() OR public.is_admin());

CREATE POLICY "Founders and admins can update products"
  ON public.products
  FOR UPDATE
  TO authenticated
  USING (public.is_founder() OR public.is_admin())
  WITH CHECK (public.is_founder() OR public.is_admin());

CREATE POLICY "Founders and admins can delete products"
  ON public.products
  FOR DELETE
  TO authenticated
  USING (public.is_founder() OR public.is_admin());

-- SECURITY DEFINER seed helpers must never be callable from public/client roles.
REVOKE EXECUTE ON FUNCTION public.seed_product(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT[], DECIMAL, DECIMAL, TEXT, TEXT
) FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.bulk_seed_products(JSONB)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.seed_product(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT[], DECIMAL, DECIMAL, TEXT, TEXT
) TO service_role;

GRANT EXECUTE ON FUNCTION public.bulk_seed_products(JSONB)
  TO service_role;
