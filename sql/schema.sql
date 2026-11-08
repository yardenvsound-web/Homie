-- Homie V1 schema: exactly three tables (ARCHITECTURE.md, section 2).
-- Run in the Supabase SQL Editor, before policies.sql and seed.sql.
-- Dates/times are Israel local time without a time zone; only timestamps are timestamptz.

create table if not exists public.events (
  id                  uuid primary key default gen_random_uuid(),
  title               text not null,
  date                date not null,
  start_time          time,                      -- null = all-day event
  end_time            time,
  source              text not null check (source in ('homie', 'google')),
  status              text not null default 'approved'
                        check (status in ('pending', 'approved', 'dismissed')),
  assigned_member_ids jsonb not null default '[]'::jsonb,  -- ids from data/members.json
  google_event_id     text unique,               -- prevents duplicate Google imports
  updated_from_google boolean not null default false,
  notes               text,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

create table if not exists public.tasks (
  id                  uuid primary key default gen_random_uuid(),
  title               text not null,
  date                date not null,
  time                time,                      -- null = task without a time
  status              text not null default 'todo' check (status in ('todo', 'done')),
  assigned_member_ids jsonb not null default '[]'::jsonb,
  notes               text,
  reminder_at         timestamptz,
  reminder_sent       boolean not null default false,
  recurrence_type     text not null default 'none'
                        check (recurrence_type in ('none', 'daily', 'weekly')),
  source              text not null default 'manual' check (source in ('manual', 'ai')),
  proposal_status     text not null default 'none'
                        check (proposal_status in ('none', 'proposed', 'approved', 'rejected')),
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

create table if not exists public.shopping_items (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  quantity   integer not null default 1 check (quantity >= 1),
  purchased  boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists events_date_idx on public.events (date);
create index if not exists tasks_date_idx  on public.tasks (date);

-- RLS on from the start, so no table is ever open. Policies live in policies.sql.
alter table public.events         enable row level security;
alter table public.tasks          enable row level security;
alter table public.shopping_items enable row level security;

-- Table privileges for the API roles. RLS still decides which rows each role sees;
-- with no anon policy, an anonymous read returns 0 rows (not a permission error).
grant select, insert, update, delete on public.events, public.tasks, public.shopping_items
  to anon, authenticated;
