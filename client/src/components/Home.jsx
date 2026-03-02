import React from 'react';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useLocale } from '../context/LocaleContext.jsx';

export default function Home() {
  const { isAuthenticated } = useAuth();
  const { t } = useLocale();

  return (
    <Box
      sx={{
        minHeight: '68vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: { xs: 2.5, sm: 3.5, md: 6 },
        py: { xs: 6, sm: 8, md: 10 },
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'column', lg: 'row' }}
        spacing={{ xs: 5, md: 6, lg: 8 }}
        sx={{ width: '100%', maxWidth: 1100 }}
        alignItems={{ xs: 'stretch', md: 'center', lg: 'center' }}
      >
        <Box
          sx={{
            maxWidth: { xs: '100%', sm: 520, md: 620, lg: 680 },
            textAlign: { xs: 'center', md: 'center', lg: 'left' },
            mx: { xs: 'auto', md: 'auto', lg: 0 },
            position: 'relative',
            px: { xs: 1.5, sm: 0 },
          }}
        >
          <Typography
            sx={{
              fontFamily: 'var(--app-font-script)',
              fontSize: { xs: '1.6rem', sm: '1.9rem' },
              color: 'secondary.main',
              mb: 1,
            }}
          >
            {t('home.heroAccent')}
          </Typography>
          <Typography
            variant="h1"
            component="h1"
            sx={{
              fontSize: { xs: '2rem', sm: '3rem', lg: '3.75rem' },
              letterSpacing: { xs: '0.08rem', sm: '0.12rem', lg: '0.18rem' },
              lineHeight: { xs: 1.08, sm: 1.1 },
              mb: 2.5,
              wordBreak: 'break-word',
              mx: { xs: 'auto', lg: 0 },
              maxWidth: { xs: '100%', sm: 560, lg: '100%' },
            }}
          >
            {t('home.heroTitle')}
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              fontSize: { xs: '1.05rem', sm: '1.15rem' },
              maxWidth: { xs: '100%', sm: 480 },
              mx: { xs: 'auto', lg: 0 },
            }}
          >
            {t('home.heroSubtitle')}
          </Typography>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2.5}
            sx={{ mt: 4, width: '100%' }}
            justifyContent={{ xs: 'center', md: 'center', lg: 'flex-start' }}
            alignItems={{ xs: 'stretch', sm: 'center' }}
          >
            {isAuthenticated ? (
              <Button
                component={RouterLink}
                to="/dashboard"
                variant="contained"
                size="large"
                color="info"
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              >
                {t('home.goToDashboard')}
              </Button>
            ) : (
              <>
                <Button
                  component={RouterLink}
                  to="/login"
                  variant="contained"
                  color="primary"
                  size="large"
                  sx={{ width: { xs: '100%', sm: 'auto' } }}
                >
                  {t('home.login')}
                </Button>
                <Button
                  component={RouterLink}
                  to="/register"
                  variant="outlined"
                  size="large"
                  sx={{ width: { xs: '100%', sm: 'auto' } }}
                >
                  {t('home.createAccount')}
                </Button>
              </>
            )}
          </Stack>
        </Box>

        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flex: 1,
            minHeight: { xs: 320, sm: 360, lg: 400 },
            mt: { xs: 0, md: 0, lg: 0 },
            mx: { xs: 'auto', md: 'auto', lg: 0 },
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              inset: { xs: '10% 8%', sm: '12% 10%' },
              borderRadius: 6,
              border: '1px dashed rgba(195, 111, 43, 0.4)',
            }}
          />
          <Paper
            elevation={0}
            sx={{
              position: 'relative',
              transform: { xs: 'rotate(-4deg)', sm: 'rotate(-6deg)' },
              px: { xs: 3, sm: 4 },
              py: { xs: 4, sm: 5 },
              maxWidth: 320,
              boxShadow: '0 28px 60px rgba(15, 36, 46, 0.18)',
            }}
          >
            <Typography variant="subtitle2" color="secondary.main" sx={{ mb: 1.5 }}>
              {t('home.heroTitle')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('home.heroSubtitle')}
            </Typography>
          </Paper>
          <Paper
            elevation={0}
            sx={{
              position: 'absolute',
              transform: { xs: 'rotate(6deg) translate(40px, 120px)', sm: 'rotate(9deg) translate(60px, 130px)' },
              px: { xs: 2.5, sm: 3.5 },
              py: { xs: 3, sm: 3.5 },
              maxWidth: 260,
              background: 'linear-gradient(145deg, #fbf5ea, #f1e3cc)',
              border: '2px solid rgba(195, 111, 43, 0.4)',
              boxShadow: '0 24px 55px rgba(15, 36, 46, 0.18)',
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{ letterSpacing: '0.15rem', fontSize: '0.85rem', mb: 1, color: 'primary.main' }}
            >
              {t('home.highlightCardTitle')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('home.highlightCardDescription')}
            </Typography>
          </Paper>
        </Box>
      </Stack>
    </Box>
  );
}
