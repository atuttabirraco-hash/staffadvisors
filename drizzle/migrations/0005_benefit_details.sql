ALTER TABLE public.reviews
  ADD COLUMN meal_frequency text CHECK (meal_frequency IN ('daily','some','no','unknown')),
  ADD COLUMN meal_value text CHECK (meal_value IN ('5','6','8','10+')),
  ADD COLUMN meal_provider text CHECK (meal_provider IN ('Ticket','Pellegrini','Day','Up','Sodexo','Altro')),
  ADD COLUMN welfare_answer text CHECK (welfare_answer IN ('yes','no','unknown')),
  ADD COLUMN welfare_items text[] NOT NULL DEFAULT '{}';
GRANT SELECT (meal_frequency, meal_value, meal_provider, welfare_answer, welfare_items) ON public.reviews TO anon, authenticated;
UPDATE public.reviews SET meal_frequency = CASE WHEN meal_vouchers THEN 'daily' WHEN meal_vouchers = false THEN 'no' END,
  welfare_answer = CASE WHEN welfare THEN 'yes' WHEN welfare = false THEN 'no' END;

ALTER TABLE public.companies
  ADD COLUMN meal_override boolean,
  ADD COLUMN welfare_override boolean,
  ADD COLUMN meal_value_override text,
  ADD COLUMN meal_provider_override text,
  ADD COLUMN welfare_items_override text[];

ALTER TABLE public.job_offers ADD COLUMN meal_vouchers boolean NOT NULL DEFAULT false;