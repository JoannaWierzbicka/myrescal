import { Router } from 'express';
import { getSupabaseUser } from '../auth/supabaseClient.js';
import { requireAuth } from '../auth/requireAuth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createHttpError } from '../utils/httpError.js';
import { mapSupabaseError } from '../utils/mapSupabaseError.js';
import { validateRoomPayload } from '../validators/roomValidator.js';
import { validateIdParam, validateRoomsQuery } from '../validators/requestSchemas.js';
import {
  createRoom,
  deleteRoom,
  findRoomOwnerRecord,
  listRooms,
  updateRoom,
} from '../repositories/roomRepository.js';
import {
  createRoomNameUniqueError,
  ensurePropertyBelongsToOwner,
  ensureUniqueRoomNameWithinProperty,
  isRoomNameUniqueViolation,
} from '../services/roomService.js';

const router = Router();

router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const ownerId = req.user.id;
    const supabase = getSupabaseUser(req.accessToken);
    const { property_id: propertyId } = validateRoomsQuery(req.query);

    const { data, error } = await listRooms({ supabase, ownerId, propertyId });

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
    const supabase = getSupabaseUser(req.accessToken);
    const room = validateRoomPayload(req.body);

    await ensurePropertyBelongsToOwner({ supabase, ownerId, propertyId: room.property_id });

    await ensureUniqueRoomNameWithinProperty({
      supabase,
      ownerId,
      propertyId: room.property_id,
      roomName: room.name,
    });

    const { data, error } = await createRoom({ supabase, ownerId, payload: room });

    if (error) {
      if (isRoomNameUniqueViolation(error)) {
        throw createRoomNameUniqueError();
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
    const supabase = getSupabaseUser(req.accessToken);
    const id = validateIdParam(req.params);
    const room = validateRoomPayload(req.body);

    await ensurePropertyBelongsToOwner({ supabase, ownerId, propertyId: room.property_id });

    await ensureUniqueRoomNameWithinProperty({
      supabase,
      ownerId,
      propertyId: room.property_id,
      roomName: room.name,
      excludeRoomId: id,
    });

    const { data, error } = await updateRoom({ supabase, ownerId, id, payload: room });

    if (error) {
      if (isRoomNameUniqueViolation(error)) {
        throw createRoomNameUniqueError();
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
    const supabase = getSupabaseUser(req.accessToken);
    const id = validateIdParam(req.params);

    const { data: existingRoom, error: existingRoomError } = await findRoomOwnerRecord({
      supabase,
      ownerId,
      id,
    });

    if (existingRoomError) {
      throw mapSupabaseError(
        existingRoomError,
        existingRoomError.status === 406 ? 404 : existingRoomError.status,
      );
    }

    if (!existingRoom) {
      throw createHttpError(404, 'Not found');
    }

    const { error } = await deleteRoom({ supabase, ownerId, id });

    if (error) {
      throw mapSupabaseError(error, error.status === 406 ? 404 : error.status);
    }

    res.json({ message: 'Room deleted successfully.' });
  }),
);

export default router;
