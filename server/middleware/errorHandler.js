import {
  AppError,
  createAppError,
  createHttpError,
  defaultErrorCodeForStatus,
} from '../utils/httpError.js';
import { captureException } from '../utils/monitoring.js';
import { logger } from '../utils/logger.js';

export const notFoundHandler = (req, _res, next) => {
  next(createHttpError(404, `Route not found: ${req.originalUrl}`, null, 'ROUTE_NOT_FOUND'));
};

const toAppError = (err) => {
  if (err instanceof AppError) return err;

  if (err instanceof SyntaxError && err.type === 'entity.parse.failed') {
    return createHttpError(400, 'Malformed JSON payload.', null, 'INVALID_JSON');
  }

  const statusCode = Number(err?.statusCode || err?.status) || 500;
  const code = typeof err?.code === 'string' ? err.code : defaultErrorCodeForStatus(statusCode);
  const message =
    statusCode >= 500
      ? 'Unexpected server error'
      : (err?.message || 'Unexpected server error');

  return createAppError({
    statusCode,
    code,
    message,
    details: err?.details ?? null,
    cause: err,
  });
};

export const errorHandler = (err, req, res, _next) => {
  const appError = toAppError(err);
  res.locals.errorLogged = true;
  const clientMessage =
    appError.statusCode >= 500
      ? 'Unexpected server error'
      : appError.message;
  const clientDetails =
    appError.statusCode >= 500
      ? null
      : (appError.details ?? null);

  const logContext = {
    requestId: req.requestId || null,
    method: req.method,
    path: req.originalUrl,
    statusCode: appError.statusCode,
    errorCode: appError.code,
    errorMessage: appError.message,
  };

  if (appError.statusCode >= 500) {
    logger.error('http.request.failed', {
      ...logContext,
      stack: err?.stack || null,
    });
    captureException(err, { requestId: req.requestId || null });
  } else {
    logger.warn('http.request.failed', logContext);
  }

  res.status(appError.statusCode).json({
    error: {
      code: appError.code,
      message: clientMessage,
      details: clientDetails,
    },
    requestId: req.requestId || null,
  });
};
