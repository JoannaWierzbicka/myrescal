import { getSupabaseAdmin } from './supabaseClient.js';
import { AppError, createHttpError } from '../utils/httpError.js';

export async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    next(createHttpError(401, 'Unauthorized', null, 'UNAUTHORIZED'));
    return;
  }

  req.accessToken = token;

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      throw createHttpError(401, 'Invalid or expired token.', null, 'INVALID_TOKEN');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }

    next(createHttpError(401, 'Unauthorized', null, 'UNAUTHORIZED'));
  }
}
