import assert from 'node:assert/strict';
import { afterEach, describe, test } from 'node:test';
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

afterEach(() => {
  resetSupabaseClientsForTest();
});

describe('account deletion route', () => {
  test('requires typed confirmation', async () => {
    installSupabaseMocks();

    const response = await request(app)
      .delete('/api/auth/account')
      .set('Authorization', AUTH_HEADER)
      .send({ confirmation: 'DELETE' })
      .expect(400);

    assert.equal(response.body.error.code, 'VALIDATION_ERROR');
  });

  test('deletes application data and auth user for existing account', async () => {
    const state = installSupabaseMocks(createMockState());

    const response = await request(app)
      .delete('/api/auth/account')
      .set('Authorization', AUTH_HEADER)
      .send({ confirmation: 'DELETE ACCOUNT' })
      .expect(200);

    assert.equal(response.body.message, 'Account deleted successfully.');
    assert.equal(state.owner_profiles.some((profile) => profile.owner_id === OWNER_ID), false);
    assert.equal(state.properties.some((property) => property.owner_id === OWNER_ID), false);
    assert.equal(state.rooms.some((room) => room.owner_id === OWNER_ID), false);
    assert.equal(state.reservations.some((reservation) => reservation.owner_id === OWNER_ID), false);
    assert.deepEqual(state.deletedAuthUserIds, [OWNER_ID]);
  });
});
