const STATUS_TO_CODE = Object.freeze({
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  429: 'RATE_LIMITED',
  500: 'INTERNAL_SERVER_ERROR',
});

const normalizeStatusCode = (statusCode) => {
  const parsed = Number(statusCode);
  if (!Number.isInteger(parsed)) return 500;
  if (parsed < 400 || parsed > 599) return 500;
  return parsed;
};

export const defaultErrorCodeForStatus = (statusCode) =>
  STATUS_TO_CODE[normalizeStatusCode(statusCode)] || 'INTERNAL_SERVER_ERROR';

export class AppError extends Error {
  constructor({ statusCode = 500, code, message = 'Unexpected server error', details = null, cause } = {}) {
    super(message, cause ? { cause } : undefined);
    this.name = 'AppError';
    this.statusCode = normalizeStatusCode(statusCode);
    this.status = this.statusCode;
    this.code = code || defaultErrorCodeForStatus(this.statusCode);
    this.details = details ?? null;
    this.isOperational = true;
  }
}

export const createAppError = ({
  statusCode = 500,
  code,
  message = 'Unexpected server error',
  details = null,
  cause,
} = {}) =>
  new AppError({
    statusCode,
    code,
    message,
    details,
    cause,
  });

export const createHttpError = (statusCode, message, details, code) =>
  createAppError({
    statusCode,
    code,
    message,
    details,
  });

export const HttpError = AppError;
