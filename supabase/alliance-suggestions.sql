create table public.alliance_suggestions (
  id uuid primary key default gen_random_uuid(),
  author_name text,
  message text not null,
  created_at timestamptz not null default now(),
  reviewed boolean not null default false,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  constraint suggestion_author_length check (author_name is null or char_length(btrim(author_name)) between 1 and 80),
  constraint suggestion_message_length check (char_length(btrim(message)) between 10 and 2000)
);
alter table public.alliance_suggestions enable row level security;
-- Public submissions cannot choose review state or timestamps.
revoke all on public.alliance_suggestions from public, anon, authenticated;
grant insert (id,author_name,message) on public.alliance_suggestions to anon,authenticated;
grant select on public.alliance_suggestions to authenticated;
grant update (reviewed) on public.alliance_suggestions to authenticated;
create policy "Submit suggestions" on public.alliance_suggestions for insert to anon,authenticated
  with check (reviewed=false and reviewed_at is null and reviewed_by is null);
create policy "Officers read suggestions" on public.alliance_suggestions for select to authenticated
  using ((select public.is_hola_r4_r5_admin()));
create policy "Officers review suggestions" on public.alliance_suggestions for update to authenticated
  using ((select public.is_hola_r4_r5_admin()))
  with check ((select public.is_hola_r4_r5_admin()));
create index alliance_suggestions_status_date_idx on public.alliance_suggestions(reviewed,created_at desc);
create index alliance_suggestions_date_idx on public.alliance_suggestions(created_at desc);
create function public.stamp_suggestion_review() returns trigger language plpgsql security invoker set search_path=public as $$
begin
  if new.reviewed is distinct from old.reviewed then
    new.reviewed_at=case when new.reviewed then now() else null end;
    new.reviewed_by=case when new.reviewed then auth.uid() else null end;
  end if;
  return new;
end;
$$;
revoke all on function public.stamp_suggestion_review() from public,anon,authenticated;
create trigger stamp_suggestion_review before update of reviewed on public.alliance_suggestions
  for each row execute function public.stamp_suggestion_review();
notify pgrst,'reload schema';

alter table public.alliance_suggestions alter column author_name set not null;
create function public.validate_suggestion_member() returns trigger language plpgsql security invoker set search_path=public as $$
begin
 if not exists(select 1 from public.players where name=new.author_name) then
   raise exception 'Selecciona un miembro actual de HOLa' using errcode='23514';
 end if;
 return new;
end;
$$;
revoke all on function public.validate_suggestion_member() from public,anon,authenticated;
create trigger validate_suggestion_member before insert on public.alliance_suggestions
 for each row execute function public.validate_suggestion_member();
notify pgrst,'reload schema';