# MyResCal

MyResCal to aplikacja fullstack do zarządzania rezerwacjami (client: React + Vite + MUI, server: Node + Express, DB/Auth: Supabase).

## Wymagania
- Node.js 20+
- npm
- projekt Supabase
- dostęp do Supabase SQL Editor

## Struktura
```text
.
├── client/
├── server/
├── scripts/
└── README.md
```

## Szybki start
1. Utwórz `server/.env` na bazie `server/.env.example`.
2. Zainstaluj zależności:
```bash
cd server && npm install
cd ../client && npm install
```
3. Wykonaj SQL z `server/supabase/README.md`.
4. Uruchom backend:
```bash
cd server
npm run dev
```
5. Uruchom frontend:
```bash
cd client
npm run dev
```

## Konfiguracja ENV

### Backend (`server/.env`)
| Zmienna | Wymagana | Opis |
| --- | --- | --- |
| `SUPABASE_URL` | Tak | URL projektu Supabase |
| `SUPABASE_ANON_KEY` | Tak | klucz anon do requestów usera (RLS enforced) |
| `SUPABASE_SERVICE_ROLE_KEY` | Tak | klucz admin/service-role (operacje administracyjne, walidacja auth) |
| `SUPABASE_KEY` | Nie (legacy) | fallback dla `SUPABASE_SERVICE_ROLE_KEY` (deprecated) |
| `CORS_ORIGIN` | Zalecane | lista originów oddzielona przecinkami |
| `CLIENT_ORIGIN` | Nie (legacy) | fallback dla `CORS_ORIGIN` (deprecated) |
| `PORT` | Nie | domyślnie `3000` |
| `API_RATE_LIMIT_MAX` | Nie | limit globalny `/api` |
| `AUTH_LOGIN_RATE_LIMIT_MAX` | Nie | limit `/api/auth/login` |

### Frontend (`client/.env`)
| Zmienna | Wymagana | Opis |
| --- | --- | --- |
| `VITE_API_URL` | Nie | preferowany adres API, np. `/api` lub `https://api.example.com` |
| `VITE_API_BASE_URL` | Nie (legacy) | fallback w kodzie, utrzymany dla kompatybilności |

## CSP (audyt repo)
- `vercel.json` (root): brak nagłówków CSP, tylko `rewrites`.
- `client/vercel.json`: brak nagłówków CSP, tylko `rewrites`.
- `client/index.html`: brak meta tagu CSP.
- brak w repo; możliwe że ustawione w Vercel Dashboard.

## Sprawdzenie typów dat w DB
Uruchom w Supabase SQL Editor:

```sql
select column_name, data_type, udt_name from information_schema.columns 
where table_schema='public' and table_name='reservations' and column_name in ('start_date','end_date','room_id');
```

## RLS: wymagane pliki SQL
Wykonaj pliki z katalogu `server/supabase`:
- `properties_rooms.sql`
- `reservations_rls.sql`
- `reservations_notes_pricing.sql`
- `reservations_no_overlap.sql` (po wybraniu właściwego wariantu zgodnie z typami kolumn)

Szczegóły kolejności i uwagi operacyjne: `server/supabase/README.md`.

## Backup & Restore Runbook
Skrypty:
- `scripts/backup.sh`
- `scripts/restore.sh`

Wymagania:
- ustawiony `DATABASE_URL` (connection string do Postgresa)
- dostępne binarki `pg_dump` i `psql`

Backup:
```bash
export DATABASE_URL='postgresql://...'
./scripts/backup.sh
```
Plik backupu zostanie zapisany w `backups/backup_YYYYmmdd_HHMMSS.sql.gz`.

Restore:
```bash
export DATABASE_URL='postgresql://...'
./scripts/restore.sh backups/backup_YYYYmmdd_HHMMSS.sql.gz
```

Ostrzeżenia:
- restore nadpisuje dane w docelowej bazie;
- wykonuj restore najpierw na środowisku testowym;
- przed restore do produkcji wykonaj świeży backup.
