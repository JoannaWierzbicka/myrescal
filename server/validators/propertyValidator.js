import { createHttpError } from '../utils/httpError.js';
import { z } from 'zod';
import { optionalTrimmedString, parseSchema, requiredTrimmedString } from './schemaUtils.js';

const propertySchema = z
  .object({
    name: requiredTrimmedString(120, 'Property name'),
    description: optionalTrimmedString(1000, 'Description').optional(),
  })
  .passthrough();

export const validatePropertyPayload = (payload) => {
  if (!payload || typeof payload !== 'object') {
    throw createHttpError(400, 'Invalid property payload.');
  }

  const parsedPayload = parseSchema(propertySchema, payload, 'Invalid property payload.');

  return {
    name: parsedPayload.name,
    description: parsedPayload.description ?? null,
  };
};
