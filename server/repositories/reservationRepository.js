const RESERVATION_WITH_RELATIONS_SELECT = `
  *,
  room:rooms (
    id,
    name,
    property_id
  ),
  property:properties (
    id,
    name
  )
`;

export async function listReservations({
  supabase,
  ownerId,
  lastname,
  startDate,
  propertyId,
}) {
  let query = supabase
    .from('reservations')
    .select(RESERVATION_WITH_RELATIONS_SELECT)
    .eq('owner_id', ownerId)
    .order('start_date', { ascending: true });

  if (lastname) {
    query = query.ilike('lastname', `${lastname}%`);
  }
  if (startDate) {
    query = query.gte('start_date', startDate);
  }
  if (propertyId) {
    query = query.eq('property_id', propertyId);
  }

  return await query;
}

export async function findReservationById({ supabase, ownerId, id }) {
  return supabase
    .from('reservations')
    .select(RESERVATION_WITH_RELATIONS_SELECT)
    .eq('id', id)
    .eq('owner_id', ownerId)
    .maybeSingle();
}

export async function createReservation({ supabase, payload }) {
  return supabase
    .from('reservations')
    .insert(payload)
    .select(RESERVATION_WITH_RELATIONS_SELECT)
    .maybeSingle();
}

export async function updateReservation({ supabase, ownerId, id, payload }) {
  return supabase
    .from('reservations')
    .update(payload)
    .eq('id', id)
    .eq('owner_id', ownerId)
    .select(RESERVATION_WITH_RELATIONS_SELECT)
    .maybeSingle();
}

export async function findReservationOwnerRecord({ supabase, ownerId, id }) {
  return supabase
    .from('reservations')
    .select('id')
    .eq('id', id)
    .eq('owner_id', ownerId)
    .maybeSingle();
}

export async function deleteReservation({ supabase, ownerId, id }) {
  return supabase
    .from('reservations')
    .delete()
    .eq('id', id)
    .eq('owner_id', ownerId);
}

export async function deleteReservationsByProperty({ supabase, ownerId, propertyId }) {
  return supabase
    .from('reservations')
    .delete()
    .eq('owner_id', ownerId)
    .eq('property_id', propertyId);
}

export async function deleteReservationsByRoom({ supabase, ownerId, roomId }) {
  return supabase
    .from('reservations')
    .delete()
    .eq('owner_id', ownerId)
    .eq('room_id', roomId);
}

export async function deleteReservationsByRooms({ supabase, ownerId, roomIds }) {
  if (!roomIds?.length) {
    return { data: null, error: null };
  }

  return supabase
    .from('reservations')
    .delete()
    .eq('owner_id', ownerId)
    .in('room_id', roomIds);
}

export async function findOwnedProperty({ supabase, ownerId, propertyId }) {
  return supabase
    .from('properties')
    .select('id, name')
    .eq('id', propertyId)
    .eq('owner_id', ownerId)
    .maybeSingle();
}

export async function findOwnedRoom({ supabase, ownerId, roomId }) {
  return supabase
    .from('rooms')
    .select('id, property_id, name')
    .eq('id', roomId)
    .eq('owner_id', ownerId)
    .maybeSingle();
}

export async function findOverlappingReservations({
  supabase,
  ownerId,
  roomId,
  startDate,
  endDate,
  excludeReservationId,
}) {
  let query = supabase
    .from('reservations')
    .select('id, start_date, end_date')
    .eq('owner_id', ownerId)
    .eq('room_id', roomId)
    .lt('start_date', endDate)
    .gt('end_date', startDate);

  if (excludeReservationId) {
    query = query.neq('id', excludeReservationId);
  }

  return await query;
}
