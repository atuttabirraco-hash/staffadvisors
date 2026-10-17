ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS full_address text,
  ADD COLUMN IF NOT EXISTS place_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS parent_brand text,
  ADD COLUMN IF NOT EXISTS store_code text,
  ADD COLUMN IF NOT EXISTS is_headquarter boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS companies_brand_city_idx ON public.companies(parent_brand, city);
CREATE INDEX IF NOT EXISTS companies_brand_trgm ON public.companies USING gin (parent_brand gin_trgm_ops);