-- Allow a user to publish several availability listings (up to 5 currently active).
-- The old unique constraint forced one ad per user; the app now relies on the
-- check_disponibilita_limit trigger instead.
ALTER TABLE public.disponibilita DROP CONSTRAINT disponibilita_user_id_key;

CREATE OR REPLACE FUNCTION public.check_disponibilita_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF (SELECT count(*) FROM public.disponibilita
      WHERE user_id = NEW.user_id
        AND is_active = true
        AND expires_at > now()) >= 5 THEN
    RAISE EXCEPTION 'availability_limit_reached';
  END IF;
  RETURN NEW;
END
$function$;

DROP TRIGGER IF EXISTS disponibilita_limit ON public.disponibilita;
CREATE TRIGGER disponibilita_limit
BEFORE INSERT ON public.disponibilita
FOR EACH ROW EXECUTE FUNCTION public.check_disponibilita_limit();