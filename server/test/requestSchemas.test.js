import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  validateIdParam,
  validateReservationIdParam,
  validateReservationQuery,
  validateRoomsQuery,
} from '../validators/requestSchemas.js';

describe('request schema validators', () => {
  test('validates uuid route params', () => {
    const id = validateIdParam({ id: 'a7f0f089-45fb-4f24-8772-54f0b1428217' });

    assert.equal(id, 'a7f0f089-45fb-4f24-8772-54f0b1428217');
  });

  test('rejects invalid uuid route params', () => {
    assert.throws(
      () => validateIdParam({ id: 'not-a-uuid' }),
      /valid UUID/,
    );
  });

  test('validates numeric reservation route params', () => {
    const id = validateReservationIdParam({ id: '123' });

    assert.equal(id, '123');
  });

  test('rejects invalid reservation route params', () => {
    assert.throws(
      () => validateReservationIdParam({ id: 'not-a-reservation-id' }),
      /valid reservation id/,
    );
  });

  test('validates reservation query', () => {
    const query = validateReservationQuery({
      lastname: 'Kow',
      start_date: '2026-07-01',
      property_id: 'a7f0f089-45fb-4f24-8772-54f0b1428217',
    });

    assert.equal(query.lastname, 'Kow');
  });

  test('rejects invalid rooms query property id', () => {
    assert.throws(
      () => validateRoomsQuery({ property_id: 'not-a-uuid' }),
      /valid UUID/,
    );
  });
});
