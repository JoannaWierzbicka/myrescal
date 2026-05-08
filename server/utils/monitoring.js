import * as Sentry from '@sentry/node';
import { logger } from './logger.js';

const parseSampleRate = (value, fallback = 0) => {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(1, Math.max(0, parsed));
};

const hasSentryDsn = () => Boolean(process.env.SENTRY_DSN);
const shouldSkipInTest = () =>
  process.env.NODE_ENV === 'test' && process.env.SENTRY_ENABLE_IN_TEST !== 'true';

let initialized = false;

export const initMonitoring = () => {
  if (shouldSkipInTest()) return;
  if (!hasSentryDsn()) return;

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
    release: process.env.SENTRY_RELEASE || process.env.APP_VERSION || undefined,
    tracesSampleRate: parseSampleRate(process.env.SENTRY_TRACES_SAMPLE_RATE, 0),
    sendDefaultPii: false,
  });

  initialized = true;

  logger.info('monitoring.sentry.enabled', {
    provider: 'sentry',
    configured: true,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
    release: process.env.SENTRY_RELEASE || process.env.APP_VERSION || null,
  });
};

export const setupMonitoringErrorHandler = (app) => {
  if (!initialized) return;

  Sentry.setupExpressErrorHandler(app, {
    shouldHandleError(error) {
      const statusCode = Number(error?.statusCode || error?.status) || 500;
      return statusCode >= 500;
    },
  });
};

export const setRequestMonitoringContext = (req) => {
  if (!initialized) return;

  Sentry.setTag('request_id', req.requestId || 'unknown');
  Sentry.setContext('request', {
    requestId: req.requestId || null,
    method: req.method,
    path: req.originalUrl,
  });

  if (req.user?.id) {
    Sentry.setUser({
      id: req.user.id,
      email: req.user.email ?? undefined,
    });
  }
};

export const captureException = (error, context = {}) => {
  if (!initialized) return;

  Sentry.withScope((scope) => {
    if (context.requestId) {
      scope.setTag('request_id', context.requestId);
    }
    if (context.userId) {
      scope.setUser({ id: context.userId, email: context.userEmail ?? undefined });
    }
    if (context.extra && typeof context.extra === 'object') {
      scope.setExtras(context.extra);
    }
    Sentry.captureException(error);
  });
};
