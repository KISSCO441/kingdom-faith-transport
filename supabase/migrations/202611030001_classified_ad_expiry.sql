-- KFM Classifieds: expire published adverts after 90 days.
-- Expired adverts are hidden from public listings but retained for renewal and audit.
alter table public.classified_ads
  add column if not exists expired_at timestamptz;

-- Backfill existing published adverts without resetting an already-recorded expiry.
update public.classified_ads
set published_at = coalesce(published_at, created_at),
    expires_at = coalesce(expires_at, coalesce(published_at, created_at) + interval '90 days')
where advert_status in ('active', 'expired');

create index if not exists classified_ads_expiry_idx
  on public.classified_ads (expires_at)
  where advert_status = 'active';

create or replace function public.kfm_expire_classified_adverts()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.classified_ads
  set advert_status = 'expired',
      expired_at = coalesce(expired_at, now()),
      updated_at = now()
  where advert_status = 'active'
    and coalesce(expires_at, coalesce(published_at, created_at) + interval '90 days') <= now();

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.kfm_expire_classified_adverts() from public, anon, authenticated;
grant execute on function public.kfm_expire_classified_adverts() to service_role;

-- Supabase pg_cron runs the expiry sweep once daily.
create extension if not exists pg_cron with schema pg_catalog;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid)
    from cron.job
    where jobname = 'kfm-classified-advert-expiry';

    perform cron.schedule(
      'kfm-classified-advert-expiry',
      '17 2 * * *',
      'select public.kfm_expire_classified_adverts();'
    );
  end if;
end;
$$;
