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


-- v6.1 safety upgrade: fix old constraints and support smarter locations
alter table public.poll_options add column if not exists label text;
update public.poll_options set label = coalesce(label, option_text, '') where label is null;
alter table public.poll_options alter column label drop not null;
alter table public.poll_options alter column option_text drop not null;
alter table public.polls add column if not exists creator_name text;
alter table public.polls add column if not exists creator_email text;
alter table public.polls add column if not exists icon text default '✨';
alter table public.polls add column if not exists category text;
alter table public.polls add column if not exists address_line1 text;
alter table public.polls add column if not exists city text;
alter table public.polls add column if not exists postcode text;
alter table public.polls add column if not exists place_label text;
alter table public.polls add column if not exists place_lat double precision;
alter table public.polls add column if not exists place_lon double precision;
alter table public.polls add column if not exists maps_url text;
alter table public.polls add column if not exists allow_vote_edit boolean default true;
alter table public.polls add column if not exists notify_on_quorum boolean default true;
alter table public.participants add column if not exists name_or_email text;
alter table public.participants alter column name_or_email drop not null;
alter table public.votes add column if not exists participant_id uuid;
alter table public.votes add column if not exists invite_token text;
alter table public.votes add column if not exists voter_name text;
alter table public.votes add column if not exists voter_email text;
alter table public.votes add column if not exists updated_at timestamptz default now();

-- v6.3 safety upgrade
alter table public.poll_options add column if not exists label text;
update public.poll_options set label = coalesce(label, option_text, '') where label is null;
alter table public.poll_options alter column label drop not null;
alter table public.poll_options alter column option_text drop not null;
alter table public.polls add column if not exists place_label text;
alter table public.polls add column if not exists place_lat double precision;
alter table public.polls add column if not exists place_lon double precision;
alter table public.polls add column if not exists maps_url text;
alter table public.polls add column if not exists address_line1 text;
alter table public.polls add column if not exists city text;
alter table public.polls add column if not exists postcode text;


-- v6.4 voting safety: make one invite/email update the existing vote instead of inserting duplicates
alter table public.poll_options add column if not exists label text;
update public.poll_options set label = coalesce(label, option_text, '') where label is null;
alter table public.poll_options alter column label drop not null;
alter table public.poll_options alter column option_text drop not null;

-- remove duplicate votes before adding constraints, keeping the newest vote
with ranked as (
  select id, row_number() over (partition by poll_id, invite_token order by updated_at desc nulls last, created_at desc nulls last, id desc) rn
  from public.votes
  where invite_token is not null and invite_token <> ''
)
delete from public.votes v using ranked r where v.id = r.id and r.rn > 1;

with ranked as (
  select id, row_number() over (partition by poll_id, lower(voter_email) order by updated_at desc nulls last, created_at desc nulls last, id desc) rn
  from public.votes
  where voter_email is not null and voter_email <> ''
)
delete from public.votes v using ranked r where v.id = r.id and r.rn > 1;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'votes_poll_invite_unique') then
    alter table public.votes add constraint votes_poll_invite_unique unique (poll_id, invite_token);
  end if;
exception when duplicate_table then null; when unique_violation then null;
end $$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'votes_poll_email_unique') then
    alter table public.votes add constraint votes_poll_email_unique unique (poll_id, voter_email);
  end if;
exception when duplicate_table then null; when unique_violation then null;
end $$;


-- v6.6 voting safety: supports projects where older unique constraints were not applied.
-- cast-vote.js now updates/inserts votes safely without depending on ON CONFLICT.
create index if not exists idx_votes_poll_invite_lookup on public.votes(poll_id, invite_token);
create index if not exists idx_votes_poll_email_lookup on public.votes(poll_id, voter_email);

-- v7.2 calendar polling: options can be date/time slots and voters can say yes to multiple slots
alter table public.polls add column if not exists poll_type text default 'standard';
alter table public.poll_options add column if not exists start_at timestamptz;
alter table public.poll_options add column if not exists end_at timestamptz;

create table if not exists public.calendar_poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid references public.polls(id) on delete cascade,
  option_id uuid references public.poll_options(id) on delete cascade,
  participant_id uuid references public.participants(id) on delete set null,
  invite_token text,
  voter_name text,
  voter_email text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_calendar_poll_votes_poll on public.calendar_poll_votes(poll_id);
create index if not exists idx_calendar_poll_votes_option on public.calendar_poll_votes(option_id);
create index if not exists idx_calendar_poll_votes_invite on public.calendar_poll_votes(poll_id, invite_token);
create index if not exists idx_calendar_poll_votes_email on public.calendar_poll_votes(poll_id, voter_email);

-- v7.5 admin results, team access toggle, export/sync support
alter table public.polls add column if not exists admin_token text;
alter table public.polls add column if not exists results_visible boolean default true;
alter table public.polls add column if not exists roster_webhook_url text;
create index if not exists idx_polls_admin_token on public.polls(admin_token);

-- Backfill admin tokens for older polls that do not yet have one
update public.polls set admin_token = encode(gen_random_bytes(12), 'hex') where admin_token is null;

-- v7.7 roster sync type persistence
alter table public.polls add column if not exists roster_sync_type text default 'none';

-- v8.0.3 poll consolidation: same title/question/options write to the same poll record
alter table public.polls add column if not exists poll_group_key text;
create index if not exists idx_polls_group_key on public.polls(poll_group_key);

-- v8.0.4 poll expiry: deadline_at closes consolidated polls. If creator leaves expiry blank, the app sends the first option start time.
