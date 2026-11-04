-- KFM ride payment ledger and secure customer payment requests.
-- Additive migration: does not modify NSAWAM MARKET tables or its Paystack webhook.

create table if not exists public.ride_payment_ledger (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid not null unique references public.ride_requests(id) on delete restrict,
  booking_code text not null,
  payment_method text not null check (payment_method in ('cash', 'paystack')),
  fare_amount numeric(12,2) not null check (fare_amount > 0),
  driver_share numeric(12,2) not null check (driver_share >= 0),
  kfm_commission numeric(12,2) not null check (kfm_commission >= 0),
  payment_reference text,
  paid_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.ride_payment_requests (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid not null unique references public.ride_requests(id) on delete cascade,
  booking_code text not null,
  token_hash text not null unique,
  amount numeric(12,2) not null check (amount > 0),
  customer_email text not null,
  payment_reference text unique,
  status text not null default 'pending' check (status in ('pending', 'paid', 'expired')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

alter table public.ride_payment_ledger enable row level security;
alter table public.ride_payment_requests enable row level security;
revoke all on public.ride_payment_ledger from anon, authenticated;
revoke all on public.ride_payment_requests from anon, authenticated;
grant all on public.ride_payment_ledger to service_role;
grant all on public.ride_payment_requests to service_role;

create or replace function public.kfm_record_ride_payment(
  p_ride_id uuid,
  p_payment_method text,
  p_payment_reference text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ride public.ride_requests%rowtype;
  v_fare numeric(12,2);
  v_driver_share numeric(12,2);
  v_kfm_commission numeric(12,2);
begin
  select * into v_ride
  from public.ride_requests
  where id = p_ride_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Ride not found.');
  end if;

  if lower(coalesce(v_ride.ride_status, '')) <> 'completed' then
    return jsonb_build_object('success', false, 'error', 'Only completed rides can be settled.');
  end if;

  if lower(coalesce(v_ride.payment_method, '')) <> lower(coalesce(p_payment_method, '')) then
    return jsonb_build_object('success', false, 'error', 'Payment method does not match this booking.');
  end if;

  if lower(coalesce(v_ride.payment_status, '')) = 'paid' then
    return jsonb_build_object('success', true, 'already_paid', true);
  end if;

  if lower(coalesce(v_ride.payment_status, '')) <> 'unpaid' then
    return jsonb_build_object('success', false, 'error', 'Ride payment is not awaiting settlement.');
  end if;

  if lower(p_payment_method) = 'paystack' and nullif(trim(coalesce(p_payment_reference, '')), '') is null then
    return jsonb_build_object('success', false, 'error', 'A verified Paystack reference is required.');
  end if;

  v_fare := round(coalesce(v_ride.fare_estimate, 0)::numeric, 2);
  if v_fare <= 0 then
    return jsonb_build_object('success', false, 'error', 'Ride fare is invalid.');
  end if;

  v_driver_share := round(v_fare * 0.80, 2);
  v_kfm_commission := v_fare - v_driver_share;

  insert into public.ride_payment_ledger (
    ride_id, booking_code, payment_method, fare_amount,
    driver_share, kfm_commission, payment_reference
  ) values (
    v_ride.id, v_ride.booking_code, lower(p_payment_method), v_fare,
    v_driver_share, v_kfm_commission, nullif(trim(coalesce(p_payment_reference, '')), '')
  );

  update public.ride_requests
  set payment_status = 'paid',
      payment_reference = case when lower(p_payment_method) = 'paystack' then p_payment_reference else payment_reference end,
      payment_paid_at = now()
  where id = v_ride.id;

  return jsonb_build_object(
    'success', true,
    'already_paid', false,
    'fare_amount', v_fare,
    'driver_share', v_driver_share,
    'kfm_commission', v_kfm_commission
  );
end;
$$;

revoke all on function public.kfm_record_ride_payment(uuid, text, text) from public, anon, authenticated;
grant execute on function public.kfm_record_ride_payment(uuid, text, text) to service_role;
