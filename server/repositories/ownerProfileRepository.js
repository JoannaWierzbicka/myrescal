export async function findOwnerProfile({ supabase, ownerId }) {
  return supabase
    .from('owner_profiles')
    .select('*')
    .eq('owner_id', ownerId)
    .maybeSingle();
}

export async function upsertOwnerProfile({ supabase, ownerId, payload }) {
  return supabase
    .from('owner_profiles')
    .upsert(
      {
        owner_id: ownerId,
        ...payload,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'owner_id' },
    )
    .select('*')
    .maybeSingle();
}

export async function deleteOwnerProfile({ supabase, ownerId }) {
  return supabase
    .from('owner_profiles')
    .delete()
    .eq('owner_id', ownerId);
}
