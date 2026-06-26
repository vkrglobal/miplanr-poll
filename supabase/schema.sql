create extension if not exists pgcrypto;

create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  question text not null,
  event_title text,
  creator text,
  deadline text,
  threshold integer not null default 1,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table if not exists public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  label text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  email text,
  name text,
  created_at timestamptz not null default now()
);

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  option_id uuid not null references public.poll_options(id) on delete cascade,
  voter_name text,
  voter_email text,
  created_at timestamptz not null default now()
);

create table if not exists public.integration_requests (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid references public.polls(id) on delete set null,
  integration_name text not null,
  requester_email text,
  status text not null default 'requested',
  created_at timestamptz not null default now()
);

create index if not exists idx_poll_options_poll_id on public.poll_options(poll_id);
create index if not exists idx_participants_poll_id on public.participants(poll_id);
create index if not exists idx_votes_poll_id on public.votes(poll_id);
create index if not exists idx_votes_option_id on public.votes(option_id);
create index if not exists idx_polls_slug on public.polls(slug);

alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.participants enable row level security;
alter table public.votes enable row level security;
alter table public.integration_requests enable row level security;
