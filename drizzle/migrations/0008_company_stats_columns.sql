CREATE EXTENSION IF NOT EXISTS pg_trgm;
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS review_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS verified_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avg_score double precision NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS trend double precision NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS has_meal boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_welfare boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.refresh_company_stats(_cid uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE cut timestamptz := now() - interval '90 days';
BEGIN
  UPDATE public.companies c SET
    review_count = s.n, verified_count = s.v, avg_score = coalesce(s.a, 0),
    trend = CASE WHEN s.rn > 0 AND s.on_ > 0 THEN coalesce(s.ra,0) - coalesce(s.oa,0) ELSE 0 END,
    has_meal = coalesce(c.meal_override, s.mk > 0 AND s.my * 2 >= s.mk),
    has_welfare = coalesce(c.welfare_override, s.wk > 0 AND s.wy * 2 >= s.wk)
  FROM (
    SELECT count(*) n, count(*) FILTER (WHERE is_verified) v,
      sum(sc * w) / nullif(sum(w),0) a,
      count(*) FILTER (WHERE created_at >= cut) rn, count(*) FILTER (WHERE created_at < cut) on_,
      sum(sc*w) FILTER (WHERE created_at >= cut) / nullif(sum(w) FILTER (WHERE created_at >= cut),0) ra,
      sum(sc*w) FILTER (WHERE created_at < cut) / nullif(sum(w) FILTER (WHERE created_at < cut),0) oa,
      count(meal_vouchers) mk, count(*) FILTER (WHERE meal_vouchers) my,
      count(welfare) wk, count(*) FILTER (WHERE welfare) wy
    FROM (SELECT r.*, (score_salary+score_shifts+score_management+score_growth+score_safety+score_environment)/6.0 sc,
                 CASE WHEN is_verified THEN 3 ELSE 1 END w
          FROM public.reviews r WHERE company_id = _cid AND status = 'approved') x
  ) s WHERE c.id = _cid;
END $$;
REVOKE EXECUTE ON FUNCTION public.refresh_company_stats(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.reviews_stats_trg() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP <> 'INSERT' THEN PERFORM public.refresh_company_stats(OLD.company_id); END IF;
  IF TG_OP <> 'DELETE' THEN PERFORM public.refresh_company_stats(NEW.company_id); END IF;
  RETURN NULL;
END $$;
CREATE TRIGGER reviews_stats AFTER INSERT OR UPDATE OR DELETE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.reviews_stats_trg();

CREATE OR REPLACE FUNCTION public.companies_override_trg() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.meal_override IS DISTINCT FROM OLD.meal_override OR NEW.welfare_override IS DISTINCT FROM OLD.welfare_override THEN
    PERFORM public.refresh_company_stats(NEW.id);
  END IF;
  RETURN NULL;
END $$;
CREATE TRIGGER companies_override AFTER UPDATE OF meal_override, welfare_override ON public.companies FOR EACH ROW EXECUTE FUNCTION public.companies_override_trg();

SELECT public.refresh_company_stats(id) FROM public.companies WHERE id IN (SELECT DISTINCT company_id FROM public.reviews) OR meal_override IS NOT NULL OR welfare_override IS NOT NULL;

CREATE INDEX IF NOT EXISTS companies_region_city_sector_idx ON public.companies(region, city, sector);
CREATE INDEX IF NOT EXISTS companies_list_order_idx ON public.companies(review_count DESC, name);
CREATE INDEX IF NOT EXISTS companies_name_trgm ON public.companies USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS companies_city_trgm ON public.companies USING gin (city gin_trgm_ops);