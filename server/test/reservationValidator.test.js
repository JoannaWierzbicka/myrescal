import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { validateReservationPayload } from '../validators/reservationValidator.js';

const validPayload = {
  name: 'Anna',
  lastname: 'Kowalska',
  start_date: '2026-07-01',
  end_date: '2026-07-03',
  property_id: 'a7f0f089-45fb-4f24-8772-54f0b1428217',
  room_id: '153dfe95-6e33-4aba-a46b-b61835d15f4d',
  nightly_rate: 120,
  deposit_amount: 50,
  status: 'deposit_paid',
};

describe('validateReservationPayload', () => {
  test('normalizes a valid reservation payload', () => {
    const result = validateReservationPayload(validPayload);

    assert.equal(result.name, 'Anna');
    assert.equal(result.lastname, 'Kowalska');
    assert.equal(result.nightly_rate, 120);
    assert.equal(result.deposit_amount, 50);
    assert.equal(result.status, 'deposit_paid');
  });

  test('rejects missing required fields', () => {
    assert.throws(
      () => validateReservationPayload({ ...validPayload, name: ' ' }),
      /First name is required/,
    );
  });

  test('rejects invalid date ranges', () => {
    assert.throws(
      () => validateReservationPayload({
        ...validPayload,
        start_date: '2026-07-03',
        end_date: '2026-07-01',
      }),
      /End date must be after the start date/,
    );
  });

  test('rejects negative pricing', () => {
    assert.throws(
      () => validateReservationPayload({ ...validPayload, nightly_rate: -1 }),
      /nightly_rate/,
    );
  });

  test('rejects invalid status', () => {
    assert.throws(
      () => validateReservationPayload({ ...validPayload, status: 'invalid' }),
      /Invalid status/,
    );
  });

  test('requires confirmation method for confirmed reservations', () => {
    assert.throws(
      () => validateReservationPayload({ ...validPayload, status: 'confirmed' }),
      /confirmation_method/,
    );
  });

  test('normalizes confirmed reservations with confirmation method', () => {
    const result = validateReservationPayload({
      ...validPayload,
      status: 'confirmed',
      confirmation_method: 'booking_com',
    });

    assert.equal(result.status, 'confirmed');
    assert.equal(result.confirmation_method, 'booking_com');
    assert.equal(result.deposit_amount, 50);
  });

  test('maps legacy booking status to confirmed booking.com confirmation', () => {
    const result = validateReservationPayload({ ...validPayload, status: 'booking' });

    assert.equal(result.status, 'confirmed');
    assert.equal(result.confirmation_method, 'booking_com');
  });

  test('rejects non-integer guest counts', () => {
    assert.throws(
      () => validateReservationPayload({ ...validPayload, adults: 1.5 }),
      /integer/,
    );
  });

  test('rejects invalid property id', () => {
    assert.throws(
      () => validateReservationPayload({ ...validPayload, property_id: 'not-a-uuid' }),
      /valid UUID/,
    );
  });
});
