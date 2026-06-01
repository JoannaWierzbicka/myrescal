export async function listRooms({ supabase, ownerId, propertyId }) {
  let query = supabase
    .from('rooms')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: true });

  if (propertyId) {
    query = query.eq('property_id', propertyId);
  }

  return await query;
}

export async function createRoom({ supabase, ownerId, payload }) {
  return supabase
    .from('rooms')
    .insert({ ...payload, owner_id: ownerId })
    .select('*')
    .maybeSingle();
}

export async function updateRoom({ supabase, ownerId, id, payload }) {
  return supabase
    .from('rooms')
    .update(payload)
    .eq('id', id)
    .eq('owner_id', ownerId)
    .select('*')
    .maybeSingle();
}

export async function findRoomOwnerRecord({ supabase, ownerId, id }) {
  return supabase
    .from('rooms')
    .select('id')
    .eq('id', id)
    .eq('owner_id', ownerId)
    .maybeSingle();
}

export async function deleteRoom({ supabase, ownerId, id }) {
  return supabase
    .from('rooms')
    .delete()
    .eq('id', id)
    .eq('owner_id', ownerId);
}

export async function deleteRoomsByOwner({ supabase, ownerId }) {
  return supabase
    .from('rooms')
    .delete()
    .eq('owner_id', ownerId);
}

export async function findPropertyOwnerRecord({ supabase, ownerId, propertyId }) {
  return supabase
    .from('properties')
    .select('id')
    .eq('id', propertyId)
    .eq('owner_id', ownerId)
    .maybeSingle();
}

export async function listRoomsForProperty({ supabase, ownerId, propertyId }) {
  return supabase
    .from('rooms')
    .select('id, name')
    .eq('owner_id', ownerId)
    .eq('property_id', propertyId);
}
