ALTER TABLE public.job_offers
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent text,
  ADD COLUMN IF NOT EXISTS refunded_at timestamptz;
CREATE INDEX IF NOT EXISTS job_offers_user_idx ON public.job_offers(user_id);
CREATE INDEX IF NOT EXISTS job_offers_pi_idx ON public.job_offers(stripe_payment_intent);
REVOKE SELECT (user_id, stripe_payment_intent) ON public.job_offers FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_my_offers()
RETURNS TABLE(id uuid, title text, city text, poster_company text, is_active boolean, payment_status text, paid_until timestamptz, amount_cents integer, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT o.id, o.title, o.city, o.poster_company, o.is_active, o.payment_status, o.paid_until, o.amount_cents, o.created_at
    FROM public.job_offers o
   WHERE o.user_id = auth.uid() AND o.payment_status <> 'pending'
   ORDER BY o.created_at DESC
$$;

CREATE OR REPLACE FUNCTION public.close_my_offer(p_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v uuid;
BEGIN
  UPDATE public.job_offers SET is_active = false WHERE id = p_id AND user_id = auth.uid() RETURNING id INTO v;
  RETURN v IS NOT NULL;
END $$;

REVOKE ALL ON FUNCTION public.get_my_offers() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.close_my_offer(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_offers() TO authenticated;
GRANT EXECUTE ON FUNCTION public.close_my_offer(uuid) TO authenticated;