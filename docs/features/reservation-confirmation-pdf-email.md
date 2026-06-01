# Reservation Confirmation PDF And Email Specification

## Purpose

This document describes the planned feature for reservation confirmations:

- preview and edit a confirmation email from reservation details;
- send the confirmation email to the guest;
- show when the confirmation was sent;
- download a confirmation PDF separately for archive or manual sharing.

The first implementation should be staged. The current app does not yet store all owner/property data needed for a production-quality guest confirmation.

## Current Implementation State

Implemented now:

- account settings allow editing owner profile data, while the login email stays read-only;
- property confirmation settings store contact details, stay conditions, cancellation policy, payment/deposit settings, property rules text, and enabled guest-message types;
- guest messages can be enabled or disabled per property with `guest_messages_enabled`;
- reservation details show a guest-message section only when messages are enabled for the reservation's property;
- the owner can open a preview dialog from reservation details, choose a message type, include/exclude rules, cancellation terms, and summary, then edit the subject/body locally;
- generated drafts follow the current app language (`pl` / `en`);
- real email sending is intentionally disabled until a production email provider is configured.

Not implemented yet:

- real email delivery;
- send history;
- provider message id/error storage;
- generated PDF download;
- generated/uploaded PDF rules attachment;
- automatic guest language detection.

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

Account data currently available from Supabase Auth:

- account login email.

Property data currently available:

- property name;
- optional property description.

## Missing Data To Add Before Full Production

These are required before this feature is considered production-complete:

1. Official confirmation sender identity.
   - Business/property display name used in guest emails.
   - It can default to property name at first.
2. Owner/property contact details.
   - guest-facing contact email;
   - contact phone;
   - address;
   - optional tax/company id, for example NIP;
   - optional website.
3. Property-specific confirmation settings.
   - check-in time;
   - check-out time;
   - property rules/terms text;
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

## Real Email Sending Readiness

Real sending should stay disabled until these conditions are met:

1. A sending domain is selected and verified with the chosen email provider.
2. DNS records are configured:
   - SPF;
   - DKIM;
   - DMARC.
3. A transactional email provider is chosen.
   - Recommended first choice: Resend.
   - Good alternatives: Postmark, SendGrid, Amazon SES.
4. Backend environment variables are configured in production.
5. A send-history table exists so every send attempt is auditable.
6. The backend send endpoint validates that:
   - the reservation belongs to the logged-in owner;
   - guest email exists;
   - guest messages are enabled for the property;
   - the selected message type is enabled for the property.
7. Test sends are verified before exposing the button to users.

Recommended sender model:

- `From`: a verified app/system address, for example `potwierdzenia@myrescal.com` or `noreply@myrescal.com`;
- `Reply-To`: the property contact email entered by the owner;
- sender display name: property name or `{{propertyName}} przez MyResCal`, depending on provider/domain policy.

Reason:

- the provider controls deliverability through the verified app domain;
- guests can still reply directly to the property;
- owners do not need to configure their own domain in MVP.

Supabase Auth SMTP is separate from reservation confirmations. It only covers account emails such as registration confirmation and password reset. Guest reservation emails should be sent by the backend through a transactional email provider.

Suggested backend env variables:

```env
EMAIL_PROVIDER=resend
EMAIL_FROM=potwierdzenia@myrescal.com
EMAIL_FROM_NAME=MyResCal
EMAIL_REPLY_TO_FALLBACK=support@myrescal.com
EMAIL_API_KEY=...
EMAIL_SENDING_ENABLED=false
```

`EMAIL_SENDING_ENABLED=false` should keep the UI/backend in preview-only mode even if the send endpoint exists. Enable it only after provider testing passes.

## Next Implementation Steps For Sending

When the domain/provider is ready, implement in this order:

1. Add a send-history migration.
   - recommended table: `reservation_message_sends`;
   - fields: `id`, `owner_id`, `reservation_id`, `property_id`, `message_type`, `recipient_email`, `subject`, `body_text`, `body_html`, `status`, `provider`, `provider_message_id`, `error_message`, `sent_at`, `created_at`.
2. Add email provider abstraction in the backend.
   - one interface, for example `sendEmail({ to, from, replyTo, subject, text, html })`;
   - one initial provider implementation;
   - a disabled/mock implementation for local development and tests.
3. Add `POST /reservations/:id/messages/send`.
   - accepts final edited subject/body and selected options;
   - sends email only when `EMAIL_SENDING_ENABLED=true`;
   - writes send history for both success and failure.
