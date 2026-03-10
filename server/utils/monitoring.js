import { logger } from './logger.js';

const hasSentryDsn = () => Boolean(process.env.SENTRY_DSN);

export const initMonitoring = () => {
  if (!hasSentryDsn()) return;

  logger.info('monitoring.sentry.placeholder.enabled', {
    provider: 'sentry',
    configured: true,
    note: 'SENTRY_DSN found. Add @sentry/node integration in this module when enabling Sentry.',
  });
};

export const captureException = (error, context = {}) => {
  if (!hasSentryDsn()) return;

  logger.warn('monitoring.sentry.placeholder.capture_exception', {
    provider: 'sentry',
    errorName: error?.name || null,
    errorCode: error?.code || null,
    requestId: context.requestId || null,
  });
};
