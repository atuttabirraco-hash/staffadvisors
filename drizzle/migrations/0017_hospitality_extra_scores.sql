ALTER TABLE public.reviews
  ADD COLUMN score_tips smallint CHECK (score_tips BETWEEN 0 AND 5),
  ADD COLUMN score_notice smallint CHECK (score_notice BETWEEN 0 AND 5),
  ADD COLUMN score_meal_lodging smallint CHECK (score_meal_lodging BETWEEN 0 AND 5),
  ADD COLUMN score_overtime smallint CHECK (score_overtime BETWEEN 0 AND 5);
COMMENT ON COLUMN public.reviews.score_tips IS 'Hospitality only: fair tips. 0 = not applicable, excluded from averages.';
COMMENT ON COLUMN public.reviews.score_notice IS 'Hospitality only: shifts communicated in advance. 0 = not applicable.';
COMMENT ON COLUMN public.reviews.score_meal_lodging IS 'Hospitality only: board and lodging. 0 = not applicable, excluded from averages.';
COMMENT ON COLUMN public.reviews.score_overtime IS 'Hospitality only: paid overtime. 0 = not applicable, excluded from averages.';