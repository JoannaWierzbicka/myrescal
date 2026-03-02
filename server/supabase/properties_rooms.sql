-- Properties table for hotel owners
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  name text not null,
  description text,
  created_at timestamp with time zone default now()
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  property_id uuid not null references public.properties(id) on delete cascade,
  name text not null,
  created_at timestamp with time zone default now()
);

-- Reservations adjustments
alter table public.reservations
  add column if not exists property_id uuid,
  add column if not exists room_id uuid,
  add column if not exists status text default 'preliminary',
  add column if not exists notes text,
  add column if not exists nightly_rate numeric,
  add column if not exists total_price numeric;

update public.reservations
  set status = coalesce(status, 'preliminary');

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'reservations'
      and column_name = 'price'
  ) then
    execute '
      update public.reservations
      set total_price = price
      where total_price is null and price is not null
    ';
  end if;
end $$;

do $$
begin
  alter table public.reservations
    add constraint reservations_status_check
    check (status in ('preliminary', 'deposit_paid', 'confirmed', 'booking', 'past'));
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.reservations
    add constraint reservations_nightly_rate_non_negative
    check (nightly_rate is null or nightly_rate >= 0);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.reservations
    add constraint reservations_total_price_non_negative
    check (total_price is null or total_price >= 0);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.reservations
    add constraint reservations_property_fk foreign key (property_id)
    references public.properties(id) on delete set null;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.reservations
    add constraint reservations_room_fk foreign key (room_id)
    references public.rooms(id) on delete set null;
exception
  when duplicate_object then null;
end $$;

-- Ensure owner_id columns exist on supporting tables
alter table public.properties
  add column if not exists owner_id uuid;

alter table public.rooms
  add column if not exists owner_id uuid;

-- Indexes
create index if not exists properties_owner_idx on public.properties(owner_id);
create index if not exists rooms_owner_idx on public.rooms(owner_id);
create index if not exists rooms_property_idx on public.rooms(property_id);
create unique index if not exists rooms_property_name_unique
  on public.rooms(owner_id, property_id, lower(btrim(name)));
create index if not exists reservations_property_idx on public.reservations(property_id);
create index if not exists reservations_room_idx on public.reservations(room_id);

-- Row level security setup
alter table public.properties enable row level security;
alter table public.rooms enable row level security;

do $$
begin
  create policy "Users manage own properties" on public.properties
    for all
    using (auth.uid() = owner_id)
    with check (auth.uid() = owner_id);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "Users manage own rooms" on public.rooms
    for all
    using (auth.uid() = owner_id)
    with check (auth.uid() = owner_id);
exception
  when duplicate_object then null;
end $$;

-- Ensure reservations policy also checks owner across joins (manually adjust if needed)
