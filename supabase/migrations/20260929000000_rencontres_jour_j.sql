-- ─────────────────────────────────────────────────────────────────────────────
-- PinLove — Mode Rencontres · Lot 5 : jour J & sécurité
--
-- À exécuter dans le SQL Editor Supabase APRÈS 20260928000000_rencontres_organisation.sql.
-- Rejouable.
--
--  • Check-in « Je suis arrivé·e » : position vérifiée côté serveur, à moins
--    de 150 m du lieu, de H-2 à H+3.
--  • Indice libre (« veste verte, près de l'entrée ») visible par l'autre.
--  • Chat : déjà limité par la policy mm_insert_window (H-2 → H+3, lot 1).
--  • « Tout va bien ? » à la fin du créneau + 30 min (tâche rencontres_tick).
--  • Signalement depuis un moment, sans jamais connaître l'identifiant de
--    l'autre ; il sépare définitivement les deux personnes (lot 3).
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Fenêtre du jour J : de H-2 à H+3 ────────────────────────────────────────

create or replace function public._rencontre_day_window(p_moment public.moments)
returns boolean
language sql stable set search_path = public as $$
  select p_moment.scheduled_at is not null
    and p_moment.status in ('matched', 'confirmed', 'done')
    and now() between p_moment.scheduled_at - interval '2 hours'
                  and p_moment.scheduled_at + interval '3 hours';
$$;

-- ── Détail d'un moment (remplace la version du lot 4) ───────────────────────
-- Ajoute : check-in et indice (les miens, ceux de l'autre), fenêtre du jour J,
-- ouverture du chat.

create or replace function public.get_moment(p_moment_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  m        public.moments;
  me       uuid := auth.uid();
  mine     public.moment_participants;
  creator  public.rencontre_profiles;
  other_p  public.moment_participants;
  other    public.rencontre_profiles;
  revealed boolean;
begin
  select * into m from public.moments where id = p_moment_id;
  if not found then return null; end if;

  select * into mine from public.moment_participants where moment_id = m.id and user_id = me;
  if mine.user_id is null and not public._rencontre_moment_visible(m, me) then
    return null;
  end if;

  select * into creator from public.rencontre_profiles where user_id = m.creator_id;

  -- Révélation : seulement entre les deux participants d'un moment calé.
  revealed := mine.user_id is not null and m.scheduled_at is not null
              and m.status in ('matched', 'confirmed', 'done', 'cancelled');
  if revealed then
    select * into other_p from public.moment_participants where moment_id = m.id and user_id <> me;
    select * into other from public.rencontre_profiles where user_id = other_p.user_id;
  end if;

  return jsonb_build_object(
    'id',                  m.id,
    'title',               m.title,
    'status',              case when m.status = 'open' and m.expires_at <= now() then 'expired' else m.status::text end,
    'place_key',           m.place_key,
    'place_name',          m.place_name,
    'place_address',       m.place_address,
    'latitude',            m.latitude,
    'longitude',           m.longitude,
    'duration_min',        m.duration_min,
    'proposed_slots',      m.proposed_slots,
    'scheduled_at',        m.scheduled_at,
    'expires_at',          m.expires_at,
    'payment_rule',        m.payment_rule,
    'intention',           m.intention,
    'created_at',          m.created_at,
    'cancelled_by_me',     m.cancelled_by is not null and m.cancelled_by = me,
    'my_role',             mine.role,
    'my_chosen_slot',      mine.chosen_slot,
    'my_confirmed_at',     mine.confirmed_eve_at,
    'my_checked_in_at',    mine.checked_in_at,
    'my_hint',             mine.hint_text,
    'day_window_open',     mine.user_id is not null and public._rencontre_day_window(m),
    'chat_open',           mine.user_id is not null and public.moment_chat_open(m.id),
    'creator_first_name',  creator.first_name,
    'creator_why',         (select why_text from public.places where id = m.source_place_id),
    'common_places',       case when m.creator_id = me then '[]'::jsonb
                                else public._rencontre_common_places(me, m.creator_id) end,
    'request_count',       case when m.creator_id = me then (
                             select count(*) from public.moment_participants
                             where moment_id = m.id and role = 'guest'
                           ) end,
    'requests',            case when m.creator_id = me and m.status = 'open' then (
                             select coalesce(jsonb_agg(jsonb_build_object(
                               'token',             mp.request_token,
                               'first_name',        rp.first_name,
                               'chosen_slot',       mp.chosen_slot,
                               'reliability_score', rp.reliability_score,
                               'why',               public._rencontre_why(mp.user_id, m.place_key),
                               'common_places',     public._rencontre_common_places(me, mp.user_id)
                             ) order by mp.accepted_at), '[]'::jsonb)
                             from public.moment_participants mp
                             join public.rencontre_profiles rp on rp.user_id = mp.user_id and rp.enabled
                             where mp.moment_id = m.id and mp.role = 'guest'
                               and not public._rencontre_blocked(me, mp.user_id)
                           ) end,
    'other',               case when revealed and other.user_id is not null then jsonb_build_object(
                             'first_name',        other.first_name,
                             'photo_path',        other.photo_path,
                             'reliability_score', other.reliability_score,
                             'why',               public._rencontre_why(other.user_id, m.place_key),
                             'confirmed',         other_p.confirmed_eve_at is not null,
                             'checked_in',        other_p.checked_in_at is not null,
                             'hint',              other_p.hint_text
                           ) end
  );
end;
$$;

-- ── Check-in ─────────────────────────────────────────────────────────────────
-- Renvoie la distance au lieu en mètres.

create or replace function public.check_in_moment(p_moment_id uuid, p_lat double precision, p_lng double precision)
returns integer
language plpgsql volatile security definer set search_path = public as $$
declare
  m public.moments;
  d double precision;
begin
  select * into m from public.moments where id = p_moment_id;
  if not found or not public.is_moment_participant(m.id) then
    raise exception 'Moment introuvable.';
  end if;
  if not public._rencontre_day_window(m) then
    raise exception 'Le check-in s’ouvre 2 h avant le rendez-vous.';
  end if;
  if p_lat is null or p_lng is null or abs(p_lat) > 90 or abs(p_lng) > 180 then
    raise exception 'Position invalide.';
  end if;

  -- Distance orthodromique (haversine), rayon terrestre moyen.
  d := 2 * 6371000 * asin(sqrt(
    power(sin(radians(p_lat - m.latitude) / 2), 2)
    + cos(radians(m.latitude)) * cos(radians(p_lat)) * power(sin(radians(p_lng - m.longitude) / 2), 2)
  ));
  if d > 150 then
    raise exception 'Tu es à % m du lieu : le check-in se fait à moins de 150 m.', round(d);
  end if;

  update public.moment_participants
  set checked_in_at = coalesce(checked_in_at, now())
  where moment_id = m.id and user_id = auth.uid();

  return round(d)::integer;
end;
$$;

-- ── Indice ───────────────────────────────────────────────────────────────────

create or replace function public.set_moment_hint(p_moment_id uuid, p_hint text)
returns void
language plpgsql volatile security definer set search_path = public as $$
declare
  m public.moments;
begin
  select * into m from public.moments where id = p_moment_id;
  if not found or not public.is_moment_participant(m.id) then
    raise exception 'Moment introuvable.';
  end if;
  if not public._rencontre_day_window(m) then
    raise exception 'L’indice se partage le jour J, à partir de 2 h avant.';
  end if;
  if char_length(p_hint) > 140 then
    raise exception 'Indice trop long (140 caractères maximum).';
  end if;
  update public.moment_participants
  set hint_text = nullif(btrim(p_hint), '')
  where moment_id = m.id and user_id = auth.uid();
end;
$$;

-- ── Signalement depuis un moment ────────────────────────────────────────────
-- Cible déduite du contexte, jamais d'identifiant côté client :
--   • p_request_token : le créateur signale l'auteur d'une demande ;
--   • moment calé : l'autre participant ;
--   • sinon : le créateur du moment (vu dans le fil ou après une demande).

create or replace function public.report_in_moment(
  p_moment_id     uuid,
  p_reason        text,
  p_details       text default null,
  p_request_token uuid default null
)
returns void
language plpgsql volatile security definer set search_path = public as $$
declare
  m      public.moments;
  me     uuid := auth.uid();
  target uuid;
begin
  if p_reason is null or p_reason not in ('comportement', 'absence', 'faux_profil', 'harcelement', 'securite', 'autre') then
    raise exception 'Motif de signalement inconnu.';
  end if;
  if p_details is not null and char_length(p_details) > 1000 then
    raise exception 'Détails trop longs (1000 caractères maximum).';
  end if;

  select * into m from public.moments where id = p_moment_id;
  if not found then raise exception 'Moment introuvable.'; end if;

  if p_request_token is not null then
    if m.creator_id = me then
      select user_id into target from public.moment_participants
      where moment_id = m.id and request_token = p_request_token and role = 'guest';
    end if;
  elsif public.is_moment_participant(m.id) and m.scheduled_at is not null then
    select user_id into target from public.moment_participants
    where moment_id = m.id and user_id <> me;
  elsif m.creator_id <> me and (public.is_moment_participant(m.id) or public._rencontre_moment_visible(m, me)) then
    target := m.creator_id;
  end if;

  if target is null or target = me then
    raise exception 'Signalement impossible pour ce moment.';
  end if;

  insert into public.reports (reporter_id, reported_user_id, moment_id, reason, details)
  values (me, target, m.id, p_reason, nullif(btrim(coalesce(p_details, '')), ''));

  -- Moment encore ouvert : la demande entre les deux personnes disparaît.
  if m.status = 'open' then
    delete from public.moment_participants
    where moment_id = m.id and role = 'guest' and user_id in (me, target);
  end if;
end;
$$;

-- ── Tâche planifiée : ajoute « Tout va bien ? » ─────────────────────────────

create or replace function public.rencontres_tick()
returns void
language plpgsql volatile security definer set search_path = public as $$
begin
  perform public.expire_moments();

  update public.moments set status = 'expired'
  where status = 'matched' and scheduled_at + make_interval(mins => duration_min) < now();

  update public.moments set status = 'done'
  where status = 'confirmed' and scheduled_at + make_interval(mins => duration_min) < now();

  perform public._rencontre_notify(mp.user_id, 'eve_check', m)
  from public.moments m
  join public.moment_participants mp on mp.moment_id = m.id
  where m.status = 'matched'
    and mp.confirmed_eve_at is null
    and now() >= public._rencontre_eve_at(m.scheduled_at)
    and now() < m.scheduled_at
    and not exists (
      select 1 from public.notifications n
      where n.moment_id = m.id and n.user_id = mp.user_id and n.type = 'eve_check'
    );

  perform public._rencontre_notify(mp.user_id, 'h2_reminder', m,
    jsonb_build_object('latitude', m.latitude, 'longitude', m.longitude, 'payment_rule', m.payment_rule))
  from public.moments m
  join public.moment_participants mp on mp.moment_id = m.id
  where m.status = 'confirmed'
    and now() >= m.scheduled_at - interval '2 hours'
    and now() < m.scheduled_at
    and not exists (
      select 1 from public.notifications n
      where n.moment_id = m.id and n.user_id = mp.user_id and n.type = 'h2_reminder'
    );

  -- Fin du créneau + 30 min : « Tout va bien ? » (dans les 6 h qui suivent).
  perform public._rencontre_notify(mp.user_id, 'safety_check', m)
  from public.moments m
  join public.moment_participants mp on mp.moment_id = m.id
  where m.status in ('confirmed', 'done')
    and now() >= m.scheduled_at + make_interval(mins => m.duration_min + 30)
    and now() <  m.scheduled_at + make_interval(mins => m.duration_min) + interval '6 hours'
    and not exists (
      select 1 from public.notifications n
      where n.moment_id = m.id and n.user_id = mp.user_id and n.type = 'safety_check'
    );
end;
$$;

-- ── Droits ───────────────────────────────────────────────────────────────────

revoke all on function public._rencontre_day_window(public.moments)                        from public, anon, authenticated;
revoke all on function public.rencontres_tick()                                            from public, anon, authenticated;
revoke all on function public.check_in_moment(uuid, double precision, double precision)    from public, anon;
revoke all on function public.set_moment_hint(uuid, text)                                  from public, anon;
revoke all on function public.report_in_moment(uuid, text, text, uuid)                     from public, anon;
revoke all on function public.get_moment(uuid)                                             from public, anon;
grant execute on function public.check_in_moment(uuid, double precision, double precision) to authenticated;
grant execute on function public.set_moment_hint(uuid, text)                               to authenticated;
grant execute on function public.report_in_moment(uuid, text, text, uuid)                  to authenticated;
grant execute on function public.get_moment(uuid)                                          to authenticated;
