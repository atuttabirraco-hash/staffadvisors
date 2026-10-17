CREATE OR REPLACE FUNCTION public.renew_availability(p_id uuid)
 RETURNS TABLE (expires_at timestamptz)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.disponibilita WHERE id = p_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'not_allowed';
  END IF;
  -- Same window a brand new ad gets, kept in one place with disponibilita_set_dates.
  UPDATE public.disponibilita
     SET expires_at = now() + interval '15 days', is_active = true
   WHERE id = p_id;
  RETURN QUERY SELECT d.expires_at FROM public.disponibilita d WHERE d.id = p_id;
END
$function$;

GRANT EXECUTE ON FUNCTION public.renew_availability(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.renew_availability(uuid) TO service_role;