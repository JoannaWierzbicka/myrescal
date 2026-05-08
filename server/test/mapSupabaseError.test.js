import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { isReservationOverlapError, mapSupabaseError } from '../utils/mapSupabaseError.js';

describe('mapSupabaseError', () => {
  test('maps unique violations to stable code', () => {
    const error = mapSupabaseError({ code: '23505', message: 'duplicate key value' });

    assert.equal(error.statusCode, 500);
    assert.equal(error.code, 'DB_UNIQUE_VIOLATION');
    assert.equal(error.message, 'duplicate key value');
  });

  test('maps forbidden database errors to stable code', () => {
    const error = mapSupabaseError({ code: '42501', message: 'permission denied', status: 403 });

    assert.equal(error.statusCode, 403);
    assert.equal(error.code, 'FORBIDDEN');
  });
});

describe('isReservationOverlapError', () => {
  test('detects exclusion constraint error code', () => {
    assert.equal(isReservationOverlapError({ code: '23P01' }), true);
  });

  test('detects reservation overlap constraint name', () => {
    assert.equal(
      isReservationOverlapError({ message: 'violates reservations_no_overlap constraint' }),
      true,
    );
  });
});
