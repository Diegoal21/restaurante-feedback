create extension if not exists pgcrypto;

create table if not exists public.surveys (
  id uuid primary key default gen_random_uuid(),
  table_number text,
  rating_general integer not null check (rating_general between 1 and 5),
  rating_food integer not null check (rating_food between 1 and 5),
  rating_service integer not null check (rating_service between 1 and 5),
  rating_cleanliness integer not null check (rating_cleanliness between 1 and 5),
  comment text,
  contact text,
  created_at timestamptz not null default now()
);

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.surveys(id) on delete cascade,
  code text not null unique,
  status text not null default 'unused' check (status in ('unused', 'redeemed', 'expired')),
  promotion_text text not null,
  expires_at timestamptz not null,
  redeemed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists surveys_created_at_idx on public.surveys(created_at desc);
create index if not exists coupons_status_idx on public.coupons(status);
create index if not exists coupons_created_at_idx on public.coupons(created_at desc);

alter table public.surveys enable row level security;
alter table public.coupons enable row level security;

drop policy if exists "No public survey reads" on public.surveys;
drop policy if exists "No public coupon reads" on public.coupons;

create policy "No public survey reads"
on public.surveys for select
to anon, authenticated
using (false);

create policy "No public coupon reads"
on public.coupons for select
to anon, authenticated
using (false);

-- La app usa SUPABASE_SERVICE_ROLE_KEY en API routes para insertar, leer y redimir.
-- No publiques la service role key en el navegador ni en repositorios.
