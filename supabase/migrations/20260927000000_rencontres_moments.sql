-- ─────────────────────────────────────────────────────────────────────────────
-- PinLove — Mode Rencontres · Lot 3 : matching & moments
--
-- À exécuter dans le SQL Editor Supabase APRÈS 20260926000000_rencontres.sql.
-- Rejouable (create or replace, planification pg_cron idempotente).
--
-- Toutes les lectures « entre utilisateurs » passent par ces fonctions
-- security definer : elles ne renvoient jamais la liste complète des lieux
-- d'un autre, seulement les lieux ouverts en commun.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Fonctions internes (non appelables par les clients) ─────────────────────

-- Profil Rencontres actif (activé + principes acceptés), ou rien.
create or replace function public._rencontre_active_profile(p_user uuid)
returns public.rencontre_profiles
language sql stable security definer set search_path = public as $$
  select * from public.rencontre_profiles
  where user_id = p_user and enabled and principles_accepted_at is not null;
$$;

-- Un signalement, dans un sens ou dans l'autre, sépare définitivement deux
-- personnes (sans que la personne signalée le sache).
create or replace function public._rencontre_blocked(p_a uuid, p_b uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.reports
    where (reporter_id = p_a and reported_user_id = p_b)
       or (reporter_id = p_b and reported_user_id = p_a)
  );
$$;

-- Lieux ouverts communs à A et B, vus depuis A (nom du lieu chez A), avec
-- les deux « pourquoi » et le poids de chaque lieu dans le score :
--   1 / ln(2 + nb d'utilisateurs actifs ayant ce lieu ouvert)  (rareté)
--   × 1,5 si les deux ont écrit un « pourquoi ».
create or replace function public._rencontre_common_places(p_a uuid, p_b uuid)
returns jsonb
language sql stable security definer set search_path = public as $$
  with a as (
    select distinct on (place_key) place_key, name, why_text
    from public.places
    where user_id = p_a and rencontre_open
    order by place_key, updated_at desc
  ),
  b as (
    select distinct on (place_key) place_key, why_text
    from public.places
    where user_id = p_b and rencontre_open
    order by place_key, updated_at desc
  ),
  common as (
    select
      a.place_key, a.name, a.why_text as my_why, b.why_text as their_why,
      (1.0 / ln(2 + (
        select count(distinct p.user_id)
        from public.places p
        join public.rencontre_profiles rp on rp.user_id = p.user_id and rp.enabled
        where p.place_key = a.place_key and p.rencontre_open
      ))) * case when a.why_text is not null and b.why_text is not null then 1.5 else 1 end as weight
    from a join b using (place_key)
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'place_key',  place_key,
    'place_name', name,
    'my_why',     my_why,
    'their_why',  their_why,
    'weight',     round(weight::numeric, 4)
  ) order by weight desc), '[]'::jsonb)
  from common;
$$;

