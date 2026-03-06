alter table public.reservations enable row level security;

drop policy if exists "Users manage own reservations" on public.reservations;

create policy "Users manage own reservations" on public.reservations
  for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);
