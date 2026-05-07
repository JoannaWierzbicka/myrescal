import { z } from 'zod';
import { parseSchema, uuidSchema } from './schemaUtils.js';

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const POSITIVE_INTEGER_ID_REGEX = /^[1-9]\d*$/;

export const validateIdParam = (params, fieldName = 'id') =>
  parseSchema(
    z.object({
      [fieldName]: uuidSchema(fieldName),
    }),
    params,
    `Invalid ${fieldName}.`,
  )[fieldName];

export const validateReservationIdParam = (params) =>
  parseSchema(
    z.object({
      id: z
        .string({ error: 'Field "id" is required.' })
        .trim()
        .regex(POSITIVE_INTEGER_ID_REGEX, 'Field "id" must be a valid reservation id.'),
    }),
    params,
    'Invalid reservation id.',
  ).id;

export const validateReservationQuery = (query) =>
  parseSchema(
    z
      .object({
        lastname: z.string().trim().max(80, 'lastname must be at most 80 characters long.').optional(),
        start_date: z.string().regex(ISO_DATE_REGEX, 'start_date must use YYYY-MM-DD format.').optional(),
        property_id: uuidSchema('property_id').optional(),
      })
      .passthrough(),
    query,
    'Invalid reservation query.',
  );

export const validateRoomsQuery = (query) =>
  parseSchema(
    z
      .object({
        property_id: uuidSchema('property_id').optional(),
      })
      .passthrough(),
    query,
    'Invalid rooms query.',
  );
