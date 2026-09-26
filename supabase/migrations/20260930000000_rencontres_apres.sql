-- ─────────────────────────────────────────────────────────────────────────────
-- PinLove — Mode Rencontres · Lot 6 : après la rencontre
--
-- À exécuter dans le SQL Editor Supabase APRÈS 20260929000000_rencontres_jour_j.sql.
-- Rejouable.
--
--  • Feedback en 3 gestes (revoir ? bien passé ? signaler ?) : jamais lisible
--    par l'autre (RLS du lot 1).
--  • « Revoir » mutuel → notification « Vous pouvez vous revoir » aux deux,
--    chat débloqué (moment_chat_open, lot 1). Non mutuel → rien.
--  • Souvenir commun : si les deux acceptent, un pin daté (privé) est créé
--    sur les deux cartes.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Pin « souvenir » ─────────────────────────────────────────────────────────

alter table public.places add column if not exists memory_moment_id uuid references public.moments(id) on delete set null;
alter table public.places add column if not exists memory_at timestamptz;
create unique index if not exists places_memory_unique_idx
  on public.places(user_id, memory_moment_id) where memory_moment_id is not null;

-- ── Détail d'un moment (remplace la version du lot 5) ───────────────────────
-- Ajoute : feedback (ouvert, déjà donné), revoir mutuel, souvenir commun.

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
    'feedback_open',       mine.user_id is not null and m.scheduled_at is not null
                           and m.status in ('confirmed', 'done') and now() >= m.scheduled_at,
    'my_feedback_given',   exists (select 1 from public.feedback f where f.moment_id = m.id and f.from_user = me),
    'my_feedback_reported', exists (select 1 from public.feedback f where f.moment_id = m.id and f.from_user = me
                                    and f.report_reason is not null),
    'meet_again_mutual',   mine.user_id is not null and public.moment_meet_again_mutual(m.id),
    'my_wants_memory',     coalesce(mine.wants_shared_memory, false),
    'shared_memory_created_at', m.shared_memory_created_at,
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

