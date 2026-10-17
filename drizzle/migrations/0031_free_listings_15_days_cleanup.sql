CREATE OR REPLACE FUNCTION public.disponibilita_set_dates()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_at := now(); NEW.expires_at := now() + interval '15 days'; NEW.is_active := true;
  ELSE
    NEW.created_at := OLD.created_at; NEW.expires_at := OLD.expires_at; NEW.user_id := OLD.user_id;
    IF OLD.expires_at <= now() THEN NEW.is_active := false; END IF;
  END IF;
  RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION public.purge_expired_free_listings()
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.job_offer_messages m USING public.job_offers o
   WHERE m.offer_id = o.id AND o.payment_status = 'free' AND o.paid_until IS NOT NULL AND o.paid_until <= now();
  DELETE FROM public.job_offers WHERE payment_status = 'free' AND paid_until IS NOT NULL AND paid_until <= now();
  DELETE FROM public.disponibilita WHERE expires_at <= now();
END $function$;
REVOKE ALL ON FUNCTION public.purge_expired_free_listings() FROM PUBLIC, anon, authenticated;

CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('purge-expired-free-listings', '15 * * * *', 'SELECT public.purge_expired_free_listings()');