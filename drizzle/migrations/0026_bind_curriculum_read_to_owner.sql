drop policy if exists "Utenti registrati leggono i curriculum" on storage.objects;
create policy "Owner legge il proprio curriculum"
on storage.objects for select to authenticated
using (bucket_id = 'curriculum' and (storage.foldername(name))[1] = (select auth.uid()::text));