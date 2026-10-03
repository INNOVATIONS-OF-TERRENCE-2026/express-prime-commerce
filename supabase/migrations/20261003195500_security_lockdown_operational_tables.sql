-- Security remediation: remove broad anonymous write access from operational tables.
-- Keeps public storefront collection reads while restricting all mutations to trusted roles.

-- ============================================================
-- COLLECTIONS
-- ============================================================
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view collections" ON public.collections;
DROP POLICY IF EXISTS "Allow collection inserts" ON public.collections;
DROP POLICY IF EXISTS "Allow collection updates" ON public.collections;
DROP POLICY IF EXISTS "Allow collection deletes" ON public.collections;
DROP POLICY IF EXISTS "All roles can view collections" ON public.collections;
DROP POLICY IF EXISTS "Founders and admins can manage collections" ON public.collections;

REVOKE ALL ON TABLE public.collections FROM anon;
REVOKE ALL ON TABLE public.collections FROM authenticated;

GRANT SELECT ON TABLE public.collections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.collections TO authenticated;

CREATE POLICY "Public can view collections"
  ON public.collections
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Authenticated users can view collections"
  ON public.collections
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Founders and admins can insert collections"
  ON public.collections
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_founder() OR public.is_admin());

CREATE POLICY "Founders and admins can update collections"
  ON public.collections
  FOR UPDATE
  TO authenticated
  USING (public.is_founder() OR public.is_admin())
  WITH CHECK (public.is_founder() OR public.is_admin());

CREATE POLICY "Founders and admins can delete collections"
  ON public.collections
  FOR DELETE
  TO authenticated
  USING (public.is_founder() OR public.is_admin());

-- ============================================================
-- PERFORMANCE METRICS
-- ============================================================
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view performance_metrics" ON public.performance_metrics;
DROP POLICY IF EXISTS "Allow performance_metrics inserts" ON public.performance_metrics;
DROP POLICY IF EXISTS "Allow performance_metrics updates" ON public.performance_metrics;
DROP POLICY IF EXISTS "All roles can view metrics" ON public.performance_metrics;
DROP POLICY IF EXISTS "Founders and admins can manage metrics" ON public.performance_metrics;

REVOKE ALL ON TABLE public.performance_metrics FROM anon;
REVOKE ALL ON TABLE public.performance_metrics FROM authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.performance_metrics TO authenticated;

CREATE POLICY "Elevated users can view performance metrics"
  ON public.performance_metrics
  FOR SELECT
  TO authenticated
  USING (public.has_any_role());

CREATE POLICY "Founders and admins can insert performance metrics"
  ON public.performance_metrics
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_founder() OR public.is_admin());

CREATE POLICY "Founders and admins can update performance metrics"
  ON public.performance_metrics
  FOR UPDATE
  TO authenticated
  USING (public.is_founder() OR public.is_admin())
  WITH CHECK (public.is_founder() OR public.is_admin());

CREATE POLICY "Founders and admins can delete performance metrics"
  ON public.performance_metrics
  FOR DELETE
  TO authenticated
  USING (public.is_founder() OR public.is_admin());

-- ============================================================
-- REALTIME ANALYTICS
-- ============================================================
ALTER TABLE public.realtime_analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous inserts" ON public.realtime_analytics;
DROP POLICY IF EXISTS "Allow authenticated inserts" ON public.realtime_analytics;
DROP POLICY IF EXISTS "Allow authenticated reads" ON public.realtime_analytics;
DROP POLICY IF EXISTS "realtime_analytics_anon_insert" ON public.realtime_analytics;
DROP POLICY IF EXISTS "realtime_analytics_auth_insert" ON public.realtime_analytics;
DROP POLICY IF EXISTS "realtime_analytics_auth_select" ON public.realtime_analytics;

REVOKE ALL ON TABLE public.realtime_analytics FROM anon;
REVOKE ALL ON TABLE public.realtime_analytics FROM authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.realtime_analytics TO authenticated;

