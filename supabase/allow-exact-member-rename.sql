CREATE OR REPLACE FUNCTION public.block_finalized_train_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare old_day date; new_day date; source_data boolean; rename_old text; rename_new text;
begin
 if TG_OP='UPDATE' then
  rename_old:=current_setting('hola.rename_old',true);rename_new:=current_setting('hola.rename_new',true);
  if nullif(rename_old,'') is not null and nullif(rename_new,'') is not null
   and not exists(select 1 from public.players where name=rename_old)
   and exists(select 1 from public.players where name=rename_new)
   and to_jsonb(new)=replace(to_jsonb(old)::text,to_jsonb(rename_old)::text,to_jsonb(rename_new)::text)::jsonb
  then return new; end if;
 end if;
 if TG_OP<>'INSERT' then old_day:=(to_jsonb(old)->>TG_ARGV[0])::date; end if;
 if TG_OP<>'DELETE' then new_day:=(to_jsonb(new)->>TG_ARGV[0])::date; end if;
 source_data:=TG_ARGV[1]='source';
 if exists(select 1 from public.train_saved_weeks w where
 (source_data and (old_day between w.source_week and w.source_week+6 or new_day between w.source_week and w.source_week+6))
 or (not source_data and (old_day between w.schedule_week and w.schedule_week+6 or new_day between w.schedule_week and w.schedule_week+6)))
 then raise exception 'Semana guardada y bloqueada: sus datos no se pueden modificar ni borrar.'; end if;
 if TG_OP='DELETE' then return old; end if;return new;
end $function$
