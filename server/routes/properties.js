import { Router } from 'express';
import { supabase } from '../auth/supabaseClient.js';
import { requireAuth } from '../auth/requireAuth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createHttpError } from '../utils/httpError.js';
import { mapSupabaseError } from '../utils/mapSupabaseError.js';
import { validatePropertyPayload } from '../validators/propertyValidator.js';

const router = Router();

router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const ownerId = req.user.id;
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: true });

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
    const property = validatePropertyPayload(req.body);

    const { data, error } = await supabase
      .from('properties')
      .insert({ ...property, owner_id: ownerId })
      .select('*')
      .maybeSingle();

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
    const { id } = req.params;
    const property = validatePropertyPayload(req.body);

    const { data, error } = await supabase
      .from('properties')
      .update(property)
      .eq('id', id)
      .eq('owner_id', ownerId)
      .select('*')
      .maybeSingle();

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
    const { id } = req.params;

    const { data: existingProperty, error: existingPropertyError } = await supabase
      .from('properties')
      .select('id')
      .eq('id', id)
      .eq('owner_id', ownerId)
      .maybeSingle();

    if (existingPropertyError) {
      throw mapSupabaseError(
        existingPropertyError,
        existingPropertyError.status === 406 ? 404 : existingPropertyError.status,
      );
    }

    if (!existingProperty) {
      throw createHttpError(404, 'Not found');
    }

    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id)
      .eq('owner_id', ownerId);

    if (error) {
      throw mapSupabaseError(error, error.status === 406 ? 404 : error.status);
    }

    res.json({ message: 'Property deleted successfully.' });
  }),
);

export default router;