4. Replace the disabled dialog button with a real `Send` button only when sending is enabled.
5. Show send status/history in reservation details.
6. Add resend behavior later, after the first send flow is stable.

## Domain And Provider Setup Checklist

Before enabling real sends:

1. Buy or choose the sending domain.
2. Create an account with the email provider.
3. Add and verify the domain in the provider dashboard.
4. Add SPF/DKIM/DMARC DNS records.
5. Create an API key for backend sending.
6. Configure production backend env variables.
7. Send test messages to Gmail, Outlook, and one private mailbox.
8. Check that:
   - messages arrive;
   - `From` looks correct;
   - replies go to the property contact email;
   - messages do not land in spam;
   - Polish characters display correctly;
   - mobile email clients render the HTML acceptably.
9. Set `EMAIL_SENDING_ENABLED=true`.

## Prerequisite Settings Work

Before building the production confirmation email/PDF flow, add the settings data that makes confirmations complete and property-specific.

### Resolved Product Decisions

1. The login email must not be editable from this flow.
2. Account settings show the login email as read-only.
3. Owner first name and last name should be editable in account settings and prefilled from registration.
4. Guest-facing contact email belongs to the property and must not be prefilled from the account email.
5. Property rules/terms belong to a property, not to the whole account.
6. Check-in/check-out times and cancellation policy belong to a property, not to the whole account.
7. Property rules can start as a textarea. File upload/PDF upload is a later enhancement.
8. Cancellation policy should use a guided generator with editable inputs, not a fixed global policy.
9. Settings should use tabs: account, properties/rooms, and confirmations.
10. Account deletion should stay at the bottom of the account tab, below the account details form.

### Account Settings Section

Location:

- `Settings` screen;
- `Account` tab.

Fields:

- first name, required;
- last name, required;
- login email, read-only;
- phone, optional;
- address, optional;
- company/business name, optional.

Behavior:

- first name and last name are prefilled from registration/account profile where possible;
- existing old accounts without profile names can leave them empty until the owner saves account settings;
- login email is prefilled from Supabase Auth and cannot be changed here;
- after save, the authenticated profile in local app state should be refreshed so dashboard greetings and monitoring context stay correct.

Danger zone:

- bottom of the `Account` tab, below the account details form;
- action: `Delete account`;
- deletion must be protected by a confirmation dialog and typed confirmation, for example `DELETE ACCOUNT` or localized equivalent;
- the dialog must explain that account deletion removes profile, properties, rooms, reservations, and related confirmation data;
- after successful deletion the app logs the user out and clears local auth storage.

### Property Confirmation Settings Section

Location:

- same `Settings` screen;
- `Confirmations` tab;
- shown after a property is selected;
- separate from room management so room editing stays simple.

Suggested groups:

1. Property contact details.
   - property address;
   - property contact email;
   - property contact phone.
2. Stay conditions.
   - check-in time;
   - check-out time;
   - optional check-in instructions;
   - optional check-out instructions.
3. Cancellation policy generator.
   - free cancellation until `N` days before arrival;
   - deposit refund mode: refundable, non-refundable, partially refundable, or custom;
   - optional custom note;
   - generated preview text shown below the inputs.
4. Payments and deposits.
   - payment recipient;
   - bank account/IBAN;
   - default deposit type: percent or fixed amount;
   - payment deadline in days;
   - transfer title should be generated automatically from reservation data.
5. Available guest-message types.
   - master toggle: guest messages enabled for this property;
   - deposit request for preliminary reservation;
   - deposit received confirmation;
   - standard reservation confirmation;
   - custom message.
6. Property rules/terms.
   - textarea for property rules;
   - helper text: this text can be sent with the reservation confirmation;
   - later: convert to a generated PDF attachment or support PDF upload.

Mobile layout:

- sections stack vertically;
- property list becomes a full-width selector/list first;
- selected property settings appear immediately below the selected property;
- rooms remain below property settings;
- destructive actions stay at the bottom of their relevant section;
- buttons should be full-width on narrow screens where needed, but icon-only edit/delete actions can stay compact.

### Prerequisite Data Model Changes

These are mostly new columns on existing tables, not separate feature modules.

Recommended `owner_profiles` additions:

- `address text`;
- optional later: `tax_id text`, `website text`.

Recommended `properties` additions:

- `contact_email text`;
- `contact_phone text`;
- `address text`;
- `check_in_time text` or `time`;
- `check_out_time text` or `time`;
- `check_in_instructions text`;
- `check_out_instructions text`;
- `cancellation_free_until_days integer`;
- `deposit_refund_policy text`;
- `cancellation_policy_note text`;
- `terms_text text`.

