create extension if not exists "pgcrypto";

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  product_id text not null,
  rating integer not null check (rating between 1 and 5),
  text text,
  user_email text
);

alter table public.reviews enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'reviews' and policyname = 'reviews_select_public') then
    create policy reviews_select_public on public.reviews for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'reviews' and policyname = 'reviews_insert_public') then
    create policy reviews_insert_public on public.reviews for insert with check (true);
  end if;
end $$;
