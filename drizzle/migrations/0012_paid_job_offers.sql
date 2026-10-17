ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS offer_price_cents integer NOT NULL DEFAULT 1900;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS offer_days integer NOT NULL DEFAULT 30;
ALTER TABLE public.job_offers ADD COLUMN IF NOT EXISTS poster_email text;
ALTER TABLE public.job_offers ADD COLUMN IF NOT EXISTS poster_company text;
ALTER TABLE public.job_offers ADD COLUMN IF NOT EXISTS paid_until timestamptz;
ALTER TABLE public.job_offers ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'free';
ALTER TABLE public.job_offers ADD COLUMN IF NOT EXISTS stripe_session_id text;
ALTER TABLE public.job_offers ADD COLUMN IF NOT EXISTS amount_cents integer;
REVOKE SELECT (poster_email, stripe_session_id) ON public.job_offers FROM anon, authenticated;