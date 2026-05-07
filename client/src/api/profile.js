import { apiClient } from './client.js';

const PROFILE_ROOT = '/profile';

export const fetchOwnerProfile = ({ signal } = {}) =>
  apiClient(PROFILE_ROOT, { signal });

export const updateOwnerProfile = (data, { signal } = {}) =>
  apiClient(PROFILE_ROOT, { method: 'PUT', data, signal });
