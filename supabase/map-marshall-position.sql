-- Editable Marshall position and five additional rows of empty player positions.
begin;
alter table public.alliance_map_config
 add column if not exists marshall_x integer not null default 195,
 add column if not exists marshall_y integer not null default 959;
alter table public.alliance_map_config add constraint alliance_map_marshall_bounds
 check (marshall_x between 180 and 270 and marshall_y between 915 and 998);
create or replace function public.check_alliance_map_marshall()
returns trigger language plpgsql set search_path='' as $$
begin
 if exists (select 1 from jsonb_array_elements(new.slots) s
 where nullif(trim(s->>'name'),'') is not null
 and abs((s->>'x')::integer-new.marshall_x)<3 and abs((s->>'y')::integer-new.marshall_y)<3)
 or (new.marshall_x+1.5>220.5 and new.marshall_x-1.5<229.5 and new.marshall_y+1.5>986.5 and new.marshall_y-1.5<995.5)
 or (new.marshall_x+1.5>218.5 and new.marshall_x-1.5<234.5 and new.marshall_y+1.5>971.5 and new.marshall_y-1.5<986.5)
 then raise exception 'El Marshall se solapa con un jugador asignado, el centro o la montaña'; end if;
 return new;
end; $$;
create trigger check_marshall before insert or update on public.alliance_map_config
for each row execute function public.check_alliance_map_marshall();
-- Serialize the controlled expansion and keep every existing slot unchanged.
lock table public.alliance_map_config in exclusive mode;
do $$ begin
 if (select jsonb_array_length(slots) from public.alliance_map_config where id=1)<>100
 then raise exception 'Expected 100 positions before adding five rows'; end if;
end $$;
-- The existing trigger deliberately rejects any slot count change.
-- Disable only that geometry trigger during this exact append, restoring it before commit.
alter table public.alliance_map_config disable trigger validate_map;
with extra as (
 select jsonb_agg(jsonb_build_object('id',100+(r-1)*13+col,'x',x,'y',959-r*5,'name',null) order by r,col) as slots
 from generate_series(1,5) r cross join unnest(array[195,200,205,210,215,219,224,229,233,238,243,248,253]) with ordinality a(x,col)
)
update public.alliance_map_config c set slots=c.slots||e.slots,revision=c.revision+1,updated_at=now() from extra e where c.id=1;
alter table public.alliance_map_config enable trigger validate_map;
commit;
