import { createHttpError } from '../utils/httpError.js';

export function createEmailExistsError(details = null) {
  return createHttpError(
    409,
    'An account with this email already exists.',
    details,
    'AUTH_EMAIL_EXISTS',
  );
}

export function mapAuthProviderError(error, { fallbackStatus, fallbackMessage }) {
  const message = error?.message || fallbackMessage;
  const normalizedMessage = message.toLowerCase();

  if (
    error?.code === 'email_exists' ||
    (normalizedMessage.includes('already') &&
      (normalizedMessage.includes('registered') || normalizedMessage.includes('exists')))
  ) {
    return createEmailExistsError(error?.details);
  }

  if (normalizedMessage.includes('invalid login credentials')) {
    return createHttpError(
      401,
      'Invalid email or password.',
      error?.details,
      'AUTH_INVALID_CREDENTIALS',
    );
  }

  if (normalizedMessage.includes('email not confirmed')) {
    return createHttpError(
      403,
      'Please confirm your email address before logging in.',
      error?.details,
      'AUTH_EMAIL_NOT_CONFIRMED',
    );
  }

  return createHttpError(
    error?.status || fallbackStatus,
    message || fallbackMessage,
    error?.details,
    'AUTH_PROVIDER_ERROR',
  );
}
