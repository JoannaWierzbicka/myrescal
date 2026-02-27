import { Router } from 'express';
import { supabase } from './supabaseClient.js';
import { requireAuth } from './requireAuth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createHttpError } from '../utils/httpError.js';

const router = Router();

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body || {};

    if (!email || !password) {
      throw createHttpError(400, 'Email and password are required.');
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      const message = error.message || 'Unable to register user.';
      throw createHttpError(error.status || 400, message);
    }

    res.json({ user: data.user, session: data.session ?? null });
  }),
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body || {};

    if (!email || !password) {
      throw createHttpError(400, 'Email and password are required.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      const message = error.message || 'Invalid email or password.';
      throw createHttpError(error.status || 400, message);
    }

    res.json({ session: data.session, user: data.user });
  }),
);

router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      throw createHttpError(400, 'Missing access token.');
    }

    const { error } = await supabase.auth.signOut({ access_token: token });

    if (error) {
      const message = error.message || 'Unable to log out.';
      throw createHttpError(error.status || 400, message);
    }

    res.json({ message: 'Logged out' });
  }),
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = req.user;

    res.json({
      user: {
        id: user.id,
        email: user.email ?? null,
        phone: user.phone ?? null,
        role: user.role ?? null,
        aud: user.aud ?? null,
      },
    });
  }),
);

export default router;
