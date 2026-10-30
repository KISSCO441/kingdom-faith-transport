# KFM live driver tracking — database setup

This is a one-time setup for the **Preview** version of live driver tracking.

1. Open the KFM project in Supabase.
2. Open **SQL Editor** and create a new query.
3. Copy the SQL below into the editor and run it.
4. Confirm that the `driver_locations` table was created.
5. Do not merge the feature into production until the Preview build and ride test pass.

The table stores only the latest GPS position per driver, tied to the active ride. It does not create a location-history trail. Browser clients are denied direct table access; the authenticated server routes handle location reads and writes.

```sql
create table if not exists public.driver_locations (
  driver_id uuid primary key references public.drivers(id) on delete cascade,
  ride_id uuid not null references public.ride_requests(id) on delete cascade,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  accuracy_m double precision,
  updated_at timestamptz not null default now()
);

alter table public.driver_locations enable row level security;

revoke all on table public.driver_locations from anon, authenticated;
grant all on table public.driver_locations to service_role;
```

**Important:** Run this only after confirming the branch Preview build is ready. This creates a new table and does not alter existing ride, payment, or driver records.
