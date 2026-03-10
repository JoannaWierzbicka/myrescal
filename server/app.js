import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRouter from './auth/authRoutes.js';
import reservationsRouter from './routes/reservations.js';
import propertiesRouter from './routes/properties.js';
import roomsRouter from './routes/rooms.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { requestIdMiddleware, requestLoggingMiddleware } from './middleware/requestContext.js';
import { createHttpError } from './utils/httpError.js';
import { logger } from './utils/logger.js';
import { initMonitoring } from './utils/monitoring.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3000;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const corsOrigin = process.env.CORS_ORIGIN || process.env.CLIENT_ORIGIN || '';
const allowedOrigins = corsOrigin.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (process.env.NODE_ENV !== 'production') {
  logger.info('config.cors.allowed_origins', { allowedOrigins });
  if (!process.env.CORS_ORIGIN && process.env.CLIENT_ORIGIN) {
    logger.warn('config.env.deprecated_client_origin', {
      variable: 'CLIENT_ORIGIN',
      replacement: 'CORS_ORIGIN',
    });
  }
}

const corsOptions = {
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

const createRateLimitHandler = (message) => (req, _res, next) =>
  next(createHttpError(429, message, null, 'RATE_LIMITED'));

const apiLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: Number(process.env.API_RATE_LIMIT_MAX) || 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: createRateLimitHandler('Too many requests. Please try again later.'),
});

const loginLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: Number(process.env.AUTH_LOGIN_RATE_LIMIT_MAX) || 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: createRateLimitHandler('Too many login attempts. Please try again in 15 minutes.'),
});

app.disable('x-powered-by');
app.use(requestIdMiddleware);
app.use(requestLoggingMiddleware);
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
      },
      reportOnly: true,
    },
  }),
);
app.use(
  cors(corsOptions),
);
app.options(/.*/, cors(corsOptions));
app.use(express.json());

app.get('/health', (_req, res) => res.status(200).json({ ok: true }));

app.use('/api/auth/login', loginLimiter);
app.use('/api', apiLimiter);

app.use('/api/auth', authRouter);
app.use('/api/properties', propertiesRouter);
app.use('/api/rooms', roomsRouter);
app.use('/api/reservations', reservationsRouter);

app.use(express.static(path.join(__dirname, 'static')));

app.use(notFoundHandler);
app.use(errorHandler);

initMonitoring();

app.listen(port, () => {
  logger.info('server.started', {
    port,
    nodeEnv: process.env.NODE_ENV || 'development',
  });
});
