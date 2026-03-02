import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { registerGlobalErrorHandler } from '../api/client.js';

const ErrorContext = createContext(null);

const initialErrorState = {
  errorMessage: '',
  retryCallback: null,
};

export function ErrorProvider({ children }) {
  const [errorState, setErrorState] = useState(initialErrorState);

  const clearError = useCallback(() => {
    setErrorState(initialErrorState);
  }, []);

  const setError = useCallback(
    ({ message, retryCallback } = {}) => {
      if (!message) {
        clearError();
        return;
      }

      setErrorState({
        errorMessage: message,
        retryCallback: typeof retryCallback === 'function' ? retryCallback : null,
      });
    },
    [clearError],
  );

  useEffect(() => registerGlobalErrorHandler(setError), [setError]);

  const value = useMemo(
    () => ({
      errorMessage: errorState.errorMessage,
      retryCallback: errorState.retryCallback,
      setError,
      clearError,
    }),
    [errorState.errorMessage, errorState.retryCallback, setError, clearError],
  );

  return <ErrorContext.Provider value={value}>{children}</ErrorContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useGlobalError() {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useGlobalError must be used within an ErrorProvider');
  }
  return context;
}
