# Reservation Confirmation PDF And Email Specification

## Purpose

This document describes the planned feature for reservation confirmations:

- preview and edit a confirmation email from reservation details;
- send the confirmation email to the guest;
- show when the confirmation was sent;
- download a confirmation PDF separately for archive or manual sharing.

The first implementation should be staged. The current app does not yet store all owner/property data needed for a production-quality guest confirmation.

## Product Direction

The confirmation must look like it comes from the property/business, not from MyResCal.

MyResCal can appear only as a small footer, for example:

```text
Powered by MyResCal
```

The main visible identity should be the property/business name entered by the owner.

## Current Data Available

Reservation data currently available:

- guest first name;
- guest last name;
- optional guest phone;
- optional guest email;
- check-in date;
- check-out date;
- calculated number of nights;
- property name;
- room name;
- nightly room rate;
- total stay price;
- deposit amount;
- remaining amount;
- reservation status;
- confirmation method;
- notes.

Owner/profile data currently available:

- owner first name;
- owner last name;
- optional owner phone;
- optional company name.

Property data currently available:

- property name;
- optional property description.

## Missing Data To Add Before Full Production

These are required before this feature is considered production-complete:

1. Official confirmation sender identity.
   - Business/property display name used in guest emails.
   - It can default to property name at first.
2. Owner/property contact details.
   - contact email;
   - contact phone;
   - address;
   - optional tax/company id, for example NIP;
   - optional website.
3. Property-specific confirmation settings.
   - check-in time;
   - check-out time;
   - payment terms;
   - cancellation policy;
   - prepayment/deposit requirements;
   - custom confirmation note.
4. Preferred confirmation language.
   - Default: current app language of the logged-in user.
   - Manual override from the send-preview dialog.
   - Future: guest language stored per reservation.
5. Email delivery provider configuration.
   - Production SMTP/provider must be configured before real guest sending.

## Recommended MVP Scope

MVP should not pretend to have missing data. It should send a clean, limited confirmation.

MVP includes:

1. Button in reservation details:
   - `Send confirmation`;
   - disabled after successful send, unless a later `Resend` flow is added.
2. Confirmation preview dialog:
   - recipient email;
   - language selector;
   - editable subject;
   - editable message intro/body;
   - read-only reservation summary.
3. Backend send endpoint.
4. Email HTML template.
5. Plain-text email fallback.
6. Send history stored in database:
   - sent timestamp;
   - recipient email;
   - subject;
   - sending status;
   - provider message id if available.
7. Button in reservation details:
   - `Download PDF`.
8. PDF generated from a separate print-oriented HTML template.

MVP does not include:

- property logo upload;
- advanced branding;
- cancellation policy section;
- payment rules section;
- automatic per-guest language detection;
- email attachments.

## Email And PDF Relationship

Email and PDF should share the same reservation data model, but they should not be visually identical.

Recommended approach:

- Email: simple, readable, email-client-safe HTML.
- PDF: more document-like, printable, with clearer sections and page margins.

Reason:

- HTML email clients have poor CSS support.
- PDF can use a richer print layout.
- Keeping them too identical usually weakens one of them.

## Email Behavior

The email should be a normal transactional message, not a PDF attachment.

The guest receives the confirmation directly in the email body. The PDF remains available only as a separate download in the app.

Recommended email structure:

1. Header:
   - property/business name;
   - small subtitle: reservation confirmation.
2. Greeting:
   - guest name.
3. Main confirmation text.
4. Stay summary:
   - property;
   - room;
   - check-in;
   - check-out;
   - number of nights.
5. Guest summary:
   - guest name;
   - adults;
   - children.
6. Payment summary:
   - nightly room rate;
   - total price;
   - deposit;
   - remaining amount.
7. Optional note:
   - reservation notes, if appropriate.
8. Footer:
   - property/business contact placeholder;
   - small `Powered by MyResCal`.

Do not include cancellation/payment policies until the owner can configure them.

## PDF Behavior

The PDF is downloaded manually from reservation details.

Recommended PDF sections:

1. Document header:
   - property/business name;
   - `Reservation confirmation`;
   - generated date.
2. Reservation summary:
   - guest;
   - property;
   - room;
   - check-in/check-out;
   - number of nights.
3. Payment summary:
   - nightly room rate;
   - total stay price;
   - deposit;
   - remaining amount.
