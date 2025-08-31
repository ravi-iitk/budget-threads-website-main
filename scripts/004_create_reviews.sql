/* Supabase reviews table aligned with current API (text, user_email) */
create extension if not exists "pgcrypto";

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  text text not null default '',
  user_email text,
  created_at timestamptz not null default now()
);

alter table public.reviews enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='reviews' and policyname='reviews_select_all') then
    create policy reviews_select_all on public.reviews for select to anon using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='reviews' and policyname='reviews_insert_all') then
    create policy reviews_insert_all on public.reviews for insert to anon with check (true);
  end if;
end $$;
