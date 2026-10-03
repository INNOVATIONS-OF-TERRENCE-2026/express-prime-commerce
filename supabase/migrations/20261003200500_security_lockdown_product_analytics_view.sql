-- Security remediation for the product analytics view.
ALTER VIEW public.product_analytics SET (security_invoker = true);
REVOKE ALL ON public.product_analytics FROM PUBLIC, anon;
GRANT SELECT ON public.product_analytics TO authenticated;
