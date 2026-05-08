import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { validatePropertyPayload } from '../validators/propertyValidator.js';
import { validateRoomPayload } from '../validators/roomValidator.js';

describe('validatePropertyPayload', () => {
  test('normalizes valid property payload', () => {
    const result = validatePropertyPayload({
      name: ' Apartamenty Centrum ',
      description: ' Opis ',
    });

    assert.equal(result.name, 'Apartamenty Centrum');
    assert.equal(result.description, 'Opis');
  });

  test('rejects too long property name', () => {
    assert.throws(
      () => validatePropertyPayload({ name: 'a'.repeat(121) }),
      /at most 120/,
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
