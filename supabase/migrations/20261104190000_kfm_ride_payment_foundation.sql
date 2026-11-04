-- KFM Bolt-inspired ride payment foundation.
-- Additive only: preserves existing ride and book-payment records.
alter table public.ride_requests
  add column if not exists payment_authorization_url text,
  add column if not exists payment_requested_at timestamptz,
  add column if not exists payment_channel text,
  add column if not exists driver_share_amount numeric(12,2),
  add column if not exists kfm_commission_amount numeric(12,2),
  add column if not exists driver_payout_status text not null default 'pending',
  add column if not exists kfm_commission_status text not null default 'pending',
  add column if not exists cash_confirmed_by uuid,
  add column if not exists cash_confirmed_at timestamptz,
  add column if not exists payment_receipt_number text;

create index if not exists ride_requests_payment_status_idx
  on public.ride_requests (payment_status, ride_status);

create index if not exists ride_requests_payment_reference_idx
  on public.ride_requests (payment_reference)
  where payment_reference is not null;