-- ── Feedback ─────────────────────────────────────────────────────────────────
-- Un seul par personne et par moment. Un signalement implique « pas de
-- revoir » et crée aussi une ligne dans reports (modération + séparation).
-- Renvoie true si le « revoir » devient mutuel (l'info n'est donnée que dans
-- ce cas : un « non » n'est jamais révélé).

create or replace function public.submit_feedback(
  p_moment_id        uuid,
  p_would_meet_again boolean,
  p_went_well        boolean,
  p_report_reason    text default null
)
returns boolean
language plpgsql volatile security definer set search_path = public as $$
declare
  m      public.moments;
  me     uuid := auth.uid();
  other  uuid;
  again  boolean := coalesce(p_would_meet_again, false) and p_report_reason is null;
  mutual boolean;
begin
  select * into m from public.moments where id = p_moment_id for update;
  if not found or not public.is_moment_participant(m.id) then
    raise exception 'Moment introuvable.';
  end if;
  if m.scheduled_at is null or m.status not in ('confirmed', 'done') or now() < m.scheduled_at then
    raise exception 'Le retour s’ouvre après la rencontre.';
  end if;
  if p_went_well is null then
    raise exception 'Dis-nous si ça s’est bien passé.';
  end if;
  if p_report_reason is not null
     and p_report_reason not in ('comportement', 'absence', 'faux_profil', 'harcelement', 'securite', 'autre') then
    raise exception 'Motif de signalement inconnu.';
  end if;
  if exists (select 1 from public.feedback where moment_id = m.id and from_user = me) then
    raise exception 'Tu as déjà donné ton retour sur ce moment.';
  end if;

  select user_id into other from public.moment_participants where moment_id = m.id and user_id <> me;

  insert into public.feedback (moment_id, from_user, to_user, would_meet_again, went_well, report_reason)
  values (m.id, me, other, again, p_went_well, p_report_reason);

  if p_report_reason is not null then
    insert into public.reports (reporter_id, reported_user_id, moment_id, reason, details)
    values (me, other, m.id, p_report_reason, 'Signalé depuis le retour après la rencontre');
  end if;

  mutual := again and public.moment_meet_again_mutual(m.id);
  if mutual then
    perform public._rencontre_notify(mp.user_id, 'meet_again', m,
      jsonb_build_object('first_name', (select first_name from public.rencontre_profiles where user_id = (
        select user_id from public.moment_participants o where o.moment_id = m.id and o.user_id <> mp.user_id))))
    from public.moment_participants mp where mp.moment_id = m.id;
  end if;
  return mutual;
end;
$$;

-- ── Souvenir commun ──────────────────────────────────────────────────────────
-- Chacun accepte (ou non) ; au second « oui », un pin daté et privé est créé
-- sur les deux cartes. Un « non » n'est jamais notifié.
-- Renvoie true si le souvenir vient d'être créé.

create or replace function public.set_shared_memory(p_moment_id uuid, p_wants boolean)
returns boolean
language plpgsql volatile security definer set search_path = public as $$
declare
  m       public.moments;
  src     public.places;
  pending integer;
begin
  select * into m from public.moments where id = p_moment_id for update;
  if not found or not public.is_moment_participant(m.id) then
    raise exception 'Moment introuvable.';
  end if;
  if m.scheduled_at is null or m.status not in ('confirmed', 'done') or now() < m.scheduled_at then
    raise exception 'Le souvenir commun se propose après la rencontre.';
  end if;
  if m.shared_memory_created_at is not null then
    return false;
  end if;
  update public.moment_participants set wants_shared_memory = coalesce(p_wants, false)
  where moment_id = m.id and user_id = auth.uid();

  -- Pas de souvenir commun après un signalement, et sans le dire : le
  -- « oui » est enregistré mais le pin n'est jamais créé.
  if exists (select 1 from public.feedback where moment_id = m.id and report_reason is not null) then
    return false;
  end if;

  select count(*) into pending from public.moment_participants
  where moment_id = m.id and not wants_shared_memory;
  if pending > 0 then
    return false;
  end if;

  select * into src from public.places where id = m.source_place_id;

  insert into public.places (
    user_id, name, address, postal_code, city, country, category, description,
    latitude, longitude, visibility, memory_moment_id, memory_at
  )
  select
    mp.user_id,
    m.place_name,
    coalesce(src.address, m.place_address, m.place_name),
    src.postal_code,
    coalesce(src.city, ''),
    coalesce(src.country, 'France'),
    coalesce(src.category, 'other'),
    format('Souvenir commun : « %s » avec %s, le %s.',
      m.title,
      (select rp.first_name from public.moment_participants o
       join public.rencontre_profiles rp on rp.user_id = o.user_id
       where o.moment_id = m.id and o.user_id <> mp.user_id),
      to_char(m.scheduled_at at time zone 'Europe/Paris', 'DD/MM/YYYY')),
    m.latitude, m.longitude, 'private', m.id, m.scheduled_at
  from public.moment_participants mp
  where mp.moment_id = m.id
  on conflict do nothing;

  update public.moments set shared_memory_created_at = now() where id = m.id returning * into m;

  perform public._rencontre_notify(mp.user_id, 'shared_memory', m)
  from public.moment_participants mp where mp.moment_id = m.id;

  return true;
end;
$$;

-- ── Mes rencontres (remplace la version du lot 4) : ajoute needs_my_feedback ─

drop function if exists public.my_rencontres();
create or replace function public.my_rencontres()
returns table (
  id                uuid,
  title             text,
  place_name        text,
  status            text,
  scheduled_at      timestamptz,
  proposed_slots    jsonb,
  expires_at        timestamptz,
  duration_min      integer,
  my_role           public.moment_role,
  my_chosen_slot    timestamptz,
  other_first_name  text,
  needs_my_confirmation boolean,
  needs_my_feedback boolean,
  request_count     integer,
  created_at        timestamptz
)
language sql stable security definer set search_path = public as $$
  select
    m.id, m.title, m.place_name,
    case when m.status = 'open' and m.expires_at <= now() then 'expired' else m.status::text end,
    m.scheduled_at, m.proposed_slots, m.expires_at, m.duration_min,
    mine.role, mine.chosen_slot,
    case when m.scheduled_at is not null then (
      select rp.first_name from public.moment_participants o
      join public.rencontre_profiles rp on rp.user_id = o.user_id
      where o.moment_id = m.id and o.user_id <> mine.user_id
    ) end,
    m.status = 'matched' and mine.confirmed_eve_at is null and now() < m.scheduled_at,
    m.status in ('confirmed', 'done')
      and now() >= m.scheduled_at + make_interval(mins => m.duration_min)
      and now() <  m.scheduled_at + interval '7 days'
      and not exists (select 1 from public.feedback f where f.moment_id = m.id and f.from_user = mine.user_id),
    case when mine.role = 'creator' and m.status = 'open' then (
      select count(*)::integer from public.moment_participants g where g.moment_id = m.id and g.role = 'guest'
    ) end,
    m.created_at
  from public.moments m
  join public.moment_participants mine on mine.moment_id = m.id and mine.user_id = auth.uid()
  where not (mine.role = 'guest' and m.scheduled_at is null and (m.status <> 'open' or m.expires_at <= now()))
  order by coalesce(m.scheduled_at, m.created_at) desc;
$$;

-- ── Droits ───────────────────────────────────────────────────────────────────

revoke all on function public.submit_feedback(uuid, boolean, boolean, text) from public, anon;
revoke all on function public.set_shared_memory(uuid, boolean)              from public, anon;
revoke all on function public.my_rencontres()                               from public, anon;
revoke all on function public.get_moment(uuid)                              from public, anon;
grant execute on function public.submit_feedback(uuid, boolean, boolean, text) to authenticated;
grant execute on function public.set_shared_memory(uuid, boolean)              to authenticated;
grant execute on function public.my_rencontres()                               to authenticated;
grant execute on function public.get_moment(uuid)                              to authenticated;
