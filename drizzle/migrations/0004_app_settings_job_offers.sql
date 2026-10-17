CREATE TABLE public.app_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  job_offers_enabled boolean NOT NULL DEFAULT false,
  adzuna_enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.app_settings TO anon, authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Settings are public" ON public.app_settings FOR SELECT TO anon, authenticated USING (true);
INSERT INTO public.app_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

CREATE TABLE public.job_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  city text,
  contract_type text,
  salary_range text,
  apply_link text,
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','adzuna')),
  is_premium boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX job_offers_company_idx ON public.job_offers(company_id);
GRANT SELECT ON public.job_offers TO anon, authenticated;
GRANT ALL ON public.job_offers TO service_role;
ALTER TABLE public.job_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active offers public when enabled" ON public.job_offers FOR SELECT TO anon, authenticated
USING (is_active AND EXISTS (SELECT 1 FROM public.app_settings s WHERE s.id = 1 AND s.job_offers_enabled));