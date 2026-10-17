ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS bacheca_enabled boolean NOT NULL DEFAULT false;

CREATE TABLE public.disponibilita (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  nome_visualizzato text NOT NULL CHECK (char_length(nome_visualizzato) BETWEEN 2 AND 60),
  mansione text NOT NULL CHECK (char_length(mansione) BETWEEN 2 AND 80),
  zona text NOT NULL CHECK (char_length(zona) BETWEEN 2 AND 80),
  descrizione text NOT NULL DEFAULT '' CHECK (char_length(descrizione) <= 200),
  telefono text CHECK (telefono IS NULL OR char_length(telefono) <= 30),
  email_contatto text CHECK (email_contatto IS NULL OR char_length(email_contatto) <= 200),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  is_active boolean NOT NULL DEFAULT true
);

GRANT SELECT ON public.disponibilita TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.disponibilita TO authenticated;
GRANT ALL ON public.disponibilita TO service_role;
ALTER TABLE public.disponibilita ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pubblico legge annunci attivi" ON public.disponibilita FOR SELECT TO anon, authenticated
  USING (is_active AND expires_at > now() AND EXISTS (SELECT 1 FROM public.app_settings s WHERE s.id = 1 AND s.bacheca_enabled));
CREATE POLICY "Owner legge il suo" ON public.disponibilita FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Owner inserisce" ON public.disponibilita FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Owner aggiorna" ON public.disponibilita FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Owner cancella" ON public.disponibilita FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.disponibilita_set_dates() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_at := now(); NEW.expires_at := now() + interval '30 days'; NEW.is_active := true;
  ELSE
    NEW.created_at := OLD.created_at; NEW.expires_at := OLD.expires_at; NEW.user_id := OLD.user_id;
    IF OLD.expires_at <= now() THEN NEW.is_active := false; END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER disponibilita_dates BEFORE INSERT OR UPDATE ON public.disponibilita FOR EACH ROW EXECUTE FUNCTION public.disponibilita_set_dates();

CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('disattiva-disponibilita-scadute', '0 3 * * *', $$UPDATE public.disponibilita SET is_active = false WHERE is_active AND expires_at <= now()$$);