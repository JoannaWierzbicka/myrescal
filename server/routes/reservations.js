import { Router } from 'express';
import { getSupabaseUser } from '../auth/supabaseClient.js';
import { requireAuth } from '../auth/requireAuth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createHttpError } from '../utils/httpError.js';
import { isReservationOverlapError, mapSupabaseError } from '../utils/mapSupabaseError.js';
import {
  validateReservationPayload,
  DEFAULT_RESERVATION_STATUS,
} from '../validators/reservationValidator.js';
import {
  validateReservationIdParam,
  validateReservationQuery,
} from '../validators/requestSchemas.js';
import {
  calculateNumberOfNights,
  createReservationOverlapError,
  resolveDepositAmount,
  resolveTotalPrice,
  withComputedReservationStatus,
} from '../utils/reservationRules.js';
import {
  createReservation,
  deleteReservation,
  findReservationById,
  findReservationOwnerRecord,
  listReservations,
  updateReservation,
} from '../repositories/reservationRepository.js';
import {
  ensureReservationOwnership,
  ensureRoomAvailability,
} from '../services/reservationService.js';

const router = Router();

router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { lastname, start_date: startDate, property_id: propertyId } =
      validateReservationQuery(req.query);
    const ownerId = req.user.id;
    const supabase = getSupabaseUser(req.accessToken);

    const { data, error } = await listReservations({
      supabase,
      ownerId,
      lastname,
      startDate,
      propertyId,
    });

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
    const id = validateReservationIdParam(req.params);
    const ownerId = req.user.id;
    const supabase = getSupabaseUser(req.accessToken);

    const { data, error } = await findReservationById({ supabase, ownerId, id });

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
    const supabase = getSupabaseUser(req.accessToken);
    const numberOfNights = calculateNumberOfNights(reservation.start_date, reservation.end_date);
    const totalPrice = resolveTotalPrice(reservation, numberOfNights);
    const depositAmount = resolveDepositAmount(reservation, totalPrice);

    const { property, room } = await ensureReservationOwnership(
      supabase,
      ownerId,
      reservation.property_id,
      reservation.room_id,
    );

    try {
      await ensureRoomAvailability({
        supabase,
        ownerId,
        roomId: room.id,
        startDate: reservation.start_date,
        endDate: reservation.end_date,
      });
    } catch (error) {
      if (error?.status === 409) {
        throw createReservationOverlapError();
      }
      throw error;
    }

    const insertPayload = {
      ...reservation,
      total_price: totalPrice,
      deposit_amount: depositAmount,
      property_id: property.id,
      room_id: room.id,
      owner_id: ownerId,
    };

    if (insertPayload.status === undefined) {
      insertPayload.status = DEFAULT_RESERVATION_STATUS;
    }

    const { data, error } = await createReservation({ supabase, payload: insertPayload });

    if (error) {
      if (isReservationOverlapError(error)) {
        throw createReservationOverlapError();
      }
      throw mapSupabaseError(error);
    }

    res.status(201).json(data);
  }),
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = validateReservationIdParam(req.params);
    const ownerId = req.user.id;
    const supabase = getSupabaseUser(req.accessToken);
    const reservation = validateReservationPayload(req.body);
    const numberOfNights = calculateNumberOfNights(reservation.start_date, reservation.end_date);
    const totalPrice = resolveTotalPrice(reservation, numberOfNights);
    const depositAmount = resolveDepositAmount(reservation, totalPrice);

    const { property, room } = await ensureReservationOwnership(
      supabase,
      ownerId,
      reservation.property_id,
      reservation.room_id,
    );

    try {
      await ensureRoomAvailability({
        supabase,
        ownerId,
        roomId: room.id,
        startDate: reservation.start_date,
        endDate: reservation.end_date,
        excludeReservationId: id,
      });
    } catch (error) {
      if (error?.status === 409) {
        throw createReservationOverlapError();
      }
      throw error;
    }

    const updatePayload = {
      ...reservation,
      total_price: totalPrice,
      deposit_amount: depositAmount,
      property_id: property.id,
      room_id: room.id,
    };

    if (updatePayload.status === undefined) {
      delete updatePayload.status;
    }

    const { data, error } = await updateReservation({
      supabase,
      ownerId,
      id,
      payload: updatePayload,
    });

    if (error) {
      if (isReservationOverlapError(error)) {
        throw createReservationOverlapError();
      }
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
    const id = validateReservationIdParam(req.params);
    const ownerId = req.user.id;
    const supabase = getSupabaseUser(req.accessToken);

    const {
      data: existingReservation,
      error: existingReservationError,
    } = await findReservationOwnerRecord({ supabase, ownerId, id });

    if (existingReservationError) {
      throw mapSupabaseError(
        existingReservationError,
        existingReservationError.status === 406 ? 404 : existingReservationError.status,
      );
    }

    if (!existingReservation) {
      throw createHttpError(404, 'Not found');
    }

    const { error } = await deleteReservation({ supabase, ownerId, id });

    if (error) {
      throw mapSupabaseError(error, error.status === 406 ? 404 : error.status);
    }

    res.json({ message: 'Reservation deleted successfully.' });
  }),
);

export default router;
