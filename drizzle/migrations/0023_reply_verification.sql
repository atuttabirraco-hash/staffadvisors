-- Company replies can now be verified automatically against the company's own email domain.
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS website_domain text;
ALTER TABLE public.company_replies ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false;