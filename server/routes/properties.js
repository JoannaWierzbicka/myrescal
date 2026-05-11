import { Router } from 'express';
import { getSupabaseUser } from '../auth/supabaseClient.js';
import { requireAuth } from '../auth/requireAuth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createHttpError } from '../utils/httpError.js';
import { mapSupabaseError } from '../utils/mapSupabaseError.js';
import { validatePropertyPayload } from '../validators/propertyValidator.js';
import { validateIdParam } from '../validators/requestSchemas.js';
import {
  createProperty,
  deleteProperty,
  findPropertyOwnerRecord,
  listProperties,
  updateProperty,
} from '../repositories/propertyRepository.js';

const router = Router();

router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const ownerId = req.user.id;
    const supabase = getSupabaseUser(req.accessToken);

    const { data, error } = await listProperties({ supabase, ownerId });

    if (error) {
      throw mapSupabaseError(error);
    }

    res.json(data);
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const ownerId = req.user.id;
    const supabase = getSupabaseUser(req.accessToken);
    const property = validatePropertyPayload(req.body);

    const { data, error } = await createProperty({ supabase, ownerId, payload: property });

    if (error) {
      throw mapSupabaseError(error);
    }

    res.status(201).json(data);
  }),
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const ownerId = req.user.id;
    const supabase = getSupabaseUser(req.accessToken);
    const id = validateIdParam(req.params);
    const property = validatePropertyPayload(req.body);

    const { data, error } = await updateProperty({ supabase, ownerId, id, payload: property });

    if (error) {
      throw mapSupabaseError(error, error.status === 406 ? 404 : error.status);
    }

    if (!data) {
      throw createHttpError(404, `Property with ID ${id} not found.`);
    }

    res.json(data);
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const ownerId = req.user.id;
    const supabase = getSupabaseUser(req.accessToken);
    const id = validateIdParam(req.params);

    const { data: existingProperty, error: existingPropertyError } = await findPropertyOwnerRecord({
      supabase,
      ownerId,
      id,
    });

    if (existingPropertyError) {
      throw mapSupabaseError(
        existingPropertyError,
        existingPropertyError.status === 406 ? 404 : existingPropertyError.status,
      );
    }

    if (!existingProperty) {
      throw createHttpError(404, 'Not found');
    }

    const { error } = await deleteProperty({ supabase, ownerId, id });

    if (error) {
      throw mapSupabaseError(error, error.status === 406 ? 404 : error.status);
    }

    res.json({ message: 'Property deleted successfully.' });
  }),
);

export default router;
