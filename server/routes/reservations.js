import { Router } from 'express';
import { supabase } from '../auth/supabaseClient.js';
import { requireAuth } from '../auth/requireAuth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createHttpError } from '../utils/httpError.js';
import { mapSupabaseError } from '../utils/mapSupabaseError.js';
import {
  validateReservationPayload,
  DEFAULT_RESERVATION_STATUS,
} from '../validators/reservationValidator.js';

const router = Router();

router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { lastname, start_date: startDate, property_id: propertyId } = req.query;
    const ownerId = req.user.id;

    let query = supabase
      .from('reservations')
      .select(`
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
      `)
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

    const { data, error } = await query;

    if (error) {
      throw mapSupabaseError(error);
    }

    const normalized = withComputedReservationStatus(data);

    res.json(normalized);
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const ownerId = req.user.id;

    const { data, error } = await supabase
      .from('reservations')
      .select(`
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
      `)
      .eq('id', id)
      .eq('owner_id', ownerId)
      .maybeSingle();

    if (error) {
      throw mapSupabaseError(error, error.status === 406 ? 404 : error.status);
    }

    if (!data) {
      throw createHttpError(404, `Reservation with ID ${id} not found.`);
    }

    const [normalized] = withComputedReservationStatus([data]);

    res.json(normalized);
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const reservation = validateReservationPayload(req.body);
    const ownerId = req.user.id;

    const { property, room } = await ensureOwnership(ownerId, reservation.property_id, reservation.room_id);

    await ensureRoomAvailability({
      ownerId,
      roomId: room.id,
      startDate: reservation.start_date,
      endDate: reservation.end_date,
    });

    const insertPayload = {
      ...reservation,
      property_id: property.id,
      room_id: room.id,
      owner_id: ownerId,
    };

    if (insertPayload.status === undefined) {
      insertPayload.status = DEFAULT_RESERVATION_STATUS;
    }

    const { data, error } = await supabase
      .from('reservations')
      .insert(insertPayload)
      .select(`
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
      `)
      .maybeSingle();

    if (error) {
      throw mapSupabaseError(error);
    }

    res.status(201).json(data);
  }),
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const ownerId = req.user.id;
    const reservation = validateReservationPayload(req.body);

    const { property, room } = await ensureOwnership(ownerId, reservation.property_id, reservation.room_id);

    await ensureRoomAvailability({
      ownerId,
      roomId: room.id,
      startDate: reservation.start_date,
      endDate: reservation.end_date,
      excludeReservationId: id,
    });

    const updatePayload = {
      ...reservation,
      property_id: property.id,
      room_id: room.id,
    };

    if (updatePayload.status === undefined) {
      delete updatePayload.status;
    }

    const { data, error } = await supabase
      .from('reservations')
      .update(updatePayload)
      .eq('id', id)
      .eq('owner_id', ownerId)
      .select(`
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
      `)
      .maybeSingle();

    if (error) {
      throw mapSupabaseError(error, error.status === 406 ? 404 : error.status);
    }

    if (!data) {
      throw createHttpError(404, `Reservation with ID ${id} not found.`);
    }

    res.json(data);
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const ownerId = req.user.id;

    const { data: existingReservation, error: existingReservationError } = await supabase
      .from('reservations')
      .select('id')
      .eq('id', id)
      .eq('owner_id', ownerId)
      .maybeSingle();

    if (existingReservationError) {
      throw mapSupabaseError(
        existingReservationError,
        existingReservationError.status === 406 ? 404 : existingReservationError.status,
      );
    }

    if (!existingReservation) {
      throw createHttpError(404, 'Not found');
    }

    const { error } = await supabase
      .from('reservations')
      .delete()
      .eq('id', id)
      .eq('owner_id', ownerId);

    if (error) {
      throw mapSupabaseError(error, error.status === 406 ? 404 : error.status);
    }

    res.json({ message: 'Reservation deleted successfully.' });
  }),
);

export default router;

async function ensureOwnership(ownerId, propertyId, roomId) {
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

  const { data: property, error: propertyError } = await supabase
    .from('properties')
    .select('id, name')
    .eq('id', propertyId)
    .eq('owner_id', ownerId)
    .maybeSingle();

  if (propertyError) {
    throw createHttpError(
      propertyError.status || 500,
      propertyError.message || 'Failed to validate property.',
    );
  }

  if (!property) {
    throw createHttpError(404, 'Property not found.');
  }

  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .select('id, property_id, name')
    .eq('id', roomId)
    .eq('owner_id', ownerId)
    .maybeSingle();

  if (roomError) {
    throw createHttpError(roomError.status || 500, roomError.message || 'Failed to validate room.');
  }

  if (!room) {
    throw createHttpError(404, 'Room not found.');
  }

  if (room.property_id !== propertyId) {
    throw createHttpError(400, 'Room does not belong to the selected property.');
  }

  return { property, room };
}

async function ensureRoomAvailability({ ownerId, roomId, startDate, endDate, excludeReservationId }) {
  if (!roomId || !startDate || !endDate) {
    return;
  }

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

  const { data, error } = await query;

  if (error) {
    throw mapSupabaseError(error);
  }

  if (Array.isArray(data) && data.length > 0) {
    throw createHttpError(409, 'Room is already booked for the selected dates.');
  }
}

function withComputedReservationStatus(reservations) {
  if (!Array.isArray(reservations) || reservations.length === 0) {
    return reservations;
  }

  const now = new Date();
  return reservations.map((reservation) => {
    if (!reservation) {
      return reservation;
    }

    const endDate = reservation.end_date ? new Date(reservation.end_date) : null;
    const isPastByDate = Boolean(
      endDate && !Number.isNaN(endDate.getTime()) && endDate < now,
    );
    const computedStatus = isPastByDate ? 'past' : reservation.status;

    return {
      ...reservation,
      computedStatus,
      isPast: computedStatus === 'past',
    };
  });
}
