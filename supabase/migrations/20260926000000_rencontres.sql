-- ─────────────────────────────────────────────────────────────────────────────
-- PinLove — Mode Rencontres · Lot 1 : données
--
-- À exécuter dans le SQL Editor Supabase APRÈS supabase/schema.sql.
-- Rejouable : types, tables, colonnes et policies sont créés « si absents ».
--
-- Principes appliqués au niveau des données :
--  • Opt-in : rien n'existe pour un utilisateur tant qu'il n'a pas de ligne
--    dans rencontre_profiles avec enabled = true.
--  • Aucune table Rencontres n'est lisible directement par un autre
--    utilisateur : les écrans passeront par des fonctions RPC (lots 3 à 6)
--    qui ne renvoient que ce que le niveau de révélation autorise.
--  • Les changements d'état (acceptation, validation, annulation, check-in…)
--    passeront aussi par des RPC : aucun client ne peut écrire directement
--    dans moments / moment_participants.
--  • Aucun rejet visible : il n'existe ni statut « refusé » ni notification
--    de refus.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Types ────────────────────────────────────────────────────────────────────

do $$ begin
  create type public.rencontre_intention as enum ('amical', 'ouvert', 'pro');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.moment_status as enum
    ('open', 'matched', 'confirmed', 'done', 'cancelled', 'expired');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.moment_role as enum ('creator', 'guest');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.report_status as enum ('pending', 'reviewed', 'dismissed');
exception when duplicate_object then null; end $$;

