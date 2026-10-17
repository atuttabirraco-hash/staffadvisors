CREATE OR REPLACE FUNCTION public.disponibilita_set_dates()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_at := now(); NEW.expires_at := now() + interval '15 days'; NEW.is_active := true;
  ELSE
    NEW.created_at := OLD.created_at;
    NEW.user_id := OLD.user_id;
    -- An owner renewal sends an explicit later deadline: that one is honoured.
    -- Every other edit keeps the stored dates, so the window cannot be rewritten.
    IF NEW.expires_at > OLD.expires_at AND NEW.expires_at > now() THEN
      NEW.is_active := true;
    ELSE
      NEW.expires_at := OLD.expires_at;
      IF OLD.expires_at <= now() THEN NEW.is_active := false; END IF;
    END IF;
  END IF;
  RETURN NEW;
END
$function$;