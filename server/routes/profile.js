import { Router } from 'express';
import { getSupabaseUser } from '../auth/supabaseClient.js';
import { requireAuth } from '../auth/requireAuth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createHttpError } from '../utils/httpError.js';
import { mapSupabaseError } from '../utils/mapSupabaseError.js';
import { validateOwnerProfilePayload } from '../validators/profileValidator.js';
import {
  findOwnerProfile,
  upsertOwnerProfile,
} from '../repositories/ownerProfileRepository.js';

const router = Router();

router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const ownerId = req.user.id;
    const supabase = getSupabaseUser(req.accessToken);

    const { data, error } = await findOwnerProfile({ supabase, ownerId });

    if (error) {
      throw mapSupabaseError(error, error.status === 406 ? 404 : error.status);
    }

    if (!data) {
      throw createHttpError(404, 'Owner profile not found.', null, 'PROFILE_NOT_FOUND');
    }

    res.json(data);
  }),
);

router.put(
  '/',
  asyncHandler(async (req, res) => {
    const ownerId = req.user.id;
    const supabase = getSupabaseUser(req.accessToken);
    const profile = validateOwnerProfilePayload(req.body);

    const { data, error } = await upsertOwnerProfile({
      supabase,
      ownerId,
      payload: profile,
    });

    if (error) {
      throw mapSupabaseError(error);
    }

    res.json(data);
  }),
);

export default router;
