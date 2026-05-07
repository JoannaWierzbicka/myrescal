## Supabase setup

Uruchamiaj pliki SQL w Supabase SQL Editor (schema `public`) w tej kolejności:

1. `properties_rooms.sql`
2. `owner_profiles.sql`
3. `reservations_rls.sql`
4. `reservations_notes_pricing.sql`
5. `reservations_no_overlap.sql` (najpierw sprawdź typy kolumn i wybierz właściwy wariant)
6. `remove_confirmed_status.sql` (jeśli baza ma jeszcze stare rekordy/statusy `confirmed`)

---

### Sprawdzenie typów `start_date` / `end_date`

Przed uruchomieniem `reservations_no_overlap.sql` sprawdź typy:

```sql
select column_name, data_type, udt_name from information_schema.columns
where table_schema='public' and table_name='reservations' and column_name in ('start_date','end_date','room_id');
```

- Jeśli `start_date` i `end_date` to `date`, użyj wariantu `daterange(...)`.
- Jeśli to `timestamp` lub `timestamptz`, użyj wariantu `tstzrange(...)`.

---

### Co robią pliki

- `properties_rooms.sql`:
  - tworzy/uzupełnia `properties`, `rooms` i powiązania z `reservations`;
  - tworzy indeksy i polityki RLS dla `properties` i `rooms`.

- `owner_profiles.sql`:
  - tworzy tabelę `owner_profiles` na dane właściciela konta;
  - wiąże profil z `auth.users(id)`;
  - dodaje RLS owner-based (`auth.uid() = owner_id`).

- `reservations_rls.sql`:
  - włącza RLS na `reservations`;
  - ustawia politykę owner-based (`auth.uid() = owner_id`) dla wszystkich operacji.

- `reservations_notes_pricing.sql`:
  - dodaje pola `notes`, `nightly_rate`, `total_price`, `deposit_amount`;
  - utrzymuje zgodność wsteczną dla legacy `price`.

- `reservations_no_overlap.sql`:
  - dodaje extension `btree_gist`;
  - definiuje exclusion constraint `reservations_no_overlap`, blokujący nakładające się rezerwacje dla tego samego `room_id`.

- `remove_confirmed_status.sql`:
  - zamienia stare `confirmed` na `preliminary`;
  - odtwarza constraint statusów bez `confirmed`.

---

### Wymagane ENV backendu

W `server/.env` ustaw:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AUTH_REQUIRE_EMAIL_CONFIRMATION=true` (zalecane; backend nie zwraca sesji po rejestracji i blokuje niepotwierdzone konta)
- `AUTH_EMAIL_REDIRECT_URL` (opcjonalnie, adres powrotu po kliknięciu linku potwierdzającego email)

Legacy fallback:
- `SUPABASE_KEY` (deprecated, tylko jako fallback dla service role).

### Wymagane ustawienie Supabase Auth

Aby tworzyć tylko konta z realnym adresem email, włącz potwierdzanie emaila w Supabase:

1. Supabase Dashboard -> Authentication -> Providers -> Email.
2. Włącz `Confirm email`.
3. Ustaw `Site URL` i `Redirect URLs` na adres web app oraz docelowy adres aplikacji mobilnej/deep link, kiedy będzie gotowy.
4. Jeśli używasz `AUTH_EMAIL_REDIRECT_URL`, dodaj ten URL do listy redirectów w Supabase.

Uwaga: bez włączenia `Confirm email` Supabase może nie wysłać maila potwierdzającego. Backend domyślnie nie loguje użytkownika po rejestracji, ale wysyłka maila jest ustawieniem Supabase Auth, nie samego kodu aplikacji.
