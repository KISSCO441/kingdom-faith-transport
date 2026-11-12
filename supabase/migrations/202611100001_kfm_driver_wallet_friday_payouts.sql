-- KFM Driver Wallet + Friday Weekly Payouts
-- REVIEW / PREVIEW ONLY. Apply to KFM-PREVIEW after reviewing this migration.
-- No automatic bank or mobile-money transfers are initiated by this migration.
-- Ride payment confirmation remains the source of truth. Ledger entries are idempotent.

create table if not exists public.kfm_wallet_accounts (
  id uuid primary key default gen_random_uuid(),
  account_type text not null check (account_type in ('driver','kfm')),
  driver_id uuid references public.drivers(id) on delete restrict,
  currency text not null default 'GHS' check (currency = 'GHS'),
  created_at timestamptz not null default now(),
  check ((account_type = 'driver' and driver_id is not null) or (account_type = 'kfm' and driver_id is null))
);
create unique index if not exists kfm_wallet_driver_account_uidx
  on public.kfm_wallet_accounts(driver_id) where account_type = 'driver';
create unique index if not exists kfm_wallet_kfm_account_uidx
  on public.kfm_wallet_accounts(account_type) where account_type = 'kfm';

create table if not exists public.kfm_wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_account_id uuid not null references public.kfm_wallet_accounts(id) on delete restrict,
  driver_id uuid references public.drivers(id) on delete restrict,
  ride_id uuid references public.ride_requests(id) on delete restrict,
  payout_id uuid,
  transaction_type text not null check (transaction_type in (
    'ride_driver_credit','ride_kfm_commission','ride_driver_reversal','ride_kfm_reversal','cash_commission_debit','cash_commission_reversal','weekly_payout_debit'
  )),
  direction text not null check (direction in ('credit','debit')),
  amount numeric(12,2) not null check (amount > 0),
  currency text not null default 'GHS' check (currency = 'GHS'),
  reference text not null unique,
  description text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check ((ride_id is not null and payout_id is null) or (ride_id is null and payout_id is not null))
);
create unique index if not exists kfm_wallet_ride_entry_uidx
  on public.kfm_wallet_transactions(ride_id, transaction_type) where ride_id is not null;
create unique index if not exists kfm_wallet_payout_entry_uidx
  on public.kfm_wallet_transactions(payout_id, transaction_type) where payout_id is not null;
create index if not exists kfm_wallet_transactions_account_created_idx
  on public.kfm_wallet_transactions(wallet_account_id, created_at desc);
create index if not exists kfm_wallet_transactions_driver_created_idx
  on public.kfm_wallet_transactions(driver_id, created_at desc);

create table if not exists public.kfm_driver_payout_batches (
  id uuid primary key default gen_random_uuid(),
  period_start date not null,
  period_end date not null,
  scheduled_for date not null,
  batch_status text not null default 'draft' check (batch_status in ('draft','approved','processing','completed','cancelled')),
  total_amount numeric(12,2) not null default 0 check (total_amount >= 0),
  payout_count integer not null default 0 check (payout_count >= 0),
  created_by uuid,
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  check (period_end >= period_start),
  check (extract(isodow from scheduled_for) = 5),
  unique(period_start, period_end)
);

create table if not exists public.kfm_driver_payouts (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.kfm_driver_payout_batches(id) on delete restrict,
  driver_id uuid not null references public.drivers(id) on delete restrict,
  wallet_account_id uuid not null references public.kfm_wallet_accounts(id) on delete restrict,
  payout_method text not null default 'mobile_money' check (payout_method = 'mobile_money'),
  payout_account_name text not null,
  payout_mobile_money_number text not null,
  payout_mobile_money_network text not null check (payout_mobile_money_network in ('MTN','Telecel','AirtelTigo')),
  amount numeric(12,2) not null check (amount > 0),
  payout_status text not null default 'pending' check (payout_status in ('pending','approved','paid','held')),
  payout_reference text,
  paid_at timestamptz,
  reviewed_by uuid,
  admin_note text,
  created_at timestamptz not null default now(),
  unique(batch_id, driver_id)
);
create index if not exists kfm_driver_payouts_batch_status_idx
  on public.kfm_driver_payouts(batch_id, payout_status);
