ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

GRANT INSERT ON public.reviews TO anon, authenticated;
CREATE POLICY "Anyone can submit reviews for moderation" ON public.reviews
  FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'pending_moderation' AND is_verified = false AND helpful_count = 0);
REVOKE UPDATE, DELETE ON public.reviews FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.companies, public.company_replies FROM anon, authenticated;

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email_hash text;
UPDATE public.users SET email_hash = encode(extensions.digest(lower(email), 'sha256'), 'hex') WHERE email IS NOT NULL AND email_hash IS NULL;
UPDATE public.users SET email = NULL WHERE email IS NOT NULL;
COMMENT ON COLUMN public.users.email IS 'DEPRECATED: plaintext email never stored; use email_hash (sha256)';
REVOKE ALL ON public.users FROM anon;
REVOKE SELECT ON public.users FROM authenticated;
GRANT SELECT (id, email_hash, created_at) ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;