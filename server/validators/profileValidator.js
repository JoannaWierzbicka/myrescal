import { createHttpError } from '../utils/httpError.js';

const MAX_NAME_LENGTH = 80;
const MAX_COMPANY_NAME_LENGTH = 120;
const MAX_PHONE_LENGTH = 25;
const PHONE_INPUT_REGEX = /^\+?[\d\s\-()]{6,25}$/;

const normalizeRequiredString = (value, field, label, maxLength) => {
  if (value === undefined || value === null || String(value).trim() === '') {
    throw createHttpError(400, `${label} is required.`, null, 'VALIDATION_ERROR');
  }

  const normalized = String(value).trim();
  if (normalized.length > maxLength) {
    throw createHttpError(
      400,
      `${label} must be at most ${maxLength} characters long.`,
      { field },
      'VALIDATION_ERROR',
    );
  }

  return normalized;
};

const normalizeOptionalString = (value, field, label, maxLength) => {
  if (value === undefined || value === null || String(value).trim() === '') {
    return null;
  }

  const normalized = String(value).trim();
  if (normalized.length > maxLength) {
    throw createHttpError(
      400,
      `${label} must be at most ${maxLength} characters long.`,
      { field },
      'VALIDATION_ERROR',
    );
  }

  return normalized;
};

const normalizePhone = (value) => {
  const normalized = normalizeOptionalString(value, 'phone', 'Phone number', MAX_PHONE_LENGTH);
  if (!normalized) return null;

  if (!PHONE_INPUT_REGEX.test(normalized)) {
    throw createHttpError(400, 'Invalid phone number.', { field: 'phone' }, 'VALIDATION_ERROR');
  }

  const digits = normalized.replace(/\D/g, '');
  if (digits.length < 6 || digits.length > 15) {
    throw createHttpError(400, 'Invalid phone number.', { field: 'phone' }, 'VALIDATION_ERROR');
  }

  return `${normalized.startsWith('+') ? '+' : ''}${digits}`;
};

export const validateOwnerProfilePayload = (payload) => {
  if (!payload || typeof payload !== 'object') {
    throw createHttpError(400, 'Invalid owner profile payload.', null, 'VALIDATION_ERROR');
  }

  return {
    first_name: normalizeRequiredString(payload.firstName ?? payload.first_name, 'firstName', 'First name', MAX_NAME_LENGTH),
    last_name: normalizeRequiredString(payload.lastName ?? payload.last_name, 'lastName', 'Last name', MAX_NAME_LENGTH),
    phone: normalizePhone(payload.phone),
    company_name: normalizeOptionalString(
      payload.companyName ?? payload.company_name,
      'companyName',
      'Company name',
      MAX_COMPANY_NAME_LENGTH,
    ),
  };
};
