import { randomUUID } from 'crypto';
import { logger } from '../utils/logger.js';

const REQUEST_ID_HEADER = 'x-request-id';
const MAX_REQUEST_ID_LENGTH = 128;

const normalizeRequestId = (value) => {
  if (!value) return null;
  const normalized = String(value).trim();
  if (!normalized) return null;
  if (normalized.length > MAX_REQUEST_ID_LENGTH) {
    return normalized.slice(0, MAX_REQUEST_ID_LENGTH);
  }
  return normalized;
};

export const requestIdMiddleware = (req, res, next) => {
  const incomingRequestId = normalizeRequestId(req.header(REQUEST_ID_HEADER));
  const requestId = incomingRequestId || randomUUID();

  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  next();
};

export const requestLoggingMiddleware = (req, res, next) => {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    if (res.statusCode >= 400 && res.locals?.errorLogged) {
      return;
    }

    const durationMs = Number((process.hrtime.bigint() - start) / 1000000n);
    const baseContext = {
      requestId: req.requestId || null,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs,
      userId: req.user?.id || null,
    };

    logger.info('http.request.completed', baseContext);
  });

  next();
};
