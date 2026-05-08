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
  OTHER_ROOM_ID,
  PROPERTY_ID,
  ROOM_ID,
  createMockState,
  installSupabaseMocks,
} = await import('../testSupport/mockSupabase.js');

const validReservationPayload = () => ({
  name: 'Anna',
  lastname: 'Kowalska',
  phone: '500600700',
  mail: 'anna@example.com',
  start_date: '2026-07-10',
  end_date: '2026-07-12',
  property_id: PROPERTY_ID,
  room_id: ROOM_ID,
  adults: 2,
  children: 0,
  nightly_rate: 250,
  total_price: null,
  deposit_amount: null,
  status: 'booking',
  notes: '',
});

afterEach(() => {
  resetSupabaseClientsForTest();
});

describe('reservation routes', () => {
  beforeEach(() => {
    installSupabaseMocks();
  });

  test('rejects unauthenticated reservation access', async () => {
    const response = await request(app).get('/api/reservations').expect(401);

    assert.equal(response.body.error.code, 'UNAUTHORIZED');
  });

  test('lists only reservations owned by the authenticated user', async () => {
    const response = await request(app)
      .get(`/api/reservations?property_id=${PROPERTY_ID}`)
      .set('Authorization', AUTH_HEADER)
      .expect(200);

    assert.equal(response.body.length, 1);
    assert.equal(response.body[0].id, '1');
    assert.equal(response.body[0].owner_id, OWNER_ID);
    assert.equal(response.body[0].property.name, 'Apartament Centrum');
  });

  test('creates a reservation and computes total price from nightly rate', async () => {
    const state = installSupabaseMocks(createMockState({ reservations: [] }));

    const response = await request(app)
      .post('/api/reservations')
      .set('Authorization', AUTH_HEADER)
      .send(validReservationPayload())
      .expect(201);

    assert.equal(response.body.owner_id, OWNER_ID);
    assert.equal(response.body.total_price, 500);
    assert.equal(response.body.room.id, ROOM_ID);
    assert.equal(state.reservations.length, 1);
  });

  test('returns 409 when a reservation overlaps an existing booking', async () => {
    installSupabaseMocks(createMockState());

    const response = await request(app)
      .post('/api/reservations')
      .set('Authorization', AUTH_HEADER)
      .send({
        ...validReservationPayload(),
        start_date: '2026-06-03',
        end_date: '2026-06-06',
      })
      .expect(409);

    assert.equal(response.body.error.code, 'RESERVATION_OVERLAP');
  });

  test('rejects invalid reservation dates before hitting database writes', async () => {
    const state = installSupabaseMocks(createMockState({ reservations: [] }));

    const response = await request(app)
      .post('/api/reservations')
      .set('Authorization', AUTH_HEADER)
      .send({
        ...validReservationPayload(),
        start_date: '2026-07-12',
        end_date: '2026-07-10',
      })
      .expect(400);

    assert.equal(response.body.error.code, 'BAD_REQUEST');
    assert.equal(state.reservations.length, 0);
  });

  test('updates an owned reservation', async () => {
    const state = installSupabaseMocks(createMockState());

    const response = await request(app)
      .put('/api/reservations/1')
      .set('Authorization', AUTH_HEADER)
      .send({
        ...validReservationPayload(),
        name: 'Maria',
        room_id: OTHER_ROOM_ID,
        start_date: '2026-08-01',
        end_date: '2026-08-04',
      })
      .expect(200);

    assert.equal(response.body.name, 'Maria');
    assert.equal(response.body.total_price, 750);
    assert.equal(state.reservations.find((item) => item.id === '1').room_id, OTHER_ROOM_ID);
  });

  test('deletes an owned reservation', async () => {
    const state = installSupabaseMocks(createMockState());

    const response = await request(app)
      .delete('/api/reservations/1')
      .set('Authorization', AUTH_HEADER)
      .expect(200);

    assert.equal(response.body.message, 'Reservation deleted successfully.');
    assert.equal(state.reservations.some((item) => item.id === '1'), false);
  });
});
