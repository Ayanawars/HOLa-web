create table public.alliance_map_position_reviews (
 player_name text primary key check (length(btrim(player_name)) between 1 and 200),
 assigned_x integer not null check (assigned_x between 0 and 999),
 assigned_y integer not null check (assigned_y between 0 and 999),
 source_queried_at timestamptz,
 verified_at timestamptz not null default now(),
 verified_by uuid not null default auth.uid()
);
alter table public.alliance_map_position_reviews enable row level security;
revoke all on public.alliance_map_position_reviews from anon;
grant select,insert,update,delete on public.alliance_map_position_reviews to authenticated;
create policy position_reviews_read on public.alliance_map_position_reviews for select to authenticated using ((select public.is_hola_r4_r5_admin()));
create policy position_reviews_insert on public.alliance_map_position_reviews for insert to authenticated with check ((select public.is_hola_r4_r5_admin()) and verified_by=(select auth.uid()));
create policy position_reviews_update on public.alliance_map_position_reviews for update to authenticated using ((select public.is_hola_r4_r5_admin())) with check ((select public.is_hola_r4_r5_admin()) and verified_by=(select auth.uid()));
create policy position_reviews_delete on public.alliance_map_position_reviews for delete to authenticated using ((select public.is_hola_r4_r5_admin()));
comment on table public.alliance_map_position_reviews is 'Officer verification at an assigned map position, valid only for this position and source query. Does not replace source coordinates.';
