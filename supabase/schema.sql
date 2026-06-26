-- miPlanr Poll v2 database schema
-- Run this in Supabase SQL Editor once.

create extension if not exists pgcrypto;

create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null default substr(replace(gen_random_uuid()::text, '-', ''), 1, 8),
  question text not null,
  event_title text,
  creator_name text default 'Josh Sim',
  deadline text,
  threshold integer default 1,
  status text default 'open',
  created_at timestamptz default now()
);

create table if not exists public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  label text not null,
  sort_order integer default 0,
  created_at timestamptz default now()
);

create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  name_or_email text not null,
  created_at timestamptz default now()
);

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  option_id uuid not null references public.poll_options(id) on delete cascade,
  voter_name text,
  voter_email text,
  created_at timestamptz default now()
);

create index if not exists idx_poll_options_poll_id on public.poll_options(poll_id);
create index if not exists idx_votes_poll_id on public.votes(poll_id);
create index if not exists idx_votes_option_id on public.votes(option_id);
create index if not exists idx_participants_poll_id on public.participants(poll_id);
