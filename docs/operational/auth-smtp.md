# Auth SMTP Runbook (MyResCal)

## Cel

Ten runbook opisuje konfigurację własnego SMTP dla maili Supabase Auth:
- potwierdzenie rejestracji,
- reset hasła,
- przyszłe maile magic link / OTP, jeśli zostaną włączone.

Domyślna wysyłka Supabase jest tylko testowa, ma niski limit i słabą kontrolę nad dostarczalnością. Przed produkcją Google Play / web production wymagany jest własny SMTP.

## Rekomendowany dostawca na start: Resend

Wymagania:
1. Konto w Resend.
2. Zweryfikowana domena wysyłkowa.
3. Klucz API Resend.

Rekomendowana domena / adres:
- domena auth: `auth.myrescal.com` albo główna domena aplikacji, jeśli nie ma osobnej subdomeny,
- From email: `no-reply@myrescal.com` albo `no-reply@auth.myrescal.com`,
- Sender name: `MyResCal`.

## Dane SMTP Resend

W Supabase wpisz:

| Pole Supabase | Wartość |
| --- | --- |
| Host | `smtp.resend.com` |
| Port | `587` |
| Username | `resend` |
| Password | klucz API z Resend |
| Sender email | `no-reply@...` ze zweryfikowanej domeny |
| Sender name | `MyResCal` |

Port `587` używa STARTTLS i jest dobrym domyślnym wyborem.

## Konfiguracja Supabase

W Supabase Dashboard:

1. `Authentication -> SMTP Settings` albo `Authentication -> Email -> SMTP` (nazwa zależy od wersji dashboardu).
2. Włącz custom SMTP.
3. Uzupełnij dane SMTP z sekcji powyżej.
4. Zapisz konfigurację.
5. W `Authentication -> Providers -> Email` upewnij się, że:
   - `Allow new users to sign up` jest włączone,
   - `Confirm email` jest włączone.
6. W `Authentication -> URL Configuration` ustaw:
   - `Site URL`: produkcyjny adres web app,
   - `Redirect URLs`:
     - `http://localhost:5173/login`
     - `https://myrescal.vercel.app/login`
     - przyszły deep link mobile, gdy będzie finalnie skonfigurowany.

## ENV aplikacji

Lokalnie w `server/.env`:

```env
AUTH_REQUIRE_EMAIL_CONFIRMATION=true
AUTH_EMAIL_REDIRECT_URL=http://localhost:5173/login
```

Produkcja w Render:

```env
AUTH_REQUIRE_EMAIL_CONFIRMATION=true
AUTH_EMAIL_REDIRECT_URL=https://myrescal.vercel.app/login
```

## Test po konfiguracji

1. Usuń testowego użytkownika z `Authentication -> Users`, jeśli był już wcześniej tworzony.
2. Zarejestruj nowe konto przez aplikację.
3. Sprawdź, czy mail:
   - przychodzi z nazwy `MyResCal`,
   - przychodzi z wybranego adresu `no-reply@...`,
   - nie trafia do spamu.
4. Kliknij link potwierdzający.
5. Zaloguj się hasłem podanym przy rejestracji.
6. Sprawdź `Authentication -> Logs`, czy nie ma błędów SMTP.

## Jeśli mail trafia do spamu

Sprawdź w Resend/DNS:
- SPF,
- DKIM,
- DMARC.

Nie używaj treści marketingowych w mailach auth. Mail potwierdzający powinien być krótki i techniczny.

## Źródła

- Supabase custom SMTP: https://supabase.com/docs/guides/auth/auth-smtp
- Supabase auth rate limits: https://supabase.com/docs/guides/auth/rate-limits
- Resend SMTP: https://resend.com/docs/send-with-smtp
