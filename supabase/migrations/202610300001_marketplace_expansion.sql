-- NSAWAM MARKET expansion: vendors, classified adverts and seller accounts.
-- REVIEW ONLY: this migration is not applied automatically by the application.
-- Apply to Supabase only after reviewing the schema, policies and API implementation.
-- Existing bookings, market_orders, market_order_items and Paystack flows are untouched.

create table if not exists public.market_accounts (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  account_type text not null check (account_type in ('vendor', 'classified_seller', 'vendor_and_seller')),
  display_name text,
  phone text,
  email_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists market_accounts_email_lower_uidx
  on public.market_accounts (lower(email));

create table if not exists public.market_account_verification_codes (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0 check (attempts between 0 and 5),
  requested_account_type text not null check (requested_account_type in ('vendor', 'classified_seller', 'vendor_and_seller')),
  requested_display_name text,
  requested_phone text,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists market_account_codes_email_created_idx
  on public.market_account_verification_codes (lower(email), created_at desc);

create table if not exists public.market_account_sessions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.market_accounts(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists market_account_sessions_account_idx
  on public.market_account_sessions (account_id, expires_at desc);

create table if not exists public.market_vendors (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null unique references public.market_accounts(id) on delete cascade,
  business_name text not null,
  contact_name text not null,
  contact_phone text not null,
  business_location text not null,
  business_description text,
  approval_status text not null default 'pending'
    check (approval_status in ('pending', 'approved', 'rejected', 'suspended')),
  admin_notes text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vendor_products (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.market_vendors(id) on delete cascade,
  title text not null,
  description text not null,
  category text not null,
  price numeric(12,2) not null check (price > 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  image_urls text[] not null default '{}',
  listing_status text not null default 'pending_review'
    check (listing_status in ('draft', 'pending_review', 'approved', 'rejected', 'paused', 'out_of_stock')),
  admin_notes text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vendor_products_vendor_status_idx
  on public.vendor_products (vendor_id, listing_status, created_at desc);

create index if not exists vendor_products_category_status_idx
  on public.vendor_products (category, listing_status);

create table if not exists public.classified_ads (
  id uuid primary key default gen_random_uuid(),
  seller_account_id uuid not null references public.market_accounts(id) on delete restrict,
  category text not null
    check (category in ('cars_vehicles', 'appliances_electronics', 'furniture_household', 'general_items')),
  title text not null,
  description text not null,
  asking_price numeric(12,2) not null check (asking_price > 0),
  currency text not null default 'GHS' check (currency = 'GHS'),
  location text not null,
  seller_contact_phone text not null,
  image_urls text[] not null default '{}',
  advert_status text not null default 'draft'
    check (advert_status in ('draft', 'pending_payment', 'pending_review', 'active', 'rejected', 'paused', 'sold', 'expired')),
  admin_notes text,
  reviewed_at timestamptz,
  published_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists classified_ads_public_browse_idx
  on public.classified_ads (category, advert_status, created_at desc);

create index if not exists classified_ads_seller_idx
  on public.classified_ads (seller_account_id, created_at desc);

create table if not exists public.classified_ad_payments (
  id uuid primary key default gen_random_uuid(),
  advert_id uuid not null references public.classified_ads(id) on delete restrict,
  payment_provider text not null default 'paystack' check (payment_provider = 'paystack'),
  payment_reference text not null unique,
  amount numeric(12,2) not null check (amount > 0),
  currency text not null default 'GHS' check (currency = 'GHS'),
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  provider_transaction_id text,
  paid_at timestamptz,
  provider_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists classified_ad_payments_advert_idx
  on public.classified_ad_payments (advert_id, created_at desc);

create table if not exists public.classified_ad_reports (
  id uuid primary key default gen_random_uuid(),
  advert_id uuid not null references public.classified_ads(id) on delete cascade,
  reporter_email text,
  reporter_phone text,
  reason text not null,
  details text,
  report_status text not null default 'open'
    check (report_status in ('open', 'under_review', 'resolved', 'dismissed')),
  admin_notes text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists classified_ad_reports_status_idx
  on public.classified_ad_reports (report_status, created_at desc);

create table if not exists public.market_vendor_settlements (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.market_vendors(id) on delete restrict,
  period_start date not null,
  period_end date not null,
  gross_sales numeric(12,2) not null default 0 check (gross_sales >= 0),
  commission_rate numeric(5,2) not null check (commission_rate >= 0 and commission_rate <= 100),
  commission_amount numeric(12,2) not null default 0 check (commission_amount >= 0),
  adjustment_amount numeric(12,2) not null default 0,
  net_payable numeric(12,2) not null default 0,
  settlement_status text not null default 'pending'
    check (settlement_status in ('pending', 'approved', 'paid', 'on_hold', 'cancelled')),
  payment_reference text,
  paid_at timestamptz,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (period_end >= period_start)
);

create index if not exists market_vendor_settlements_vendor_period_idx
  on public.market_vendor_settlements (vendor_id, period_start desc);

-- No anon/authenticated policies are granted here. Access is intentionally closed
-- until the dedicated server-side APIs, ownership checks and admin controls are added.
alter table public.market_accounts enable row level security;
alter table public.market_account_verification_codes enable row level security;
alter table public.market_account_sessions enable row level security;
alter table public.market_vendors enable row level security;
alter table public.vendor_products enable row level security;
alter table public.classified_ads enable row level security;
alter table public.classified_ad_payments enable row level security;
alter table public.classified_ad_reports enable row level security;
alter table public.market_vendor_settlements enable row level security;
