-- Presence only: score magnitude never determines Arena participation.
create table public.arena_battles (
  id uuid primary key default gen_random_uuid(),
  battle_date date not null,
  title text not null default 'Guerras de arena' check (char_length(btrim(title)) between 1 and 120),
  created_at timestamptz not null default now(),
  unique (battle_date, title)
);
create index arena_battles_date_idx on public.arena_battles (battle_date desc);
create table public.arena_participation (
  battle_id uuid not null references public.arena_battles(id) on delete cascade,
  player_name text not null check (char_length(btrim(player_name)) between 1 and 200),
  source text not null default 'manual' check (source in ('ocr','manual')),
  recorded_at timestamptz not null default now(),
  primary key (battle_id, player_name)
);
-- Names are historical snapshots, so leaving the alliance never blocks deletion.
create index arena_participation_player_idx on public.arena_participation (player_name, battle_id);
alter table public.arena_battles enable row level security;
alter table public.arena_participation enable row level security;
revoke all on public.arena_battles, public.arena_participation from anon, authenticated;
grant select on public.arena_battles, public.arena_participation to anon, authenticated;
grant insert on public.arena_battles, public.arena_participation to authenticated;
grant delete on public.arena_participation to authenticated;
create policy arena_battles_read on public.arena_battles for select to anon, authenticated using (true);
create policy arena_battles_insert on public.arena_battles for insert to authenticated with check ((select public.is_hola_r4_r5_admin()));
create policy arena_participation_read on public.arena_participation for select to anon, authenticated using (true);
create policy arena_participation_insert on public.arena_participation for insert to authenticated with check ((select public.is_hola_r4_r5_admin()));
create policy arena_participation_delete on public.arena_participation for delete to authenticated using ((select public.is_hola_r4_r5_admin()));
comment on table public.arena_participation is 'Confirmed Arena War participation. Missing rows mean unconfirmed, never automatically absent. Points are intentionally not stored.';
