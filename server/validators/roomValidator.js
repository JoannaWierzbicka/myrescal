import { createHttpError } from '../utils/httpError.js';
import { z } from 'zod';
import { parseSchema, requiredTrimmedString, uuidSchema } from './schemaUtils.js';

const roomSchema = z
  .object({
    property_id: uuidSchema('property_id'),
    name: requiredTrimmedString(120, 'Room name'),
  })
  .passthrough();

export const validateRoomPayload = (payload) => {
  if (!payload || typeof payload !== 'object') {
    throw createHttpError(400, 'Invalid room payload.');
  }

  const parsedPayload = parseSchema(roomSchema, payload, 'Invalid room payload.');

  return {
    property_id: parsedPayload.property_id,
    name: parsedPayload.name,
  };
};
