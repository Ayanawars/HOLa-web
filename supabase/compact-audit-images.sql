-- Applied via Supabase migration compact_audit_image_payloads.

create or replace function private.compact_audit_images(payload jsonb)
returns jsonb language plpgsql immutable set search_path = '' as $$
declare field text; value text; result jsonb := payload;
begin
 if payload is null then return null; end if;
 foreach field in array array['avatar','uploaded_avatar','hola_avatar','map_data_url'] loop
  value := payload->>field;
  if value like 'data:image/%' then
   result := pg_catalog.jsonb_set(result, array[field],
    pg_catalog.to_jsonb('[image omitted; md5=' || pg_catalog.md5(value) || '; chars=' || pg_catalog.length(value)::text || ']'));
  end if;
 end loop;
 return result;
end; $$;
revoke all on function private.compact_audit_images(jsonb) from public;
create or replace function private.compact_admin_audit_images()
returns trigger language plpgsql set search_path = '' as $$
begin
 new.old_data := private.compact_audit_images(new.old_data);
 new.new_data := private.compact_audit_images(new.new_data);
 return new;
end; $$;
revoke all on function private.compact_admin_audit_images() from public;
create trigger compact_audit_images before insert or update of old_data,new_data on public.admin_audit_log
for each row execute function private.compact_admin_audit_images();

-- Maintenance: compact existing payloads without deleting audit entries.
update public.admin_audit_log
set old_data=private.compact_audit_images(old_data), new_data=private.compact_audit_images(new_data)
where old_data is distinct from private.compact_audit_images(old_data)
   or new_data is distinct from private.compact_audit_images(new_data);
-- Run separately, outside a transaction, to reclaim disk space:
-- vacuum full public.admin_audit_log;

