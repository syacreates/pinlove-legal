-- ─────────────────────────────────────────────────────────────────────────────
-- PinLove — Mode Rencontres · Lot 4 : organisation
--
-- À exécuter dans le SQL Editor Supabase APRÈS 20260927000000_rencontres_moments.sql.
-- Rejouable.
--
--  • Double acceptation : l'invité a choisi un créneau (lot 3), le créateur
--    valide une demande → status = matched, photos révélées. Les autres
--    demandes disparaissent sans notification.
--  • La veille à 18 h (heure de Paris) : « Toujours partant·e ? ». Les deux
--    confirmations font passer le moment en confirmed.
--  • H-2 : rappel + itinéraire (moments confirmés).
--  • Annulation à tout moment ; à moins de 12 h du début : fiabilité −10.
--  • Push natif : chaque notification insérée déclenche l'Edge Function
--    send-push si les secrets Vault sont configurés (sinon : in-app seul).
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Demandes : identifiant opaque ───────────────────────────────────────────
-- Le créateur valide une demande par ce jeton, jamais par l'identifiant de
-- l'utilisateur.

alter table public.moment_participants
  add column if not exists request_token uuid not null default gen_random_uuid();
create unique index if not exists mp_request_token_idx on public.moment_participants(request_token);

-- ── Appareils (push natif) ──────────────────────────────────────────────────

create table if not exists public.device_tokens (
  token      text primary key,
  user_id    uuid not null references public.users(id) on delete cascade,
  platform   text not null check (platform in ('ios', 'android')),
  updated_at timestamptz not null default now()
);
create index if not exists device_tokens_user_idx on public.device_tokens(user_id);

alter table public.device_tokens enable row level security;
drop policy if exists "device_tokens_select_own" on public.device_tokens;
create policy "device_tokens_select_own" on public.device_tokens
  for select using (auth.uid() = user_id);
drop policy if exists "device_tokens_delete_own" on public.device_tokens;
create policy "device_tokens_delete_own" on public.device_tokens
  for delete using (auth.uid() = user_id);
-- Enregistrement : RPC register_device_token (un appareil peut changer de compte).

create or replace function public.register_device_token(p_token text, p_platform text)
returns void
language plpgsql volatile security definer set search_path = public as $$
begin
  if auth.uid() is null or p_token is null or char_length(p_token) not between 10 and 4096 then
    raise exception 'Jeton invalide.';
  end if;
  insert into public.device_tokens (token, user_id, platform, updated_at)
  values (p_token, auth.uid(), p_platform, now())
  on conflict (token) do update
    set user_id = excluded.user_id, platform = excluded.platform, updated_at = now();
end;
$$;

-- ── Fonctions internes ──────────────────────────────────────────────────────

-- La veille du créneau à 18 h, heure de Paris.
create or replace function public._rencontre_eve_at(p_scheduled timestamptz)
returns timestamptz
language sql immutable set search_path = public as $$
  select (date_trunc('day', p_scheduled at time zone 'Europe/Paris') - interval '1 day' + interval '18 hours')
         at time zone 'Europe/Paris';
$$;

-- « Pourquoi » d'un utilisateur pour un lieu (clé OSM).
create or replace function public._rencontre_why(p_user uuid, p_place_key text)
returns text
language sql stable security definer set search_path = public as $$
  select why_text from public.places
  where user_id = p_user and place_key = p_place_key and rencontre_open
  order by updated_at desc limit 1;
$$;

create or replace function public._rencontre_notify(p_user uuid, p_type text, p_moment public.moments, p_extra jsonb default '{}'::jsonb)
returns void
language sql volatile security definer set search_path = public as $$
  insert into public.notifications (user_id, type, moment_id, payload)
  values (p_user, p_type, p_moment.id, jsonb_build_object(
    'title', p_moment.title,
    'place_name', p_moment.place_name,
    'scheduled_at', p_moment.scheduled_at
  ) || p_extra);
$$;

-- ── Détail d'un moment (remplace la version du lot 3) ───────────────────────
-- Ajoute : demandes reçues (créateur, moment ouvert), l'autre personne après
-- double acceptation (prénom, photo, fiabilité, pourquoi), confirmations.

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
                             'confirmed',         other_p.confirmed_eve_at is not null
                           ) end
  );
end;
$$;

-- ── Double acceptation ───────────────────────────────────────────────────────

create or replace function public.accept_moment_request(p_moment_id uuid, p_token uuid)
returns void
language plpgsql volatile security definer set search_path = public as $$
declare
  m     public.moments;
  guest public.moment_participants;
