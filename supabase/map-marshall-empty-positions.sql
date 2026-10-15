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
