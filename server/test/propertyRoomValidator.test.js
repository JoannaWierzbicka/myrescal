import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { validatePropertyPayload } from '../validators/propertyValidator.js';
import { validateRoomPayload } from '../validators/roomValidator.js';

describe('validatePropertyPayload', () => {
  test('normalizes valid property payload', () => {
    const result = validatePropertyPayload({
      name: ' Apartamenty Centrum ',
      description: ' Opis ',
      contactEmail: ' Kontakt@Example.com ',
      contactPhone: '+48 500 600 700',
      address: ' Rynek 1 ',
      checkInTime: '15:00',
      checkOutTime: '11:00',
      checkInInstructions: ' Kod do drzwi ',
      checkOutInstructions: ' Zostaw klucze ',
      cancellationFreeUntilDays: '7',
      depositRefundPolicy: 'refundable',
      cancellationPolicyNote: ' Dodatkowa zasada ',
      termsText: ' Cisza nocna po 22 ',
      paymentRecipient: ' Apartamenty Centrum ',
      paymentAccount: ' PL00 0000 0000 0000 0000 0000 0000 ',
      depositType: 'percent',
      depositValue: '30',
      depositDueDays: '2',
      guestMessagesEnabled: false,
      messageDepositRequestEnabled: true,
      messageDepositConfirmationEnabled: false,
      messageBookingConfirmationEnabled: true,
      messageCustomEnabled: true,
    });

    assert.equal(result.name, 'Apartamenty Centrum');
    assert.equal(result.description, 'Opis');
    assert.equal(result.contact_email, 'kontakt@example.com');
    assert.equal(result.contact_phone, '+48500600700');
    assert.equal(result.address, 'Rynek 1');
    assert.equal(result.check_in_time, '15:00');
    assert.equal(result.check_out_time, '11:00');
    assert.equal(result.check_in_instructions, 'Kod do drzwi');
    assert.equal(result.check_out_instructions, 'Zostaw klucze');
    assert.equal(result.cancellation_free_until_days, 7);
    assert.equal(result.deposit_refund_policy, 'refundable');
    assert.equal(result.cancellation_policy_note, 'Dodatkowa zasada');
    assert.equal(result.terms_text, 'Cisza nocna po 22');
    assert.equal(result.payment_recipient, 'Apartamenty Centrum');
    assert.equal(result.payment_account, 'PL00 0000 0000 0000 0000 0000 0000');
    assert.equal(result.deposit_type, 'percent');
    assert.equal(result.deposit_value, 30);
    assert.equal(result.deposit_due_days, 2);
    assert.equal(result.guest_messages_enabled, false);
    assert.equal(result.message_deposit_request_enabled, true);
    assert.equal(result.message_deposit_confirmation_enabled, false);
    assert.equal(result.message_booking_confirmation_enabled, true);
    assert.equal(result.message_custom_enabled, true);
  });

  test('rejects too long property name', () => {
    assert.throws(
      () => validatePropertyPayload({ name: 'a'.repeat(121) }),
      /at most 120/,
    );
  });

  test('rejects invalid property confirmation settings', () => {
    assert.throws(
      () => validatePropertyPayload({
        name: 'Apartamenty Centrum',
        contactEmail: 'invalid',
      }),
      /Invalid contact email/,
    );

    assert.throws(
      () => validatePropertyPayload({
        name: 'Apartamenty Centrum',
        depositRefundPolicy: 'always',
      }),
      /Invalid deposit refund policy/,
    );

    assert.throws(
      () => validatePropertyPayload({
        name: 'Apartamenty Centrum',
        depositType: 'unknown',
      }),
      /Invalid deposit type/,
    );

    assert.throws(
      () => validatePropertyPayload({
        name: 'Apartamenty Centrum',
        depositType: 'percent',
        depositValue: 120,
      }),
      /Deposit percent/,
    );
  });
});

describe('validateRoomPayload', () => {
  test('normalizes valid room payload', () => {
    const result = validateRoomPayload({
      property_id: 'a7f0f089-45fb-4f24-8772-54f0b1428217',
      name: ' 101 ',
    });

    assert.equal(result.property_id, 'a7f0f089-45fb-4f24-8772-54f0b1428217');
    assert.equal(result.name, '101');
  });

  test('rejects invalid property id', () => {
    assert.throws(
      () => validateRoomPayload({ property_id: 'not-a-uuid', name: '101' }),
      /valid UUID/,
    );
  });
});
