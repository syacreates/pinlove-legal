-- ─────────────────────────────────────────────────────────────────────────────
-- PinLove — Supabase schema
-- Run in the Supabase SQL Editor or via `supabase db push`
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── users ─────────────────────────────────────────────────────────────────────
-- Extends Supabase auth.users with app-specific profile data.
create table if not exists public.users (
  id                   uuid primary key references auth.users(id) on delete cascade,
  email                text not null,
  username             text not null unique,
  full_name            text not null,
  avatar_url           text,
  plan                 text not null default 'free' check (plan in ('free', 'premium')),
  premium_purchased_at timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- RLS
alter table public.users enable row level security;
create policy "Users can view their own profile" on public.users
  for select using (auth.uid() = id);
create policy "Users can update their own profile" on public.users
  for update using (auth.uid() = id);

-- ── places ────────────────────────────────────────────────────────────────────
create table if not exists public.places (
  id                      uuid primary key default uuid_generate_v4(),
  user_id                 uuid not null references public.users(id) on delete cascade,
  name                    text not null,
  address                 text not null,
  city                    text not null,
  country                 text not null default 'France',
  category                text not null default 'other',
  description             text,
  note                    text,
  photo_url               text,
  latitude                double precision not null,
  longitude               double precision not null,
  visibility              text not null default 'private' check (visibility in ('private', 'friends', 'public')),
  shared_with_friend_ids  uuid[] not null default '{}',
  -- Import source (stored as JSONB for flexibility)
  source_platform         text check (source_platform in ('tiktok', 'instagram', 'manual', 'other')),
  source_url              text,
  source_post_id          text,
  source_parsed_at        timestamptz,
  source_confidence       double precision check (source_confidence between 0 and 1),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- Indexes
create index if not exists places_user_id_idx on public.places(user_id);
create index if not exists places_visibility_idx on public.places(visibility);
create index if not exists places_category_idx on public.places(category);
create index if not exists places_created_at_idx on public.places(created_at desc);

-- RLS
alter table public.places enable row level security;

-- Owner can do everything
create policy "Owner can manage their places" on public.places
  for all using (auth.uid() = user_id);

-- Public visibility → everyone can read
create policy "Public places are readable by all" on public.places
  for select using (visibility = 'public');

-- Friends visibility → must be in shared_with_friend_ids
create policy "Friends can read shared places" on public.places
  for select using (
    visibility = 'friends' and
    auth.uid() = any(shared_with_friend_ids)
  );

-- ── friend_connections ────────────────────────────────────────────────────────
create table if not exists public.friend_connections (
  id             uuid primary key default uuid_generate_v4(),
  requester_id   uuid not null references public.users(id) on delete cascade,
  addressee_id   uuid not null references public.users(id) on delete cascade,
  status         text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  invite_token   text unique,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique(requester_id, addressee_id)
);

create index if not exists fc_requester_idx on public.friend_connections(requester_id);
create index if not exists fc_addressee_idx on public.friend_connections(addressee_id);
create index if not exists fc_token_idx on public.friend_connections(invite_token);

alter table public.friend_connections enable row level security;

create policy "Users can view their own connections" on public.friend_connections
  for select using (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy "Users can create connection requests" on public.friend_connections
  for insert with check (auth.uid() = requester_id);

create policy "Addressee can update (accept/decline)" on public.friend_connections
  for update using (auth.uid() = addressee_id);

-- ── premium_purchases ─────────────────────────────────────────────────────────
create table if not exists public.premium_purchases (
  id                       uuid primary key default uuid_generate_v4(),
  user_id                  uuid not null references public.users(id) on delete cascade,
  stripe_payment_intent_id text not null unique,
  amount_cents             integer not null,
  currency                 text not null default 'eur',
  status                   text not null default 'pending' check (status in ('pending', 'succeeded', 'failed')),
  created_at               timestamptz not null default now()
);

alter table public.premium_purchases enable row level security;
create policy "Users can view their own purchases" on public.premium_purchases
  for select using (auth.uid() = user_id);

-- ── Trigger: auto-create user profile after signup ────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, email, username, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Trigger: update updated_at automatically ──────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_places_updated_at
  before update on public.places
  for each row execute procedure public.set_updated_at();

create trigger set_users_updated_at
  before update on public.users
  for each row execute procedure public.set_updated_at();

create trigger set_fc_updated_at
  before update on public.friend_connections
  for each row execute procedure public.set_updated_at();
