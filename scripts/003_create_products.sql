/* Supabase products table (public), open read/write for demo */
create extension if not exists "pgcrypto";

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  price integer not null,
  sizes text[] not null default '{}',
  color text not null default 'White',
  images jsonb not null default '[]',
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='products' and policyname='products_select_all') then
    create policy products_select_all on public.products for select to anon using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='products' and policyname='products_insert_all') then
    create policy products_insert_all on public.products for insert to anon with check (true);
  end if;
end $$;
