DROP POLICY IF EXISTS "Owner legge il proprio curriculum" ON storage.objects;
DROP POLICY IF EXISTS "Utenti registrati leggono i curriculum" ON storage.objects;
DROP POLICY IF EXISTS "Utenti caricano il proprio curriculum" ON storage.objects;
DROP POLICY IF EXISTS "Utenti aggiornano il proprio curriculum" ON storage.objects;
DROP POLICY IF EXISTS "Utenti cancellano il proprio curriculum" ON storage.objects;
COMMENT ON COLUMN public.disponibilita.cv_path IS 'DEPRECATED: curriculum uploads removed from StaffAdvisors.';