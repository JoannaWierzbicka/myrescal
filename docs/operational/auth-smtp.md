# Auth SMTP Runbook (MyResCal)

## Purpose

This runbook describes custom SMTP configuration for Supabase Auth emails:

- registration confirmation;
- password reset;
- future magic link / OTP emails, if enabled.

Supabase's default email sender is for testing only. It has a low rate limit and weak deliverability control. Custom SMTP is required before Google Play / web production usage.

## Recommended Initial Provider: Resend

Requirements:

1. Resend account.
2. Verified sending domain.
3. Resend API key.

Recommended domain/address:

- auth domain: `auth.myrescal.com`, or the main application domain if there is no separate subdomain;
- From email: `no-reply@myrescal.com` or `no-reply@auth.myrescal.com`;
- Sender name: `MyResCal`.

## Resend SMTP Values

Enter these in Supabase:

| Supabase Field | Value |
| --- | --- |
| Host | `smtp.resend.com` |
| Port | `587` |
| Username | `resend` |
| Password | Resend API key |
| Sender email | `no-reply@...` from a verified domain |
| Sender name | `MyResCal` |

Port `587` uses STARTTLS and is a good default.

## Supabase Configuration

In Supabase Dashboard:

1. Open `Authentication -> SMTP Settings` or `Authentication -> Email -> SMTP`; the label depends on the dashboard version.
2. Enable custom SMTP.
3. Fill in the SMTP values from the section above.
4. Save the configuration.
5. In `Authentication -> Providers -> Email`, make sure:
   - `Allow new users to sign up` is enabled;
   - `Confirm email` is enabled.
6. In `Authentication -> URL Configuration`, set:
   - `Site URL`: production web app URL;
   - `Redirect URLs`:
     - `http://localhost:5173/login`
     - `https://myrescal.vercel.app/login`
     - future mobile deep link when it is finalized.

## Application ENV

Local `server/.env`:

```env
AUTH_REQUIRE_EMAIL_CONFIRMATION=true
AUTH_EMAIL_REDIRECT_URL=http://localhost:5173/login
```

Production on Render:

```env
AUTH_REQUIRE_EMAIL_CONFIRMATION=true
AUTH_EMAIL_REDIRECT_URL=https://myrescal.vercel.app/login
```

## Test After Configuration

1. Delete the test user from `Authentication -> Users` if it was already created.
2. Register a new account through the application.
3. Verify that the email:
   - arrives from `MyResCal`;
   - arrives from the selected `no-reply@...` address;
   - does not land in spam.
4. Click the confirmation link.
5. Log in with the password used during registration.
6. Check `Authentication -> Logs` for SMTP errors.

## If Email Lands In Spam

Check in Resend/DNS:

- SPF;
- DKIM;
- DMARC.

Do not use marketing copy in auth emails. The confirmation email should be short and technical.

## Sources

- Supabase custom SMTP: https://supabase.com/docs/guides/auth/auth-smtp
- Supabase auth rate limits: https://supabase.com/docs/guides/auth/rate-limits
- Resend SMTP: https://resend.com/docs/send-with-smtp
