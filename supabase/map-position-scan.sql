create table public.alliance_map_position_scan (
 id smallint primary key default 1 check(id=1),
 positions jsonb not null default '[]'::jsonb check(jsonb_typeof(positions)='array'),
 source text not null default 'https://lwatlas.com/es/',
 observed_at text,
 queried_at timestamptz,
 revision integer not null default 0
);
alter table public.alliance_map_position_scan enable row level security;
revoke all on public.alliance_map_position_scan from anon,authenticated;
grant select on public.alliance_map_position_scan to authenticated;
grant update(positions,source,observed_at,queried_at,revision) on public.alliance_map_position_scan to authenticated;
create policy officers_read_map_scan on public.alliance_map_position_scan for select to authenticated using((select public.is_hola_r4_r5_admin()));
create policy officers_update_map_scan on public.alliance_map_position_scan for update to authenticated using((select public.is_hola_r4_r5_admin())) with check((select public.is_hola_r4_r5_admin()));
insert into public.alliance_map_position_scan(id) values(1);
