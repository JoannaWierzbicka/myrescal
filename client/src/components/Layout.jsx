import { useCallback, useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import {
  Alert,
  Box,
  Button,
  Container,
  LinearProgress,
  Snackbar,
  Typography,
} from '@mui/material';
import { Capacitor } from '@capacitor/core';
import { useLocale } from '../context/LocaleContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getPendingCount, subscribeToNetworkActivity } from '../api/client.js';
import { useGlobalError } from '../context/ErrorContext.jsx';
import { useAndroidBackButton } from '../mobile/useAndroidBackButton.js';

const WAKEUP_NOTICE_DELAY_MS = 4000;
const SLOW_NOTICE_DELAY_MS = 60000;
const NETWORK_NOTICE_KEYS = {
  wakeup: 'layout.networkNotice.wakeup',
  slow: 'layout.networkNotice.slow',
};

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [flash, setFlash] = useState(null);
  const [pendingCount, setPendingCount] = useState(() => getPendingCount());
  const [networkNotice, setNetworkNotice] = useState('');
  const networkTimersRef = useRef({ wakeup: null, slow: null });
  const wasNetworkActiveRef = useRef(false);
  const { t } = useLocale();
  const { isAuthenticated } = useAuth();
  const { errorMessage, retryCallback, clearError } = useGlobalError();
  const hasGlobalError = Boolean(errorMessage);
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const isHomePage = location.pathname === '/';
  const isPublicHome = location.pathname === '/' && !isAuthenticated;
  const isNativeApp = Capacitor.isNativePlatform();
  const isNativePublicHome = isPublicHome && isNativeApp;
  const isWebHome = isHomePage && !isNativeApp;

  useAndroidBackButton();

  const clearNetworkTimers = useCallback(() => {
    if (networkTimersRef.current.wakeup) {
      clearTimeout(networkTimersRef.current.wakeup);
      networkTimersRef.current.wakeup = null;
    }
    if (networkTimersRef.current.slow) {
      clearTimeout(networkTimersRef.current.slow);
      networkTimersRef.current.slow = null;
    }
  }, []);

  useEffect(() => {
    const flashMessage = location.state?.flash;
    if (flashMessage) {
      setFlash(flashMessage);
      navigate(location.pathname + location.search + location.hash, { replace: true });
    }
  }, [location, navigate]);

  const handleFlashClose = (_event, reason) => {
    if (reason === 'clickaway') return;
    setFlash(null);
  };

  const handleGlobalErrorClose = (_event, reason) => {
    if (reason === 'clickaway') return;
    clearError();
  };

  const handleRetry = async () => {
    const callback = retryCallback;
    clearError();

    if (typeof callback !== 'function') return;

    try {
      await callback();
    } catch {
      // apiClient reports retry failures globally.
    }
  };

  useEffect(() => {
    const unsubscribe = subscribeToNetworkActivity((count) => {
      setPendingCount(count);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const isNetworkActive = pendingCount > 0;
    const wasNetworkActive = wasNetworkActiveRef.current;

    if (isNetworkActive && !wasNetworkActive) {
      setNetworkNotice('');
      networkTimersRef.current.wakeup = setTimeout(() => {
        setNetworkNotice('wakeup');
      }, WAKEUP_NOTICE_DELAY_MS);
      networkTimersRef.current.slow = setTimeout(() => {
        setNetworkNotice('slow');
      }, SLOW_NOTICE_DELAY_MS);
    }

    if (!isNetworkActive && wasNetworkActive) {
      clearNetworkTimers();
      setNetworkNotice('');
    }

    wasNetworkActiveRef.current = isNetworkActive;
  }, [clearNetworkTimers, pendingCount]);

  useEffect(() => () => clearNetworkTimers(), [clearNetworkTimers]);

  return (
    <>
      {pendingCount > 0 ? (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: (theme) => theme.zIndex.appBar + 1,
          }}
        >
          <LinearProgress color="secondary" />
        </Box>
      ) : null}
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          backgroundColor: isNativePublicHome ? '#FAF7F0' : 'transparent',
        }}
      >
        <Navbar />
        <Box
          component="main"
          sx={{
            position: 'relative',
            flexGrow: 1,
            display: 'flex',
            alignItems: isAuthPage ? 'center' : 'stretch',
            pt: isWebHome ? 0 : isNativePublicHome ? { xs: 1, sm: 2, md: 5 } : { xs: 2, sm: 3, md: 5 },
            pb: isWebHome ? 0 : isNativePublicHome ? { xs: 2, sm: 3, md: 8 } : { xs: 12, md: 8 },
            px: { xs: 0, sm: 2, md: 0 },
            backgroundColor: isNativePublicHome ? '#FAF7F0' : 'transparent',
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: 0,
              background: isNativePublicHome
                ? 'none'
                : 'linear-gradient(180deg, rgba(191, 230, 213, 0.2) 0%, rgba(251, 248, 241, 0) 42%)',
              pointerEvents: 'none',
            },
          }}
        >
          <Container
            maxWidth={isAuthPage ? 'sm' : 'lg'}
            sx={{
              position: 'relative',
              px: { xs: 2, sm: 3, md: 5 },
              py: isWebHome ? 0 : isNativePublicHome ? { xs: 0, sm: 1.5, md: 4 } : { xs: 1.5, sm: 2.5, md: 4 },
              borderRadius: 0,
              backgroundColor: 'transparent',
              boxShadow: 'none',
              flexGrow: 1,
            }}
          >
            <Outlet />
          </Container>
        </Box>
        <Box
          component="footer"
          sx={{
            display: isWebHome ? 'none' : { xs: 'none', md: 'block' },
            mt: { xs: 6, md: 10 },
            py: { xs: 4, md: 5 },
            background: 'transparent',
          }}
        >
          <Container maxWidth="lg" sx={{ px: { xs: 2.5, sm: 3.5, md: 5 } }}>
            <Typography variant="caption" align="center" sx={{ display: 'block', letterSpacing: '0.2rem' }}>
              {t('footer.copyright', { year: new Date().getFullYear() })}
            </Typography>
          </Container>
        </Box>
      </Box>
      <Snackbar
        open={Boolean(flash) && !hasGlobalError}
        autoHideDuration={4000}
        onClose={handleFlashClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {flash ? (
          <Alert onClose={handleFlashClose} severity={flash.severity || 'info'} sx={{ width: '100%' }}>
            {flash.message}
          </Alert>
        ) : null}
      </Snackbar>
      <Snackbar
        open={pendingCount > 0 && Boolean(networkNotice) && !hasGlobalError && !flash}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ top: { xs: 72, sm: 84, md: 96 } }}
      >
        {networkNotice ? (
          <Alert severity={networkNotice === 'slow' ? 'warning' : 'info'} sx={{ width: '100%' }}>
            {t(NETWORK_NOTICE_KEYS[networkNotice])}
          </Alert>
        ) : null}
      </Snackbar>
      <Snackbar
        open={hasGlobalError}
        onClose={handleGlobalErrorClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {errorMessage ? (
          <Alert
            onClose={handleGlobalErrorClose}
            severity="error"
            action={
              retryCallback ? (
                <Button color="inherit" size="small" onClick={handleRetry}>
                  {t('common.retry')}
                </Button>
              ) : null
            }
            sx={{ width: '100%' }}
          >
            {errorMessage}
          </Alert>
        ) : null}
      </Snackbar>
    </>
  );
}
