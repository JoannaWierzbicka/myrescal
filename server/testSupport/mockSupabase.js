import { setSupabaseClientsForTest } from '../auth/supabaseClient.js';

export const OWNER_ID = '11111111-1111-4111-8111-111111111111';
export const OTHER_OWNER_ID = '22222222-2222-4222-8222-222222222222';
export const PROPERTY_ID = '33333333-3333-4333-8333-333333333333';
export const ROOM_ID = '44444444-4444-4444-8444-444444444444';
export const OTHER_ROOM_ID = '55555555-5555-4555-8555-555555555555';
export const AUTH_HEADER = 'Bearer test-access-token';

export const createMockState = (overrides = {}) => ({
  nextPropertyIndex: 7,
  nextRoomIndex: 8,
  nextReservationId: 20,
  properties: [
    {
      id: PROPERTY_ID,
      owner_id: OWNER_ID,
      name: 'Apartament Centrum',
      description: 'Blisko rynku',
    },
    {
      id: '66666666-6666-4666-8666-666666666666',
      owner_id: OTHER_OWNER_ID,
      name: 'Nie moj obiekt',
      description: null,
    },
  ],
  rooms: [
    { id: ROOM_ID, owner_id: OWNER_ID, property_id: PROPERTY_ID, name: 'Pokoj 1' },
    { id: OTHER_ROOM_ID, owner_id: OWNER_ID, property_id: PROPERTY_ID, name: 'Pokoj 2' },
  ],
  reservations: [
    {
      id: '1',
      owner_id: OWNER_ID,
      property_id: PROPERTY_ID,
      room_id: ROOM_ID,
      name: 'Jan',
      lastname: 'Nowak',
      phone: '123456789',
      mail: 'jan@example.com',
      start_date: '2026-06-01',
      end_date: '2026-06-05',
      adults: 2,
      children: 1,
      nightly_rate: 200,
      total_price: 800,
      deposit_amount: null,
      status: 'confirmed',
      confirmation_method: 'booking_com',
      notes: null,
    },
    {
      id: '2',
      owner_id: OTHER_OWNER_ID,
      property_id: PROPERTY_ID,
      room_id: ROOM_ID,
      name: 'Obcy',
      lastname: 'Gosc',
      phone: '987654321',
      mail: 'obcy@example.com',
      start_date: '2026-06-10',
      end_date: '2026-06-12',
      adults: 1,
      children: 0,
      nightly_rate: 100,
      total_price: 200,
      deposit_amount: null,
      status: 'confirmed',
      confirmation_method: 'booking_com',
      notes: null,
    },
  ],
  ...overrides,
});

export const installSupabaseMocks = (state = createMockState()) => {
  const admin = {
    auth: {
      getUser: async (token) => ({
        data: {
          user: token
            ? {
                id: OWNER_ID,
                email: 'owner@example.com',
                email_confirmed_at: '2026-01-01T00:00:00.000Z',
              }
            : null,
        },
        error: token ? null : { message: 'Missing token' },
      }),
    },
  };

  setSupabaseClientsForTest({
    admin,
    user: () => createFakeSupabaseClient(state),
  });

  return state;
};

function createFakeSupabaseClient(state) {
  return {
    from: (table) => new FakeQueryBuilder(state, table),
  };
}

class FakeQueryBuilder {
  constructor(state, table) {
    this.state = state;
    this.table = table;
    this.operation = 'select';
    this.payload = null;
    this.filters = [];
  }

  select() {
    return this;
  }

  order() {
    return this;
  }

  insert(payload) {
    this.operation = 'insert';
    this.payload = payload;
    return this;
  }

  update(payload) {
    this.operation = 'update';
    this.payload = payload;
    return this;
  }

  delete() {
    this.operation = 'delete';
    return this;
  }

  eq(field, value) {
    this.filters.push({ operator: 'eq', field, value });
    return this;
  }

  neq(field, value) {
    this.filters.push({ operator: 'neq', field, value });
    return this;
  }