4. Guest details:
   - guest email;
   - guest phone, if present;
   - adults/children.
5. Notes.
6. Footer:
   - `Powered by MyResCal`.

The PDF should not be emailed as an attachment in MVP.

## Visual Design

Use conservative styling for both email and PDF.

Base colors:

- dark teal: `#1F3C4A`;
- text: `#102A33`;
- light background: `#FAF7F0`;
- accent teal: `#33B4AC`;
- warm accent: `#C9874A`;
- borders: `#DDE2E1`.

Fonts:

- email: `Arial, Helvetica, sans-serif`;
- PDF: `Arial, Helvetica, sans-serif` for MVP.

Reason:

- reliable Polish characters;
- good email compatibility;
- no external font loading risk.

Layout principles:

- mobile-readable email width, about `600px`;
- strong contrast;
- no complex CSS grid in email;
- PDF page margin around `24-32px`;
- clear section headings;
- no decorative complexity.

## Sender And SMTP Explanation

SMTP/provider controls technical email delivery. It does not automatically mean every property can appear as a fully authenticated sender.

For good deliverability, the app should send from an authenticated domain that you control, for example:

```text
no-reply@myrescal.com
```

The visible sender name can still be property-based:

```text
Apartamenty XYZ <no-reply@myrescal.com>
```

This is the recommended MVP model.

Why:

- using random owner/property email addresses as the real `From` address usually fails SPF/DKIM/DMARC checks;
- unauthenticated sender domains increase spam risk;
- guests still see the property/business name in the mailbox sender name;
- replies can be directed with `Reply-To` later when owner/property email is stored.

Future improvement:

- store owner/property contact email;
- set `Reply-To` to that email;
- optionally support custom sender domains for larger customers, but this is not MVP.

Supabase Auth emails are separate from reservation confirmation emails.

- Supabase handles account confirmation/password/auth messages.
- Reservation confirmations should be sent by the application backend through the chosen transactional email provider.

Recommended provider:

- Resend API or SMTP.

Using a provider API is often better than raw SMTP because it returns message ids and delivery metadata more cleanly.

## Data Model Changes

MVP requires database changes if send history should appear in the UI.

Recommended new table:

```sql
reservation_confirmation_sends
```

Suggested columns:

- `id uuid primary key`;
- `owner_id uuid not null`;
- `reservation_id bigint not null`;
- `recipient_email text not null`;
- `subject text not null`;
- `language text not null`;
- `status text not null`;
- `provider_message_id text`;
- `error_message text`;
- `sent_at timestamp with time zone`;
- `created_at timestamp with time zone not null default now()`.

Suggested constraints:

- `status in ('pending', 'sent', 'failed')`;
- `language in ('pl', 'en')`;
- foreign key to `reservations(id)` with cascade delete.

RLS:

- owner can only read/manage send records where `owner_id = auth.uid()`.

Reservation table option:

- Do not denormalize `confirmation_sent_at` into `reservations` at first.
- The UI can read the latest send from the send-history endpoint.

## Backend API

Recommended endpoints:

### Preview Confirmation

```text
GET /api/reservations/:id/confirmation/preview?language=pl
```

Returns:

- default recipient;
- default subject;
- editable default message;
- rendered HTML preview or structured preview data.

### Send Confirmation

```text
POST /api/reservations/:id/confirmation/send
```

Payload:

```json
{
  "recipientEmail": "guest@example.com",
  "language": "pl",
  "subject": "Potwierdzenie rezerwacji",
  "messageIntro": "Dziękujemy za rezerwację..."
}
```

Behavior:

- authenticate owner;
- verify reservation belongs to owner;
- validate guest recipient email;
- generate email HTML and text;
- send through provider;
- store send history;
- return latest send status.

### Download PDF

```text
GET /api/reservations/:id/confirmation.pdf?language=pl
```

Behavior:

- authenticate owner;
- verify reservation belongs to owner;
- generate PDF;
- return `application/pdf`.

### Send History

```text
GET /api/reservations/:id/confirmation/sends
```

Returns latest and historical sends.

## Frontend UI

Location:

- reservation details page.

Add actions:

- `Send confirmation`;
- `Download PDF`.

If latest send exists:

```text
Sent: 20 May 2026, 14:32
```

Button behavior:

