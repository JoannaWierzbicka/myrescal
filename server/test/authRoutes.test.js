import assert from 'node:assert/strict';
import { afterEach, describe, test } from 'node:test';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL ||= 'https://example.supabase.co';
process.env.SUPABASE_ANON_KEY ||= 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY ||= 'test-service-role-key';
process.env.CORS_ORIGIN ||= 'http://localhost:5173';

const { default: app } = await import('../app.js');
const {
  resetSupabaseClientsForTest,
  setSupabaseClientsForTest,
} = await import('../auth/supabaseClient.js');

afterEach(() => {
  resetSupabaseClientsForTest();
});

const validRegisterPayload = (overrides = {}) => ({
  firstName: 'Anna',
  lastName: 'Kowalska',
  email: 'anna@example.com',
  password: 'strong-password',
  ...overrides,
});

describe('auth routes', () => {
  test('rejects registration when email already exists', async () => {
    let signUpCalled = false;

    installAuthMocks({
      users: [{ id: 'existing-user-id', email: 'anna@example.com' }],
      signUp: async () => {
        signUpCalled = true;
        return { data: { user: null, session: null }, error: null };
      },
    });

    const response = await request(app)
      .post('/api/auth/register')
      .send(validRegisterPayload({ email: 'ANNA@example.com' }))
      .expect(409);

    assert.equal(response.body.error.code, 'AUTH_EMAIL_EXISTS');
    assert.equal(response.body.error.message, 'An account with this email already exists.');
    assert.equal(signUpCalled, false);
  });

  test('registers a new email after duplicate check passes', async () => {
    let signUpPayload = null;

    installAuthMocks({
      users: [{ id: 'other-user-id', email: 'other@example.com' }],
      signUp: async (payload) => {
        signUpPayload = payload;
        return {
          data: {
            user: { id: 'new-user-id', email: payload.email },
            session: null,
          },
          error: null,
        };
      },
    });

    const response = await request(app)
      .post('/api/auth/register')
      .send(validRegisterPayload())
      .expect(200);

    assert.equal(response.body.user.id, 'new-user-id');
    assert.equal(response.body.requiresEmailConfirmation, true);
    assert.equal(signUpPayload.email, 'anna@example.com');
    assert.equal(signUpPayload.options.data.first_name, 'Anna');
  });
});

function installAuthMocks({ users, signUp }) {
  setSupabaseClientsForTest({
    admin: {
      auth: {
        admin: {
          listUsers: async ({ page = 1, perPage = 1000 } = {}) => {
            const start = (page - 1) * perPage;
            const pageUsers = users.slice(start, start + perPage);
            const nextPage = start + perPage < users.length ? page + 1 : null;

            return {
              data: {
                users: pageUsers,
                nextPage,
              },
              error: null,
            };
          },
        },
      },
    },
    user: {
      auth: {
        signUp,
      },
    },
  });
}
