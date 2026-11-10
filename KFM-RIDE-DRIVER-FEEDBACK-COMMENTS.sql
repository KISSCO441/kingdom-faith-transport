-- KFM ride driver comments
-- Apply this migration in the KFM-PREVIEW Supabase SQL Editor only.

alter table public.ride_driver_ratings
  alter column rating drop not null;

alter table public.ride_driver_ratings
  add column if not exists comment text
  check (comment is null or char_length(comment) <= 80);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'ride_driver_ratings_one_feedback_check'
      and conrelid = 'public.ride_driver_ratings'::regclass
  ) then
    alter table public.ride_driver_ratings
      add constraint ride_driver_ratings_one_feedback_check
      check (
        (rating is not null and comment is null)
        or
        (rating is null and comment is not null and char_length(btrim(comment)) between 1 and 80)
      );
  end if;
end $$;
