# MyResCal Privacy And Compliance Readiness

This is an engineering checklist, not legal advice. A lawyer or data protection specialist should review the final public privacy policy and operating process before a public launch.

## Why This Applies

MyResCal processes personal data because users create accounts and store reservation/contact data. Under GDPR/RODO, the organization deciding why and how the data is processed is normally the controller. Cloud providers such as Supabase, Render, Sentry, Vercel, and an SMTP provider are normally processors or separate service providers depending on their terms and actual role.

## Personal Data In The Current App

Account and owner data:

- email address;
- password handled by Supabase Auth;
- user id;
- first name;
- last name;
- optional phone;
- optional company name.

Reservation/guest data:

- guest first name;
- guest last name;
- optional phone;
- optional email;
- stay dates;
- number of adults/children;
- notes;
- pricing/deposit values;
- reservation status and confirmation method.

Operational/diagnostic data:

- request ids;
- endpoint/status metadata;
- backend logs;
- Sentry events if enabled;
- authenticated user id and possibly email in Sentry context.

## Current Positive Controls In Code

- Server-side authentication is required for protected API routes.
- Supabase RLS policies scope core tables by `owner_id`.
- CORS is configurable through `CORS_ORIGIN`.
- Backend uses Helmet and rate limiting.
- Email confirmation is required by default.
- The Android manifest currently requests only Internet permission.
- Database migrations and backup/restore procedures are documented.

## Current Compliance Gaps

These are not theoretical; they affect store approval and production readiness:

1. No privacy policy file or public privacy policy URL is present in the repo.
2. No in-app privacy policy link was found.
3. In-app account deletion exists in Settings, but no public external deletion request page/URL is documented.
4. No documented retention schedule exists for account, reservation, log, backup, and Sentry data.
5. No documented Data Processing Agreement inventory exists for Supabase, Render, Vercel, Sentry, and SMTP.
6. No cookie/analytics consent path is documented. This may be fine if no non-essential analytics/cookies are added, but it must remain true.
7. Auth/session data is stored in WebView `localStorage`; this is acceptable for development but should be reviewed before public production.

## Minimum Privacy Policy Contents

The public policy should include:

- controller identity and contact details;
- privacy contact email;
- categories of personal data collected;
- purposes of processing;
- legal bases under GDPR/RODO;
- recipients/processors and hosting locations;
- data retention periods or criteria;
- user rights: access, rectification, deletion, restriction, objection, portability, complaint to supervisory authority;
- account deletion and data deletion process;
- security measures at a high level;
- whether data is transferred outside the EEA and on what safeguards;
- whether automated decision-making/profiling is used;
- effective date and update process.

## Likely Legal Bases To Confirm

For a reservation management app, likely bases are:

- account and app operation: contract or steps before contract;
- reservation records entered by the user: legitimate interest or contract, depending on business model;
- transactional auth emails: contract or legitimate interest;
- security logs and abuse prevention: legitimate interest;
- legally required retention, if any: legal obligation;
- optional analytics/marketing, if later added: consent may be required.

The final decision depends on the business model and should be reviewed legally.

## Account And Data Deletion

Google Play requires an in-app path and an external web resource if the app allows account creation. GDPR also gives users deletion rights in defined circumstances.

Implemented in-app flow:

- Settings includes `Delete account`;
- the backend verifies the authenticated user;
- the user must type `DELETE ACCOUNT`;
- the backend deletes the Supabase auth user, owner profile, properties, rooms, and reservations.

Remaining production tasks:

1. Document what remains in backups/logs and for how long.
2. Publish a public deletion request page and enter its URL in Play Console.
3. Include the deletion process in the public privacy policy.

## Third-Party Processor Register

Create and maintain a small register with:

- provider name;
- purpose;
- data categories;
- region/transfer basis;
- DPA link or signed agreement;
- retention controls;
- owner/responsible person.

Initial provider list:

- Supabase: database and authentication;
- Render: backend hosting;
- Vercel: web frontend hosting;
- Sentry: error monitoring, if enabled;
- SMTP provider, for example Resend: transactional auth emails;
- Google Play: distribution and store metadata.

## Official References

- GDPR Article 13 information duties: https://gdpr.eu/article-13-personal-data-collected/
- European Commission controller/processor explanation: https://commission.europa.eu/law/law-topic/data-protection/rules-business-and-organisations/obligations/controllerprocessor/what-data-controller-or-data-processor_en
- European Commission processor contract explanation: https://commission.europa.eu/law/law-topic/data-protection/rules-business-and-organisations/obligations/controllerprocessor/can-someone-else-process-data-my-organisations-behalf_en
- Google Play User Data policy: https://support.google.com/googleplay/android-developer/answer/10144311
- Google Play account deletion requirements: https://support.google.com/googleplay/android-developer/answer/13327111
