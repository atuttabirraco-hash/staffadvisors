-- Own-review access without exposing reviews.user_id.
-- reviews.user_id has no SELECT grant for anon/authenticated on purpose (anonymity),
-- and DELETE was never granted to authenticated, so the two ownership policies below
-- could never actually run and the account page failed with "permission denied".
-- Own-review reads and deletes now go through SECURITY DEFINER functions that filter
-- by auth.uid() themselves.

DROP POLICY IF EXISTS "Users read own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users delete own reviews" ON public.reviews;

CREATE OR REPLACE FUNCTION public.get_my_reviews()
RETURNS TABLE (
  id uuid,
  company_id uuid,
  role text,
  contract_type text,
  period_from date,
  period_to date,
  pro text,
  cons text,
  advice text,
  is_verified boolean,
  status text,
  helpful_count integer,
  created_at timestamptz,
  company_name text,
  company_city text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.id, r.company_id, r.role, r.contract_type, r.period_from, r.period_to,
         r.pro, r.cons, r.advice, r.is_verified, r.status, r.helpful_count, r.created_at,
         c.name, c.city
    FROM public.reviews r
    LEFT JOIN public.companies c ON c.id = r.company_id
   WHERE r.user_id = auth.uid()
   ORDER BY r.created_at DESC
$$;

CREATE OR REPLACE FUNCTION public.delete_my_review(p_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_deleted uuid;
BEGIN
  DELETE FROM public.reviews r
   WHERE r.id = p_id AND r.user_id = auth.uid()
  RETURNING r.id INTO v_deleted;
  RETURN v_deleted IS NOT NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.get_my_reviews() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.delete_my_review(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_reviews() TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_my_review(uuid) TO authenticated;

COMMENT ON FUNCTION public.get_my_reviews() IS 'Reviews of auth.uid(); SECURITY DEFINER so reviews.user_id stays unreadable to anon/authenticated.';
COMMENT ON FUNCTION public.delete_my_review(uuid) IS 'Deletes a review only when its user_id = auth.uid().';