import { apiClient } from './client.js';

const AUTH_ROOT = '/auth';

export async function loginUser({ email, password, signal } = {}) {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  return apiClient(`${AUTH_ROOT}/login`, {
    method: 'POST',
    data: { email, password },
    signal,
  });
}

export async function registerUser({ email, password, signal } = {}) {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  return apiClient(`${AUTH_ROOT}/register`, {
    method: 'POST',
    data: { email, password },
    signal,
  });
}

export async function fetchCurrentUser({ signal } = {}) {
  return apiClient(`${AUTH_ROOT}/me`, { signal });
}

export async function logoutUser({ signal, token } = {}) {
  return apiClient(`${AUTH_ROOT}/logout`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    signal,
  });
}
