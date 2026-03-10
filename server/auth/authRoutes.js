import { Router } from 'express';
import { getSupabaseUser } from './supabaseClient.js';
import { requireAuth } from './requireAuth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createHttpError } from '../utils/httpError.js';

const router = Router();

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body || {};
    const supabase = getSupabaseUser();

    if (!email || !password) {
      throw createHttpError(400, 'Email and password are required.', null, 'VALIDATION_ERROR');
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw mapAuthProviderError(error, {
        fallbackStatus: 400,
        fallbackMessage: 'Unable to register user.',
      });
    }

    res.json({ user: data.user, session: data.session ?? null });
  }),
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body || {};
    const supabase = getSupabaseUser();

    if (!email || !password) {
      throw createHttpError(400, 'Email and password are required.', null, 'VALIDATION_ERROR');
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      throw mapAuthProviderError(error, {
        fallbackStatus: 401,
        fallbackMessage: 'Invalid email or password.',
      });
    }

    res.json({ session: data.session, user: data.user });
  }),
);

router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      throw createHttpError(400, 'Missing access token.', null, 'VALIDATION_ERROR');
    }

    const supabase = getSupabaseUser(token);
    const { error } = await supabase.auth.signOut();

    if (error) {
      const message = error.message || 'Unable to log out.';
      throw createHttpError(error.status || 400, message, error.details, 'AUTH_LOGOUT_FAILED');
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

function mapAuthProviderError(error, { fallbackStatus, fallbackMessage }) {
  const message = error?.message || fallbackMessage;
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes('already') && normalizedMessage.includes('registered')) {
    return createHttpError(
      409,
      'An account with this email already exists.',
      error?.details,
      'AUTH_EMAIL_EXISTS',
    );
  }

  if (normalizedMessage.includes('invalid login credentials')) {
    return createHttpError(
      401,
      'Invalid email or password.',
      error?.details,
      'AUTH_INVALID_CREDENTIALS',
    );
  }

  return createHttpError(
    error?.status || fallbackStatus,
    message || fallbackMessage,
    error?.details,
    'AUTH_PROVIDER_ERROR',
  );
}
