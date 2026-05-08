# Sentry Monitoring Runbook (MyResCal)

## Zakres

Sentry jest używane do:
- błędów backendu Express,
- błędów frontendu web,
- błędów w aplikacji Android/Capacitor,
- korelacji błędów z `requestId`,
- identyfikacji użytkownika po `user.id`.

Sentry działa tylko wtedy, gdy ustawiony jest DSN. Brak DSN oznacza cichy no-op.

## Projekty Sentry

Rekomendowane dwa projekty:

```text
myrescal-backend
myrescal-frontend
```

Frontend obejmuje web i Capacitor Android, bo obecnie używają tego samego React/Vite bundle.

## Backend ENV

Lokalnie / Render:

```env
SENTRY_DSN=
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=
SENTRY_TRACES_SAMPLE_RATE=0
```

Uwagi:
- `SENTRY_DSN` ustaw z projektu `myrescal-backend`.
- `SENTRY_RELEASE` powinien docelowo być wersją deployu.
- `SENTRY_TRACES_SAMPLE_RATE=0` zbiera błędy, ale nie wysyła performance traces.
- Na staging/test można tymczasowo ustawić `SENTRY_TRACES_SAMPLE_RATE=0.1`.

## Frontend ENV

Vercel / build Android:

```env
VITE_SENTRY_DSN=
VITE_SENTRY_ENVIRONMENT=production
VITE_SENTRY_RELEASE=
VITE_SENTRY_TRACES_SAMPLE_RATE=0
```

Uwagi:
- `VITE_SENTRY_DSN` ustaw z projektu `myrescal-frontend`.
- Zmienne `VITE_*` są wbudowywane podczas builda, więc po zmianie trzeba przebudować frontend/Android.

## Kontekst wysyłany do Sentry

Backend:
- `request_id`,
- metoda HTTP,
- endpoint,
- status,
- `user.id` i email, jeśli request jest uwierzytelniony.

Frontend:
- `request_id` z API,
- endpoint,
- status,
- `user.id` i email,
- informacja, czy profil właściciela istnieje.

## Alerty Sentry

Minimalne alerty przed testami zewnętrznymi:

1. Backend 5xx spike:
   - project: `myrescal-backend`,
   - condition: number of errors/issues above baseline albo minimum kilka błędów w 5-10 minut,
   - filtr: `level:error`.

2. Auth/login errors:
   - project: `myrescal-backend`,
   - filtr po endpointach `/api/auth/login`, `/api/auth/register`,
   - powiadomienie, gdy rośnie liczba błędów.

3. Supabase errors:
   - project: `myrescal-backend`,
   - filtr po kodach zaczynających się od `SUPABASE_`.

4. Frontend API/network errors:
   - project: `myrescal-frontend`,
   - tagi: `endpoint`, `status`,
   - powiadomienie przy rosnącej liczbie błędów sieciowych albo `5xx`.

5. Render cold start / timeout:
   - project: `myrescal-frontend`,
   - obserwować błędy z `reason=timeout` albo `reason=network`.

## Test integracji

1. Ustaw DSN lokalnie dla backendu i frontendu.
2. Uruchom backend i frontend.
3. Wywołaj kontrolowany błąd backendu:

```bash
curl http://localhost:3000/debug/sentry
```

Endpoint jest dostępny tylko poza `NODE_ENV=production`.

4. Wywołaj kontrolowany błąd frontendu w konsoli przeglądarki:

```js
window.__MYRESCAL_TEST_SENTRY__()
```

Funkcja jest dostępna tylko w trybie dev Vite.

4. Sprawdź w Sentry, czy event zawiera:
   - request id,
   - endpoint,
   - user id dla requestu po zalogowaniu.
5. Jeśli eventy pojawiają się poprawnie, nie trzeba usuwać hooków testowych, bo są wyłączone w produkcji.

Nie dodawać stałego endpointu typu `/debug-sentry` do produkcji bez zabezpieczenia.

## Bundle size

Po włączeniu Sentry frontend bundle rośnie. Przed release warto rozważyć osobny chunk dla Sentry albo późniejszą inicjalizację monitoringu, jeśli rozmiar paczki stanie się problemem dla Android/Web.