begin
  select * into m from public.moments where id = p_moment_id for update;
  if not found or m.creator_id <> auth.uid() then
    raise exception 'Moment introuvable.';
  end if;
  if m.status <> 'open' or m.expires_at <= now() then
    raise exception 'Ce moment n’est plus ouvert.';
  end if;

  select * into guest from public.moment_participants
  where moment_id = m.id and request_token = p_token and role = 'guest';
  if not found
     or (public._rencontre_active_profile(guest.user_id)).user_id is null
     or public._rencontre_blocked(m.creator_id, guest.user_id) then
    raise exception 'Cette demande n’est plus disponible.';
  end if;
  if guest.chosen_slot < now() + interval '1 hour' then
    raise exception 'Ce créneau est trop proche.';
  end if;

  update public.moments
  set status = 'matched', scheduled_at = guest.chosen_slot
  where id = m.id
  returning * into m;

  -- Les autres demandes disparaissent, sans notification.
  delete from public.moment_participants
  where moment_id = m.id and role = 'guest' and user_id <> guest.user_id;

  perform public._rencontre_notify(guest.user_id, 'moment_matched', m,
    jsonb_build_object('first_name', (select first_name from public.rencontre_profiles where user_id = m.creator_id)));
end;
$$;

-- ── Confirmation (« Toujours partant·e ? ») ─────────────────────────────────

create or replace function public.confirm_moment(p_moment_id uuid)
returns void
language plpgsql volatile security definer set search_path = public as $$
declare
  m       public.moments;
  pending integer;
begin
  select * into m from public.moments where id = p_moment_id for update;
  if not found or not public.is_moment_participant(m.id) then
    raise exception 'Moment introuvable.';
  end if;
  if m.status not in ('matched', 'confirmed') or now() >= m.scheduled_at then
    raise exception 'Ce moment ne peut plus être confirmé.';
  end if;

  update public.moment_participants
  set confirmed_eve_at = coalesce(confirmed_eve_at, now())
  where moment_id = m.id and user_id = auth.uid();

  select count(*) into pending from public.moment_participants
  where moment_id = m.id and confirmed_eve_at is null;

  if pending = 0 and m.status = 'matched' then
    update public.moments set status = 'confirmed' where id = m.id returning * into m;
    perform public._rencontre_notify(mp.user_id, 'moment_confirmed', m)
    from public.moment_participants mp where mp.moment_id = m.id;
  end if;
end;
$$;

-- ── Annulation ───────────────────────────────────────────────────────────────
-- Moment ouvert : le créateur l'annule (les demandes disparaissent sans
-- notification), un invité retire sa demande.
-- Moment calé : l'autre est prévenu ; à moins de 12 h du début, −10 de
-- fiabilité. Renvoie true si la pénalité s'applique.

create or replace function public.cancel_moment(p_moment_id uuid)
returns boolean
language plpgsql volatile security definer set search_path = public as $$
declare
  m    public.moments;
  me   uuid := auth.uid();
  v_role public.moment_role;
  late   boolean := false;
begin
  select * into m from public.moments where id = p_moment_id for update;
  select mp.role into v_role from public.moment_participants mp where mp.moment_id = p_moment_id and mp.user_id = me;
  if not found or v_role is null then
    raise exception 'Moment introuvable.';
  end if;

  if m.status = 'open' then
    if v_role = 'creator' then
      update public.moments set status = 'cancelled', cancelled_by = me, cancelled_at = now() where id = m.id;
      delete from public.moment_participants where moment_id = m.id and role = 'guest';
    else
      delete from public.moment_participants where moment_id = m.id and user_id = me;
    end if;
    return false;
  end if;

  if m.status not in ('matched', 'confirmed')
     or now() >= m.scheduled_at + make_interval(mins => m.duration_min) then
    raise exception 'Ce moment ne peut plus être annulé.';
  end if;

  late := m.scheduled_at - now() < interval '12 hours';

  update public.moments set status = 'cancelled', cancelled_by = me, cancelled_at = now()
  where id = m.id returning * into m;

  if late then
    update public.rencontre_profiles
    set reliability_score = greatest(0, reliability_score - 10)
    where user_id = me;
  end if;

  perform public._rencontre_notify(mp.user_id, 'moment_cancelled', m)
  from public.moment_participants mp where mp.moment_id = m.id and mp.user_id <> me;

  return late;
end;
$$;