create index if not exists kfm_driver_payouts_driver_created_idx
  on public.kfm_driver_payouts(driver_id, created_at desc);

-- Create wallet ledger entries only when a completed ride is persisted as PAID.
-- Unique indexes make webhook retries and repeated verification requests harmless.
create or replace function public.kfm_record_paid_ride_wallet_entries()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_fare numeric(12,2);
  v_driver_share numeric(12,2);
  v_kfm_share numeric(12,2);
  v_driver_wallet_id uuid;
  v_kfm_wallet_id uuid;
  v_should_record boolean := false;
begin
  if tg_op = 'INSERT' then
    v_should_record := true;
  else
    v_should_record := lower(coalesce(old.payment_status,'')) <> 'paid'
      or lower(coalesce(old.ride_status,'')) <> 'completed';
  end if;

  if lower(coalesce(new.payment_status,'')) = 'paid'
     and lower(coalesce(new.ride_status,'')) = 'completed'
     and new.driver_id is not null
     and v_should_record then
    v_fare := round(coalesce(new.fare_estimate,0)::numeric, 2);
    if v_fare <= 0 then return new; end if;
    -- The current KFM policy is a fixed 80% driver / 20% KFM split.
    -- Calculate from the existing ride_requests fare column; do not depend on
    -- optional allocation columns that are not part of the ride schema.
    v_driver_share := round(v_fare * 0.80, 2);
    v_kfm_share := round(v_fare - v_driver_share, 2);
    if v_driver_share <= 0 or v_kfm_share < 0 or round(v_driver_share + v_kfm_share,2) <> v_fare then
      raise exception 'KFM wallet allocation does not reconcile for ride %', new.id;
    end if;

    insert into public.kfm_wallet_accounts(account_type, driver_id)
      values ('driver', new.driver_id)
      on conflict (driver_id) where account_type = 'driver' do nothing;
    select id into v_driver_wallet_id
      from public.kfm_wallet_accounts where account_type = 'driver' and driver_id = new.driver_id;

    insert into public.kfm_wallet_accounts(account_type, driver_id)
      values ('kfm', null)
      on conflict (account_type) where account_type = 'kfm' do nothing;
    select id into v_kfm_wallet_id
      from public.kfm_wallet_accounts where account_type = 'kfm' and driver_id is null;

    if lower(coalesce(new.payment_method,'')) = 'cash' then
      -- Driver collected the full fare: KFM's 20% is due from the driver.
      -- A debit may take the driver's ledger below zero; it is not cash received by KFM.
      insert into public.kfm_wallet_transactions(
        wallet_account_id,driver_id,ride_id,transaction_type,direction,amount,reference,description,metadata
      ) values (
        v_driver_wallet_id,new.driver_id,new.id,'cash_commission_debit','debit',v_kfm_share,
        'KFM-CASH-DUE-' || upper(replace(new.id::text,'-','')),
        'KFM 20% cash commission due for booking ' || coalesce(new.booking_code,new.id::text),
        jsonb_build_object('booking_code',new.booking_code,'driver_id',new.driver_id,'payment_method','cash','collection_status','due_from_driver')
      ) on conflict do nothing;
    else
      -- Online payment: credit the driver's 80%; existing negative balance offsets first.
      insert into public.kfm_wallet_transactions(
        wallet_account_id,driver_id,ride_id,transaction_type,direction,amount,reference,description,metadata
      ) values (
        v_driver_wallet_id,new.driver_id,new.id,'ride_driver_credit','credit',v_driver_share,
        'KFM-DRIVER-' || upper(replace(new.id::text,'-','')),
        'Verified driver 80% share for booking ' || coalesce(new.booking_code,new.id::text),
        jsonb_build_object('booking_code',new.booking_code,'payment_method',new.payment_method,'payment_paid_at',new.payment_paid_at)
      ) on conflict do nothing;

    end if;

    if v_kfm_share > 0 then
      insert into public.kfm_wallet_transactions(
        wallet_account_id,driver_id,ride_id,transaction_type,direction,amount,reference,description,metadata
      ) values (
        v_kfm_wallet_id,new.driver_id,new.id,'ride_kfm_commission','credit',v_kfm_share,
        'KFM-COMMISSION-' || upper(replace(new.id::text,'-','')),
        case when lower(coalesce(new.payment_method,'')) = 'cash'
          then 'KFM 20% cash commission due from driver for booking ' || coalesce(new.booking_code,new.id::text)
          else 'KFM 20% commission for booking ' || coalesce(new.booking_code,new.id::text) end,
        jsonb_build_object('booking_code',new.booking_code,'driver_id',new.driver_id,
          'payment_method',new.payment_method,'payment_paid_at',new.payment_paid_at,
          'collection_status',case when lower(coalesce(new.payment_method,'')) = 'cash' then 'due_from_driver' else 'received_online' end)
      ) on conflict do nothing;
    end if;
  end if;

  -- Reverse ledger effects if KFM later formally changes a paid ride to disputed/refunded.
  if tg_op = 'UPDATE'
     and lower(coalesce(old.payment_status,'')) = 'paid'
     and lower(coalesce(new.payment_status,'')) in ('cash_disputed','refunded')
     and old.driver_id is not null then
    select id into v_driver_wallet_id from public.kfm_wallet_accounts
      where account_type = 'driver' and driver_id = old.driver_id;
    select id into v_kfm_wallet_id from public.kfm_wallet_accounts
      where account_type = 'kfm' and driver_id is null;

    if v_driver_wallet_id is not null then
      insert into public.kfm_wallet_transactions(
        wallet_account_id,driver_id,ride_id,transaction_type,direction,amount,reference,description
      )
      select v_driver_wallet_id,old.driver_id,old.id,'ride_driver_reversal','debit',amount,
        'KFM-DRIVER-REVERSAL-' || upper(replace(old.id::text,'-','')),
        'Reversal of online driver share for booking ' || coalesce(old.booking_code,old.id::text)
      from public.kfm_wallet_transactions
      where ride_id = old.id and transaction_type = 'ride_driver_credit'
      on conflict do nothing;

      insert into public.kfm_wallet_transactions(
        wallet_account_id,driver_id,ride_id,transaction_type,direction,amount,reference,description
      )
      select v_driver_wallet_id,old.driver_id,old.id,'cash_commission_reversal','credit',amount,
        'KFM-CASH-DUE-REVERSAL-' || upper(replace(old.id::text,'-','')),
        'Reversal of cash commission due for booking ' || coalesce(old.booking_code,old.id::text)
      from public.kfm_wallet_transactions
      where ride_id = old.id and transaction_type = 'cash_commission_debit'
      on conflict do nothing;
    end if;

    if v_kfm_wallet_id is not null then
      insert into public.kfm_wallet_transactions(
        wallet_account_id,ride_id,transaction_type,direction,amount,reference,description,metadata
      )
      select v_kfm_wallet_id,old.id,'ride_kfm_reversal','debit',amount,
        'KFM-COMMISSION-REVERSAL-' || upper(replace(old.id::text,'-','')),
        'Reversal of KFM commission for booking ' || coalesce(old.booking_code,old.id::text),
        jsonb_build_object('driver_id',old.driver_id,'collection_status',metadata->>'collection_status','reverses_transaction_type','ride_kfm_commission')
      from public.kfm_wallet_transactions
      where ride_id = old.id and transaction_type = 'ride_kfm_commission'
      on conflict do nothing;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists kfm_paid_ride_wallet_ledger on public.ride_requests;
