import { authStorage } from '../context/authStorage.js';

export const AUTH_EVENTS = {
  UNAUTHORIZED: 'auth:unauthorized',
};

const DEFAULT_API_BASE_URL = '/api';

const normalizeBaseUrl = (url) => {
  if (!url) return DEFAULT_API_BASE_URL;
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

const API_BASE_URL = normalizeBaseUrl(
  import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL,
);

let pendingCount = 0;
const networkActivityListeners = new Set();

const notifyNetworkActivity = () => {
  networkActivityListeners.forEach((listener) => {
    try {
      listener(pendingCount);
    } catch (error) {
      console.error('Network activity listener failed', error);
    }
  });
};

const incrementPendingCount = () => {
  pendingCount += 1;
  notifyNetworkActivity();
};

const decrementPendingCount = () => {
  pendingCount = Math.max(0, pendingCount - 1);
  notifyNetworkActivity();
};

const buildUrl = (path) => {
  if (!path) throw new Error('apiClient requires a path');
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

const parseResponse = async (response) => {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
};

export async function apiClient(path, { method = 'GET', data, headers, signal } = {}) {
  const session = authStorage.getSession();
  const authToken = session?.access_token;

  const config = {
    method,
    headers: {
      Accept: 'application/json',
      ...(headers || {}),
    },
    signal,
  };

  if (authToken && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }

  if (data !== undefined) {
    config.body = JSON.stringify(data);
    config.headers['Content-Type'] = config.headers['Content-Type'] || 'application/json';
  }

  incrementPendingCount();

  try {
    const response = await fetch(buildUrl(path), config);
    const payload = await parseResponse(response).catch(() => null);

    if (!response.ok) {
      if (response.status === 401) {
        authStorage.clear();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent(AUTH_EVENTS.UNAUTHORIZED));
        }
      }

      const message =
        typeof payload === 'object' && payload?.error
          ? payload.error
          : payload || response.statusText || 'Unknown API error';
      const error = new Error(message);
      error.status = response.status;
      error.payload = payload;
      throw error;
    }

    return payload;
  } finally {
    decrementPendingCount();
  }
}

export function subscribeToNetworkActivity(listener) {
  if (typeof listener !== 'function') {
    throw new TypeError('subscribeToNetworkActivity requires a function listener');
  }

  networkActivityListeners.add(listener);
  listener(pendingCount);

  return () => {
    networkActivityListeners.delete(listener);
  };
}

export function getPendingCount() {
  return pendingCount;
}

export function withQueryParams(path, params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, value);
    }
  });

  const queryString = query.toString();
  return queryString ? `${path}?${queryString}` : path;
}
