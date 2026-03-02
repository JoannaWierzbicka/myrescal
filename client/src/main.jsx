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

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
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
  </React.StrictMode>
);
