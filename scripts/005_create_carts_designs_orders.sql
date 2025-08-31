/* Supabase carts, designs, orders tables aligned to current APIs */
create extension if not exists "pgcrypto";

create table if not exists public.carts (
  session_id text primary key,
  items jsonb not null default '[]',
  updated_at timestamptz not null default now()
);

create table if not exists public.designs (
  id uuid primary key default gen_random_uuid(),
  session_id text,
  title text not null,
  description text not null,
  color text not null default 'white',
  size text not null default 'M',
  front_image text,
  back_image text,
  price integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  session_id text,
  order_id text,
  amount_inr integer not null,
  items jsonb not null,
  status text not null default 'created',
  meta jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.carts enable row level security;
alter table public.designs enable row level security;
alter table public.orders enable row level security;

/* Demo policies (open). Tighten for production with auth. */
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='carts' and policyname='carts_rw') then
    create policy carts_rw on public.carts for all to anon using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='designs' and policyname='designs_rw') then
    create policy designs_rw on public.designs for all to anon using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='orders' and policyname='orders_rw') then
    create policy orders_rw on public.orders for all to anon using (true) with check (true);
  end if;
end $$;
