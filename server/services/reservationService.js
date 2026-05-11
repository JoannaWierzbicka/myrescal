import { findOwnedProperty, findOwnedRoom, findOverlappingReservations } from '../repositories/reservationRepository.js';
import { createHttpError } from '../utils/httpError.js';
import { mapSupabaseError } from '../utils/mapSupabaseError.js';
import { createReservationOverlapError } from '../utils/reservationRules.js';

export async function ensureReservationOwnership(supabase, ownerId, propertyId, roomId) {
  const errors = [];

  if (!propertyId) {
    errors.push(createHttpError(400, 'property_id is required.'));
  }
  if (!roomId) {
    errors.push(createHttpError(400, 'room_id is required.'));
  }

  if (errors.length) {
    throw errors[0];
  }

  const { data: property, error: propertyError } = await findOwnedProperty({
    supabase,
    ownerId,
    propertyId,
  });

  if (propertyError) {
    throw mapSupabaseError(
      propertyError,
      propertyError.status || 500,
      propertyError.message || 'Failed to validate property.',
    );
  }

  if (!property) {
    throw createHttpError(404, 'Property not found.');
  }

  const { data: room, error: roomError } = await findOwnedRoom({
    supabase,
    ownerId,
    roomId,
  });

  if (roomError) {
    throw mapSupabaseError(
      roomError,
      roomError.status || 500,
      roomError.message || 'Failed to validate room.',
    );
  }

  if (!room) {
    throw createHttpError(404, 'Room not found.');
  }

  if (room.property_id !== propertyId) {
    throw createHttpError(400, 'Room does not belong to the selected property.');
  }

  return { property, room };
}

export async function ensureRoomAvailability({
  supabase,
  ownerId,
  roomId,
  startDate,
  endDate,
  excludeReservationId,
}) {
  if (!roomId || !startDate || !endDate) {
    return;
  }

  const { data, error } = await findOverlappingReservations({
    supabase,
    ownerId,
    roomId,
    startDate,
    endDate,
    excludeReservationId,
  });

  if (error) {
    throw mapSupabaseError(error);
  }

  if (Array.isArray(data) && data.length > 0) {
    throw createReservationOverlapError();
  }
}
