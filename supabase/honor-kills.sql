create table public.honor_kills (
 id smallint primary key default 1 check (id = 1),
 players jsonb not null default '[]'::jsonb check (jsonb_typeof(players) = 'array'),
 updated_on date not null,
 source text not null default '',
 revision integer not null default 0 check (revision >= 0),
 updated_at timestamptz not null default now()
);
alter table public.honor_kills enable row level security;
revoke all on public.honor_kills from anon, authenticated;
grant select on public.honor_kills to anon, authenticated;
grant update (players, updated_on, source, revision, updated_at) on public.honor_kills to authenticated;
create policy "Public can read honor kills" on public.honor_kills for select to anon, authenticated using (true);
create policy "Officers can update honor kills" on public.honor_kills for update to authenticated
 using ((select public.is_hola_r4_r5_admin())) with check ((select public.is_hola_r4_r5_admin()));
insert into public.honor_kills (id,players,updated_on,source) values
(1,'[{"name":"Judéx ᓚᘏᗢ","kills":18661869},{"name":"JEBRAW ᓚᘏᗢ","kills":17490865},{"name":"Sabie tárás","kills":8604652},{"name":"Xarnyx","kills":7755465},{"name":"jack daniels g","kills":7689031},{"name":"SilentBG","kills":7641052},{"name":"Laz Ziyaaa ᓚᘏᗢ","kills":7527423},{"name":"atEr","kills":7129932},{"name":"Rey Excalibur","kills":6740294},{"name":"dAndrei20","kills":5900912}]'::jsonb,'2026-10-03','https://lastintel.io/alliances/VP7xiGc6fADBcd173QLUEQ');

