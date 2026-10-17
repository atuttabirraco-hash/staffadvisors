ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS reviews_require_login boolean NOT NULL DEFAULT true;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS reviews_deletable boolean NOT NULL DEFAULT true;
CREATE OR REPLACE FUNCTION public.delete_my_review(p_id uuid)
 RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_deleted uuid;
BEGIN
  IF NOT coalesce((SELECT reviews_deletable FROM public.app_settings WHERE id = 1), true) THEN RETURN false; END IF;
  DELETE FROM public.reviews r WHERE r.id = p_id AND r.user_id = auth.uid() RETURNING r.id INTO v_deleted;
  RETURN v_deleted IS NOT NULL;
END $$;