import rateLimit from 'express-rate-limit';
import { createHttpError } from '../utils/httpError.js';

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_JSON_BODY_LIMIT = '100kb';
const DEFAULT_PORT = 3000;
const DEFAULT_API_RATE_LIMIT_MAX = 300;
const DEFAULT_AUTH_LOGIN_RATE_LIMIT_MAX = 10;

export function getServerConfig(env = process.env) {
  const corsOrigin = env.CORS_ORIGIN || env.CLIENT_ORIGIN || '';
  const allowedOrigins = corsOrigin
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return {
    port: Number(env.PORT) || DEFAULT_PORT,
    jsonBodyLimit: env.JSON_BODY_LIMIT || DEFAULT_JSON_BODY_LIMIT,
    allowedOrigins,
    usesDeprecatedClientOrigin: Boolean(!env.CORS_ORIGIN && env.CLIENT_ORIGIN),
    apiRateLimitMax: Number(env.API_RATE_LIMIT_MAX) || DEFAULT_API_RATE_LIMIT_MAX,
    authLoginRateLimitMax:
      Number(env.AUTH_LOGIN_RATE_LIMIT_MAX) || DEFAULT_AUTH_LOGIN_RATE_LIMIT_MAX,
  };
}

export function createCorsOptions(allowedOrigins) {
  return {
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(createHttpError(403, 'Not allowed by CORS.', null, 'CORS_ORIGIN_NOT_ALLOWED'));
    },
    credentials: false,
  };
}

export function createApiLimiter(max) {
  return createRateLimiter(max, 'Too many requests. Please try again later.');
}

export function createLoginLimiter(max) {
  return createRateLimiter(max, 'Too many login attempts. Please try again in 15 minutes.');
}

function createRateLimiter(max, message) {
  return rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: createRateLimitHandler(message),
  });
}

function createRateLimitHandler(message) {
  return (_req, _res, next) => next(createHttpError(429, message, null, 'RATE_LIMITED'));
}
