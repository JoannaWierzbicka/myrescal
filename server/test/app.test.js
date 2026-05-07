import assert from 'node:assert/strict';
import { test } from 'node:test';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL ||= 'https://example.supabase.co';
process.env.SUPABASE_ANON_KEY ||= 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY ||= 'test-service-role-key';
process.env.CORS_ORIGIN ||= 'http://localhost:5173';

const { default: app } = await import('../app.js');

test('GET /health returns ok and request id', async () => {
  const response = await request(app).get('/health').expect(200);

  assert.deepEqual(response.body, { ok: true });
  assert.ok(response.headers['x-request-id']);
});

test('GET /ready reports unavailable dependency in isolated test env', async () => {
  const response = await request(app).get('/ready').expect(503);

  assert.equal(response.body.ok, false);
});

test('unknown route returns normalized 404 error', async () => {
  const response = await request(app).get('/missing-route').expect(404);

  assert.equal(response.body.error.code, 'ROUTE_NOT_FOUND');
  assert.equal(response.body.requestId, response.headers['x-request-id']);
});

test('protected API route without token returns 401', async () => {
  const response = await request(app).get('/api/reservations').expect(401);

  assert.equal(response.body.error.code, 'UNAUTHORIZED');
  assert.equal(response.body.requestId, response.headers['x-request-id']);
});

test('malformed JSON returns normalized 400 error', async () => {
  const response = await request(app)
    .post('/api/auth/login')
    .set('Content-Type', 'application/json')
    .send('{"email":')
    .expect(400);

  assert.equal(response.body.error.code, 'INVALID_JSON');
  assert.equal(response.body.error.message, 'Malformed JSON payload.');
});

test('oversized JSON payload is rejected', async () => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email: `${'a'.repeat(150_000)}@example.com`, password: 'password' })
    .expect(413);

  assert.equal(response.body.error.code, 'PAYLOAD_TOO_LARGE');
});
