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
  OTHER_ROOM_ID,
  PROPERTY_ID,
  ROOM_ID,
  createMockState,
  installSupabaseMocks,
} = await import('../testSupport/mockSupabase.js');

afterEach(() => {
  resetSupabaseClientsForTest();
});

describe('property routes', () => {
  beforeEach(() => {
    installSupabaseMocks();
  });

  test('rejects unauthenticated property access', async () => {
    const response = await request(app).get('/api/properties').expect(401);

    assert.equal(response.body.error.code, 'UNAUTHORIZED');
  });

  test('lists only properties owned by the authenticated user', async () => {
    const response = await request(app)
      .get('/api/properties')
      .set('Authorization', AUTH_HEADER)
      .expect(200);

    assert.equal(response.body.length, 1);
    assert.equal(response.body[0].id, PROPERTY_ID);
    assert.equal(response.body[0].name, 'Apartament Centrum');
  });

  test('creates a property for the authenticated owner', async () => {
    const state = installSupabaseMocks(createMockState({ properties: [], rooms: [], reservations: [] }));

    const response = await request(app)
      .post('/api/properties')
      .set('Authorization', AUTH_HEADER)
      .send({ name: ' Domek nad jeziorem ', description: ' Testowy opis ' })
      .expect(201);

    assert.equal(response.body.name, 'Domek nad jeziorem');
    assert.equal(response.body.description, 'Testowy opis');
    assert.equal(state.properties.length, 1);
  });

  test('rejects invalid property payload', async () => {
    const response = await request(app)
      .post('/api/properties')
      .set('Authorization', AUTH_HEADER)
      .send({ name: '' })
      .expect(400);

    assert.equal(response.body.error.code, 'VALIDATION_ERROR');
  });

  test('updates an owned property', async () => {
    const state = installSupabaseMocks(createMockState());

    const response = await request(app)
      .put(`/api/properties/${PROPERTY_ID}`)
      .set('Authorization', AUTH_HEADER)
      .send({ name: 'Nowa nazwa', description: '' })
      .expect(200);

    assert.equal(response.body.name, 'Nowa nazwa');
    assert.equal(response.body.description, null);
    assert.equal(state.properties.find((property) => property.id === PROPERTY_ID).name, 'Nowa nazwa');
  });

  test('does not update a property owned by another user', async () => {
    const response = await request(app)
      .put('/api/properties/66666666-6666-4666-8666-666666666666')
      .set('Authorization', AUTH_HEADER)
      .send({ name: 'Nie wolno' })
      .expect(404);

    assert.match(response.body.error.message, /not found/i);
  });

  test('deletes an owned property', async () => {
    const state = installSupabaseMocks(createMockState());

    const response = await request(app)
      .delete(`/api/properties/${PROPERTY_ID}`)
      .set('Authorization', AUTH_HEADER)
      .expect(200);

    assert.equal(response.body.message, 'Property deleted successfully.');
    assert.equal(state.properties.some((property) => property.id === PROPERTY_ID), false);
  });
});

describe('room routes', () => {
  beforeEach(() => {
    installSupabaseMocks();
  });

  test('lists rooms by owned property', async () => {
    const response = await request(app)
      .get(`/api/rooms?property_id=${PROPERTY_ID}`)
      .set('Authorization', AUTH_HEADER)
      .expect(200);

    assert.equal(response.body.length, 2);
    assert.ok(response.body.every((room) => room.property_id === PROPERTY_ID));
  });

  test('rejects invalid rooms query property id', async () => {
    const response = await request(app)
      .get('/api/rooms?property_id=not-a-uuid')
      .set('Authorization', AUTH_HEADER)
      .expect(400);

    assert.equal(response.body.error.code, 'VALIDATION_ERROR');
  });

  test('creates a room for an owned property', async () => {
    const state = installSupabaseMocks(createMockState());

    const response = await request(app)
      .post('/api/rooms')
      .set('Authorization', AUTH_HEADER)
      .send({ property_id: PROPERTY_ID, name: 'Pokoj rodzinny' })
      .expect(201);

    assert.equal(response.body.property_id, PROPERTY_ID);
    assert.equal(response.body.name, 'Pokoj rodzinny');
    assert.equal(state.rooms.length, 3);
  });

  test('does not create a room for another owner property', async () => {
    const response = await request(app)
      .post('/api/rooms')
      .set('Authorization', AUTH_HEADER)
      .send({
        property_id: '66666666-6666-4666-8666-666666666666',
        name: 'Pokoj obcy',
      })
      .expect(404);

    assert.equal(response.body.error.message, 'Property not found.');
  });

  test('returns 409 for duplicate room name within property', async () => {
    const response = await request(app)
      .post('/api/rooms')
      .set('Authorization', AUTH_HEADER)
      .send({ property_id: PROPERTY_ID, name: ' pokoj 1 ' })
      .expect(409);

    assert.equal(response.body.error.code, 'ROOM_NAME_NOT_UNIQUE');
  });

  test('updates an owned room', async () => {
    const state = installSupabaseMocks(createMockState());

    const response = await request(app)
      .put(`/api/rooms/${ROOM_ID}`)
      .set('Authorization', AUTH_HEADER)
      .send({ property_id: PROPERTY_ID, name: 'Pokoj premium' })
      .expect(200);

    assert.equal(response.body.name, 'Pokoj premium');
    assert.equal(state.rooms.find((room) => room.id === ROOM_ID).name, 'Pokoj premium');
  });

  test('does not update a room to duplicate name', async () => {
    const response = await request(app)
      .put(`/api/rooms/${OTHER_ROOM_ID}`)
      .set('Authorization', AUTH_HEADER)
      .send({ property_id: PROPERTY_ID, name: 'Pokoj 1' })
      .expect(409);

    assert.equal(response.body.error.code, 'ROOM_NAME_NOT_UNIQUE');
  });

  test('deletes an owned room', async () => {
    const state = installSupabaseMocks(createMockState());

    const response = await request(app)
      .delete(`/api/rooms/${ROOM_ID}`)
      .set('Authorization', AUTH_HEADER)
      .expect(200);

    assert.equal(response.body.message, 'Room deleted successfully.');
    assert.equal(state.rooms.some((room) => room.id === ROOM_ID), false);
  });
});
