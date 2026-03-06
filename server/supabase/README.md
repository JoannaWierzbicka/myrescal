## Supabase setup

Uruchamiaj pliki SQL w Supabase SQL Editor (schema `public`) w tej kolejności:

1. `properties_rooms.sql`
2. `reservations_rls.sql`
3. `reservations_notes_pricing.sql`
4. `reservations_no_overlap.sql` (najpierw sprawdź typy kolumn i wybierz właściwy wariant)

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

- `reservations_rls.sql`:
  - włącza RLS na `reservations`;
  - ustawia politykę owner-based (`auth.uid() = owner_id`) dla wszystkich operacji.

- `reservations_notes_pricing.sql`:
  - dodaje pola `notes`, `nightly_rate`, `total_price`;
  - utrzymuje zgodność wsteczną dla legacy `price`.

- `reservations_no_overlap.sql`:
  - dodaje extension `btree_gist`;
  - definiuje exclusion constraint `reservations_no_overlap`, blokujący nakładające się rezerwacje dla tego samego `room_id`.

---

### Wymagane ENV backendu

W `server/.env` ustaw:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Legacy fallback:
- `SUPABASE_KEY` (deprecated, tylko jako fallback dla service role).
