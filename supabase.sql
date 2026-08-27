-- Run this in Supabase SQL Editor
-- Enable pgcrypto for gen_random_uuid if not enabled
create extension if not exists "pgcrypto";

-- Users: mirrors NextAuth but also stores tokens
create table if not exists users (
  id text primary key, -- email or next-auth id
  email text unique not null,
  name text,
  gmail_refresh_token text,
  slack_access_token text,
  slack_team_id text,
  created_at timestamptz default now()
);

-- Promises extracted
create table if not exists promises (
  id uuid primary key default gen_random_uuid(),
  user_id text references users(id) on delete cascade not null,
  source text not null check (source in ('gmail','slack','demo')),
  source_id text not null, -- gmail message id or slack ts+channel
  recipient text, -- to whom promise was made
  promise_text text not null,
  context_snippet text, -- surrounding sentence for explainability
  due_date date,
  confidence numeric(3,2) check (confidence >=0 and confidence <=1),
  status text not null default 'open' check (status in ('open','done','snoozed')),
  snoozed_until date,
  created_at timestamptz default now(),
  unique(user_id, source, source_id, promise_text)
);

create index if not exists idx_promises_user_status_due on promises(user_id, status, due_date);
create index if not exists idx_promises_user_created on promises(user_id, created_at desc);

-- Optional: digests log
create table if not exists digests (
  id uuid primary key default gen_random_uuid(),
  user_id text references users(id) on delete cascade not null,
  sent_at timestamptz default now(),
  promise_count int not null
);

-- RLS: for MVP keep disabled. Enable after auth:
-- alter table promises enable row level security;