create trigger kfm_paid_ride_wallet_ledger
after insert or update of payment_status, ride_status on public.ride_requests
for each row execute function public.kfm_record_paid_ride_wallet_entries();

-- One-time, idempotent backfill for rides already completed and PAID before
-- this migration was installed. Only confirmed PAID rides qualify:
-- cash_pending_driver and cash_disputed are deliberately excluded.
do $$
declare
  r record;
  v_driver_wallet_id uuid;
  v_kfm_wallet_id uuid;
  v_driver_share numeric(12,2);
  v_kfm_share numeric(12,2);
begin
  insert into public.kfm_wallet_accounts(account_type,driver_id)
  select 'driver',rr.driver_id
  from public.ride_requests rr
  where lower(coalesce(rr.payment_status,''))='paid'
    and lower(coalesce(rr.ride_status,''))='completed'
    and rr.driver_id is not null
    and coalesce(rr.fare_estimate,0)::numeric > 0
  on conflict (driver_id) where account_type='driver' do nothing;

  if exists (
    select 1 from public.ride_requests rr
    where lower(coalesce(rr.payment_status,''))='paid'
      and lower(coalesce(rr.ride_status,''))='completed'
      and rr.driver_id is not null
      and coalesce(rr.fare_estimate,0)::numeric > 0
  ) then
    insert into public.kfm_wallet_accounts(account_type,driver_id)
    values ('kfm',null)
    on conflict (account_type) where account_type='kfm' do nothing;
  end if;

  select id into v_kfm_wallet_id
  from public.kfm_wallet_accounts where account_type='kfm' and driver_id is null;

  for r in
    select rr.id,rr.driver_id,rr.fare_estimate,rr.payment_method,rr.booking_code,rr.payment_paid_at
    from public.ride_requests rr
    where lower(coalesce(rr.payment_status,''))='paid'
      and lower(coalesce(rr.ride_status,''))='completed'
      and rr.driver_id is not null
      and coalesce(rr.fare_estimate,0)::numeric > 0
    order by rr.created_at,rr.id
  loop
    v_driver_share := round(r.fare_estimate::numeric * 0.80,2);
    v_kfm_share := round(r.fare_estimate::numeric - v_driver_share,2);

    select id into v_driver_wallet_id
    from public.kfm_wallet_accounts
    where account_type='driver' and driver_id=r.driver_id;

    if lower(coalesce(r.payment_method,''))='cash' then
      insert into public.kfm_wallet_transactions(
        wallet_account_id,driver_id,ride_id,transaction_type,direction,amount,reference,description,metadata
      ) values (
        v_driver_wallet_id,r.driver_id,r.id,'cash_commission_debit','debit',v_kfm_share,
        'KFM-CASH-DUE-' || upper(replace(r.id::text,'-','')),
        'KFM 20% cash commission due for booking ' || coalesce(r.booking_code,r.id::text),
        jsonb_build_object('booking_code',r.booking_code,'driver_id',r.driver_id,'payment_method','cash','collection_status','due_from_driver')
      ) on conflict do nothing;
    else
      insert into public.kfm_wallet_transactions(
        wallet_account_id,driver_id,ride_id,transaction_type,direction,amount,reference,description,metadata
      ) values (
        v_driver_wallet_id,r.driver_id,r.id,'ride_driver_credit','credit',v_driver_share,
        'KFM-DRIVER-' || upper(replace(r.id::text,'-','')),
        'Verified driver 80% share for booking ' || coalesce(r.booking_code,r.id::text),
        jsonb_build_object('booking_code',r.booking_code,'payment_method',r.payment_method,'payment_paid_at',r.payment_paid_at)
      ) on conflict do nothing;
    end if;

    if v_kfm_share > 0 then
      insert into public.kfm_wallet_transactions(
        wallet_account_id,driver_id,ride_id,transaction_type,direction,amount,reference,description,metadata
      ) values (
        v_kfm_wallet_id,r.driver_id,r.id,'ride_kfm_commission','credit',v_kfm_share,
        'KFM-COMMISSION-' || upper(replace(r.id::text,'-','')),
        case when lower(coalesce(r.payment_method,''))='cash'
          then 'KFM 20% cash commission due from driver for booking ' || coalesce(r.booking_code,r.id::text)
          else 'KFM 20% commission for booking ' || coalesce(r.booking_code,r.id::text) end,
        jsonb_build_object('booking_code',r.booking_code,'driver_id',r.driver_id,
          'payment_method',r.payment_method,'payment_paid_at',r.payment_paid_at,
          'collection_status',case when lower(coalesce(r.payment_method,''))='cash' then 'due_from_driver' else 'received_online' end)
      ) on conflict do nothing;
    end if;
  end loop;
