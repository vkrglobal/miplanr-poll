-- miPlanr Events & Polls v4.0 full safe schema
create extension if not exists "pgcrypto";
create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  question text not null,
  description text,
  category text,
  icon text default '✨',
  creator_name text,
  creator_email text,
  location text,
  maps_url text,
  lat numeric,
  lng numeric,
  place_id text,
  start_at timestamptz,
  end_at timestamptz,
  deadline_at timestamptz,
  threshold integer default 3,
  allow_vote_edit boolean default true,
  allow_multiple_choice boolean default false,
  notify_on_quorum boolean default true,
  quorum_notified boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create table if not exists public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid references public.polls(id) on delete cascade,
  option_text text not null,
  icon text default '✨',
  sort_order integer default 0,
  created_at timestamptz default now()
);
create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid references public.polls(id) on delete cascade,
  email text,
  name_or_email text,
  invite_token text unique,
  has_voted boolean default false,
  created_at timestamptz default now()
);
create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid references public.polls(id) on delete cascade,
  option_id uuid references public.poll_options(id) on delete cascade,
  participant_id uuid references public.participants(id) on delete cascade,
  invite_token text,
  voter_name text,
  voter_email text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
-- safe upgrades for older databases
alter table public.polls add column if not exists slug text;
alter table public.polls add column if not exists title text;
alter table public.polls add column if not exists question text;
alter table public.polls add column if not exists description text;
alter table public.polls add column if not exists category text;
alter table public.polls add column if not exists icon text default '✨';
alter table public.polls add column if not exists creator_name text;
alter table public.polls add column if not exists creator_email text;
alter table public.polls add column if not exists location text;
alter table public.polls add column if not exists maps_url text;
alter table public.polls add column if not exists lat numeric;
alter table public.polls add column if not exists lng numeric;
alter table public.polls add column if not exists place_id text;
alter table public.polls add column if not exists start_at timestamptz;
alter table public.polls add column if not exists end_at timestamptz;
alter table public.polls add column if not exists deadline_at timestamptz;
alter table public.polls add column if not exists threshold integer default 3;
alter table public.polls add column if not exists allow_vote_edit boolean default true;
alter table public.polls add column if not exists allow_multiple_choice boolean default false;
alter table public.polls add column if not exists notify_on_quorum boolean default true;
alter table public.polls add column if not exists quorum_notified boolean default false;
alter table public.polls add column if not exists created_at timestamptz default now();
alter table public.polls add column if not exists updated_at timestamptz default now();
alter table public.poll_options add column if not exists poll_id uuid;
alter table public.poll_options add column if not exists option_text text;
alter table public.poll_options add column if not exists icon text default '✨';
alter table public.poll_options add column if not exists sort_order integer default 0;
alter table public.poll_options add column if not exists created_at timestamptz default now();
alter table public.participants add column if not exists poll_id uuid;
alter table public.participants add column if not exists email text;
alter table public.participants add column if not exists name_or_email text;
alter table public.participants add column if not exists invite_token text;
alter table public.participants add column if not exists has_voted boolean default false;
alter table public.participants add column if not exists created_at timestamptz default now();
alter table public.votes add column if not exists poll_id uuid;
alter table public.votes add column if not exists option_id uuid;
alter table public.votes add column if not exists participant_id uuid;
alter table public.votes add column if not exists invite_token text;
alter table public.votes add column if not exists voter_name text;
alter table public.votes add column if not exists voter_email text;
alter table public.votes add column if not exists created_at timestamptz default now();
alter table public.votes add column if not exists updated_at timestamptz default now();
alter table public.participants alter column name_or_email drop not null;
create unique index if not exists idx_polls_slug_unique on public.polls(slug);
create unique index if not exists idx_participants_invite_token_unique on public.participants(invite_token) where invite_token is not null;
create unique index if not exists idx_one_vote_per_participant_poll on public.votes(poll_id, participant_id) where participant_id is not null;
create index if not exists idx_poll_options_poll_id on public.poll_options(poll_id);
create index if not exists idx_votes_poll_id on public.votes(poll_id);
create index if not exists idx_votes_option_id on public.votes(option_id);
create index if not exists idx_votes_participant_id on public.votes(participant_id);
create index if not exists idx_participants_poll_id on public.participants(poll_id);
