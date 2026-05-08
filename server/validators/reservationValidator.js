import { createHttpError } from '../utils/httpError.js';
import { z } from 'zod';
import {
  optionalNonNegativeInteger,
  optionalNonNegativeNumber,
  optionalTrimmedString,
  parseSchema,
  requiredTrimmedString,
  uuidSchema,
} from './schemaUtils.js';

export const RESERVATION_STATUSES = Object.freeze([
  'preliminary',
  'deposit_paid',
  'confirmed',
  'past',
]);

export const DEFAULT_RESERVATION_STATUS = 'preliminary';
export const RESERVATION_CONFIRMATION_METHODS = Object.freeze([
  'paid_full',
  'booking_com',
  'other',
]);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_INPUT_REGEX = /^\+?[\d\s\-()]{6,25}$/;
const MAX_NOTES_LENGTH = 1000;
const MAX_NAME_LENGTH = 80;
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const reservationSchema = z
  .object({
    name: requiredTrimmedString(MAX_NAME_LENGTH, 'First name'),
    lastname: requiredTrimmedString(MAX_NAME_LENGTH, 'Last name'),
    phone: optionalTrimmedString(25, 'Phone number'),
    mail: optionalTrimmedString(254, 'Email'),
    start_date: z.string({ error: 'Start date is required.' }).regex(ISO_DATE_REGEX, 'Invalid reservation dates.'),
    end_date: z.string({ error: 'End date is required.' }).regex(ISO_DATE_REGEX, 'Invalid reservation dates.'),
    property_id: uuidSchema('property_id'),
    room_id: uuidSchema('room_id'),
    price: optionalNonNegativeNumber('price').optional(),
    nightly_rate: optionalNonNegativeNumber('nightly_rate').optional(),
    total_price: optionalNonNegativeNumber('total_price').optional(),
    deposit_amount: optionalNonNegativeNumber('deposit_amount').optional(),
    adults: optionalNonNegativeInteger('adults').optional(),
    children: optionalNonNegativeInteger('children').optional(),
    notes: optionalTrimmedString(MAX_NOTES_LENGTH, 'Notes').optional(),
    status: z.preprocess(
      (value) => {
        if (value === undefined || value === null || String(value).trim() === '') return undefined;
        const normalized = String(value).trim();
        return normalized === 'booking' ? 'confirmed' : normalized;
      },
      z.enum(RESERVATION_STATUSES, { error: 'Invalid status.' }).optional(),
    ),
    confirmation_method: z.preprocess(
      (value) => {
        if (value === undefined || value === null || String(value).trim() === '') return undefined;
        return String(value).trim();
      },
      z.enum(RESERVATION_CONFIRMATION_METHODS, { error: 'Invalid confirmation method.' }).optional(),
    ),
  })
  .passthrough();

const normalizeString = (value) => {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed.length === 0 ? null : trimmed;
};

const normalizeEmail = (value) => {
  const normalized = normalizeString(value);
  if (!normalized) return null;

  if (!EMAIL_REGEX.test(normalized)) {
    throw createHttpError(400, 'Invalid email');
  }

  return normalized;
};

const normalizePhone = (value) => {
  const normalized = normalizeString(value);
  if (!normalized) return null;

  if (!PHONE_INPUT_REGEX.test(normalized)) {
    throw createHttpError(400, 'Invalid phone number');
  }

  const digits = normalized.replace(/\D/g, '');
  if (digits.length < 6 || digits.length > 15) {
    throw createHttpError(400, 'Invalid phone number');
  }

  return `${normalized.startsWith('+') ? '+' : ''}${digits}`;
};

const normalizeNotes = (value) => {
  const normalized = normalizeString(value);
  if (!normalized) return null;

  if (normalized.length > MAX_NOTES_LENGTH) {
    throw createHttpError(400, `Field "notes" must be at most ${MAX_NOTES_LENGTH} characters long.`);
  }

  return normalized;
};

export const validateReservationPayload = (payload) => {
  if (!payload || typeof payload !== 'object') {
    throw createHttpError(400, 'Invalid reservation payload.');
  }

  const parsedPayload = parseSchema(reservationSchema, payload, 'Invalid reservation payload.');
  const startDate = new Date(parsedPayload.start_date);
  const endDate = new Date(parsedPayload.end_date);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw createHttpError(400, 'Invalid reservation dates.');
  }

  if (endDate <= startDate) {
    throw createHttpError(400, 'End date must be after the start date.');
  }

  const legacyPrice = parsedPayload.price ?? null;
  const nightlyRate = parsedPayload.nightly_rate ?? null;
  const totalPrice = parsedPayload.total_price ?? null;
  const depositAmount = parsedPayload.deposit_amount ?? null;
  const rawStatus = String(payload.status || '').trim();
  const status = parsedPayload.status ?? null;
  const confirmationMethod =
    parsedPayload.confirmation_method ?? (rawStatus === 'booking' ? 'booking_com' : null);

  if (status === 'confirmed' && !confirmationMethod) {
    throw createHttpError(
      400,
      'Field "confirmation_method" is required for confirmed reservations.',
      { field: 'confirmation_method' },
      'VALIDATION_ERROR',
    );
  }

  const result = {
    name: parsedPayload.name,
    lastname: parsedPayload.lastname,
    phone: normalizePhone(parsedPayload.phone),
    mail: normalizeEmail(parsedPayload.mail),
    start_date: parsedPayload.start_date,
    end_date: parsedPayload.end_date,
    property_id: parsedPayload.property_id,
    room_id: parsedPayload.room_id,
    nightly_rate: nightlyRate,
    total_price: totalPrice ?? legacyPrice,
    deposit_amount: depositAmount,
    adults: parsedPayload.adults ?? null,
    children: parsedPayload.children ?? null,
    notes: normalizeNotes(parsedPayload.notes),
    confirmation_method: status === 'confirmed' ? confirmationMethod : null,
  };

  if (parsedPayload.status !== undefined && parsedPayload.status !== null && String(parsedPayload.status).trim() !== '') {
    const normalizedStatus = String(parsedPayload.status).trim();
    if (!RESERVATION_STATUSES.includes(normalizedStatus)) {
      throw createHttpError(400, `Invalid status "${parsedPayload.status}".`, null, 'VALIDATION_ERROR');
    }
    result.status = normalizedStatus;
  }

  return result;
};
