import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import CssBaseline from '@mui/material/CssBaseline';
import GlobalStyles from '@mui/material/GlobalStyles';
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme/theme';
import router from './router/router.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ErrorProvider } from './context/ErrorContext.jsx';
import { LocaleProvider } from './context/LocaleContext.jsx';
import { configureCapacitorRuntime } from './mobile/capacitorRuntime.js';
import {
  captureMonitoringTestMessage,
  initMonitoring,
  MonitoringErrorBoundary,
} from './utils/monitoring.js';

initMonitoring();
configureCapacitorRuntime();

if (import.meta.env.DEV) {
  window.__MYRESCAL_TEST_SENTRY__ = captureMonitoringTestMessage;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MonitoringErrorBoundary
      fallback={
        <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
          Nie udało się załadować aplikacji.
        </div>
      }
    >
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <GlobalStyles
          styles={(theme) => ({
            body: {
              overflowX: 'hidden',
              backgroundColor: theme.palette.background.default,
            },
            '#root': {
              minHeight: '100vh',
            },
          })}
        />
        <LocaleProvider>
          <ErrorProvider>
            <AuthProvider>
              <RouterProvider router={router} />
            </AuthProvider>
          </ErrorProvider>
        </LocaleProvider>
      </ThemeProvider>
    </MonitoringErrorBoundary>
  </React.StrictMode>
);
