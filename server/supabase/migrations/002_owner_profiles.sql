-- Owner profile table used by account registration/profile screens.
-- Idempotent: safe to run more than once.

create extension if not exists pgcrypto;

create table if not exists public.owner_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  phone text,
  company_name text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint owner_profiles_first_name_length check (char_length(btrim(first_name)) between 1 and 80),
  constraint owner_profiles_last_name_length check (char_length(btrim(last_name)) between 1 and 80),
  constraint owner_profiles_phone_length check (phone is null or char_length(phone) between 6 and 25),
  constraint owner_profiles_company_name_length check (company_name is null or char_length(btrim(company_name)) between 1 and 120)
);

create index if not exists owner_profiles_owner_idx on public.owner_profiles(owner_id);