-- ── Mes rencontres ───────────────────────────────────────────────────────────
-- Moments où je suis participant. Pour un invité, les demandes sans suite
-- (expirées, annulées avant validation) n'apparaissent pas : aucun rejet
-- visible.

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
    case when mine.role = 'creator' and m.status = 'open' then (
      select count(*)::integer from public.moment_participants g where g.moment_id = m.id and g.role = 'guest'
    ) end,
    m.created_at
  from public.moments m
  join public.moment_participants mine on mine.moment_id = m.id and mine.user_id = auth.uid()
  where not (mine.role = 'guest' and m.scheduled_at is null and (m.status <> 'open' or m.expires_at <= now()))
  order by coalesce(m.scheduled_at, m.created_at) desc;
$$;

-- ── Tâche planifiée (remplace rencontres-expire-moments) ────────────────────

create or replace function public.rencontres_tick()
returns void
language plpgsql volatile security definer set search_path = public as $$
begin
  -- Expiration des moments ouverts (lot 3).
  perform public.expire_moments();

  -- Calé mais jamais confirmé des deux côtés, créneau terminé : expiré.
  update public.moments set status = 'expired'
  where status = 'matched' and scheduled_at + make_interval(mins => duration_min) < now();

  -- Rencontre confirmée terminée.
  update public.moments set status = 'done'
  where status = 'confirmed' and scheduled_at + make_interval(mins => duration_min) < now();

  -- La veille à 18 h : « Toujours partant·e ? » (une fois par personne).
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

  -- H-2 : rappel + itinéraire, moments confirmés.
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
end;
$$;

-- ── Push natif ───────────────────────────────────────────────────────────────
-- Chaque notification déclenche l'Edge Function send-push via pg_net, si les
-- secrets Vault « push_function_url » et « push_webhook_secret » existent et
-- que le destinataire a un appareil. Une erreur ici ne bloque jamais la
-- notification in-app.

create extension if not exists pg_net;

create or replace function public._notification_push()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  fn_url text;
  secret text;
begin
  if not exists (select 1 from public.device_tokens where user_id = new.user_id) then
    return new;
  end if;
  select decrypted_secret into fn_url from vault.decrypted_secrets where name = 'push_function_url';
  select decrypted_secret into secret from vault.decrypted_secrets where name = 'push_webhook_secret';
  if fn_url is null or secret is null then
    return new;
  end if;
  perform net.http_post(
    url     := fn_url,
    body    := jsonb_build_object('notification_id', new.id),
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || secret)
  );
  return new;
exception when others then
  return new;
end;
$$;

drop trigger if exists notifications_push on public.notifications;
create trigger notifications_push
  after insert on public.notifications
  for each row execute procedure public._notification_push();

-- ── Droits ───────────────────────────────────────────────────────────────────

revoke all on function public._rencontre_eve_at(timestamptz)                              from public, anon, authenticated;
revoke all on function public._rencontre_why(uuid, text)                                  from public, anon, authenticated;
revoke all on function public._rencontre_notify(uuid, text, public.moments, jsonb)       from public, anon, authenticated;
revoke all on function public._notification_push()                                       from public, anon, authenticated;
revoke all on function public.rencontres_tick()                                          from public, anon, authenticated;

revoke all on function public.register_device_token(text, text)       from public, anon;
revoke all on function public.get_moment(uuid)                        from public, anon;
revoke all on function public.accept_moment_request(uuid, uuid)       from public, anon;
revoke all on function public.confirm_moment(uuid)                    from public, anon;
revoke all on function public.cancel_moment(uuid)                     from public, anon;
revoke all on function public.my_rencontres()                         from public, anon;
grant execute on function public.register_device_token(text, text)    to authenticated;
grant execute on function public.get_moment(uuid)                     to authenticated;
grant execute on function public.accept_moment_request(uuid, uuid)    to authenticated;
grant execute on function public.confirm_moment(uuid)                 to authenticated;
grant execute on function public.cancel_moment(uuid)                  to authenticated;
grant execute on function public.my_rencontres()                      to authenticated;

-- ── Planification ────────────────────────────────────────────────────────────
-- Toutes les 5 minutes (rappels à l'heure près ; pg_cron gratuit).

do $$ begin
  perform cron.unschedule(jobname) from cron.job
  where jobname in ('rencontres-expire-moments', 'rencontres-tick');
  perform cron.schedule('rencontres-tick', '*/5 * * * *', 'select public.rencontres_tick()');
end $$;
