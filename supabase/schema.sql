-- miPlanr Poll 2.0 / 2.1 full safe schema upgrade
-- Run this in Supabase SQL Editor. It is safe to run more than once.

create extension if not exists "pgcrypto";

create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  question text,
  event_title text,
  creator_name text,
  deadline text,
  threshold integer default 3,
  created_at timestamptz default now()
);

create table if not exists public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid references public.polls(id) on delete cascade,
  label text,
  sort_order integer default 0,
  created_at timestamptz default now()
);

create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid references public.polls(id) on delete cascade,
  email text,
  name_or_email text,
  created_at timestamptz default now()
);

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid references public.polls(id) on delete cascade,
  option_id uuid references public.poll_options(id) on delete cascade,
  voter_name text,
  voter_email text,
  created_at timestamptz default now()
);

create table if not exists public.integration_requests (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid,
  integration_name text,
  requester_email text,
  created_at timestamptz default now()
);

-- Upgrade older prototype columns safely
alter table public.polls add column if not exists slug text;
alter table public.polls add column if not exists question text;
alter table public.polls add column if not exists event_title text;
alter table public.polls add column if not exists creator_name text;
alter table public.polls add column if not exists deadline text;
alter table public.polls add column if not exists threshold integer default 3;
alter table public.polls add column if not exists created_at timestamptz default now();

alter table public.poll_options add column if not exists poll_id uuid references public.polls(id) on delete cascade;
alter table public.poll_options add column if not exists label text;
alter table public.poll_options add column if not exists sort_order integer default 0;
alter table public.poll_options add column if not exists created_at timestamptz default now();

alter table public.participants add column if not exists poll_id uuid references public.polls(id) on delete cascade;
alter table public.participants add column if not exists email text;
alter table public.participants add column if not exists name_or_email text;
alter table public.participants add column if not exists created_at timestamptz default now();
alter table public.participants alter column name_or_email drop not null;

alter table public.votes add column if not exists poll_id uuid references public.polls(id) on delete cascade;
alter table public.votes add column if not exists option_id uuid references public.poll_options(id) on delete cascade;
alter table public.votes add column if not exists voter_name text;
alter table public.votes add column if not exists voter_email text;
alter table public.votes add column if not exists created_at timestamptz default now();

create unique index if not exists idx_polls_slug_unique on public.polls(slug);
create index if not exists idx_poll_options_poll_id on public.poll_options(poll_id);
create index if not exists idx_votes_poll_id on public.votes(poll_id);
create index if not exists idx_votes_option_id on public.votes(option_id);
create index if not exists idx_participants_poll_id on public.participants(poll_id);
create index if not exists idx_integration_requests_poll_id on public.integration_requests(poll_id);
