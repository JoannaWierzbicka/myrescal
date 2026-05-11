import { Router } from 'express';
import { getSupabaseUser } from './supabaseClient.js';
import { requireAuth } from './requireAuth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createHttpError } from '../utils/httpError.js';
import { mapSupabaseError } from '../utils/mapSupabaseError.js';
import { validateOwnerProfilePayload } from '../validators/profileValidator.js';
import { findOwnerProfile } from '../repositories/ownerProfileRepository.js';
import { createEmailExistsError, mapAuthProviderError } from './authErrors.js';
import {
  findAuthUserByEmail,
  maybeCreateOwnerProfileFromUserMetadata,
} from '../services/authService.js';

const router = Router();
const authRedirectUrl = process.env.AUTH_EMAIL_REDIRECT_URL || process.env.CLIENT_URL || null;
const shouldRequireConfirmedEmail = () => process.env.AUTH_REQUIRE_EMAIL_CONFIRMATION !== 'false';
const isEmailConfirmed = (user) =>
  Boolean(user?.email_confirmed_at || user?.confirmed_at);

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body || {};

    if (!email || !password) {
      throw createHttpError(400, 'Email and password are required.', null, 'VALIDATION_ERROR');
    }

    const existingUser = await findAuthUserByEmail(email);
    if (existingUser) {
      throw createEmailExistsError();
    }

    const profile = validateOwnerProfilePayload(req.body);
    const supabase = getSupabaseUser();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        ...(authRedirectUrl ? { emailRedirectTo: authRedirectUrl } : {}),
        data: {
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
          company_name: profile.company_name,
        },
      },
    });

    if (error) {
      throw mapAuthProviderError(error, {
        fallbackStatus: 400,
        fallbackMessage: 'Unable to register user.',
      });
    }

    res.json({
      user: data.user,
      session: shouldRequireConfirmedEmail() ? null : (data.session ?? null),
      requiresEmailConfirmation: shouldRequireConfirmedEmail() || !data.session,
    });
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

    if (shouldRequireConfirmedEmail() && !isEmailConfirmed(data.user)) {
      throw createHttpError(
        403,
        'Please confirm your email address before logging in.',
        null,
        'AUTH_EMAIL_NOT_CONFIRMED',
      );
    }

    const profile = await maybeCreateOwnerProfileFromUserMetadata(data.user);

    res.json({ session: data.session, user: data.user, profile: profile ?? null });
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
    const supabase = getSupabaseUser(req.accessToken);
    const { data: profile, error: profileError } = await findOwnerProfile({
      supabase,
      ownerId: user.id,
    });

    if (profileError) {
      throw mapSupabaseError(profileError, profileError.status === 406 ? 404 : profileError.status);
    }

    const resolvedProfile = profile ?? await maybeCreateOwnerProfileFromUserMetadata(user);

    res.json({
      user: {
        id: user.id,
        email: user.email ?? null,
        phone: user.phone ?? null,
        role: user.role ?? null,
        aud: user.aud ?? null,
      },
      profile: resolvedProfile ?? null,
    });
  }),
);

export default router;
