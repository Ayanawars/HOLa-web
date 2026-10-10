create table public.upcoming_events_visibility (
 id integer primary key default 1 check (id = 1),
 enabled boolean not null default true,
 updated_at timestamptz not null default now()
);
insert into public.upcoming_events_visibility(id,enabled) values (1,true);
alter table public.upcoming_events_visibility enable row level security;
revoke all on public.upcoming_events_visibility from anon, authenticated;
grant select on public.upcoming_events_visibility to anon, authenticated;
grant update on public.upcoming_events_visibility to authenticated;
create policy upcoming_events_visibility_read on public.upcoming_events_visibility for select to anon, authenticated using (true);
create policy upcoming_events_visibility_admin_update on public.upcoming_events_visibility for update to authenticated using ((select public.is_hola_r4_r5_admin())) with check ((select public.is_hola_r4_r5_admin()));
