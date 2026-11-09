-- KFM ride driver feedback
-- Apply this in the KFM-PREVIEW Supabase SQL Editor before testing the feedback form.

create table if not exists public.ride_driver_ratings (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid not null references public.ride_requests(id) on delete cascade,
  driver_id uuid not null references public.drivers(id) on delete restrict,
  rating smallint not null check (rating in (1, 2, 3)),
  created_at timestamptz not null default now(),
  constraint ride_driver_ratings_one_per_ride unique (ride_id)
);

create index if not exists ride_driver_ratings_driver_id_idx
  on public.ride_driver_ratings (driver_id);

alter table public.ride_driver_ratings enable row level security;

revoke all on table public.ride_driver_ratings from anon, authenticated;
grant select, insert on table public.ride_driver_ratings to service_role;
