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

## Testy

Backend:

```bash
cd server
npm test
```

Aktualny zestaw obejmuje podstawowe kontrakty HTTP, format błędów, `401`, `404`, malformed JSON, walidatory i mapowanie błędów Supabase.

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
| `AUTH_REQUIRE_EMAIL_CONFIRMATION` | Zalecane | domyślnie wymagamy potwierdzonego emaila; ustaw `false` tylko lokalnie, jeśli chcesz pominąć ten wymóg |
| `AUTH_EMAIL_REDIRECT_URL` | Zalecane | adres powrotu po kliknięciu linku potwierdzającego email |
| `PORT` | Nie | domyślnie `3000` |
| `JSON_BODY_LIMIT` | Nie | limit JSON body, domyślnie `100kb` |
| `CSP_REPORT_ONLY` | Nie | `true` wymusza CSP report-only; produkcyjnie domyślnie enforce |
| `API_RATE_LIMIT_MAX` | Nie | limit globalny `/api` |
| `AUTH_LOGIN_RATE_LIMIT_MAX` | Nie | limit `/api/auth/login` |
| `SENTRY_DSN` | Nie | DSN projektu Sentry dla backendu; brak wartości wyłącza Sentry |
| `SENTRY_ENVIRONMENT` | Nie | środowisko Sentry, np. `development`, `staging`, `production` |
| `SENTRY_RELEASE` | Nie | wersja/release aplikacji raportowana do Sentry |
| `SENTRY_TRACES_SAMPLE_RATE` | Nie | sampling performance tracing od `0` do `1`; domyślnie `0` |

### Frontend (`client/.env`)
| Zmienna | Wymagana | Opis |
| --- | --- | --- |
| `VITE_API_URL` | Nie | preferowany adres API, np. `/api` lub `https://api.example.com` |
| `VITE_API_BASE_URL` | Nie (legacy) | fallback w kodzie, utrzymany dla kompatybilności |
| `VITE_SENTRY_DSN` | Nie | DSN projektu Sentry dla web/mobile; brak wartości wyłącza Sentry |
| `VITE_SENTRY_ENVIRONMENT` | Nie | środowisko Sentry dla klienta |
| `VITE_SENTRY_RELEASE` | Nie | wersja/release klienta raportowana do Sentry |
| `VITE_SENTRY_TRACES_SAMPLE_RATE` | Nie | sampling frontend tracing od `0` do `1`; domyślnie `0` |

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
- `owner_profiles.sql`
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
- dostępne binarki `pg_dump`, `psql`, `gzip`

Backup:
```bash
export DATABASE_URL='postgresql://...'
./scripts/backup.sh
```
Pliki backupu:
- `backups/backup_YYYYmmdd_HHMMSS.sql.gz`
- `backups/backup_YYYYmmdd_HHMMSS.sql.gz.sha256`

Restore:
```bash
export DATABASE_URL='postgresql://...'
./scripts/restore.sh backups/backup_YYYYmmdd_HHMMSS.sql.gz
```
Tryb bez promptu (np. CI):
```bash
FORCE_RESTORE=1 ./scripts/restore.sh --yes backups/backup_YYYYmmdd_HHMMSS.sql.gz
```

Ostrzeżenia:
- restore nadpisuje dane w docelowej bazie;
- wykonuj restore najpierw na środowisku testowym;
- przed restore do produkcji wykonaj świeży backup.

Pełna procedura operacyjna i plan testów restore:
- `docs/operational/backup-restore.md`

## Auth SMTP

Przed produkcyjną rejestracją użytkowników skonfiguruj własny SMTP dla Supabase Auth. Domyślna wysyłka Supabase jest tylko testowa i ma niski limit.

Runbook:
- `docs/operational/auth-smtp.md`

## Monitoring

Sentry obsługuje błędy backendu, web i mobile po ustawieniu DSN w ENV.

Runbook:
- `docs/operational/monitoring-sentry.md`
