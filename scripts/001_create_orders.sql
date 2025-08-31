create extension if not exists "pgcrypto";

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  session_id text,
  order_id text,
  amount_inr integer not null default 0,
  items jsonb not null default '[]'::jsonb,
  status text not null default 'paid',
  meta jsonb not null default '{}'::jsonb
);

alter table public.orders enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'orders' and policyname = 'orders_select_public') then
    create policy orders_select_public on public.orders for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'orders' and policyname = 'orders_insert_public') then
    create policy orders_insert_public on public.orders for insert with check (true);
  end if;
end $$;
