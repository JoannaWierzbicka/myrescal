const AUTH_STORAGE_KEYS = Object.freeze({
  user: 'booking-app:user',
  session: 'booking-app:session',
  profile: 'booking-app:profile',
});

const safeParse = (value) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const isBrowser = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const readStorage = (key) => {
  if (!isBrowser()) return null;
  const raw = window.localStorage.getItem(key);
  return safeParse(raw);
};

const writeStorage = (key, value) => {
  if (!isBrowser()) return;
  if (value === null || value === undefined) {
    window.localStorage.removeItem(key);
    return;
  }
  window.localStorage.setItem(key, JSON.stringify(value));
};

export const authStorage = {
  keys: AUTH_STORAGE_KEYS,
  getUser: () => readStorage(AUTH_STORAGE_KEYS.user),
  getSession: () => readStorage(AUTH_STORAGE_KEYS.session),
  getProfile: () => readStorage(AUTH_STORAGE_KEYS.profile),
  setUser: (user) => writeStorage(AUTH_STORAGE_KEYS.user, user),
  setSession: (session) => writeStorage(AUTH_STORAGE_KEYS.session, session),
  setProfile: (profile) => writeStorage(AUTH_STORAGE_KEYS.profile, profile),
  clear: () => {
    if (!isBrowser()) return;
    window.localStorage.removeItem(AUTH_STORAGE_KEYS.user);
    window.localStorage.removeItem(AUTH_STORAGE_KEYS.session);
    window.localStorage.removeItem(AUTH_STORAGE_KEYS.profile);
  },
};
