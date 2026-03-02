import { Router } from 'express';
import { supabase } from '../auth/supabaseClient.js';
import { requireAuth } from '../auth/requireAuth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createHttpError } from '../utils/httpError.js';
import { mapSupabaseError } from '../utils/mapSupabaseError.js';
import { validateRoomPayload } from '../validators/roomValidator.js';

const router = Router();
const ROOM_UNIQUE_NAME_ERROR = 'Room name must be unique within this property.';

router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const ownerId = req.user.id;
    const { property_id: propertyId } = req.query;

    let query = supabase
      .from('rooms')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: true });

    if (propertyId) {
      query = query.eq('property_id', propertyId);
    }

    const { data, error } = await query;

    if (error) {
      throw mapSupabaseError(error);
    }

    res.json(data);
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const ownerId = req.user.id;
    const room = validateRoomPayload(req.body);

    // Ensure property belongs to owner
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id')
      .eq('id', room.property_id)
      .eq('owner_id', ownerId)
      .maybeSingle();

    if (propertyError) {
      throw mapSupabaseError(propertyError, propertyError.status === 406 ? 404 : propertyError.status);
    }

    if (!property) {
      throw createHttpError(404, 'Property not found.');
    }

    await ensureUniqueRoomNameWithinProperty({
      ownerId,
      propertyId: room.property_id,
      roomName: room.name,
    });

    const { data, error } = await supabase
      .from('rooms')
      .insert({ ...room, owner_id: ownerId })
      .select('*')
      .maybeSingle();

    if (error) {
      if (isRoomNameUniqueViolation(error)) {
        throw createHttpError(400, ROOM_UNIQUE_NAME_ERROR);
      }
      throw mapSupabaseError(error);
    }

    res.status(201).json(data);
  }),
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const ownerId = req.user.id;
    const { id } = req.params;
    const room = validateRoomPayload(req.body);

    // Ensure property belongs to owner
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id')
      .eq('id', room.property_id)
      .eq('owner_id', ownerId)
      .maybeSingle();

    if (propertyError) {
      throw mapSupabaseError(propertyError, propertyError.status === 406 ? 404 : propertyError.status);
    }

    if (!property) {
      throw createHttpError(404, 'Property not found.');
    }

    await ensureUniqueRoomNameWithinProperty({
      ownerId,
      propertyId: room.property_id,
      roomName: room.name,
      excludeRoomId: id,
    });

    const { data, error } = await supabase
      .from('rooms')
      .update(room)
      .eq('id', id)
      .eq('owner_id', ownerId)
      .select('*')
      .maybeSingle();

    if (error) {
      if (isRoomNameUniqueViolation(error)) {
        throw createHttpError(400, ROOM_UNIQUE_NAME_ERROR);
      }
      throw mapSupabaseError(error, error.status === 406 ? 404 : error.status);
    }

    if (!data) {
      throw createHttpError(404, `Room with ID ${id} not found.`);
    }

    res.json(data);
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const ownerId = req.user.id;
    const { id } = req.params;

    const { data: existingRoom, error: existingRoomError } = await supabase
      .from('rooms')
      .select('id')
      .eq('id', id)
      .eq('owner_id', ownerId)
      .maybeSingle();

    if (existingRoomError) {
      throw mapSupabaseError(
        existingRoomError,
        existingRoomError.status === 406 ? 404 : existingRoomError.status,
      );
    }

    if (!existingRoom) {
      throw createHttpError(404, 'Not found');
    }

    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('id', id)
      .eq('owner_id', ownerId);

    if (error) {
      throw mapSupabaseError(error, error.status === 406 ? 404 : error.status);
    }

    res.json({ message: 'Room deleted successfully.' });
  }),
);

export default router;

async function ensureUniqueRoomNameWithinProperty({
  ownerId,
  propertyId,
  roomName,
  excludeRoomId,
}) {
  const normalizedName = normalizeRoomName(roomName);

  const { data, error } = await supabase
    .from('rooms')
    .select('id, name')
    .eq('owner_id', ownerId)
    .eq('property_id', propertyId);

  if (error) {
    throw mapSupabaseError(error);
  }

  const conflict = (data || []).find((existingRoom) => {
    if (!existingRoom?.id || !existingRoom?.name) return false;
    if (excludeRoomId && existingRoom.id === excludeRoomId) return false;
    return normalizeRoomName(existingRoom.name) === normalizedName;
  });

  if (conflict) {
    throw createHttpError(400, ROOM_UNIQUE_NAME_ERROR);
  }
}

function normalizeRoomName(name) {
  return String(name || '').trim().toLowerCase();
}

function isRoomNameUniqueViolation(error) {
  const message = String(error?.message || '').toLowerCase();
  return (
    error?.code === '23505'
    && (message.includes('rooms_property_name_unique') || message.includes('lower(btrim(name))'))
  );
}