- after successful send, `Send confirmation` can be disabled for MVP;
- later add `Resend confirmation`.

Preview dialog:

1. Recipient email input.
2. Language select.
3. Subject input.
4. Editable intro/body textarea.
5. Read-only reservation summary.
6. Actions:
   - cancel;
   - send.

Validation:

- reservation must have or receive recipient email;
- invalid email blocks send;
- no silent sends without preview.

## Implementation Plan

### Step 1 - Data Preparation

1. Create a shared reservation confirmation data mapper.
2. Include calculated nights.
3. Normalize missing values to safe fallbacks.
4. Add tests for the mapper.

Files likely involved:

- `server/services/reservationConfirmationDataService.js`
- `server/test/reservationConfirmationDataService.test.js`

### Step 2 - Email Template Preview

1. Create HTML email template function.
2. Create plain-text template function.
3. Add development sample data.
4. Add a dev-only preview script or endpoint.

Files likely involved:

- `server/templates/emails/reservationConfirmation.js`
- `server/templates/shared/brandStyles.js`
- `server/test/reservationConfirmationEmailTemplate.test.js`

### Step 3 - PDF Template

1. Create print-oriented HTML template.
2. Choose PDF renderer.
   - Recommended: Playwright/Puppeteer HTML-to-PDF.
3. Add PDF service.
4. Add PDF download endpoint.

Files likely involved:

- `server/templates/documents/reservationConfirmation.js`
- `server/services/pdfService.js`
- `server/routes/reservationConfirmations.js`

### Step 4 - Send History Migration

1. Add SQL migration for `reservation_confirmation_sends`.
2. Add RLS policy.
3. Add repository functions.
4. Add tests.

Files likely involved:

- `server/supabase/migrations/010_reservation_confirmation_sends.sql`
- `server/repositories/reservationConfirmationRepository.js`

### Step 5 - Email Provider Service

1. Decide provider implementation.
   - Recommended MVP: Resend API.
   - Alternative: SMTP transport.
2. Add environment variables.
3. Add send service.
4. Store provider message id.
5. Handle failures safely.

Possible env:

```env
EMAIL_PROVIDER=resend
RESEND_API_KEY=
CONFIRMATION_EMAIL_FROM=no-reply@myrescal.com
```

Future env:

```env
CONFIRMATION_EMAIL_REPLY_TO=
```

### Step 6 - Send Endpoint

1. Add preview endpoint.
2. Add send endpoint.
3. Add send history endpoint.
4. Ensure auth and owner scoping.
5. Add rate limiting if needed.
6. Add tests.

### Step 7 - Frontend Details Page

1. Add API functions.
2. Add confirmation actions to reservation details.
3. Add preview/send dialog.
4. Show latest sent timestamp.
5. Add PDF download button.
6. Add translations.

Files likely involved:

- `client/src/api/reservationConfirmations.js`
- `client/src/components/ReservationConfirmationDialog.jsx`
- `client/src/components/ReservationDetail.jsx`
- `client/src/i18n/translations.js`

### Step 8 - End-To-End Testing

1. Generate preview.
2. Send email to test inbox.
3. Verify Gmail and mobile rendering.
4. Verify Polish characters.
5. Download PDF on desktop.
6. Download/open PDF on Android.
7. Verify send history appears.
8. Verify user cannot send/download another owner's reservation.

## Security And Privacy

1. All endpoints require authentication.
2. Owner must only access own reservation.
3. Do not expose provider API keys to frontend.
4. Do not log full email body.
5. Do not log guest email unnecessarily.
6. Store only send metadata needed for audit/support.
7. Include this processing in privacy policy before production.

## Open Decisions

These can be deferred, but must be resolved before production release:

1. Exact provider: Resend API vs SMTP.
2. Final sender domain.
3. Whether sent confirmations can be resent.
4. Whether owner can edit the full email body or only intro text.
5. Where owner/property official details are stored.
6. Whether confirmation settings live under property settings or a separate document/email settings page.
7. Whether reservation notes should be included in guest-facing emails by default.

## Recommended First Slice

Start with a non-sending prototype:

1. Build shared confirmation data mapper.
2. Build HTML email template with sample data.
3. Build PDF HTML template with sample data.
4. Add local/dev preview.
5. Review visual design.

Only after the visual and content model are accepted, implement provider sending and database send history.
