import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { buildGuestMessagePreview } from '../services/reservationGuestMessageService.js';

const reservation = {
  id: '1',
  name: 'Jan',
  lastname: 'Nowak',
  mail: 'jan@example.com',
  start_date: '2026-06-01',
  end_date: '2026-06-05',
  adults: 2,
  children: 1,
  total_price: 1000,
  deposit_amount: 300,
  status: 'preliminary',
  confirmation_method: null,
  property: {
    name: 'Apartament Centrum',
    payment_recipient: 'Apartamenty Centrum',
    payment_account: 'PL00 0000 0000 0000 0000 0000 0000',
    deposit_type: 'percent',
    deposit_value: 30,
    deposit_due_days: 7,
    cancellation_free_until_days: 14,
    deposit_refund_policy: 'refundable',
    terms_text: 'Regulamin testowy',
  },
};

describe('buildGuestMessagePreview', () => {
  test('builds deposit request draft with property settings', () => {
    const preview = buildGuestMessagePreview(reservation, { type: 'deposit_request' });

    assert.equal(preview.type, 'deposit_request');
    assert.equal(preview.recipientEmail, 'jan@example.com');
    assert.match(preview.subject, /dane do wpłaty zaliczki/);
    assert.match(preview.body, /dziękujemy za zainteresowanie naszym obiektem/);
    assert.match(preview.body, /Odbiorca: Apartamenty Centrum/);
    assert.match(preview.body, /Regulamin testowy/);
    assert.equal(preview.sendEnabled, false);
  });

  test('custom message starts empty', () => {
    const preview = buildGuestMessagePreview(reservation, { type: 'custom_message' });

    assert.equal(preview.subject, '');
    assert.equal(preview.body, '');
  });

  test('omits attachment sentence when property rules are not included', () => {
    const preview = buildGuestMessagePreview(reservation, {
      type: 'deposit_request',
      includeRules: false,
    });

    assert.doesNotMatch(preview.body, /W załączniku przesyłamy regulamin obiektu/);
    assert.doesNotMatch(preview.body, /Regulamin testowy/);
  });

  test('builds English draft when language is English', () => {
    const preview = buildGuestMessagePreview(reservation, {
      type: 'deposit_received_confirmation',
      language: 'en',
    });

    assert.match(preview.subject, /Reservation confirmation/);
    assert.match(preview.body, /Hello Jan/);
    assert.match(preview.body, /thank you for paying the deposit/);
    assert.match(preview.body, /Cancellation terms/);
  });

  test('rejects preview when guest messages are disabled for property', () => {
    assert.throws(
      () =>
        buildGuestMessagePreview({
          ...reservation,
          property: {
            ...reservation.property,
            guest_messages_enabled: false,
          },
        }),
      /Guest messages are disabled/,
    );
  });
});
