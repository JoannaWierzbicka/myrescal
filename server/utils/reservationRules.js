import { createHttpError } from './httpError.js';

const RESERVATION_OVERLAP_MESSAGE = 'Room is already booked for selected dates.';
const RESERVATION_OVERLAP_CODE = 'RESERVATION_OVERLAP';

export function createReservationOverlapError() {
  return createHttpError(
    409,
    RESERVATION_OVERLAP_MESSAGE,
    null,
    RESERVATION_OVERLAP_CODE,
  );
}

export function withComputedReservationStatus(reservations) {
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

export function calculateNumberOfNights(startDate, endDate) {
  const startUtc = parseDateToUtcDay(startDate);
  const endUtc = parseDateToUtcDay(endDate);
  const differenceMs = endUtc - startUtc;
  const nights = differenceMs / (1000 * 60 * 60 * 24);

  if (!Number.isFinite(nights) || nights <= 0) {
    throw createHttpError(400, 'End date must be after the start date.');
  }

  return nights;
}

export function resolveTotalPrice(reservation, numberOfNights) {
  if (reservation.nightly_rate !== null && reservation.nightly_rate !== undefined) {
    return Number((reservation.nightly_rate * numberOfNights).toFixed(2));
  }

  if (reservation.total_price !== null && reservation.total_price !== undefined) {
    return reservation.total_price;
  }

  return null;
}

export function resolveDepositAmount(reservation, totalPrice) {
  if (reservation.status !== 'deposit_paid') {
    return null;
  }

  const depositAmount = reservation.deposit_amount ?? 0;
  const comparableTotalPrice = totalPrice ?? 0;

  if (depositAmount > comparableTotalPrice) {
    throw createHttpError(400, 'Field "deposit_amount" cannot be greater than "total_price".');
  }

  return depositAmount;
}

function parseDateToUtcDay(dateValue) {
  const value = String(dateValue || '');
  const parts = value.split('-');
  if (parts.length !== 3) {
    throw createHttpError(400, 'Invalid reservation dates.');
  }

  const [yearRaw, monthRaw, dayRaw] = parts;
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    throw createHttpError(400, 'Invalid reservation dates.');
  }

  const utcTimestamp = Date.UTC(year, month - 1, day);
  const parsedDate = new Date(utcTimestamp);

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.getUTCFullYear() !== year ||
    parsedDate.getUTCMonth() !== month - 1 ||
    parsedDate.getUTCDate() !== day
  ) {
    throw createHttpError(400, 'Invalid reservation dates.');
  }

  return utcTimestamp;
}
