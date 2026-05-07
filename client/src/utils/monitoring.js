import { useEffect } from 'react';
import {
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType,
} from 'react-router-dom';
import * as Sentry from '@sentry/react';

const parseSampleRate = (value, fallback = 0) => {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(1, Math.max(0, parsed));
};

const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
let initialized = false;

export function initMonitoring() {
  if (!sentryDsn || initialized) return;

  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,
    release: import.meta.env.VITE_SENTRY_RELEASE || import.meta.env.VITE_APP_VERSION || undefined,
    integrations: [
      Sentry.reactRouterV7BrowserTracingIntegration({
        useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes,
      }),
    ],
    tracesSampleRate: parseSampleRate(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE, 0),
    sendDefaultPii: false,
  });

  initialized = true;
}

export const createMonitoredBrowserRouter =
  Sentry.wrapCreateBrowserRouterV7;

export const MonitoringErrorBoundary = Sentry.ErrorBoundary;

export function configureMonitoringUser({ user, profile } = {}) {
  if (!initialized) return;

  if (!user?.id) {
    Sentry.setUser(null);
    return;
  }

  Sentry.setUser({
    id: user.id,
    email: user.email ?? undefined,
  });

  Sentry.setContext('owner_profile', {
    profileId: profile?.id ?? null,
    hasProfile: Boolean(profile),
  });
}

export function captureClientException(error, context = {}) {
  if (!initialized) return;

  Sentry.withScope((scope) => {
    if (context.requestId) {
      scope.setTag('request_id', context.requestId);
    }
    if (context.endpoint) {
      scope.setTag('endpoint', context.endpoint);
    }
    if (context.status) {
      scope.setTag('status', String(context.status));
    }
    if (context.extra && typeof context.extra === 'object') {
      scope.setExtras(context.extra);
    }
    Sentry.captureException(error);
  });
}

export function captureMonitoringTestMessage() {
  if (!initialized) return false;
  Sentry.captureException(new Error('Sentry frontend test error'));
  return true;
}

initMonitoring();
