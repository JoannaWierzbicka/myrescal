import { z } from 'zod';
import { createHttpError } from '../utils/httpError.js';

export const emptyStringToNull = (value) => {
  if (value === undefined || value === null) return null;
  if (typeof value === 'string' && value.trim() === '') return null;
  return value;
};

export const optionalTrimmedString = (maxLength, fieldLabel) =>
  z.preprocess(
    emptyStringToNull,
    z
      .string()
      .trim()
      .min(1, `${fieldLabel} is required.`)
      .max(maxLength, `${fieldLabel} must be at most ${maxLength} characters long.`)
      .nullable(),
  );

export const requiredTrimmedString = (maxLength, fieldLabel) =>
  z
    .string({ error: `${fieldLabel} is required.` })
    .trim()
    .min(1, `${fieldLabel} is required.`)
    .max(maxLength, `${fieldLabel} must be at most ${maxLength} characters long.`);

export const optionalNonNegativeNumber = (fieldName) =>
  z.preprocess(
    emptyStringToNull,
    z
      .coerce
      .number({ error: `Field "${fieldName}" must be a valid number.` })
      .finite(`Field "${fieldName}" must be a valid number.`)
      .min(0, `Field "${fieldName}" must be greater than or equal to 0.`)
      .nullable(),
  );

export const optionalNonNegativeInteger = (fieldName) =>
  z.preprocess(
    emptyStringToNull,
    z
      .coerce
      .number({ error: `Field "${fieldName}" must be a valid number.` })
      .int(`Field "${fieldName}" must be an integer.`)
      .min(0, `Field "${fieldName}" must be greater than or equal to 0.`)
      .nullable(),
  );

export const uuidSchema = (fieldName = 'id') =>
  z.uuid(`Field "${fieldName}" must be a valid UUID.`);

export const parseSchema = (schema, payload, fallbackMessage = 'Validation failed.') => {
  const result = schema.safeParse(payload);
  if (result.success) return result.data;

  const details = result.error.issues.map((issue) => ({
    field: issue.path.join('.') || null,
    message: issue.message,
    code: issue.code,
  }));

  throw createHttpError(
    400,
    details[0]?.message || fallbackMessage,
    details,
    'VALIDATION_ERROR',
  );
};
