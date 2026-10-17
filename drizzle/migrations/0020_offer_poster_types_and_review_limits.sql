ALTER TABLE public.job_offers
  ADD COLUMN poster_type text NOT NULL DEFAULT 'private',
  ADD COLUMN description text,
  ADD COLUMN salary_min integer,
  ADD COLUMN salary_max integer,
  ADD COLUMN salary_visible boolean NOT NULL DEFAULT true,
  ADD COLUMN positions integer NOT NULL DEFAULT 1,
  ADD COLUMN agency_name text,
  ADD COLUMN agency_auth_code text,
  ADD COLUMN client_anonymous boolean NOT NULL DEFAULT false,
  ADD COLUMN moderation_status text NOT NULL DEFAULT 'approved';

ALTER TABLE public.app_settings
  ADD COLUMN offer_publish_mode text NOT NULL DEFAULT 'auto';

ALTER TABLE public.reviews
  ADD COLUMN device_hash text;

COMMENT ON TABLE public.review_otps IS 'DEPRECATED: email OTP verification removed; registered users are verified via account.';

DROP POLICY IF EXISTS "Active offers public when enabled" ON public.job_offers;
CREATE POLICY "Active offers public when enabled" ON public.job_offers
  FOR SELECT TO anon, authenticated
  USING (is_active AND moderation_status = 'approved' AND (EXISTS (SELECT 1 FROM app_settings s WHERE s.id = 1 AND s.job_offers_enabled)));

CREATE INDEX reviews_device_hash_idx ON public.reviews (device_hash, created_at);