Recommended `properties` additions for payment/deposit message flows:

- `payment_recipient text`;
- `payment_account text`;
- `deposit_type text`;
- `deposit_value numeric`;
- `deposit_due_days integer`;
- `guest_messages_enabled boolean`;
- `message_deposit_request_enabled boolean`;
- `message_deposit_confirmation_enabled boolean`;
- `message_booking_confirmation_enabled boolean`;
- `message_custom_enabled boolean`.

Recommended approach:

- keep the first migration focused on fields needed by the settings UI and confirmation content;
- avoid file storage until the textarea-based rules are accepted;
- avoid changing the Auth login email in this scope;
- add database constraints for basic length/range checks;
- keep RLS ownership behavior consistent with existing `owner_profiles` and `properties` policies.

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
- uploaded property rules files;
- automatic per-guest language detection;
- custom sender domains.

If prerequisite settings are implemented first, MVP can include property contact details, check-in/check-out times, generated cancellation policy text, and property rules text in the preview/email/PDF where configured. Sending property rules as a generated attachment can be added after the core send flow works.

## Guest Message Types

The feature should support more than one guest-facing message. A reservation may need different communication depending on its source and payment stage.

Recommended message types:

1. `deposit_request`
   - used for preliminary reservations;
   - asks the guest to pay a deposit;
   - includes payment recipient, bank account/IBAN, transfer title, deposit amount/percent, and payment deadline;
   - can include property rules, either from textarea content or later as a generated/uploaded PDF.
2. `deposit_received_confirmation`
   - used after the owner records that the deposit has arrived;
   - thanks the guest for the payment;
   - confirms the reservation;
   - includes remaining amount and cancellation/deposit refund rules.
3. `booking_confirmation`
   - used for a normal confirmed reservation;
   - includes stay summary, payment summary, property contact, and stay conditions.
4. `custom_message`
   - manually edited by the owner;
   - can optionally include reservation summary and property documents.

Booking.com reservations:

- MVP should allow marking a reservation as coming from an external booking platform.
- The technical `booking_com` value can stay for backward compatibility, but the UI should display a generic label such as `External booking platform` / `Rezerwacja z zewnętrznego serwisu`.
- If the external platform handles guest confirmation, the app should not push the owner toward sending a duplicate confirmation.
- Full Booking.com integration is a separate future project. iCal can help with availability, but full guest/payment/message data requires deeper Booking.com/channel-manager integration.

Property rules delivery:

- current scope: textarea content stored on the property;
- next enhancement: generate a PDF from the textarea content;
- later enhancement: upload an existing PDF file;
- DOC/DOCX upload should not be MVP because conversion and formatting are unreliable. Owners can export Word documents to PDF first.

## Draft Guest Message Copy

These are default generated drafts. Before sending, the owner should be able to edit the message or replace it with their own text.

### Deposit Request

Subject:

```text
Rezerwacja w {{propertyName}} - dane do wpłaty zaliczki
```

Body:

```text
Dzień dobry {{guestFirstName}},

dziękujemy za zainteresowanie naszym obiektem.

Aby potwierdzić rezerwację w obiekcie {{propertyName}}, prosimy o wpłatę zaliczki w wysokości {{depositAmount}} do {{depositDueDate}}.

Dane do przelewu:
Odbiorca: {{paymentRecipient}}
Numer konta: {{paymentAccount}}
Tytuł przelewu: Rezerwacja {{guestLastName}} {{checkInDate}}

{{depositRefundPolicyText}}

W załączniku przesyłamy regulamin obiektu. Prosimy o zapoznanie się z nim przed dokonaniem wpłaty.

Po zaksięgowaniu zaliczki wyślemy potwierdzenie rezerwacji.

Szczegóły pobytu:
Obiekt: {{propertyName}}
Termin: {{checkInDate}} - {{checkOutDate}}
Liczba nocy: {{nights}}
Kwota za pobyt: {{totalPrice}}
```

Rules:

- do not include room name;
- include property rules;
- do not include stay conditions/check-in details yet;
- include deposit refund/cancellation information if configured.

### Deposit Received Confirmation

Subject:

```text
Potwierdzenie rezerwacji - {{propertyName}}
```

Body:

