-- ============================================================
-- Run this in your Supabase project: Dashboard → SQL Editor
-- ============================================================

-- Trips
create table if not exists trips (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  trip_code   text not null unique,
  created_by  uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now()
);

-- Itinerary items
create table if not exists itinerary_items (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid not null references trips(id) on delete cascade,
  title       text not null,
  notes       text,
  start_at    timestamptz not null,
  end_at      timestamptz,
  created_at  timestamptz not null default now()
);

-- Trip membership
create table if not exists trip_members (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid not null references trips(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  joined_at   timestamptz not null default now(),
  unique(trip_id, user_id)
);

-- ============================================================
-- Reset all policies (safe to re-run)
-- ============================================================

alter table trips enable row level security;
alter table itinerary_items enable row level security;
alter table trip_members enable row level security;

drop policy if exists "members can view trip" on trips;
drop policy if exists "anyone can lookup trip by code" on trips;
drop policy if exists "authenticated users can create trips" on trips;
drop policy if exists "creator can update trip" on trips;
drop policy if exists "trips_select" on trips;
drop policy if exists "trips_insert" on trips;
drop policy if exists "trips_update" on trips;

drop policy if exists "members can view items" on itinerary_items;
drop policy if exists "members can add items" on itinerary_items;
drop policy if exists "members can update items" on itinerary_items;
drop policy if exists "members can delete items" on itinerary_items;
drop policy if exists "items_select" on itinerary_items;
drop policy if exists "items_insert" on itinerary_items;
drop policy if exists "items_update" on itinerary_items;
drop policy if exists "items_delete" on itinerary_items;

drop policy if exists "members can view membership" on trip_members;
drop policy if exists "authenticated users can join trips" on trip_members;
drop policy if exists "members_select" on trip_members;
drop policy if exists "members_insert" on trip_members;

-- ============================================================
-- Trips policies
-- ============================================================

-- Any authenticated user can read trips (required for join-by-code lookup
-- and for reading back the trip immediately after creating it)
create policy "trips_select"
  on trips for select
  using (auth.uid() is not null);

create policy "trips_insert"
  on trips for insert
  with check (auth.uid() = created_by);

create policy "trips_update"
  on trips for update
  using (auth.uid() = created_by);

-- ============================================================
-- Itinerary items policies (trip members only)
-- ============================================================

create policy "items_select"
  on itinerary_items for select
  using (
    exists (
      select 1 from trip_members
      where trip_members.trip_id = itinerary_items.trip_id
      and trip_members.user_id = auth.uid()
    )
  );

create policy "items_insert"
  on itinerary_items for insert
  with check (
    exists (
      select 1 from trip_members
      where trip_members.trip_id = itinerary_items.trip_id
      and trip_members.user_id = auth.uid()
    )
  );

create policy "items_update"
  on itinerary_items for update
  using (
    exists (
      select 1 from trip_members
      where trip_members.trip_id = itinerary_items.trip_id
      and trip_members.user_id = auth.uid()
    )
  );

create policy "items_delete"
  on itinerary_items for delete
  using (
    exists (
      select 1 from trip_members
      where trip_members.trip_id = itinerary_items.trip_id
      and trip_members.user_id = auth.uid()
    )
  );

-- ============================================================
-- Trip members policies
-- ============================================================

-- Users can only see their own membership rows (avoids recursion)
create policy "members_select"
  on trip_members for select
  using (auth.uid() = user_id);

create policy "members_insert"
  on trip_members for insert
  with check (auth.uid() = user_id);
