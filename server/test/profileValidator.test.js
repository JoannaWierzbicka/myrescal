import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { validateOwnerProfilePayload } from '../validators/profileValidator.js';

describe('validateOwnerProfilePayload', () => {
  test('normalizes a valid owner profile', () => {
    const result = validateOwnerProfilePayload({
      firstName: ' Joanna ',
      lastName: ' Wierzbicka ',
      phone: '+48 500 600 700',
      address: ' Rynek 1 ',
      companyName: ' MyResCal ',
    });

    assert.equal(result.first_name, 'Joanna');
    assert.equal(result.last_name, 'Wierzbicka');
    assert.equal(result.phone, '+48500600700');
    assert.equal(result.address, 'Rynek 1');
    assert.equal(result.company_name, 'MyResCal');
  });

  test('rejects missing first name', () => {
    assert.throws(
      () => validateOwnerProfilePayload({ firstName: '', lastName: 'Wierzbicka' }),
      /First name is required/,
    );
  });

  test('rejects invalid phone', () => {
    assert.throws(
      () => validateOwnerProfilePayload({
        firstName: 'Joanna',
        lastName: 'Wierzbicka',
        phone: 'abc',
      }),
      /Invalid phone number/,
    );
  });

});
