-- KFM Transport live driver tracking
-- Run this in Supabase SQL Editor before testing the feature in Preview.
-- Stores only the latest GPS point per driver; no location history is retained.

create table if not exists public.driver_locations (
  driver_id uuid primary key references public.drivers(id) on delete cascade,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  accuracy_m double precision,
  updated_at timestamptz not null default now()
);

alter table public.driver_locations enable row level security;

-- Location writes/reads are performed by authenticated server routes using
-- the service-role key. Browser clients must not read or write this table.
revoke all on table public.driver_locations from anon, authenticated;
grant all on table public.driver_locations to service_role;
