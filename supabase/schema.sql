-- miPlanr Poll v5.0 clean production schema
create extension if not exists "pgcrypto";

create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null default 'New miPlanr poll',
  question text not null default 'What works best?',
  description text,
  category text,
  icon text default '✨',
  creator_name text default 'miPlanr',
  creator_email text,
  location text,
  maps_url text,
  start_at timestamptz,
  end_at timestamptz,
  deadline_at timestamptz,
  deadline text,
  threshold integer default 3,
  allow_vote_edit boolean default true,
  allow_multiple_choice boolean default false,
  notify_on_quorum boolean default true,
  quorum_notified boolean default false,
  language text default 'English',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  label text not null default '',
  option_text text not null default '',
  icon text default '✨',
  sort_order integer default 0,
  created_at timestamptz default now()
);

create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  email text,
  name_or_email text,
  invite_token text unique,
  has_voted boolean default false,
  last_voted_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  option_id uuid not null references public.poll_options(id) on delete cascade,
  participant_id uuid references public.participants(id) on delete set null,
  invite_token text,
  voter_name text,
  voter_email text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.poll_translations (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid references public.polls(id) on delete cascade,
  language text not null,
  payload jsonb not null,
  created_at timestamptz default now()
);

-- safe upgrades for any older miPlanr databases
alter table public.polls add column if not exists title text default 'New miPlanr poll';
alter table public.polls add column if not exists question text default 'What works best?';
alter table public.polls add column if not exists description text;
alter table public.polls add column if not exists category text;
alter table public.polls add column if not exists icon text default '✨';
alter table public.polls add column if not exists creator_name text default 'miPlanr';
alter table public.polls add column if not exists creator_email text;
alter table public.polls add column if not exists location text;
alter table public.polls add column if not exists maps_url text;
alter table public.polls add column if not exists start_at timestamptz;
alter table public.polls add column if not exists end_at timestamptz;
alter table public.polls add column if not exists deadline_at timestamptz;
alter table public.polls add column if not exists deadline text;
alter table public.polls add column if not exists threshold integer default 3;
alter table public.polls add column if not exists allow_vote_edit boolean default true;
alter table public.polls add column if not exists allow_multiple_choice boolean default false;
alter table public.polls add column if not exists notify_on_quorum boolean default true;
alter table public.polls add column if not exists quorum_notified boolean default false;
alter table public.polls add column if not exists language text default 'English';
alter table public.polls add column if not exists created_at timestamptz default now();
alter table public.polls add column if not exists updated_at timestamptz default now();

alter table public.poll_options add column if not exists label text default '';
alter table public.poll_options add column if not exists option_text text default '';
alter table public.poll_options add column if not exists icon text default '✨';
alter table public.poll_options add column if not exists sort_order integer default 0;
alter table public.poll_options add column if not exists created_at timestamptz default now();
update public.poll_options set label = coalesce(nullif(label,''), option_text, 'Option') where label is null or label = '';
update public.poll_options set option_text = coalesce(nullif(option_text,''), label, 'Option') where option_text is null or option_text = '';
alter table public.poll_options alter column label set not null;
alter table public.poll_options alter column option_text set not null;

alter table public.participants add column if not exists email text;
alter table public.participants add column if not exists name_or_email text;
alter table public.participants add column if not exists invite_token text;
alter table public.participants add column if not exists has_voted boolean default false;
alter table public.participants add column if not exists last_voted_at timestamptz;
alter table public.participants add column if not exists created_at timestamptz default now();
alter table public.participants alter column name_or_email drop not null;

alter table public.votes add column if not exists participant_id uuid;
alter table public.votes add column if not exists invite_token text;
alter table public.votes add column if not exists voter_name text;
alter table public.votes add column if not exists voter_email text;
alter table public.votes add column if not exists created_at timestamptz default now();
alter table public.votes add column if not exists updated_at timestamptz default now();

create index if not exists idx_polls_slug on public.polls(slug);
create index if not exists idx_options_poll on public.poll_options(poll_id);
create index if not exists idx_participants_poll on public.participants(poll_id);
create index if not exists idx_participants_token on public.participants(invite_token);
create index if not exists idx_votes_poll on public.votes(poll_id);
create index if not exists idx_votes_participant on public.votes(participant_id);
create unique index if not exists uniq_vote_per_participant on public.votes(participant_id) where participant_id is not null;
create unique index if not exists uniq_vote_per_invite on public.votes(invite_token) where invite_token is not null;
