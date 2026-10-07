create table public.alliance_map_searches (
 id bigint generated always as identity primary key,
 slot_id integer not null,
 player_name text not null,
 searched_at timestamptz not null default now()
);
alter table public.alliance_map_searches enable row level security;
revoke all on public.alliance_map_searches from anon,authenticated;
grant insert(slot_id) on public.alliance_map_searches to anon,authenticated;
grant select on public.alliance_map_searches to authenticated;
grant usage on sequence public.alliance_map_searches_id_seq to anon,authenticated;
create policy map_search_insert on public.alliance_map_searches for insert to anon,authenticated with check(exists(select 1 from public.alliance_map_config c cross join lateral jsonb_array_elements(c.slots) s where (s->>'id')::integer=slot_id and nullif(trim(s->>'name'),'') is not null));
create policy map_search_admin_read on public.alliance_map_searches for select to authenticated using((select public.is_hola_r4_r5_admin()));
create function public.capture_alliance_map_search() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 select s->>'name' into new.player_name from public.alliance_map_config c cross join lateral jsonb_array_elements(c.slots) s where (s->>'id')::integer=new.slot_id;
 if nullif(trim(new.player_name),'') is null then raise exception 'Puesto sin jugador'; end if;
 new.searched_at=now();return new;
end; $$;
create trigger capture_map_search before insert on public.alliance_map_searches for each row execute function public.capture_alliance_map_search();
create index alliance_map_searches_name_time on public.alliance_map_searches(player_name,searched_at desc);
create view public.alliance_map_search_summary with (security_invoker=true) as select player_name,count(*) as searches,max(searched_at) as last_search from public.alliance_map_searches group by player_name;
revoke all on public.alliance_map_search_summary from anon,authenticated;
grant select on public.alliance_map_search_summary to authenticated;
