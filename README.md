# MyResCal

MyResCal to pełny stack do zarządzania rezerwacjami dla właścicieli obiektów. Backend (Express + Supabase) pilnuje autoryzacji i spójności danych, a frontend (React + Vite) daje widok kalendarza z pokojami i formularze do rezerwacji.

---

## Wymagania
- Node.js 20+ i npm  
- Konto Supabase z projektem, dostęp do SQL i klucz service-role  
- Przeglądarka do panelu Supabase i aplikacji

---

## Struktura
```
.
├── client/              # React (Vite)
├── server/              # Express API
└── README.md
```

---

## Szybki start po przerwie (krok po kroku)
1) **Zmienne środowiskowe**  
   Utwórz `server/.env`:
   ```
   SUPABASE_URL=<url_twojego_projektu_supabase>
   SUPABASE_KEY=<service_role_key_z_supabase>
   CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
   PORT=3000
   ```
   Opcjonalnie `client/.env` gdy API stoi gdzie indziej niż proxy Vite:
   ```
   VITE_API_URL=/api
   ```

2) **Instalacja zależności**  
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```

3) **Przygotowanie bazy w Supabase (jednorazowo na środowisko)**  
   - Wejdź do panelu Supabase → SQL Editor → New query.  
   - Wklej i uruchom skrypt z sekcji **Skrypt SQL Supabase** (poniżej).  
   - Po wykonaniu dodaj chociaż jeden obiekt i pokój (przez aplikację albo SQL), inaczej nie dodasz rezerwacji.

4) **Uruchom backend**  
   ```bash
   cd server
   npm run dev   # nodemon, http://localhost:3000
   # npm start   # zwykły node
   ```

5) **Uruchom frontend**  
   ```bash
   cd client
   npm run dev   # Vite na http://localhost:5173, proxy /api -> :3000
   ```

6) **Logowanie**  
   Zarejestruj się w aplikacji (Supabase Auth). Po zalogowaniu przejdź do Ustawień i dodaj obiekt + pokój, potem korzystaj z kalendarza.

---

## Konfiguracja ENV (wymagane)

### Backend (`server/.env`)

| Zmienna | Wymagana | Przykład | Gdzie używana |
| --- | --- | --- | --- |
| `SUPABASE_URL` | Tak | `https://xyz.supabase.co` | `server/auth/supabaseClient.js` |
| `SUPABASE_KEY` | Tak | `<service_role_key>` | `server/auth/supabaseClient.js` |
| `PORT` | Nie | `3000` | `server/app.js` (fallback `3000`) |
| `CORS_ORIGIN` | Nie | `http://localhost:5173,http://127.0.0.1:5173` | `server/app.js` (CORS allowlist) |
| `CLIENT_ORIGIN` | Nie (legacy fallback) | `http://localhost:5173` | `server/app.js` (fallback gdy brak `CORS_ORIGIN`) |
| `API_RATE_LIMIT_MAX` | Nie | `300` | `server/app.js` (globalny limit `/api`) |
| `AUTH_LOGIN_RATE_LIMIT_MAX` | Nie | `10` | `server/app.js` (limit `/api/auth/login`) |

### Frontend (`client/.env`)

| Zmienna | Wymagana | Przykład | Gdzie używana |
| --- | --- | --- | --- |
| `VITE_API_URL` | Nie | `/api` lub `https://api.twoja-domena.pl` | `client/src/api/client.js` |
| `VITE_API_BASE_URL` | Nie (backward compatibility) | `/api` | `client/src/api/client.js` |

W produkcji ustawiaj `VITE_API_URL` na publiczny adres API.

---

## Uruchomienie produkcyjne lokalnie (prod-like)

To jest potrzebne przed wdrożeniem, żeby sprawdzić czy build frontendu i backend działają razem bez trybu developerskiego.

1) Przygotuj ENV
- `server/.env`:
  ```env
  SUPABASE_URL=<url_twojego_projektu_supabase>
  SUPABASE_KEY=<service_role_key_z_supabase>
  CORS_ORIGIN=http://localhost:4173,http://127.0.0.1:4173
  PORT=3000
  ```
- `client/.env.production`:
  ```env
  VITE_API_URL=http://localhost:3000/api
  ```

2) Zbuduj frontend (tryb produkcyjny)
```bash
cd client
npm install
npm run build
```

3) Uruchom backend produkcyjnie (bez nodemon)
```bash
cd server
npm install
NODE_ENV=production npm start
```

4) Uruchom podgląd buildu frontendu
```bash
cd client
npm run preview -- --host 0.0.0.0 --port 4173
```

5) Sprawdź healthcheck i logowanie
```bash
curl http://localhost:3000/health
# oczekiwane: {"ok":true}
```
- Otwórz `http://localhost:4173` i wykonaj login/rejestrację.

---

## Skrypt SQL Supabase (jednorazowy)
Uruchom cały blok w SQL Editorze Supabase w schemacie `public`. Jeżeli kolumny już istnieją, komendy są idempotentne.

```sql
-- 1) Rezerwacje przypisane do właściciela
alter table public.reservations
  add column if not exists owner_id uuid;

-- Uzupełnij istniejące rekordy swoim user_id, jeśli trzeba:
-- update public.reservations set owner_id = '<twoj-user-uuid>';

alter table public.reservations
  alter column owner_id set not null;

create index if not exists reservations_owner_id_idx
  on public.reservations(owner_id);

alter table public.reservations enable row level security;

drop policy if exists "Users manage own reservations" on public.reservations;
create policy "Users manage own reservations" on public.reservations
  for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- Stara kolumna room (jeśli była)
alter table public.reservations drop column if exists room;

-- 2) Tabele obiektów i pokoi
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  name text not null,
  description text,
  created_at timestamptz default now()
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  property_id uuid not null references public.properties(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

-- Upewnij się, że kolumny owner_id istnieją (gdy tabele były wcześniej)
alter table public.properties add column if not exists owner_id uuid;
alter table public.rooms add column if not exists owner_id uuid;

-- Powiązania rezerwacji z obiektem i pokojem
alter table public.reservations
  add column if not exists property_id uuid,
  add column if not exists room_id uuid;

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

-- Status rezerwacji
alter table public.reservations
  add column if not exists status text default 'preliminary';

update public.reservations
  set status = coalesce(status, 'preliminary');

do $$
begin
  alter table public.reservations
    add constraint reservations_status_check
    check (status in ('preliminary', 'deposit_paid', 'confirmed', 'booking', 'past'));
exception
  when duplicate_object then null;
end $$;

-- Indeksy
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

-- 3) Uwagi i rozdzielenie cen
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

Po uruchomieniu skryptu dodaj przynajmniej jeden obiekt (`properties`) i pokój (`rooms`). Jeśli panel SQL pokazuje stary schemat, kliknij **Refresh**.

---

## Przydatne komendy
- Backend: `cd server && npm run dev` (lub `npm start`)  
- Frontend: `cd client && npm run dev`  
- Build frontu: `cd client && npm run build`  
- Lint frontu: `cd client && npm run lint`

Miłego planowania rezerwacji!
