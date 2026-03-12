# Backup & Restore Runbook (MyResCal)

## 1) Zakres i cel
Ten runbook opisuje minimalny, praktyczny proces backupu i odtwarzania danych dla obecnej architektury (Supabase + Node/Express), bez migracji infrastruktury.

Priorytet:
- szybko odzyskać krytyczne dane biznesowe,
- zminimalizować ryzyko operacyjne,
- mieć powtarzalny test restore.

## 2) Co wymaga backupu

### Krytyczne dane
- `public.reservations` - główne dane biznesowe rezerwacji.
- `public.properties` - obiekty/nieruchomości właściciela.
- `public.rooms` - pokoje powiązane z obiektami i rezerwacjami.
- `auth.users` - konta użytkowników (mapowanie do `owner_id`).

### Konfiguracja i logika DB
- SQL z `server/supabase/*.sql` (RLS, constraints, indeksy).
- Zmienne środowiskowe (`server/.env`) - traktować jako sekret, przechowywać poza repo.

### Poza bazą
- W kodzie nie ma użycia Supabase Storage bucketów i uploadów użytkownika.
- Statyczne assety frontendu są wersjonowane w Git (nie wymagają osobnego backupu danych runtime).

## 3) Co zapewnia Supabase (provider)
- Wbudowane backupy fizyczne (zależne od planu projektu).
- Point-in-time recovery (PITR) jako funkcja planu/dodatku.
- Restore backupu z poziomu platformy Supabase.

Uwaga: backupy bazy nie obejmują wszystkich ustawień projektu (np. API keys, część ustawień Auth) oraz nie obejmują plików obiektów Storage (obejmują tylko metadane obiektów).

## 4) Minimalna polityka backupu

### Częstotliwość
- Codziennie: 1 backup logiczny aplikacji (`scripts/backup.sh`).
- Dodatkowo przed każdą zmianą podwyższonego ryzyka (większe zmiany SQL, większy deploy backendu).

### Retencja
- Lokalnie: 7 dni.
- Kopia offsite (prywatny storage szyfrowany): 30 dni.

### Odpowiedzialność
- Właściciel procesu: osoba dyżurna/developer odpowiedzialny za deploy.
- Backup codzienny może być odpalany ręcznie lub z prostego crona/CI (bez rozbudowanej orkiestracji).

## 5) Jak wykonać backup

Wymagania lokalne:
- `pg_dump`, `gzip`.
- `DATABASE_URL` z uprawnieniami do odczytu wymaganych schematów.

Przykład:
```bash
export DATABASE_URL='postgresql://...'
./scripts/backup.sh
```

Efekt:
- plik dumpu: `backups/backup_YYYYmmdd_HHMMSS.sql.gz`
- checksum: `backups/backup_YYYYmmdd_HHMMSS.sql.gz.sha256`

## 6) Plan restore (kolejność)

### Zasada bezpieczeństwa
Najpierw restore testowy, potem dopiero decyzja o restore produkcyjnym.

### Kroki
1. Wykonaj świeży backup bieżącego stanu docelowej bazy (nawet jeśli jest uszkodzona logicznie).
2. Wybierz właściwy plik backupu i sprawdź checksum.
3. Ustaw `DATABASE_URL` na środowisko testowe/staging (nigdy od razu produkcja).
4. Uruchom restore:
```bash
export DATABASE_URL='postgresql://...test...'
./scripts/restore.sh backups/backup_YYYYmmdd_HHMMSS.sql.gz
```
5. Zweryfikuj integralność i działanie aplikacji (sekcja 7).
6. Dopiero po poprawnym teście powtórz restore na produkcji (z kontrolowanym oknem serwisowym).

Wymuszenie trybu bez promptu (np. CI):
```bash
FORCE_RESTORE=1 ./scripts/restore.sh --yes backups/backup_YYYYmmdd_HHMMSS.sql.gz
```

## 7) Test restore (warunek jakości)

Minimalny test (co najmniej raz w miesiącu):
1. Restore na osobnym środowisku testowym.
2. Sprawdzenie SQL:
```sql
select count(*) from public.properties;
select count(*) from public.rooms;
select count(*) from public.reservations;
select count(*) from auth.users;
```
3. Smoke test aplikacji:
- logowanie istniejącym kontem,
- lista obiektów/pokoi/rezerwacji,
- dodanie i edycja przykładowej rezerwacji.
4. Zapis wyniku testu (data, backup file, wynik PASS/FAIL).

Backup bez cyklicznego testu restore nie jest rozwiązaniem domkniętym.

## 8) Ograniczenia obecnego podejścia
- Brak pełnej automatyzacji harmonogramu i retencji w repo.
- Brak automatycznego raportowania statusu backupów.
- Brak osobnej procedury dla obiektów Storage (obecnie nieużywane w projekcie).

## 9) Przygotowanie pod przyszłą migrację na własny Postgres
To, co pomaga już teraz:
- regularny dump logiczny,
- udokumentowany restore workflow,
- SQL i zasady RLS trzymane w repo.

Czego będzie brakować przy migracji:
- planu migracji Auth (Supabase Auth -> własny mechanizm),
- mapowania funkcji specyficznych dla Supabase,
- procedury przeniesienia ustawień projektu i sekretów.

Rekomendacja na później (bez wdrażania teraz):
- utrzymywać regularny test restore,
- trzymać listę zależności Supabase-specific,
- doprecyzować docelowy model auth przed migracją infrastruktury.
