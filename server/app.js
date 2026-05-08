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
import profileRouter from './routes/profile.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { requestIdMiddleware, requestLoggingMiddleware } from './middleware/requestContext.js';
import { createHttpError } from './utils/httpError.js';
import { logger } from './utils/logger.js';
import { initMonitoring, setupMonitoringErrorHandler } from './utils/monitoring.js';
import { getSupabaseAdmin } from './auth/supabaseClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
initMonitoring();

const app = express();
const port = Number(process.env.PORT) || 3000;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const JSON_BODY_LIMIT = process.env.JSON_BODY_LIMIT || '100kb';
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
      reportOnly: process.env.CSP_REPORT_ONLY
        ? process.env.CSP_REPORT_ONLY === 'true'
        : process.env.NODE_ENV !== 'production',
    },
  }),
);
app.use(
  cors(corsOptions),
);
app.options(/.*/, cors(corsOptions));
app.use(express.json({ limit: JSON_BODY_LIMIT }));

app.get('/health', (_req, res) => res.status(200).json({ ok: true }));
app.get('/ready', async (_req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('properties')
      .select('id', { count: 'exact', head: true })
      .limit(1);

    if (error) {
      logger.warn('readiness.supabase.failed', {
        errorCode: error.code || null,
        errorMessage: error.message || null,
      });
      res.status(503).json({ ok: false, dependency: 'supabase' });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    logger.error('readiness.failed', {
      errorMessage: error?.message || 'Unknown readiness error',
      stack: error?.stack || null,
    });
    res.status(503).json({ ok: false });
  }
});

if (process.env.NODE_ENV !== 'production') {
  app.get('/debug/sentry', (_req, _res) => {
    throw new Error('Sentry backend test error');
  });
}

app.use('/api/auth/login', loginLimiter);
app.use('/api', apiLimiter);

app.use('/api/auth', authRouter);
app.use('/api/properties', propertiesRouter);
app.use('/api/rooms', roomsRouter);
app.use('/api/reservations', reservationsRouter);
app.use('/api/profile', profileRouter);

app.use(express.static(path.join(__dirname, 'static')));

app.use(notFoundHandler);
setupMonitoringErrorHandler(app);
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(port, () => {
    logger.info('server.started', {
      port,
      nodeEnv: process.env.NODE_ENV || 'development',
    });
  });

  const shutdown = (signal) => {
    logger.info('server.shutdown.started', { signal });
    server.close((error) => {
      if (error) {
        logger.error('server.shutdown.failed', {
          signal,
          errorMessage: error.message,
          stack: error.stack || null,
        });
        process.exit(1);
      }

      logger.info('server.shutdown.completed', { signal });
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => {
    logger.error('process.unhandled_rejection', {
      errorMessage: reason?.message || String(reason),
      stack: reason?.stack || null,
    });
  });
  process.on('uncaughtException', (error) => {
    logger.error('process.uncaught_exception', {
      errorMessage: error?.message || 'Unknown uncaught exception',
      stack: error?.stack || null,
    });
    process.exit(1);
  });
}

export default app;
