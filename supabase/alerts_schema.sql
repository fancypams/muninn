-- ============================================================
-- Run this in Supabase SQL Editor after schema.sql
-- ============================================================

-- Alerts (soft = in-app banner, hard = push notification)
create table if not exists alerts (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid not null references trips(id) on delete cascade,
  item_id     uuid not null references itinerary_items(id) on delete cascade,
  sent_by     uuid not null references auth.users(id) on delete cascade,
  sender_email text not null,
  type        text not null check (type in ('soft', 'hard')),
  created_at  timestamptz not null default now()
);

-- Device push tokens (one per user, upserted on login)
create table if not exists push_tokens (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  token       text not null,
  updated_at  timestamptz not null default now()
);

-- RLS
alter table alerts enable row level security;
alter table push_tokens enable row level security;

drop policy if exists "alerts_select" on alerts;
drop policy if exists "alerts_insert" on alerts;
drop policy if exists "push_tokens_select" on push_tokens;
drop policy if exists "push_tokens_upsert" on push_tokens;

-- Trip members can view alerts for their trips
create policy "alerts_select" on alerts for select
  using (exists (
    select 1 from trip_members
    where trip_members.trip_id = alerts.trip_id
    and trip_members.user_id = auth.uid()
  ));

-- Trip members can send alerts
create policy "alerts_insert" on alerts for insert
  with check (
    auth.uid() = sent_by
    and exists (
      select 1 from trip_members
      where trip_members.trip_id = alerts.trip_id
      and trip_members.user_id = auth.uid()
    )
  );

-- Users manage their own push token
create policy "push_tokens_select" on push_tokens for select
  using (auth.uid() = user_id);

create policy "push_tokens_upsert" on push_tokens for insert
  with check (auth.uid() = user_id);

create policy "push_tokens_update" on push_tokens for update
  using (auth.uid() = user_id);

-- Enable Realtime for alerts
alter publication supabase_realtime add table alerts;
