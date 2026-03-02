import { createHttpError } from '../utils/httpError.js';

export const RESERVATION_STATUSES = Object.freeze([
  'preliminary',
  'deposit_paid',
  'confirmed',
  'booking',
  'past',
]);

export const DEFAULT_RESERVATION_STATUS = 'preliminary';

const REQUIRED_FIELDS = new Set(['name', 'lastname', 'start_date', 'end_date', 'property_id', 'room_id']);
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_INPUT_REGEX = /^\+?[\d\s\-()]{6,25}$/;
const MAX_NOTES_LENGTH = 1000;

const toNumber = (value, field) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw createHttpError(400, `Field "${field}" must be a valid number.`);
  }
  return parsed;
};

const normalizeString = (value) => {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed.length === 0 ? null : trimmed;
};

const normalizeNonNegativeNumber = (value, field) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = toNumber(value, field);
  if (parsed < 0) {
    throw createHttpError(400, `Field "${field}" must be greater than or equal to 0.`);
  }
  return parsed;
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

  const missing = [];
  REQUIRED_FIELDS.forEach((field) => {
    const value = payload[field];
    if (value === undefined || value === null) {
      missing.push(field);
      return;
    }
    if (typeof value === 'string' && value.trim() === '') {
      missing.push(field);
    }
  });

  if (missing.length > 0) {
    throw createHttpError(400, `Missing required fields: ${missing.join(', ')}.`);
  }

  const startDate = new Date(payload.start_date);
  const endDate = new Date(payload.end_date);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw createHttpError(400, 'Invalid reservation dates.');
  }

  if (endDate <= startDate) {
    throw createHttpError(400, 'End date must be after the start date.');
  }

  const legacyPrice = normalizeNonNegativeNumber(payload.price, 'price');
  const nightlyRate = normalizeNonNegativeNumber(payload.nightly_rate, 'nightly_rate');
  const totalPrice = normalizeNonNegativeNumber(payload.total_price, 'total_price');

  const result = {
    name: String(payload.name).trim(),
    lastname: String(payload.lastname).trim(),
    phone: normalizePhone(payload.phone),
    mail: normalizeEmail(payload.mail),
    start_date: payload.start_date,
    end_date: payload.end_date,
    property_id: String(payload.property_id),
    room_id: String(payload.room_id),
    nightly_rate: nightlyRate,
    total_price: totalPrice ?? legacyPrice,
    adults: normalizeNonNegativeNumber(payload.adults, 'adults'),
    children: normalizeNonNegativeNumber(payload.children, 'children'),
    notes: normalizeNotes(payload.notes),
  };

  if (payload.status !== undefined && payload.status !== null && String(payload.status).trim() !== '') {
    const normalizedStatus = String(payload.status).trim();
    if (!RESERVATION_STATUSES.includes(normalizedStatus)) {
      throw createHttpError(400, `Invalid status "${payload.status}".`);
    }
    result.status = normalizedStatus;
  }

  return result;
};
