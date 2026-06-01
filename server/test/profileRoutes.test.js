import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, test } from 'node:test';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL ||= 'https://example.supabase.co';
process.env.SUPABASE_ANON_KEY ||= 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY ||= 'test-service-role-key';
process.env.CORS_ORIGIN ||= 'http://localhost:5173';

const { default: app } = await import('../app.js');
const { resetSupabaseClientsForTest } = await import('../auth/supabaseClient.js');
const {
  AUTH_HEADER,
  OWNER_ID,
  createMockState,
  installSupabaseMocks,
} = await import('../testSupport/mockSupabase.js');

beforeEach(() => {
  installSupabaseMocks();
});

afterEach(() => {
  resetSupabaseClientsForTest();
});

describe('profile routes', () => {
  test('returns authenticated owner profile', async () => {
    const response = await request(app)
      .get('/api/profile')
      .set('Authorization', AUTH_HEADER)
      .expect(200);

    assert.equal(response.body.owner_id, OWNER_ID);
    assert.equal(response.body.first_name, 'Joanna');
  });

  test('updates owner profile fields', async () => {
    const state = installSupabaseMocks(createMockState());

    const response = await request(app)
      .put('/api/profile')
      .set('Authorization', AUTH_HEADER)
      .send({
        firstName: ' Anna ',
        lastName: ' Nowak ',
        phone: '+48 501 502 503',
        address: ' Rynek 1 ',
        companyName: ' Firma ',
      })
      .expect(200);

    assert.equal(response.body.first_name, 'Anna');
    assert.equal(response.body.last_name, 'Nowak');
    assert.equal(response.body.phone, '+48501502503');
    assert.equal(response.body.address, 'Rynek 1');
    assert.equal(response.body.company_name, 'Firma');
    assert.equal(state.owner_profiles[0].address, 'Rynek 1');
  });
});
