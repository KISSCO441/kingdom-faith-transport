-- KFM Books & Publications: digital-only checkout with private file delivery.
create table if not exists public.kfm_books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  author text not null default 'Apostle K. F. Kisseh',
  description text not null,
  price numeric(12,2) not null check (price > 0),
  cover_url text,
  file_path text not null,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists kfm_books_published_idx
  on public.kfm_books (is_published, created_at desc);

create table if not exists public.kfm_book_orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  book_id uuid not null references public.kfm_books(id),
  customer_name text not null,
  customer_email text not null,
  amount numeric(12,2) not null check (amount > 0),
  currency text not null default 'GHS',
  payment_status text not null default 'PENDING'
    check (payment_status in ('PENDING','PAID','FAILED')),
  download_token uuid unique,
  download_expires_at timestamptz,
  download_count integer not null default 0 check (download_count >= 0),
  email_sent_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists kfm_book_orders_email_idx
  on public.kfm_book_orders (customer_email, created_at desc);

alter table public.kfm_books enable row level security;
alter table public.kfm_book_orders enable row level security;
revoke all on public.kfm_books, public.kfm_book_orders from anon, authenticated;
grant select on public.kfm_books to anon, authenticated;
drop policy if exists "Published KFM books are publicly visible" on public.kfm_books;
create policy "Published KFM books are publicly visible"
  on public.kfm_books for select to anon, authenticated
  using (is_published = true);

-- PDFs stay private. Only server-side service-role routes can access this bucket.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('kfm-digital-books', 'kfm-digital-books', false, 52428800, array['application/pdf'])
on conflict (id) do update set public = false, file_size_limit = 52428800,
  allowed_mime_types = array['application/pdf'];

-- Cover images are public catalogue artwork; PDFs are never stored in this bucket.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('kfm-book-covers', 'kfm-book-covers', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];
