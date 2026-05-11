import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import authRouter from './auth/authRoutes.js';
import reservationsRouter from './routes/reservations.js';
import propertiesRouter from './routes/properties.js';
import roomsRouter from './routes/rooms.js';
import profileRouter from './routes/profile.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { requestIdMiddleware, requestLoggingMiddleware } from './middleware/requestContext.js';
import { logger } from './utils/logger.js';
import { initMonitoring, setupMonitoringErrorHandler } from './utils/monitoring.js';
import { getSupabaseAdmin } from './auth/supabaseClient.js';
import {
  createApiLimiter,
  createCorsOptions,
  createLoginLimiter,
  getServerConfig,
} from './config/serverConfig.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
initMonitoring();

const app = express();
const {
  port,
  jsonBodyLimit,
  allowedOrigins,
  usesDeprecatedClientOrigin,
  apiRateLimitMax,
  authLoginRateLimitMax,
} = getServerConfig();

if (process.env.NODE_ENV !== 'production') {
  logger.info('config.cors.allowed_origins', { allowedOrigins });
  if (usesDeprecatedClientOrigin) {
    logger.warn('config.env.deprecated_client_origin', {
      variable: 'CLIENT_ORIGIN',
      replacement: 'CORS_ORIGIN',
    });
  }
}

const corsOptions = createCorsOptions(allowedOrigins);
const apiLimiter = createApiLimiter(apiRateLimitMax);
const loginLimiter = createLoginLimiter(authLoginRateLimitMax);

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
app.use(express.json({ limit: jsonBodyLimit }));

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
