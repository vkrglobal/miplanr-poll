-- miPlanr Poll v3.0 Production Schema
create extension if not exists "pgcrypto";

create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  question text not null,
  description text,
  category text,
  icon text default '🗳️',
  creator_name text,
  creator_email text,
  location text,
  start_at timestamptz,
  end_at timestamptz,
  deadline_at timestamptz,
  threshold integer default 3,
  allow_vote_edit boolean default true,
  notify_email boolean default true,
  notify_whatsapp boolean default false,
  quorum_notified_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  option_text text not null,
  icon text default '✨',
  sort_order integer default 0,
  created_at timestamptz default now()
);

create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  email text,
  name text,
  invite_token text unique not null default encode(gen_random_bytes(16), 'hex'),
  invited_at timestamptz default now(),
  last_notified_at timestamptz
);

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  option_id uuid not null references public.poll_options(id) on delete cascade,
  participant_id uuid references public.participants(id) on delete set null,
  voter_name text,
  voter_email text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- One invitation can only have one current vote per poll.
create unique index if not exists ux_votes_poll_participant
on public.votes(poll_id, participant_id)
where participant_id is not null;

-- Fallback for public/generic links: one email can only vote once per poll.
create unique index if not exists ux_votes_poll_email
on public.votes(poll_id, lower(voter_email))
where voter_email is not null and participant_id is null;

create index if not exists idx_polls_slug on public.polls(slug);
create index if not exists idx_options_poll on public.poll_options(poll_id);
create index if not exists idx_participants_poll on public.participants(poll_id);
create index if not exists idx_participants_token on public.participants(invite_token);
create index if not exists idx_votes_poll on public.votes(poll_id);

alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.participants enable row level security;
alter table public.votes enable row level security;
