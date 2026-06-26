create extension if not exists "pgcrypto";
create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  question text not null,
  description text,
  creator text,
  location text,
  start_at timestamptz,
  end_at timestamptz,
  deadline_at timestamptz,
  threshold integer default 3,
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
  invite_token text unique,
  has_voted boolean default false,
  created_at timestamptz default now()
);
create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid references public.polls(id) on delete cascade,
  option_id uuid references public.poll_options(id) on delete cascade,
  participant_id uuid references public.participants(id) on delete set null,
  invite_token text,
  voter_name text,
  voter_email text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(poll_id, invite_token),
  unique(poll_id, voter_email)
);
alter table public.polls add column if not exists title text;
alter table public.polls add column if not exists question text;
alter table public.polls add column if not exists description text;
alter table public.polls add column if not exists creator text;
alter table public.polls add column if not exists location text;
alter table public.polls add column if not exists start_at timestamptz;
alter table public.polls add column if not exists end_at timestamptz;
alter table public.polls add column if not exists deadline_at timestamptz;
alter table public.polls add column if not exists threshold integer default 3;
alter table public.poll_options add column if not exists icon text default '✨';
alter table public.participants add column if not exists invite_token text;
alter table public.participants add column if not exists has_voted boolean default false;
alter table public.votes add column if not exists participant_id uuid;
alter table public.votes add column if not exists invite_token text;
alter table public.votes add column if not exists updated_at timestamptz default now();
create index if not exists idx_polls_slug on public.polls(slug);
create index if not exists idx_options_poll on public.poll_options(poll_id);
create index if not exists idx_votes_poll on public.votes(poll_id);
create index if not exists idx_participants_token on public.participants(invite_token);
