import { getSupabaseAdmin } from './supabaseClient.js';
import { AppError, createHttpError } from '../utils/httpError.js';
import { setRequestMonitoringContext } from '../utils/monitoring.js';

const shouldRequireConfirmedEmail = () => process.env.AUTH_REQUIRE_EMAIL_CONFIRMATION !== 'false';

const isEmailConfirmed = (user) =>
  Boolean(user?.email_confirmed_at || user?.confirmed_at);

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

    if (shouldRequireConfirmedEmail() && !isEmailConfirmed(user)) {
      throw createHttpError(
        403,
        'Please confirm your email address before continuing.',
        null,
        'AUTH_EMAIL_NOT_CONFIRMED',
      );
    }

    req.user = user;
    setRequestMonitoringContext(req);
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }

    next(createHttpError(401, 'Unauthorized', null, 'UNAUTHORIZED'));
  }
}
