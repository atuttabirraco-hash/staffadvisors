ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS email_hash text;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS verified_via text;
CREATE INDEX IF NOT EXISTS reviews_email_company_idx ON public.reviews (email_hash, company_id, created_at);
REVOKE SELECT ON public.reviews FROM anon, authenticated;
GRANT SELECT (id, company_id, role, sector, contract_type, period_from, period_to, score_salary, score_shifts, score_management, score_growth, score_safety, score_environment, pro, cons, advice, is_anonymous, is_verified, verified_via, lang, helpful_count, status, created_at) ON public.reviews TO anon, authenticated;

CREATE TABLE public.review_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_hash text NOT NULL,
  code_hash text NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  used boolean NOT NULL DEFAULT false,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.review_otps TO service_role;
ALTER TABLE public.review_otps ENABLE ROW LEVEL SECURITY;
CREATE INDEX review_otps_email_idx ON public.review_otps (email_hash, created_at);