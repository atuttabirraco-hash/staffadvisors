ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS offer_auto_publish boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS offer_price_mode text NOT NULL DEFAULT 'admin' CHECK (offer_price_mode IN ('admin','tiers')),
  ADD COLUMN IF NOT EXISTS offer_premium_price_cents integer NOT NULL DEFAULT 3900,
  ADD COLUMN IF NOT EXISTS offer_auto_expire boolean NOT NULL DEFAULT true;