CREATE POLICY "Elevated users can view realtime analytics"
  ON public.realtime_analytics
  FOR SELECT
  TO authenticated
  USING (public.has_any_role());

CREATE POLICY "Founders and admins can insert realtime analytics"
  ON public.realtime_analytics
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_founder() OR public.is_admin());

CREATE POLICY "Founders and admins can update realtime analytics"
  ON public.realtime_analytics
  FOR UPDATE
  TO authenticated
  USING (public.is_founder() OR public.is_admin())
  WITH CHECK (public.is_founder() OR public.is_admin());

CREATE POLICY "Founders and admins can delete realtime analytics"
  ON public.realtime_analytics
  FOR DELETE
  TO authenticated
  USING (public.is_founder() OR public.is_admin());

-- ============================================================
-- LIVE VISITORS
-- ============================================================
ALTER TABLE public.live_visitors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous upserts" ON public.live_visitors;
DROP POLICY IF EXISTS "Allow authenticated access" ON public.live_visitors;
DROP POLICY IF EXISTS "live_visitors_anon_all" ON public.live_visitors;
DROP POLICY IF EXISTS "live_visitors_auth_all" ON public.live_visitors;

REVOKE ALL ON TABLE public.live_visitors FROM anon;
REVOKE ALL ON TABLE public.live_visitors FROM authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.live_visitors TO authenticated;

CREATE POLICY "Elevated users can view live visitors"
  ON public.live_visitors
  FOR SELECT
  TO authenticated
  USING (public.has_any_role());

CREATE POLICY "Founders and admins can insert live visitors"
  ON public.live_visitors
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_founder() OR public.is_admin());

CREATE POLICY "Founders and admins can update live visitors"
  ON public.live_visitors
  FOR UPDATE
  TO authenticated
  USING (public.is_founder() OR public.is_admin())
  WITH CHECK (public.is_founder() OR public.is_admin());

CREATE POLICY "Founders and admins can delete live visitors"
  ON public.live_visitors
  FOR DELETE
  TO authenticated
  USING (public.is_founder() OR public.is_admin());

-- ============================================================
-- REALTIME ALERTS
-- ============================================================
ALTER TABLE public.realtime_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated access to alerts" ON public.realtime_alerts;
DROP POLICY IF EXISTS "realtime_alerts_auth_all" ON public.realtime_alerts;

REVOKE ALL ON TABLE public.realtime_alerts FROM anon;
REVOKE ALL ON TABLE public.realtime_alerts FROM authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.realtime_alerts TO authenticated;

CREATE POLICY "Elevated users can view realtime alerts"
  ON public.realtime_alerts
  FOR SELECT
  TO authenticated
  USING (public.has_any_role());

CREATE POLICY "Founders and admins can insert realtime alerts"
  ON public.realtime_alerts
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_founder() OR public.is_admin());

CREATE POLICY "Founders and admins can update realtime alerts"
  ON public.realtime_alerts
  FOR UPDATE
  TO authenticated
  USING (public.is_founder() OR public.is_admin())
  WITH CHECK (public.is_founder() OR public.is_admin());

CREATE POLICY "Founders and admins can delete realtime alerts"
  ON public.realtime_alerts
  FOR DELETE
  TO authenticated
  USING (public.is_founder() OR public.is_admin());

-- ============================================================
-- HELPER FUNCTION EXECUTION
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.get_live_metrics() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.track_analytics_event(
  TEXT, UUID, TEXT, TEXT, TEXT, DECIMAL, JSONB
) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.upsert_live_visitor(
  TEXT, TEXT, TEXT, TEXT, TEXT, DECIMAL, INTEGER
) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.get_live_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.track_analytics_event(
  TEXT, UUID, TEXT, TEXT, TEXT, DECIMAL, JSONB
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_live_visitor(
  TEXT, TEXT, TEXT, TEXT, TEXT, DECIMAL, INTEGER
) TO authenticated;
