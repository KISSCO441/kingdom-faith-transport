-- Preserve classified advert payment/report history and record every permanent deletion.
create table if not exists public.classified_ad_moderation_audit (
  id uuid primary key default gen_random_uuid(),
  advert_id uuid,
  action text not null check (action in ('vendor_deleted','admin_deleted')),
  actor_account_id uuid,
  actor_email text,
  reason text,
  advert_snapshot jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists classified_ad_moderation_audit_advert_idx
  on public.classified_ad_moderation_audit (advert_id, created_at desc);
alter table public.classified_ad_moderation_audit enable row level security;

alter table public.classified_ad_payments
  alter column advert_id drop not null;
alter table public.classified_ad_payments
  drop constraint if exists classified_ad_payments_advert_id_fkey;
alter table public.classified_ad_payments
  add constraint classified_ad_payments_advert_id_fkey
  foreign key (advert_id) references public.classified_ads(id) on delete set null;

alter table public.classified_ad_reports
  alter column advert_id drop not null;
alter table public.classified_ad_reports
  drop constraint if exists classified_ad_reports_advert_id_fkey;
alter table public.classified_ad_reports
  add constraint classified_ad_reports_advert_id_fkey
  foreign key (advert_id) references public.classified_ads(id) on delete set null;

create or replace function public.kfm_delete_classified_ad(
  p_advert_id uuid,
  p_action text,
  p_actor_account_id uuid default null,
  p_actor_email text default null,
  p_reason text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_advert public.classified_ads%rowtype;
begin
  if p_action not in ('vendor_deleted','admin_deleted') then
    raise exception 'Invalid deletion action';
  end if;

  select * into v_advert
  from public.classified_ads
  where id = p_advert_id
  for update;

  if not found then
    raise exception 'Advert not found';
  end if;

  if p_action = 'vendor_deleted' then
    if p_actor_account_id is null or v_advert.seller_account_id <> p_actor_account_id then
      raise exception 'You can only delete your own advert';
    end if;
  elsif coalesce(trim(p_actor_email), '') = '' then
    raise exception 'Administrator identity is required';
  end if;

  insert into public.classified_ad_moderation_audit
    (advert_id, action, actor_account_id, actor_email, reason, advert_snapshot)
  values
    (v_advert.id, p_action, p_actor_account_id, p_actor_email,
     nullif(trim(p_reason), ''), to_jsonb(v_advert));

  delete from public.classified_ads where id = p_advert_id;
end;
$$;

revoke all on function public.kfm_delete_classified_ad(uuid,text,uuid,text,text) from public, anon, authenticated;
grant execute on function public.kfm_delete_classified_ad(uuid,text,uuid,text,text) to service_role;