-- ── rencontre_profiles ──────────────────────────────────────────────────────
-- Profil Rencontres, séparé de public.users (lu en select('*') par l'app)
-- pour ne jamais exposer le contact de confiance, et pour que désactiver le
-- mode reste un simple enabled = false.

create table if not exists public.rencontre_profiles (
  user_id                uuid primary key references public.users(id) on delete cascade,
  enabled                boolean not null default false,
  intention              public.rencontre_intention not null,
  first_name             text not null check (char_length(btrim(first_name)) between 1 and 40),
  -- Chemin dans le bucket privé « rencontre-photos » ({user_id}/…), pas une
  -- URL publique : la photo n'est lisible qu'après double acceptation.
  photo_path             text,
  reliability_score      integer not null default 100 check (reliability_score between 0 and 100),
  safety_contact_name    text check (char_length(safety_contact_name) <= 60),
  safety_contact_phone   text check (char_length(safety_contact_phone) <= 30),
  principles_accepted_at timestamptz,
  -- Hors périmètre V1 (vérification selfie) : prévu, jamais renseigné.
  verified_at            timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index if not exists rp_enabled_intention_idx
  on public.rencontre_profiles(intention) where enabled;

-- ── places (ajouts) ──────────────────────────────────────────────────────────
-- « visibility » (private/friends/public) sert déjà au partage entre amis :
-- l'ouverture aux rencontres est une colonne distincte, fermée par défaut.

alter table public.places add column if not exists rencontre_open boolean not null default false;
alter table public.places add column if not exists why_text       text;
-- Clé de rapprochement entre utilisateurs : identifiant OpenStreetMap
-- renvoyé par Nominatim, ex. « osm:N123456 » (remplace google_place_id).
alter table public.places add column if not exists place_key      text;

do $$ begin
  alter table public.places add constraint places_why_text_len
    check (why_text is null or char_length(why_text) <= 140);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.places add constraint places_open_needs_key
    check (not rencontre_open or place_key is not null);
exception when duplicate_object then null; end $$;

create index if not exists places_open_key_idx
  on public.places(place_key) where rencontre_open;

-- ── moments ──────────────────────────────────────────────────────────────────

create table if not exists public.moments (
  id              uuid primary key default uuid_generate_v4(),
  creator_id      uuid not null references public.users(id) on delete cascade,
  source_place_id uuid references public.places(id) on delete set null,
  place_key       text not null,
  place_name      text not null,
  place_address   text,
  -- Copiées depuis le lieu : check-in à 150 m et lien d'itinéraire.
  latitude        double precision not null,
  longitude       double precision not null,
  -- Intention du créateur au moment de la création : seuls les profils de
  -- même intention voient le moment.
  intention       public.rencontre_intention not null,
  title           text not null check (char_length(btrim(title)) between 1 and 80),
  duration_min    integer not null default 60 check (duration_min between 15 and 240),
  -- Tableau JSON de 2 à 3 horodatages ISO 8601.
  proposed_slots  jsonb not null check (
    jsonb_typeof(proposed_slots) = 'array'
    and jsonb_array_length(proposed_slots) between 2 and 3
  ),
  -- Créneau retenu, renseigné à la double acceptation.
  scheduled_at    timestamptz,
  status          public.moment_status not null default 'open',
  expires_at      timestamptz not null default (now() + interval '48 hours'),
  payment_rule    text not null default 'Chacun sa part' check (payment_rule = 'Chacun sa part'),
  cancelled_by    uuid references public.users(id) on delete set null,
  cancelled_at    timestamptz,
  -- Souvenir commun créé (lot 6).
  shared_memory_created_at timestamptz,
  -- Hors périmètre V1 (partenariats lieux) : prévu, jamais renseigné.
  partner_id      uuid,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (status in ('open', 'expired', 'cancelled') or scheduled_at is not null)
);

create index if not exists moments_open_key_idx  on public.moments(place_key) where status = 'open';
create index if not exists moments_creator_idx   on public.moments(creator_id);
create index if not exists moments_status_idx    on public.moments(status);
create index if not exists moments_scheduled_idx on public.moments(scheduled_at);
create index if not exists moments_expires_idx   on public.moments(expires_at) where status = 'open';

-- ── moment_participants ─────────────────────────────────────────────────────
-- Une ligne « creator » à la création. Une ligne « guest » par personne ayant
-- choisi un créneau ; quand le créateur en valide une, les autres demandes
-- sont supprimées sans notification.

create table if not exists public.moment_participants (
  moment_id           uuid not null references public.moments(id) on delete cascade,
  user_id             uuid not null references public.users(id) on delete cascade,
  role                public.moment_role not null,
  accepted_at         timestamptz,
  chosen_slot         timestamptz,
  confirmed_eve_at    timestamptz,
  checked_in_at       timestamptz,
  hint_text           text check (char_length(hint_text) <= 140),
  wants_shared_memory boolean not null default false,
  created_at          timestamptz not null default now(),
  primary key (moment_id, user_id)
);

create index if not exists mp_user_idx on public.moment_participants(user_id);
create unique index if not exists mp_one_creator_idx
  on public.moment_participants(moment_id) where role = 'creator';

-- ── moment_messages ─────────────────────────────────────────────────────────
-- Chat du jour J uniquement (H-2 → H+3), ou après un « revoir » mutuel.

create table if not exists public.moment_messages (
  id         uuid primary key default uuid_generate_v4(),
  moment_id  uuid not null references public.moments(id) on delete cascade,
  sender_id  uuid not null references public.users(id) on delete cascade,
  body       text not null check (char_length(btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists mm_moment_idx on public.moment_messages(moment_id, created_at);

-- ── feedback ─────────────────────────────────────────────────────────────────
-- Jamais lisible par to_user : seul l'auteur relit sa réponse, la
-- réciprocité est calculée côté serveur.

create table if not exists public.feedback (
  id               uuid primary key default uuid_generate_v4(),
  moment_id        uuid not null references public.moments(id) on delete cascade,
  from_user        uuid not null references public.users(id) on delete cascade,
  to_user          uuid not null references public.users(id) on delete cascade,
  would_meet_again boolean not null,
  went_well        boolean not null,
  report_reason    text check (char_length(report_reason) <= 500),
  created_at       timestamptz not null default now(),
  unique (moment_id, from_user),
  check (from_user <> to_user)
);

-- ── reports ──────────────────────────────────────────────────────────────────
-- Signalements. Modération V1 : via le dashboard Supabase (service role).

create table if not exists public.reports (
  id               uuid primary key default uuid_generate_v4(),
  reporter_id      uuid not null references public.users(id) on delete cascade,
  reported_user_id uuid not null references public.users(id) on delete cascade,
  moment_id        uuid references public.moments(id) on delete set null,
  reason           text not null check (char_length(btrim(reason)) between 1 and 60),
  details          text check (char_length(details) <= 1000),
  status           public.report_status not null default 'pending',
  reviewed_at      timestamptz,
  created_at       timestamptz not null default now(),
  check (reporter_id <> reported_user_id)
);

create index if not exists reports_status_idx   on public.reports(status);
create index if not exists reports_reported_idx on public.reports(reported_user_id);

-- ── notifications ────────────────────────────────────────────────────────────
-- Notifications in-app (badge via Realtime). Source de vérité aussi pour le
-- push natif (lot 4). Créées uniquement par des fonctions serveur ; aucun
-- type ne correspond à un refus.

create table if not exists public.notifications (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.users(id) on delete cascade,
  type       text not null,
  moment_id  uuid references public.moments(id) on delete cascade,
  payload    jsonb not null default '{}'::jsonb,
  read_at    timestamptz,
  pushed_at  timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx
  on public.notifications(user_id, created_at desc);

-- ── updated_at ───────────────────────────────────────────────────────────────

drop trigger if exists set_rp_updated_at on public.rencontre_profiles;
create trigger set_rp_updated_at
  before update on public.rencontre_profiles
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_moments_updated_at on public.moments;
create trigger set_moments_updated_at
  before update on public.moments
  for each row execute procedure public.set_updated_at();

-- ── Fonctions d'aide aux policies ───────────────────────────────────────────
-- security definer : évite la récursion RLS entre moments et participants.

create or replace function public.is_moment_participant(p_moment_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.moment_participants
    where moment_id = p_moment_id and user_id = auth.uid()
  );
$$;

-- Revoir mutuel : les deux feedbacks disent would_meet_again = true.
create or replace function public.moment_meet_again_mutual(p_moment_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select count(*) = 2 from public.feedback
  where moment_id = p_moment_id and would_meet_again;
$$;

-- Chat ouvert : rencontre calée, de H-2 à H+3 (fin du créneau non comprise),
-- ou sans limite après un « revoir » mutuel.
create or replace function public.moment_chat_open(p_moment_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.moments m
    where m.id = p_moment_id
      and m.status in ('matched', 'confirmed', 'done')
      and (
        now() between m.scheduled_at - interval '2 hours'
                  and m.scheduled_at + interval '3 hours'
        or public.moment_meet_again_mutual(m.id)
      )
  );
$$;

-- Photo visible : la sienne, ou celle de l'autre personne d'un moment
-- doublement accepté (matched et au-delà, hors annulation / expiration).
create or replace function public.rencontre_photo_visible(p_owner uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select p_owner = auth.uid() or exists (
    select 1
    from public.moments m
    join public.moment_participants me    on me.moment_id = m.id and me.user_id = auth.uid()
    join public.moment_participants other on other.moment_id = m.id and other.user_id = p_owner
    where m.status in ('matched', 'confirmed', 'done')
  );
$$;

revoke all on function public.is_moment_participant(uuid)    from public, anon;
revoke all on function public.moment_meet_again_mutual(uuid) from public, anon;
revoke all on function public.moment_chat_open(uuid)         from public, anon;
revoke all on function public.rencontre_photo_visible(uuid)  from public, anon;
grant execute on function public.is_moment_participant(uuid)    to authenticated;
grant execute on function public.moment_meet_again_mutual(uuid) to authenticated;
grant execute on function public.moment_chat_open(uuid)         to authenticated;
grant execute on function public.rencontre_photo_visible(uuid)  to authenticated;

-- ── RLS ──────────────────────────────────────────────────────────────────────

alter table public.rencontre_profiles  enable row level security;
alter table public.moments             enable row level security;
alter table public.moment_participants enable row level security;
alter table public.moment_messages     enable row level security;
alter table public.feedback            enable row level security;
alter table public.reports             enable row level security;
alter table public.notifications       enable row level security;

-- rencontre_profiles : uniquement le sien.
drop policy if exists "rp_select_own" on public.rencontre_profiles;
create policy "rp_select_own" on public.rencontre_profiles
  for select using (auth.uid() = user_id);
drop policy if exists "rp_insert_own" on public.rencontre_profiles;
create policy "rp_insert_own" on public.rencontre_profiles
  for insert with check (auth.uid() = user_id);
drop policy if exists "rp_update_own" on public.rencontre_profiles;
create policy "rp_update_own" on public.rencontre_profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "rp_delete_own" on public.rencontre_profiles;
create policy "rp_delete_own" on public.rencontre_profiles
  for delete using (auth.uid() = user_id);

-- Le score de fiabilité et la vérification ne sont modifiables que côté
-- serveur : droits limités aux colonnes éditables par l'utilisateur.
revoke insert, update on public.rencontre_profiles from anon, authenticated;
grant insert (user_id, enabled, intention, first_name, photo_path,
              safety_contact_name, safety_contact_phone, principles_accepted_at)
  on public.rencontre_profiles to authenticated;
grant update (enabled, intention, first_name, photo_path,
              safety_contact_name, safety_contact_phone, principles_accepted_at)
  on public.rencontre_profiles to authenticated;

-- moments : lisibles par leurs participants. Le fil « Moments dans tes
-- lieux » passera par une RPC (lot 3). Écritures : RPC uniquement.
drop policy if exists "moments_select_participant" on public.moments;
create policy "moments_select_participant" on public.moments
  for select using (auth.uid() = creator_id or public.is_moment_participant(id));

-- moment_participants : lignes des moments auxquels on participe.
-- Écritures : RPC uniquement.
drop policy if exists "mp_select_participant" on public.moment_participants;
create policy "mp_select_participant" on public.moment_participants
  for select using (public.is_moment_participant(moment_id));

-- moment_messages : lecture par les participants, écriture dans la fenêtre.
drop policy if exists "mm_select_participant" on public.moment_messages;
create policy "mm_select_participant" on public.moment_messages
  for select using (public.is_moment_participant(moment_id));
drop policy if exists "mm_insert_window" on public.moment_messages;
create policy "mm_insert_window" on public.moment_messages
  for insert with check (
    auth.uid() = sender_id
    and public.is_moment_participant(moment_id)
    and public.moment_chat_open(moment_id)
  );

-- feedback : l'auteur seulement, après l'heure de la rencontre, envers
-- l'autre participant. Pas de modification ni de suppression.
drop policy if exists "feedback_select_author" on public.feedback;
create policy "feedback_select_author" on public.feedback
  for select using (auth.uid() = from_user);
drop policy if exists "feedback_insert_author" on public.feedback;
create policy "feedback_insert_author" on public.feedback
  for insert with check (
    auth.uid() = from_user
    and exists (
      select 1
      from public.moments m
      join public.moment_participants me    on me.moment_id = m.id and me.user_id = from_user
      join public.moment_participants other on other.moment_id = m.id and other.user_id = to_user
      where m.id = feedback.moment_id
        and m.status in ('confirmed', 'done')
        and now() >= m.scheduled_at
    )
  );

-- reports : création par n'importe quel utilisateur connecté, relecture
-- de ses propres signalements. Traitement : service role.
drop policy if exists "reports_insert_own" on public.reports;
create policy "reports_insert_own" on public.reports
  for insert with check (auth.uid() = reporter_id);
drop policy if exists "reports_select_own" on public.reports;
create policy "reports_select_own" on public.reports
  for select using (auth.uid() = reporter_id);
revoke insert on public.reports from anon, authenticated;
grant insert (reporter_id, reported_user_id, moment_id, reason, details)
  on public.reports to authenticated;

-- notifications : les siennes, et seulement pour les marquer lues.
drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications
  for select using (auth.uid() = user_id);
drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
revoke update on public.notifications from anon, authenticated;
grant update (read_at) on public.notifications to authenticated;

-- ── Realtime ─────────────────────────────────────────────────────────────────
-- Chat du jour J et badge de notifications (RLS appliqué aux abonnements).

do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.moment_messages;
    exception when duplicate_object then null; end;
    begin
      alter publication supabase_realtime add table public.notifications;
    exception when duplicate_object then null; end;
  end if;
end $$;

-- ── Storage : photos Rencontres ──────────────────────────────────────────────
-- Bucket privé. Chaque utilisateur écrit dans {son user_id}/… ; la lecture
-- (donc la création d'URL signée) n'est permise qu'après double acceptation.

insert into storage.buckets (id, name, public)
values ('rencontre-photos', 'rencontre-photos', false)
on conflict (id) do nothing;

drop policy if exists "rencontre_photos_select" on storage.objects;
create policy "rencontre_photos_select" on storage.objects
  for select to authenticated using (
    bucket_id = 'rencontre-photos'
    and public.rencontre_photo_visible(((storage.foldername(name))[1])::uuid)
  );
drop policy if exists "rencontre_photos_insert" on storage.objects;
create policy "rencontre_photos_insert" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'rencontre-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
drop policy if exists "rencontre_photos_update" on storage.objects;
create policy "rencontre_photos_update" on storage.objects
  for update to authenticated using (
    bucket_id = 'rencontre-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
drop policy if exists "rencontre_photos_delete" on storage.objects;
create policy "rencontre_photos_delete" on storage.objects
  for delete to authenticated using (
    bucket_id = 'rencontre-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