```text
Dzień dobry {{guestFirstName}},

dziękujemy za dokonanie wpłaty zaliczki.

Rezerwacja w obiekcie {{propertyName}} jest potwierdzona.

Szczegóły pobytu:
Obiekt: {{propertyName}}
Termin: {{checkInDate}} - {{checkOutDate}}
Liczba nocy: {{nights}}

Podsumowanie płatności:
Kwota za pobyt: {{totalPrice}}
Wpłacona zaliczka: {{depositAmount}}
Pozostało do zapłaty: {{remainingAmount}}

Warunki anulacji:
{{cancellationPolicyText}}

Zameldowanie: od {{checkInTime}}
Wymeldowanie: do {{checkOutTime}}

W razie pytań prosimy o kontakt:
{{propertyContactEmail}}
{{propertyContactPhone}}
```

Rules:

- do not include room name;
- include cancellation/deposit refund policy;
- include property contact details if configured.

### Standard Booking Confirmation

Subject:

```text
Potwierdzenie rezerwacji w {{propertyName}}
```

Body:

```text
Dzień dobry {{guestFirstName}},

potwierdzamy rezerwację w obiekcie {{propertyName}}.

Szczegóły pobytu:
Obiekt: {{propertyName}}
Termin: {{checkInDate}} - {{checkOutDate}}
Liczba nocy: {{nights}}

Goście:
Dorośli: {{adults}}
Dzieci: {{children}}

Podsumowanie płatności:
Kwota za pobyt: {{totalPrice}}
Zaliczka: {{depositAmount}}
Pozostało do zapłaty: {{remainingAmount}}

Warunki pobytu:
Zameldowanie: od {{checkInTime}}
Wymeldowanie: do {{checkOutTime}}

{{checkInInstructions}}
{{checkOutInstructions}}

Warunki anulacji:
{{cancellationPolicyText}}

Kontakt do obiektu:
{{propertyContactEmail}}
{{propertyContactPhone}}
{{propertyAddress}}
```

Rules:

- do not include room name by default, because the assigned room can change;
- include stay conditions and cancellation policy when configured.

### Custom Message

Custom message should start empty:

- no generated subject;
- no generated body;
- owner writes the full message manually;
- later options can allow inserting reservation summary, property rules, cancellation policy, or stay conditions.

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
8. Optional property conditions:
   - check-in/check-out times;
   - generated cancellation policy;
   - property rules summary or attachment reference, if enabled.
9. Footer:
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
6. Optional property conditions:
   - check-in/check-out times;
   - generated cancellation policy;
   - property rules text or generated attachment reference.
7. Footer:
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

- `Guest messages` card;
- `Prepare message`;
- `Download PDF`.

Reservation details layout:

- add a `Guest messages` card below payment details and before notes;
- show external-platform notice when the reservation confirmation method is external;
- show available message types based on property settings;
- open a preview dialog before any send action;
- on mobile, use a full-screen preview/edit dialog.

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
5. Include toggles:
   - property rules;
   - cancellation terms;
   - reservation summary.
6. Read-only reservation summary.
7. Actions:
   - cancel;
   - edit/preview toggle;
   - send.

Validation:

- reservation must have or receive recipient email;
- invalid email blocks send;
- no silent sends without preview.

## Implementation Plan

### Step 0 - Settings Data Prerequisites

1. Add migration for owner profile fields and property confirmation fields.
2. Extend profile and property validators.
3. Extend profile and property repositories/routes.
4. Add account settings section.
5. Add selected-property confirmation settings section.
6. Add account deletion endpoint and protected UI flow.
7. Add property payment/deposit settings.
8. Add guest-message type toggles.
9. Add tests for validators, route behavior, and destructive deletion.
10. Update privacy/account deletion documentation if the deletion flow becomes active.

Files likely involved:

- `server/supabase/migrations/010_owner_property_confirmation_settings.sql`
- `server/supabase/migrations/011_property_payment_and_message_settings.sql`
- `server/validators/profileValidator.js`
- `server/validators/propertyValidator.js`
- `server/routes/profile.js`
- `server/routes/properties.js`
- `server/auth/authRoutes.js`
- `client/src/components/Settings/Settings.jsx`
- `client/src/components/Settings/PropertyFormDialog.jsx`
- `client/src/api/profile.js`
- `client/src/api/properties.js`
- `client/src/context/AuthContext.jsx`
- `client/src/i18n/translations.js`

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
5. Whether property rules should be sent as generated PDF attachments or included in the email/PDF body first.
6. Whether reservation notes should be included in guest-facing emails by default.
7. Whether property rules should also be generated as a separate attachment later.

## Recommended First Slice

Start with a non-sending prototype:

1. Build shared confirmation data mapper.
2. Build HTML email template with sample data.
3. Build PDF HTML template with sample data.
4. Add local/dev preview.
5. Review visual design.

Only after the visual and content model are accepted, implement provider sending and database send history.
