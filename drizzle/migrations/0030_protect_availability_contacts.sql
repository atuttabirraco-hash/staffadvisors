REVOKE SELECT ON public.disponibilita FROM anon, authenticated;
GRANT SELECT (id, nome_visualizzato, mansione, zona, descrizione, created_at, expires_at, is_active) ON public.disponibilita TO anon, authenticated;
GRANT SELECT (user_id) ON public.disponibilita TO authenticated;
GRANT ALL ON public.disponibilita TO service_role;
CREATE INDEX IF NOT EXISTS disponibilita_active_mansione_zona_idx ON public.disponibilita (is_active, mansione, zona) WHERE is_active = true;
COMMENT ON COLUMN public.disponibilita.telefono IS 'Private contact detail revealed only through an authenticated server function.';
COMMENT ON COLUMN public.disponibilita.email_contatto IS 'Private contact detail revealed only through an authenticated server function.';