-- Le moment est-il visible dans le fil de p_viewer ? (moment ouvert non
-- expiré, même intention, lieu ouvert chez le viewer, deux profils actifs,
-- aucun signalement entre eux)
create or replace function public._rencontre_moment_visible(p_moment public.moments, p_viewer uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select p_moment.status = 'open'
    and p_moment.expires_at > now()
    and p_moment.creator_id <> p_viewer
    and exists (
      select 1 from public.rencontre_profiles v
      where v.user_id = p_viewer and v.enabled and v.principles_accepted_at is not null
        and v.intention = p_moment.intention
    )
    and exists (
      select 1 from public.rencontre_profiles c
      where c.user_id = p_moment.creator_id and c.enabled
    )
    and exists (
      select 1 from public.places
      where user_id = p_viewer and rencontre_open and place_key = p_moment.place_key
    )
    and not public._rencontre_blocked(p_viewer, p_moment.creator_id);
$$;

-- ── Suggestions de personnes ────────────────────────────────────────────────
-- Profils actifs de même intention ayant au moins un lieu ouvert en commun,
-- triés par score. Ni identifiant, ni photo : prénom + lieux communs.

create or replace function public.rencontre_suggestions(p_limit integer default 20)
returns table (first_name text, intention public.rencontre_intention, score numeric, common_places jsonb)
language plpgsql stable security definer set search_path = public as $$
declare
  me public.rencontre_profiles;
begin
  me := public._rencontre_active_profile(auth.uid());
  if me.user_id is null then return; end if;

  return query
  with candidates as (
    select distinct p.user_id
    from public.places p
    where p.rencontre_open
      and p.user_id <> me.user_id
      and p.place_key in (select place_key from public.places where user_id = me.user_id and rencontre_open)
  )
  select rp.first_name, rp.intention, s.score, cp.places
  from candidates c
  join public.rencontre_profiles rp
    on rp.user_id = c.user_id and rp.enabled and rp.principles_accepted_at is not null
   and rp.intention = me.intention
  cross join lateral (select public._rencontre_common_places(me.user_id, c.user_id) as places) cp
  cross join lateral (
    select coalesce(sum((e->>'weight')::numeric), 0) as score from jsonb_array_elements(cp.places) e
  ) s
  where not public._rencontre_blocked(me.user_id, c.user_id)
  order by s.score desc
  limit least(greatest(p_limit, 1), 50);
end;
$$;

-- ── Création d'un moment ─────────────────────────────────────────────────────
-- Depuis un de ses lieux ouverts ; 2 à 3 créneaux entre H+3 et J+30.

create or replace function public.create_moment(
  p_place_id     uuid,
  p_title        text,
  p_slots        timestamptz[],
  p_duration_min integer default 60
)
returns uuid
language plpgsql volatile security definer set search_path = public as $$
declare
  me       public.rencontre_profiles;
  pl       public.places;
  slots    timestamptz[];
  new_id   uuid;
begin
  me := public._rencontre_active_profile(auth.uid());
  if me.user_id is null then
    raise exception 'Active le mode Rencontres pour proposer un moment.';
  end if;

  select * into pl from public.places
  where id = p_place_id and user_id = me.user_id and rencontre_open and place_key is not null;
  if not found then
    raise exception 'Ce lieu n’est pas ouvert aux rencontres.';
  end if;

  if p_title is null or char_length(btrim(p_title)) not between 1 and 80 then
    raise exception 'Donne un titre au moment (80 caractères maximum).';
  end if;

  select array_agg(distinct s order by s) into slots from unnest(p_slots) s;
  if coalesce(array_length(slots, 1), 0) not between 2 and 3 then
    raise exception 'Propose 2 ou 3 créneaux différents.';
  end if;
  if exists (select 1 from unnest(slots) s where s < now() + interval '3 hours' or s > now() + interval '30 days') then
    raise exception 'Les créneaux doivent être entre dans 3 heures et dans 30 jours.';
  end if;

  insert into public.moments (
    creator_id, source_place_id, place_key, place_name, place_address,
    latitude, longitude, intention, title, duration_min, proposed_slots
  ) values (
    me.user_id, pl.id, pl.place_key, pl.name,
    nullif(concat_ws(', ', pl.address, pl.city), ''),
    pl.latitude, pl.longitude, me.intention, btrim(p_title),
    coalesce(p_duration_min, 60), to_jsonb(slots)
  )
  returning id into new_id;

  insert into public.moment_participants (moment_id, user_id, role, accepted_at)
  values (new_id, me.user_id, 'creator', now());

  return new_id;
end;
$$;

-- ── Fil « Moments dans tes lieux » ──────────────────────────────────────────

create or replace function public.moments_feed()
returns table (
  id                 uuid,
  title              text,
  place_key          text,
  place_name         text,
  place_address      text,
  duration_min       integer,
  proposed_slots     jsonb,
  expires_at         timestamptz,
  payment_rule       text,
  intention          public.rencontre_intention,
  creator_first_name text,
  creator_why        text,
  common_places      jsonb,
  score              numeric,
  my_chosen_slot     timestamptz,
  created_at         timestamptz
)
language sql stable security definer set search_path = public as $$
  select
    m.id, m.title, m.place_key, m.place_name, m.place_address, m.duration_min,
    m.proposed_slots, m.expires_at, m.payment_rule, m.intention,
    c.first_name,
    (select why_text from public.places where id = m.source_place_id),
    cp.places,
    (select coalesce(sum((e->>'weight')::numeric), 0) from jsonb_array_elements(cp.places) e),
    mp.chosen_slot,
    m.created_at
  from public.moments m
  join public.rencontre_profiles c on c.user_id = m.creator_id
  cross join lateral (select public._rencontre_common_places(auth.uid(), m.creator_id) as places) cp
  left join public.moment_participants mp on mp.moment_id = m.id and mp.user_id = auth.uid()
  where m.status = 'open'
    and public._rencontre_moment_visible(m, auth.uid())
  order by 14 desc, m.created_at desc
  limit 50;
$$;

-- ── Détail d'un moment ───────────────────────────────────────────────────────
-- Accessible au créateur, aux participants, et aux personnes à qui le moment
-- apparaît dans le fil. Avant double acceptation : jamais de photo.

create or replace function public.get_moment(p_moment_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  m       public.moments;
  me      uuid := auth.uid();
  mine    public.moment_participants;
  creator public.rencontre_profiles;
begin
  select * into m from public.moments where id = p_moment_id;
  if not found then return null; end if;

  select * into mine from public.moment_participants where moment_id = m.id and user_id = me;
  if mine.user_id is null and not public._rencontre_moment_visible(m, me) then
    return null;
  end if;

  select * into creator from public.rencontre_profiles where user_id = m.creator_id;

  return jsonb_build_object(
    'id',                 m.id,
    'title',              m.title,
    'status',             case when m.status = 'open' and m.expires_at <= now() then 'expired' else m.status::text end,
    'place_key',          m.place_key,
    'place_name',         m.place_name,
    'place_address',      m.place_address,
    'latitude',           m.latitude,
    'longitude',          m.longitude,
    'duration_min',       m.duration_min,
    'proposed_slots',     m.proposed_slots,
    'scheduled_at',       m.scheduled_at,
    'expires_at',         m.expires_at,
    'payment_rule',       m.payment_rule,
    'intention',          m.intention,
    'created_at',         m.created_at,
    'my_role',            mine.role,
    'my_chosen_slot',     mine.chosen_slot,
    'creator_first_name', creator.first_name,
    'creator_why',        (select why_text from public.places where id = m.source_place_id),
    'common_places',      case when m.creator_id = me then '[]'::jsonb
                               else public._rencontre_common_places(me, m.creator_id) end,
    -- Pour le créateur : nombre de demandes reçues (leur validation : lot 4).
    'request_count',      case when m.creator_id = me then (
                            select count(*) from public.moment_participants
                            where moment_id = m.id and role = 'guest'
                          ) end
  );
end;
$$;

-- ── Demande : l'invité choisit un créneau ───────────────────────────────────

create or replace function public.request_moment_slot(p_moment_id uuid, p_slot timestamptz)
returns void
language plpgsql volatile security definer set search_path = public as $$
declare
  m     public.moments;
  me    uuid := auth.uid();
  first boolean;
begin
  select * into m from public.moments where id = p_moment_id for update;
  if not found or not public._rencontre_moment_visible(m, me) then
    raise exception 'Ce moment n’est plus disponible.';
  end if;

  if not exists (
    select 1 from jsonb_array_elements_text(m.proposed_slots) s where s::timestamptz = p_slot
  ) then
    raise exception 'Ce créneau ne fait pas partie des propositions.';
  end if;
  if p_slot < now() + interval '1 hour' then
    raise exception 'Ce créneau est trop proche, choisis-en un autre.';
  end if;

  first := not exists (select 1 from public.moment_participants where moment_id = m.id and user_id = me);

  insert into public.moment_participants (moment_id, user_id, role, accepted_at, chosen_slot)
  values (m.id, me, 'guest', now(), p_slot)
  on conflict (moment_id, user_id) do update
    set chosen_slot = excluded.chosen_slot, accepted_at = excluded.accepted_at;

  if first then
    insert into public.notifications (user_id, type, moment_id, payload)
    values (m.creator_id, 'moment_request', m.id, jsonb_build_object('title', m.title, 'place_name', m.place_name));
  end if;
end;
$$;

-- Retirer sa demande (tant que le moment est ouvert). Rien n'est notifié.
create or replace function public.withdraw_moment_request(p_moment_id uuid)
returns void
language plpgsql volatile security definer set search_path = public as $$
begin
  delete from public.moment_participants mp
  using public.moments m
  where mp.moment_id = p_moment_id and mp.user_id = auth.uid() and mp.role = 'guest'
    and m.id = mp.moment_id and m.status = 'open';
end;
$$;

-- ── Expiration ───────────────────────────────────────────────────────────────
-- Sans double acceptation sous 48 h (ou quand tous les créneaux sont passés),
-- le moment expire. Aucune notification : pas de rejet visible.

create or replace function public.expire_moments()
returns integer
language plpgsql volatile security definer set search_path = public as $$
declare
  n integer;
begin
  update public.moments m
  set status = 'expired'
  where m.status = 'open'
    and (
      m.expires_at <= now()
      or not exists (
        select 1 from jsonb_array_elements_text(m.proposed_slots) s
        where s::timestamptz > now() + interval '1 hour'
      )
    );
  get diagnostics n = row_count;
  return n;
end;
$$;

-- ── Droits ───────────────────────────────────────────────────────────────────

revoke all on function public._rencontre_active_profile(uuid)                     from public, anon, authenticated;
revoke all on function public._rencontre_blocked(uuid, uuid)                      from public, anon, authenticated;
revoke all on function public._rencontre_common_places(uuid, uuid)                from public, anon, authenticated;
revoke all on function public._rencontre_moment_visible(public.moments, uuid)     from public, anon, authenticated;
revoke all on function public.expire_moments()                                    from public, anon, authenticated;

revoke all on function public.rencontre_suggestions(integer)                      from public, anon;
revoke all on function public.create_moment(uuid, text, timestamptz[], integer)   from public, anon;
revoke all on function public.moments_feed()                                      from public, anon;
revoke all on function public.get_moment(uuid)                                    from public, anon;
revoke all on function public.request_moment_slot(uuid, timestamptz)              from public, anon;
revoke all on function public.withdraw_moment_request(uuid)                       from public, anon;
grant execute on function public.rencontre_suggestions(integer)                    to authenticated;
grant execute on function public.create_moment(uuid, text, timestamptz[], integer) to authenticated;
grant execute on function public.moments_feed()                                    to authenticated;
grant execute on function public.get_moment(uuid)                                  to authenticated;
grant execute on function public.request_moment_slot(uuid, timestamptz)            to authenticated;
grant execute on function public.withdraw_moment_request(uuid)                     to authenticated;

-- ── Planification (pg_cron, inclus dans le tier gratuit) ────────────────────
-- Toutes les 15 minutes. Le fil filtre déjà sur expires_at : un moment
-- n'apparaît jamais après son échéance, même entre deux passages.

create extension if not exists pg_cron;

do $$ begin
  perform cron.unschedule('rencontres-expire-moments')
  where exists (select 1 from cron.job where jobname = 'rencontres-expire-moments');
  perform cron.schedule('rencontres-expire-moments', '*/15 * * * *', 'select public.expire_moments()');
end $$;
