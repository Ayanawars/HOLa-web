CREATE OR REPLACE FUNCTION public.publish_technology_donations(p_week_start date, p_rows jsonb)
 RETURNS integer LANGUAGE plpgsql SET search_path TO 'public'
AS $function$
DECLARE n integer;
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS (
   SELECT 1 FROM public.admin_users a JOIN public.players p ON lower(p.name)=lower(a.display_name)
   WHERE a.user_id=auth.uid() AND upper(p.rank) IN ('R4','R5')
 ) THEN RAISE EXCEPTION 'Sin permiso R4/R5'; END IF;
 IF p_week_start IS NULL THEN RAISE EXCEPTION 'Selecciona una semana'; END IF;
 IF p_rows IS NULL OR jsonb_typeof(p_rows)<>'array' OR jsonb_array_length(p_rows)<7 THEN
   RAISE EXCEPTION 'Se necesitan al menos siete puestos'; END IF;
 SELECT count(*) INTO n FROM jsonb_to_recordset(p_rows) AS x(rank integer,player_name text,points bigint);
 IF n<>(SELECT count(DISTINCT x.rank) FROM jsonb_to_recordset(p_rows) AS x(rank integer)) OR
    n<>(SELECT count(DISTINCT x.player_name) FROM jsonb_to_recordset(p_rows) AS x(player_name text)) OR
    EXISTS(SELECT 1 FROM jsonb_to_recordset(p_rows) AS x(rank integer,player_name text,points bigint)
      WHERE x.rank<1 OR x.rank>n OR x.player_name IS NULL OR x.player_name='' OR x.points<0 OR x.points IS NULL)
 THEN RAISE EXCEPTION 'Clasificación inválida'; END IF;
 perform pg_advisory_xact_lock(hashtext('hola_donations_'||p_week_start::text));
 -- Reject stale or incomplete forms so additions never remove previously saved players.
 IF EXISTS(
   SELECT 1 FROM public.technology_donations d
   WHERE d.week_start=p_week_start AND NOT EXISTS(
     SELECT 1 FROM jsonb_to_recordset(p_rows) AS x(player_name text)
     WHERE x.player_name=d.player_name
   )
 ) THEN RAISE EXCEPTION 'Faltan jugadores ya guardados. Recarga esta semana y añade los nuevos sin quitar los anteriores.'; END IF;
 -- Replacement is atomic; a failed insert rolls back the deletion as well.
 DELETE FROM public.technology_donations WHERE week_start=p_week_start;
 INSERT INTO public.technology_donations(week_start,rank,player_name,points)
 SELECT p_week_start,x.rank,x.player_name,x.points FROM jsonb_to_recordset(p_rows) AS x(rank integer,player_name text,points bigint);
 RETURN n;
END $function$;