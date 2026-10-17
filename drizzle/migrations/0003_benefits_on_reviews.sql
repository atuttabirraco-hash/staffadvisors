ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS meal_vouchers boolean;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS welfare boolean;
GRANT SELECT (meal_vouchers, welfare) ON public.reviews TO anon, authenticated;
UPDATE public.reviews SET meal_vouchers = (score_salary >= 3), welfare = (score_environment >= 4) WHERE meal_vouchers IS NULL;
CREATE INDEX IF NOT EXISTS companies_name_idx ON public.companies (lower(name));