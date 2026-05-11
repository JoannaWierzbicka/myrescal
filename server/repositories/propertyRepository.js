export async function listProperties({ supabase, ownerId }) {
  return supabase
    .from('properties')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: true });
}

export async function createProperty({ supabase, ownerId, payload }) {
  return supabase
    .from('properties')
    .insert({ ...payload, owner_id: ownerId })
    .select('*')
    .maybeSingle();
}

export async function updateProperty({ supabase, ownerId, id, payload }) {
  return supabase
    .from('properties')
    .update(payload)
    .eq('id', id)
    .eq('owner_id', ownerId)
    .select('*')
    .maybeSingle();
}

export async function findPropertyOwnerRecord({ supabase, ownerId, id }) {
  return supabase
    .from('properties')
    .select('id')
    .eq('id', id)
    .eq('owner_id', ownerId)
    .maybeSingle();
}

export async function deleteProperty({ supabase, ownerId, id }) {
  return supabase
    .from('properties')
    .delete()
    .eq('id', id)
    .eq('owner_id', ownerId);
}
