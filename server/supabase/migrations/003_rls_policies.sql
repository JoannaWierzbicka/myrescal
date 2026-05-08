-- Row Level Security policies for owner-scoped application data.
-- Idempotent: safe to run more than once.

alter table public.properties enable row level security;
alter table public.rooms enable row level security;
alter table public.reservations enable row level security;
alter table public.owner_profiles enable row level security;

drop policy if exists "Users manage own properties" on public.properties;
create policy "Users manage own properties" on public.properties
  for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "Users manage own rooms" on public.rooms;
create policy "Users manage own rooms" on public.rooms
  for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "Users manage own reservations" on public.reservations;
create policy "Users manage own reservations" on public.reservations
  for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "Users manage own owner profile" on public.owner_profiles;
create policy "Users manage own owner profile" on public.owner_profiles
  for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

