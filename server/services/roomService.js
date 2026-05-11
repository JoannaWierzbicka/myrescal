import {
  findPropertyOwnerRecord,
  listRoomsForProperty,
} from '../repositories/roomRepository.js';
import { createHttpError } from '../utils/httpError.js';
import { mapSupabaseError } from '../utils/mapSupabaseError.js';

const ROOM_UNIQUE_NAME_ERROR = 'Room name must be unique within this property.';
const ROOM_UNIQUE_NAME_CODE = 'ROOM_NAME_NOT_UNIQUE';

export async function ensurePropertyBelongsToOwner({ supabase, ownerId, propertyId }) {
  const { data: property, error } = await findPropertyOwnerRecord({
    supabase,
    ownerId,
    propertyId,
  });

  if (error) {
    throw mapSupabaseError(error, error.status === 406 ? 404 : error.status);
  }

  if (!property) {
    throw createHttpError(404, 'Property not found.');
  }
}

export async function ensureUniqueRoomNameWithinProperty({
  supabase,
  ownerId,
  propertyId,
  roomName,
  excludeRoomId,
}) {
  const normalizedName = normalizeRoomName(roomName);
  const { data, error } = await listRoomsForProperty({ supabase, ownerId, propertyId });

  if (error) {
    throw mapSupabaseError(error);
  }

  const conflict = (data || []).find((existingRoom) => {
    if (!existingRoom?.id || !existingRoom?.name) return false;
    if (excludeRoomId && existingRoom.id === excludeRoomId) return false;
    return normalizeRoomName(existingRoom.name) === normalizedName;
  });

  if (conflict) {
    throw createRoomNameUniqueError();
  }
}

export function createRoomNameUniqueError() {
  return createHttpError(409, ROOM_UNIQUE_NAME_ERROR, null, ROOM_UNIQUE_NAME_CODE);
}

export function isRoomNameUniqueViolation(error) {
  const message = String(error?.message || '').toLowerCase();
  return (
    error?.code === '23505'
    && (message.includes('rooms_property_name_unique') || message.includes('lower(btrim(name))'))
  );
}

function normalizeRoomName(name) {
  return String(name || '').trim().toLowerCase();
}
