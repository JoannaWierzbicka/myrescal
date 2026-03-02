## Supabase setup

Wykonaj poniższe trzy zestawy zapytań SQL (w tej kolejności) w edytorze SQL Supabase. Każdy fragment uruchamiasz tylko raz na środowisko. Zapytania zakładają, że pracujesz w schemacie `public`.

---

### 1. Rezerwacje przypisane do właściciela

```sql
-- Dodaj kolumnę owner_id, jeśli jeszcze jej nie ma
alter table public.reservations
  add column if not exists owner_id uuid;

-- Uzupełnij istniejące rekordy (przykład):
-- update public.reservations set owner_id = '<twoj-user-uuid>';

alter table public.reservations
  alter column owner_id set not null;

create index if not exists reservations_owner_id_idx
  on public.reservations(owner_id);

-- Włącz RLS i ustaw politykę
alter table public.reservations enable row level security;

drop policy if exists "Users manage own reservations" on public.reservations;

create policy "Users manage own reservations" on public.reservations
  for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);
```

Jeśli tabela `reservations` wciąż ma starą kolumnę `room` z constraintem `NOT NULL`, usuń constraint lub kolumnę (nie jest już potrzebna):

```sql
alter table public.reservations alter column room drop not null;
-- lub (zalecane) całkowicie usuń kolumnę
alter table public.reservations drop column if exists room;
```

---

### 2. Tabele obiektów i pokoi

```sql
-- Tabela obiektów (properties)
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  name text not null,
  description text,
  created_at timestamptz default now()
);

-- Tabela pokoi (rooms)
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  property_id uuid not null references public.properties(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

-- Powiązania rezerwacji z obiektem i pokojem
alter table public.reservations
  add column if not exists property_id uuid,
  add column if not exists room_id uuid;

alter table public.reservations
  drop constraint if exists reservations_property_fk,
  add constraint reservations_property_fk foreign key (property_id)
    references public.properties(id) on delete set null;

alter table public.reservations
  drop constraint if exists reservations_room_fk,
  add constraint reservations_room_fk foreign key (room_id)
    references public.rooms(id) on delete set null;

-- Indeksy pod zapytania filtrowane
create index if not exists properties_owner_idx on public.properties(owner_id);
create index if not exists rooms_owner_idx on public.rooms(owner_id);
create index if not exists rooms_property_idx on public.rooms(property_id);
create unique index if not exists rooms_property_name_unique
  on public.rooms(owner_id, property_id, lower(btrim(name)));
create index if not exists reservations_property_idx on public.reservations(property_id);
create index if not exists reservations_room_idx on public.reservations(room_id);

-- RLS + polityki
alter table public.properties enable row level security;
alter table public.rooms enable row level security;

drop policy if exists "Users manage own properties" on public.properties;
drop policy if exists "Users manage own rooms" on public.rooms;

create policy "Users manage own properties" on public.properties
  for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "Users manage own rooms" on public.rooms
  for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);
```

---

### 3. Uwagi i rozdzielenie cen (za dobę / za pobyt)

Uruchom skrypt `server/supabase/reservations_notes_pricing.sql` albo wklej poniższy blok:

```sql
alter table public.reservations
  add column if not exists notes text,
  add column if not exists nightly_rate numeric,
  add column if not exists total_price numeric;

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
```

---

### Po wykonaniu skryptów

- Dodaj przynajmniej jeden obiekt i pokój (przez aplikację lub SQL), aby móc przypisywać rezerwacje.
- Upewnij się, że backend posiada w `.env` wartości `SUPABASE_URL`, klucz `SUPABASE_KEY` w wariancie service-role oraz `CLIENT_ORIGIN`.
