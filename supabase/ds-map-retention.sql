-- Applied via ds_map_retention_infrastructure. The token lives encrypted in Vault.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
create table if not exists public.ds_map_cleanup_queue (
  path text primary key check (path ~ '^[a-f0-9]{64}\.(png|jpg|webp|gif)$'),
  queued_at timestamptz not null default now()
);
alter table public.ds_map_cleanup_queue enable row level security;
revoke all on public.ds_map_cleanup_queue from public,anon,authenticated;
grant all on public.ds_map_cleanup_queue to service_role;
-- Create ds_map_retention_token in Vault during setup; its SHA-256 is in the worker.
-- No plaintext token is stored in source control or the cron command.
select cron.schedule('ds-map-retention-7-days','15 * * * *',$job$
  select net.http_post(
    url:='https://ovybstpiomphrouvqxmf.supabase.co/functions/v1/expire-ds-maps',
    headers:=jsonb_build_object('Content-Type','application/json','x-retention-token',
      (select decrypted_secret from vault.decrypted_secrets where name='ds_map_retention_token')),
    body:='{}'::jsonb,timeout_milliseconds:=55000
  );
$job$);
