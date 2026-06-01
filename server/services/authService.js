import { getSupabaseAdmin } from '../auth/supabaseClient.js';
import { mapAuthProviderError } from '../auth/authErrors.js';
import {
  deleteOwnerProfile,
  findOwnerProfile,
  upsertOwnerProfile,
} from '../repositories/ownerProfileRepository.js';
import { deletePropertiesByOwner } from '../repositories/propertyRepository.js';
import { deleteRoomsByOwner } from '../repositories/roomRepository.js';
import { deleteReservationsByOwner } from '../repositories/reservationRepository.js';
import { mapSupabaseError } from '../utils/mapSupabaseError.js';
import { validateOwnerProfilePayload } from '../validators/profileValidator.js';

export async function findAuthUserByEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return null;
  }

  const supabaseAdmin = getSupabaseAdmin();
  const perPage = 1000;
  let page = 1;

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });

    if (error) {
      throw mapAuthProviderError(error, {
        fallbackStatus: 500,
        fallbackMessage: 'Unable to verify user registration status.',
      });
    }

    const users = Array.isArray(data?.users) ? data.users : [];
    const existingUser = users.find((user) => normalizeEmail(user.email) === normalizedEmail);
    if (existingUser) {
      return existingUser;
    }

    if (!data?.nextPage || users.length === 0) {
      return null;
    }

    page = data.nextPage;
  }
}

export async function maybeCreateOwnerProfileFromUserMetadata(user) {
  const metadata = user?.user_metadata || {};
  const firstName = metadata.first_name;
  const lastName = metadata.last_name;

  if (!user?.id || !firstName || !lastName) {
    return null;
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data: existingProfile, error: existingProfileError } = await findOwnerProfile({
    supabase: supabaseAdmin,
    ownerId: user.id,
  });

  if (existingProfileError) {
    throw mapSupabaseError(existingProfileError);
  }

  if (existingProfile) {
    return existingProfile;
  }

  const profile = validateOwnerProfilePayload({
    firstName,
    lastName,
    phone: metadata.phone ?? null,
    companyName: metadata.company_name ?? null,
  });

  const { data, error } = await upsertOwnerProfile({
    supabase: supabaseAdmin,
    ownerId: user.id,
    payload: profile,
  });

  if (error) {
    throw mapSupabaseError(error);
  }

  return data ?? null;
}

export async function deleteAccountForOwner(ownerId) {
  if (!ownerId) {
    throw new Error('ownerId is required');
  }

  const supabaseAdmin = getSupabaseAdmin();

  const deleteSteps = [
    () => deleteReservationsByOwner({ supabase: supabaseAdmin, ownerId }),
    () => deleteRoomsByOwner({ supabase: supabaseAdmin, ownerId }),
    () => deletePropertiesByOwner({ supabase: supabaseAdmin, ownerId }),
    () => deleteOwnerProfile({ supabase: supabaseAdmin, ownerId }),
  ];

  for (const deleteStep of deleteSteps) {
    const { error } = await deleteStep();
    if (error) {
      throw mapSupabaseError(error);
    }
  }

  const { error } = await supabaseAdmin.auth.admin.deleteUser(ownerId);
  if (error) {
    throw mapAuthProviderError(error, {
      fallbackStatus: 500,
      fallbackMessage: 'Unable to delete account.',
    });
  }
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}
