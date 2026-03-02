-- Run this once in Supabase SQL Editor for the EddJoy app.

create extension if not exists pgcrypto;

create table if not exists public.products (
  id text primary key default gen_random_uuid()::text,
  slug text unique not null,
  name text not null,
  description text not null default '',
  category text not null default '',
  style text,
  price numeric(12,2) not null default 0,
  "originalPrice" numeric(12,2),
  "isFeatured" boolean not null default false,
  images jsonb not null default '[]'::jsonb,
  "availableColors" jsonb not null default '[]'::jsonb,
  sizes text[] not null default '{}'::text[],
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table if not exists public.categories (
  id text primary key default gen_random_uuid()::text,
  name text not null unique,
  "createdAt" timestamptz not null default now()
);

create table if not exists public.styles (
  id text primary key default gen_random_uuid()::text,
  name text not null unique,
  "createdAt" timestamptz not null default now()
);

create table if not exists public.orders (
  id text primary key default gen_random_uuid()::text,
  products jsonb not null default '[]'::jsonb,
  "totalAmount" numeric(12,2) not null default 0,
  "shippingAddress" jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','shipped','delivered','cancelled')),
  "createdAt" timestamptz not null default now(),
  "customerName" text not null default '',
  "customerEmail" text,
  "customerPhone" text
);

create table if not exists public.reviews (
  id text primary key default gen_random_uuid()::text,
  "productId" text not null,
  "userName" text not null,
  rating integer not null check (rating between 1 and 5),
  comment text not null,
  "createdAt" timestamptz not null default now()
);

create index if not exists reviews_product_id_idx on public.reviews ("productId");
create index if not exists reviews_created_at_idx on public.reviews ("createdAt" desc);

alter table public.products enable row level security;
alter table public.categories enable row level security;
alter table public.styles enable row level security;
alter table public.orders enable row level security;
alter table public.reviews enable row level security;

drop policy if exists products_read_all on public.products;
create policy products_read_all on public.products for select using (true);

drop policy if exists products_write_authenticated on public.products;
create policy products_write_authenticated on public.products
for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists categories_read_all on public.categories;
create policy categories_read_all on public.categories for select using (true);

drop policy if exists categories_write_authenticated on public.categories;
create policy categories_write_authenticated on public.categories
for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists styles_read_all on public.styles;
create policy styles_read_all on public.styles for select using (true);

drop policy if exists styles_write_authenticated on public.styles;
create policy styles_write_authenticated on public.styles
for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists reviews_read_all on public.reviews;
create policy reviews_read_all on public.reviews for select using (true);

drop policy if exists reviews_insert_all on public.reviews;
create policy reviews_insert_all on public.reviews for insert with check (true);

drop policy if exists orders_read_authenticated on public.orders;
create policy orders_read_authenticated on public.orders
for select
using (auth.role() = 'authenticated');

drop policy if exists orders_update_authenticated on public.orders;
create policy orders_update_authenticated on public.orders
for update
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do nothing;

drop policy if exists storage_products_read_all on storage.objects;
create policy storage_products_read_all on storage.objects
for select
using (bucket_id = 'products');

drop policy if exists storage_products_write_authenticated on storage.objects;
create policy storage_products_write_authenticated on storage.objects
for all
using (bucket_id = 'products' and auth.role() = 'authenticated')
with check (bucket_id = 'products' and auth.role() = 'authenticated');
