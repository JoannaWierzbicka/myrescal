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
import { useLocale } from '../context/LocaleContext.jsx';
import { getPendingCount, subscribeToNetworkActivity } from '../api/client.js';
import { useGlobalError } from '../context/ErrorContext.jsx';

const WAKEUP_NOTICE_DELAY_MS = 4000;
const SLOW_NOTICE_DELAY_MS = 60000;
const WAKEUP_NOTICE_TEXT = 'Serwer się wybudza (darmowy hosting). To może potrwać do ~60s.';
const SLOW_NOTICE_TEXT = 'To trwa dłużej niż zwykle. Spróbuj odświeżyć lub ponowić.';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [flash, setFlash] = useState(null);
  const [pendingCount, setPendingCount] = useState(() => getPendingCount());
  const [networkNotice, setNetworkNotice] = useState('');
  const networkTimersRef = useRef({ wakeup: null, slow: null });
  const wasNetworkActiveRef = useRef(false);
  const { t } = useLocale();
  const { errorMessage, retryCallback, clearError } = useGlobalError();
  const hasGlobalError = Boolean(errorMessage);

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
        setNetworkNotice(WAKEUP_NOTICE_TEXT);
      }, WAKEUP_NOTICE_DELAY_MS);
      networkTimersRef.current.slow = setTimeout(() => {
        setNetworkNotice(SLOW_NOTICE_TEXT);
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
        }}
      >
        <Navbar />
        <Box
          component="main"
          sx={{
            position: 'relative',
            flexGrow: 1,
            display: 'flex',
            alignItems: 'stretch',
            pt: { xs: 8, sm: 10, md: 12 },
            pb: { xs: 10, md: 12 },
            px: { xs: 1.5, sm: 2, md: 0 },
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(120% 90% at 50% -10%, rgba(36, 78, 96, 0.14) 0%, transparent 70%)',
              pointerEvents: 'none',
            },
          }}
        >
          <Container
            maxWidth="lg"
            sx={{
              position: 'relative',
              px: { xs: 2.5, sm: 3.5, md: 5 },
              py: { xs: 2, sm: 3 },
              borderRadius: { xs: 1, md: 1 },
              backdropFilter: 'blur(8px)',
              backgroundColor: 'rgba(251, 247, 240, 0.82)',
              boxShadow: '0 32px 80px rgba(21, 40, 50, 0.2)',
              flexGrow: 1,
            }}
          >
            <Outlet />
          </Container>
        </Box>
        <Box
          component="footer"
          sx={{
            mt: { xs: 6, md: 10 },
            py: { xs: 4, md: 5 },
            background: 'linear-gradient(180deg, rgba(31,60,74,0) 0%, rgba(31,60,74,0.18) 100%)',
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
          <Alert severity={networkNotice === SLOW_NOTICE_TEXT ? 'warning' : 'info'} sx={{ width: '100%' }}>
            {networkNotice}
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
                  Spróbuj ponownie
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
