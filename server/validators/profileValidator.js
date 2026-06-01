import { createHttpError } from '../utils/httpError.js';
import { z } from 'zod';
import {
  optionalTrimmedString,
  parseSchema,
  requiredTrimmedString,
} from './schemaUtils.js';

const MAX_NAME_LENGTH = 80;
const MAX_COMPANY_NAME_LENGTH = 120;
const MAX_PHONE_LENGTH = 25;
const MAX_ADDRESS_LENGTH = 500;
const PHONE_INPUT_REGEX = /^\+?[\d\s\-()]{6,25}$/;

const ownerProfileSchema = z
  .object({
    firstName: requiredTrimmedString(MAX_NAME_LENGTH, 'First name').optional(),
    first_name: requiredTrimmedString(MAX_NAME_LENGTH, 'First name').optional(),
    lastName: requiredTrimmedString(MAX_NAME_LENGTH, 'Last name').optional(),
    last_name: requiredTrimmedString(MAX_NAME_LENGTH, 'Last name').optional(),
    phone: optionalTrimmedString(MAX_PHONE_LENGTH, 'Phone number').optional(),
    address: optionalTrimmedString(MAX_ADDRESS_LENGTH, 'Address').optional(),
    companyName: optionalTrimmedString(MAX_COMPANY_NAME_LENGTH, 'Company name').optional(),
    company_name: optionalTrimmedString(MAX_COMPANY_NAME_LENGTH, 'Company name').optional(),
  })
  .passthrough()
  .superRefine((value, ctx) => {
    if (!value.firstName && !value.first_name) {
      ctx.addIssue({
        code: 'custom',
        path: ['firstName'],
        message: 'First name is required.',
      });
    }
    if (!value.lastName && !value.last_name) {
      ctx.addIssue({
        code: 'custom',
        path: ['lastName'],
        message: 'Last name is required.',
      });
    }
  });

const normalizeString = (value) => {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed.length === 0 ? null : trimmed;
};

const normalizePhone = (value) => {
  const normalized = normalizeString(value);
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

  const parsedPayload = parseSchema(ownerProfileSchema, payload, 'Invalid owner profile payload.');

  return {
    first_name: parsedPayload.firstName ?? parsedPayload.first_name,
    last_name: parsedPayload.lastName ?? parsedPayload.last_name,
    phone: normalizePhone(parsedPayload.phone),
    address: parsedPayload.address ?? null,
    company_name: parsedPayload.companyName ?? parsedPayload.company_name ?? null,
  };
};
