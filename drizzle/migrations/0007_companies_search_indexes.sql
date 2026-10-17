CREATE INDEX IF NOT EXISTS companies_region_idx ON public.companies(region);
CREATE INDEX IF NOT EXISTS companies_city_idx ON public.companies(city);
CREATE INDEX IF NOT EXISTS companies_province_idx ON public.companies(province);
CREATE INDEX IF NOT EXISTS companies_sector_idx ON public.companies(sector);
CREATE INDEX IF NOT EXISTS companies_name_idx ON public.companies(name);