  gte(field, value) {
    this.filters.push({ operator: 'gte', field, value });
    return this;
  }

  lt(field, value) {
    this.filters.push({ operator: 'lt', field, value });
    return this;
  }

  gt(field, value) {
    this.filters.push({ operator: 'gt', field, value });
    return this;
  }

  ilike(field, value) {
    this.filters.push({ operator: 'ilike', field, value });
    return this;
  }

  maybeSingle() {
    return Promise.resolve(this.resolve({ single: true }));
  }

  then(resolve, reject) {
    return Promise.resolve(this.resolve({ single: false })).then(resolve, reject);
  }

  resolve({ single }) {
    if (this.operation === 'insert') {
      return this.insertRow();
    }

    if (this.operation === 'update') {
      return this.updateRow();
    }

    if (this.operation === 'delete') {
      return this.deleteRows();
    }

    const rows = this.filteredRows();
    const data = single ? rows[0] || null : rows;

    return { data, error: null };
  }

  insertRow() {
    const row = {
      id: nextIdForTable(this.state, this.table),
      ...this.payload,
    };

    this.tableRows().push(row);

    return { data: this.attachRelations(row), error: null };
  }

  updateRow() {
    const row = this.filteredRawRows()[0];

    if (!row) {
      return { data: null, error: null };
    }

    Object.assign(row, this.payload);

    return { data: this.attachRelations(row), error: null };
  }

  deleteRows() {
    const rowsToDelete = new Set(this.filteredRawRows().map((row) => row.id));

    if (this.table === 'properties') {
      this.state.properties = this.state.properties.filter((row) => !rowsToDelete.has(row.id));
    }

    if (this.table === 'rooms') {
      this.state.rooms = this.state.rooms.filter((row) => !rowsToDelete.has(row.id));
    }

    if (this.table === 'reservations') {
      this.state.reservations = this.state.reservations.filter((row) => !rowsToDelete.has(row.id));
    }

    return { data: null, error: null };
  }

  filteredRawRows() {
    return this.tableRows().filter((row) =>
      this.filters.every((filter) => matchesFilter(row, filter)),
    );
  }

  filteredRows() {
    return this.filteredRawRows().map((row) => this.attachRelations(row));
  }

  tableRows() {
    if (this.table === 'properties') return this.state.properties;
    if (this.table === 'rooms') return this.state.rooms;
    if (this.table === 'reservations') return this.state.reservations;
    return [];
  }

  attachRelations(row) {
    if (this.table !== 'reservations') {
      return { ...row };
    }

    return attachReservationRelations(this.state, row);
  }
}

function nextIdForTable(state, table) {
  if (table === 'properties') {
    return `${state.nextPropertyIndex++}`.padStart(8, '7') + '-7777-4777-8777-777777777777';
  }

  if (table === 'rooms') {
    return `${state.nextRoomIndex++}`.padStart(8, '8') + '-8888-4888-8888-888888888888';
  }

  return String(state.nextReservationId++);
}

function matchesFilter(row, filter) {
  const value = row[filter.field];
  const expected = filter.value;

  if (filter.operator === 'eq') return String(value) === String(expected);
  if (filter.operator === 'neq') return String(value) !== String(expected);
  if (filter.operator === 'gte') return String(value) >= String(expected);
  if (filter.operator === 'lt') return String(value) < String(expected);
  if (filter.operator === 'gt') return String(value) > String(expected);
  if (filter.operator === 'ilike') {
    const prefix = String(expected).replace(/%$/, '').toLowerCase();
    return String(value || '').toLowerCase().startsWith(prefix);
  }

  return true;
}

function attachReservationRelations(state, reservation) {
  const room = state.rooms.find((item) => item.id === reservation.room_id) || null;
  const property = state.properties.find((item) => item.id === reservation.property_id) || null;

  return {
    ...reservation,
    room: room ? { id: room.id, name: room.name, property_id: room.property_id } : null,
    property: property ? { id: property.id, name: property.name } : null,
  };
}
