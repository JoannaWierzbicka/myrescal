import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchCurrentUser, logoutUser } from '../api/auth.js';
import { AUTH_EVENTS } from '../api/client.js';
import { authStorage } from './authStorage.js';

const initialState = {
  user: null,
  session: null,
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [{ user, session }, setAuthState] = useState(() => ({
    user: authStorage.getUser(),
    session: authStorage.getSession(),
  }));
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const handleUnauthorized = () => {
      authStorage.clear();
      setAuthState(initialState);
      setAuthChecked(true);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(AUTH_EVENTS.UNAUTHORIZED, handleUnauthorized);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(AUTH_EVENTS.UNAUTHORIZED, handleUnauthorized);
      }
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const storedSession = authStorage.getSession();
    const accessToken = storedSession?.access_token;

    if (!accessToken) {
      authStorage.clear();
      setAuthState(initialState);
      setAuthChecked(true);
      return () => controller.abort();
    }

    fetchCurrentUser({ signal: controller.signal })
      .then((response) => {
        if (!response?.user) {
          throw new Error('Unable to verify session.');
        }

        setAuthState({
          user: response.user,
          session: storedSession,
        });
      })
      .catch((error) => {
        if (error?.name === 'AbortError') return;
        authStorage.clear();
        setAuthState(initialState);
      })
      .finally(() => {
        setAuthChecked(true);
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    authStorage.setUser(user);
  }, [user]);

  useEffect(() => {
    authStorage.setSession(session);
  }, [session]);

  const login = useCallback(({ user: nextUser, session: nextSession }) => {
    const normalizedUser = nextUser ?? null;
    const normalizedSession = nextSession ?? null;

    authStorage.setUser(normalizedUser);
    authStorage.setSession(normalizedSession);

    setAuthState({
      user: normalizedUser,
      session: normalizedSession,
    });
    setAuthChecked(true);
  }, []);

  const logout = useCallback(async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      const accessToken = session?.access_token;
      if (accessToken) {
        await logoutUser({ token: accessToken });
      }
    } catch (error) {
      console.error('Failed to log out user', error);
    } finally {
      authStorage.clear();
      setAuthState(initialState);
      setAuthChecked(true);
      setIsLoggingOut(false);
    }
  }, [isLoggingOut, session]);

  const value = useMemo(
    () => ({
      user,
      session,
      login,
      logout,
      isLoggingOut,
      authChecked,
      isAuthenticated: Boolean(user),
    }),
    [user, session, isLoggingOut, login, logout, authChecked],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
