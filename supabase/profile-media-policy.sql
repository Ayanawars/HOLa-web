-- The profile-media bucket was created via the Storage API as public.
-- Avatars and DS maps are already shown on the public HOLa website.
-- Public object access does not grant object listing or upload permissions.
-- User survey/generator uploads run through their existing verified Edge Functions.
-- Officer uploads from the editor and DS panel use this restricted INSERT policy.
create policy officer_media_insert on storage.objects
for insert to authenticated
with check (bucket_id='profile-media' and (select public.is_hola_r4_r5_admin()));