end $$;

-- Atomic batch creation: only verified payout profiles and positive unreserved balances.
-- The selected dates label the weekly accounting cycle. The amount is the driver's
-- full current net available wallet balance, including carried-forward earnings/debts,
-- less prior payouts and pending/approved reservations. This prevents old balances
-- from being omitted and previously paid earnings from being paid a second time.
create or replace function public.kfm_create_driver_payout_batch(
  p_period_start date, p_period_end date, p_scheduled_for date, p_created_by uuid
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_batch_id uuid;
  v_count integer := 0;
  v_total numeric(12,2) := 0;
begin
  if p_period_end < p_period_start or extract(isodow from p_scheduled_for) <> 5 then
    raise exception 'Choose a valid period and a Friday payout date.';
  end if;
  insert into public.kfm_driver_payout_batches(period_start,period_end,scheduled_for,created_by)
    values (p_period_start,p_period_end,p_scheduled_for,p_created_by)
    returning id into v_batch_id;

  -- Use the existing verified registration record; no separate payout profile is collected.
  insert into public.kfm_driver_payouts(
    batch_id,driver_id,wallet_account_id,payout_method,payout_account_name,
    payout_mobile_money_number,payout_mobile_money_network,amount
  )
  select v_batch_id,a.driver_id,a.id,'mobile_money',
    coalesce(nullif(trim(d.full_name),''),'KFM Driver'),
    trim(d.momo_number),d.momo_network,
    round(sum(case when t.direction='credit' then t.amount else -t.amount end)
      - coalesce(reserved.amount,0),2)
  from public.kfm_wallet_accounts a
  join public.drivers d on d.id=a.driver_id
  join public.kfm_wallet_transactions t on t.wallet_account_id=a.id
  left join lateral (
    select sum(dp.amount) as amount from public.kfm_driver_payouts dp
    where dp.driver_id=a.driver_id and dp.payout_status in ('pending','approved')
  ) reserved on true
  where a.account_type='driver'
    and upper(coalesce(d.status,''))='VERIFIED'
    and nullif(trim(d.momo_number),'') is not null
    and d.momo_network in ('MTN','Telecel','AirtelTigo')
  group by a.id,a.driver_id,d.full_name,d.momo_number,d.momo_network,reserved.amount
  having round(sum(case when t.direction='credit' then t.amount else -t.amount end)
      - coalesce(reserved.amount,0),2) > 0
  on conflict(batch_id,driver_id) do nothing;

  select count(*),coalesce(sum(amount),0) into v_count,v_total
  from public.kfm_driver_payouts where batch_id=v_batch_id;
  update public.kfm_driver_payout_batches
    set payout_count=v_count,total_amount=v_total where id=v_batch_id;
  return jsonb_build_object('batch_id',v_batch_id,'payout_count',v_count,'total_amount',v_total);
end;
$$;

create or replace function public.kfm_approve_driver_payout_batch(p_batch_id uuid,p_admin_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_count integer;
begin
  update public.kfm_driver_payout_batches
    set batch_status='approved',approved_by=p_admin_id,approved_at=now()
    where id=p_batch_id and batch_status='draft';
  if not found then raise exception 'This payout batch is not awaiting approval.'; end if;
  update public.kfm_driver_payouts set payout_status='approved',reviewed_by=p_admin_id
    where batch_id=p_batch_id and payout_status='pending';
  get diagnostics v_count = row_count;
  return jsonb_build_object('batch_id',p_batch_id,'approved_payouts',v_count);
end;
$$;

create or replace function public.kfm_mark_driver_payout_paid(
  p_payout_id uuid,p_reference text,p_admin_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_payout public.kfm_driver_payouts%rowtype;
begin
  if nullif(trim(p_reference),'') is null then raise exception 'A transfer reference is required.'; end if;
  select * into v_payout from public.kfm_driver_payouts where id=p_payout_id for update;
  if not found or v_payout.payout_status <> 'approved' then
    raise exception 'Only an approved payout can be marked paid.';
  end if;
  insert into public.kfm_wallet_transactions(
    wallet_account_id,driver_id,payout_id,transaction_type,direction,amount,reference,description
  ) values (
    v_payout.wallet_account_id,v_payout.driver_id,v_payout.id,'weekly_payout_debit','debit',v_payout.amount,
    'KFM-PAYOUT-' || upper(replace(v_payout.id::text,'-','')),
    'Friday weekly payout; external transfer reference: ' || trim(p_reference)
  ) on conflict do nothing;
  update public.kfm_driver_payouts
    set payout_status='paid',payout_reference=trim(p_reference),paid_at=now(),reviewed_by=p_admin_id
    where id=p_payout_id;
  update public.kfm_driver_payout_batches b
    set batch_status=case when not exists (
      select 1 from public.kfm_driver_payouts p where p.batch_id=b.id and p.payout_status not in ('paid','held')
    ) then 'completed' else 'processing' end
    where b.id=v_payout.batch_id;
  return jsonb_build_object('payout_id',p_payout_id,'status','paid','amount',v_payout.amount);
end;
$$;

create or replace function public.kfm_hold_driver_payout(p_payout_id uuid,p_admin_id uuid,p_note text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.kfm_driver_payouts
    set payout_status='held',reviewed_by=p_admin_id,admin_note=nullif(trim(p_note),'')
    where id=p_payout_id and payout_status in ('pending','approved');
  if not found then raise exception 'This payout cannot be placed on hold.'; end if;
  return jsonb_build_object('payout_id',p_payout_id,'status','held');
end;
$$;

alter table public.kfm_wallet_accounts enable row level security;
alter table public.kfm_wallet_transactions enable row level security;
alter table public.kfm_driver_payout_batches enable row level security;
alter table public.kfm_driver_payouts enable row level security;
revoke all on public.kfm_wallet_accounts,public.kfm_wallet_transactions,public.kfm_driver_payout_batches,public.kfm_driver_payouts from anon,authenticated;
revoke all on function public.kfm_record_paid_ride_wallet_entries() from public,anon,authenticated;
revoke all on function public.kfm_create_driver_payout_batch(date,date,date,uuid) from public,anon,authenticated;
revoke all on function public.kfm_approve_driver_payout_batch(uuid,uuid) from public,anon,authenticated;
revoke all on function public.kfm_mark_driver_payout_paid(uuid,text,uuid) from public,anon,authenticated;
revoke all on function public.kfm_hold_driver_payout(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.kfm_create_driver_payout_batch(date,date,date,uuid) to service_role;
grant execute on function public.kfm_approve_driver_payout_batch(uuid,uuid) to service_role;
grant execute on function public.kfm_mark_driver_payout_paid(uuid,text,uuid) to service_role;
grant execute on function public.kfm_hold_driver_payout(uuid,uuid,text) to service_role;


-- Authoritative wallet balance calculations are performed in the database,
-- including every ledger row and amounts reserved by pending/approved payouts.
create or replace function public.kfm_get_driver_wallet_balance(p_driver_id uuid)
returns table(ledger_balance numeric,reserved_amount numeric,available_balance numeric)
language sql
security definer
set search_path = public, pg_temp
as $$
  select
    coalesce(sum(case when t.direction='credit' then t.amount else -t.amount end),0)::numeric(12,2),
    coalesce((
      select sum(p.amount) from public.kfm_driver_payouts p
      where p.driver_id=p_driver_id and p.payout_status in ('pending','approved')
    ),0)::numeric(12,2),
    (
      coalesce(sum(case when t.direction='credit' then t.amount else -t.amount end),0)
      - coalesce((
        select sum(p.amount) from public.kfm_driver_payouts p
        where p.driver_id=p_driver_id and p.payout_status in ('pending','approved')
      ),0)
    )::numeric(12,2)
  from public.kfm_wallet_accounts a
  left join public.kfm_wallet_transactions t on t.wallet_account_id=a.id
  where a.account_type='driver' and a.driver_id=p_driver_id
  group by a.id;
$$;

create or replace function public.kfm_list_driver_wallet_balances()
returns table(
  driver_id uuid, full_name text, phone text, wallet_account_id uuid,
  ledger_balance numeric, reserved_amount numeric, available_balance numeric
)
language sql
security definer
set search_path = public, pg_temp
as $$
  select a.driver_id,d.full_name,d.phone,a.id,
    coalesce(sum(case when t.direction='credit' then t.amount else -t.amount end),0)::numeric(12,2),
    coalesce(r.amount,0)::numeric(12,2),
    (coalesce(sum(case when t.direction='credit' then t.amount else -t.amount end),0)-coalesce(r.amount,0))::numeric(12,2)
  from public.kfm_wallet_accounts a
  join public.drivers d on d.id=a.driver_id
  left join public.kfm_wallet_transactions t on t.wallet_account_id=a.id
  left join lateral (
    select sum(p.amount) amount from public.kfm_driver_payouts p
    where p.driver_id=a.driver_id and p.payout_status in ('pending','approved')
  ) r on true
  where a.account_type='driver'
  group by a.id,a.driver_id,d.full_name,d.phone,r.amount
  order by d.full_name;
$$;

do $$
begin
  alter table public.kfm_wallet_transactions
    add constraint kfm_wallet_transactions_payout_fk
    foreign key (payout_id) references public.kfm_driver_payouts(id) on delete restrict;
exception when duplicate_object then null;
end $$;

revoke all on function public.kfm_get_driver_wallet_balance(uuid) from public,anon,authenticated;
revoke all on function public.kfm_list_driver_wallet_balances() from public,anon,authenticated;
grant execute on function public.kfm_get_driver_wallet_balance(uuid) to service_role;
grant execute on function public.kfm_list_driver_wallet_balances() to service_role;


create or replace function public.kfm_get_kfm_commission_balance()
returns numeric
language sql
security definer
set search_path = public, pg_temp
as $$
  select coalesce(sum(case when t.direction='credit' then t.amount else -t.amount end),0)::numeric(12,2)
  from public.kfm_wallet_accounts a
  join public.kfm_wallet_transactions t on t.wallet_account_id=a.id
  where a.account_type='kfm'
    and t.transaction_type in ('ride_kfm_commission','ride_kfm_reversal')
    and t.metadata->>'collection_status' = 'received_online';
$$;

grant all on public.kfm_wallet_accounts,public.kfm_wallet_transactions,public.kfm_driver_payout_batches,public.kfm_driver_payouts to service_role;
revoke all on function public.kfm_get_kfm_commission_balance() from public,anon,authenticated;

grant execute on function public.kfm_get_kfm_commission_balance() to service_role;

create or replace function public.kfm_get_cash_commission_due_balance()
returns numeric
language sql
security definer
set search_path = public, pg_temp
as $function$
  with cash_due as (
    select t.driver_id,
      coalesce(sum(case
        when t.transaction_type='ride_kfm_commission' then t.amount
        when t.transaction_type='ride_kfm_reversal' then -t.amount
        else 0
      end),0) as gross_due
    from public.kfm_wallet_accounts a
    join public.kfm_wallet_transactions t on t.wallet_account_id=a.id
    where a.account_type='kfm'
      and t.driver_id is not null
      and t.metadata->>'collection_status'='due_from_driver'
    group by t.driver_id
  ),
  driver_balances as (
    select a.driver_id,
      coalesce(sum(case when t.direction='credit' then t.amount else -t.amount end),0) as ledger_balance
    from public.kfm_wallet_accounts a
    left join public.kfm_wallet_transactions t on t.wallet_account_id=a.id
    where a.account_type='driver'
    group by a.driver_id
  )
  select coalesce(sum(least(c.gross_due,greatest(0,-coalesce(d.ledger_balance,0)))),0)::numeric(12,2)
  from cash_due c
  left join driver_balances d on d.driver_id=c.driver_id;
$function$;

revoke all on function public.kfm_get_cash_commission_due_balance() from public,anon,authenticated;
grant execute on function public.kfm_get_cash_commission_due_balance() to service_role;
