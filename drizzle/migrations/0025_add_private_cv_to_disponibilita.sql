ALTER TABLE public.disponibilita
  ADD COLUMN IF NOT EXISTS cv_path text;

COMMENT ON COLUMN public.disponibilita.cv_path IS 'Private Storage object path for an optional CV; downloadable only by authenticated users.';

CREATE POLICY "Utenti registrati leggono i curriculum"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'curriculum');

CREATE POLICY "Utenti caricano il proprio curriculum"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'curriculum'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Utenti aggiornano il proprio curriculum"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'curriculum'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'curriculum'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Utenti cancellano il proprio curriculum"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'curriculum'
  AND (storage.foldername(name))[1] = auth.uid()::text
);