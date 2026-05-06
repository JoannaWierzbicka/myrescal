import { Box, Button, Stack, Typography } from '@mui/material';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import { Capacitor } from '@capacitor/core';
import { Link as RouterLink } from 'react-router-dom';
import viewImage from '../assets/view.png';
import AppLogo from './AppLogo.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useLocale } from '../context/LocaleContext.jsx';

export default function Home() {
  const { isAuthenticated } = useAuth();
  const { t } = useLocale();
  const isNativeApp = Capacitor.isNativePlatform();
  const shouldLowerLoggedOutHero = isNativeApp && !isAuthenticated;

  const features = [
    { icon: <CalendarMonthOutlinedIcon />, title: t('home.featureCalendarTitle'), body: t('home.featureCalendarBody') },
    { icon: <InsightsOutlinedIcon />, title: t('home.featureBookingsTitle'), body: t('home.featureBookingsBody') },
    { icon: <NotificationsNoneOutlinedIcon />, title: t('home.featureUpdatesTitle'), body: t('home.featureUpdatesBody') },
  ];

  return (
    <Box
      className="hero"
      sx={{
        position: 'relative',
        backgroundColor: isNativeApp ? '#FAF7F0' : 'transparent',
        minHeight: {
          xs: isNativeApp ? 'calc(100dvh - 210px)' : 'clamp(500px, 76dvh, 620px)',
          sm: isNativeApp ? 'calc(100dvh - 220px)' : 'clamp(520px, 72dvh, 660px)',
          md: '72vh',
        },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        py: { xs: 0, md: 4 },
      }}
    >
      <Box
        className="heroBackground"
        aria-hidden="true"
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 0,
          width: '100%',
          height: { xs: '58dvh', sm: '55dvh', md: '54dvh' },
          minHeight: { xs: 340, sm: 380, md: 420 },
          maxHeight: { xs: 460, sm: 520, md: 560 },
          pointerEvents: 'none',
          backgroundImage: `
            linear-gradient(180deg, rgba(250,247,240,0.2) 0%, rgba(250,247,240,0.34) 48%, rgba(250,247,240,0.78) 78%, #FAF7F0 100%),
            url(${viewImage})
          `,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: 'brightness(1.05) saturate(0.9)',
          WebkitMaskImage: 'linear-gradient(180deg, black 0%, black 58%, rgba(0,0,0,0.62) 76%, transparent 100%)',
          maskImage: 'linear-gradient(180deg, black 0%, black 58%, rgba(0,0,0,0.62) 76%, transparent 100%)',
        }}
      />
      <Stack
        className="content"
        alignItems="center"
        sx={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 480, mx: 'auto' }}
      >
        <Stack
          spacing={{ xs: 1.45, sm: 2, md: 2.4 }}
          alignItems="center"
          sx={{
            width: '100%',
            minHeight: { xs: isNativeApp ? 'calc(100dvh - 210px)' : 'auto', sm: 'auto' },
            textAlign: 'center',
            justifyContent: { xs: isNativeApp ? 'space-between' : 'center', sm: 'space-between' },
            pt: { xs: shouldLowerLoggedOutHero ? 4.5 : 0, sm: 0 },
            pb: { xs: shouldLowerLoggedOutHero ? 1 : 0, sm: 0 },
            '@media (max-height: 720px)': {
              pt: shouldLowerLoggedOutHero ? 3 : 0,
              gap: 1,
            },
          }}
        >
          <Stack spacing={{ xs: 0.7, sm: 1 }} alignItems="center">
            <Box
              sx={{
                width: { xs: 44, sm: 52 },
                height: { xs: 44, sm: 52 },
                display: 'grid',
                placeItems: 'center',
                '@media (max-height: 720px)': {
                  width: 38,
                  height: 38,
                },
              }}
            >
              <AppLogo size="100%" variant="gold" />
            </Box>
            <Box>
              <Typography
                variant="h1"
                component="h1"
                sx={{
                  fontSize: { xs: '2.5rem', sm: '3.1rem', lg: '3.4rem' },
                  color: 'primary.dark',
                  mb: { xs: 0.55, sm: 0.8 },
                  '@media (max-height: 720px)': {
                    fontSize: '2.2rem',
                  },
                }}
              >
                MyResCal
              </Typography>
              <Box
                sx={{
                  width: 40,
                  height: 2,
                  mx: 'auto',
                  mb: { xs: 1.3, sm: 1.6 },
                  backgroundColor: 'secondary.main',
                }}
              />
              <Typography
                variant="body1"
                color="text.primary"
                sx={{
                  maxWidth: 300,
                  mx: 'auto',
                  lineHeight: 1.45,
                  '@media (max-height: 720px)': {
                    fontSize: '0.88rem',
                    lineHeight: 1.35,
                  },
                }}
              >
                {t('home.welcomeSubtitle')}
              </Typography>
            </Box>
          </Stack>

          <Stack
            spacing={{ xs: 1.25, sm: 1.5, md: 2 }}
            alignItems="center"
            sx={{
              width: '100%',
              mt: { xs: isNativeApp ? 'auto' : 2.5, sm: 0 },
              transform: {
                xs: isNativeApp ? 'translateY(-6px)' : 'none',
                sm: isNativeApp ? 'translateY(-4px)' : 'none',
                md: 'none',
              },
            }}
          >
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: { xs: 0.65, sm: 1.1 },
                width: '100%',
                maxWidth: 430,
              }}
            >
              {features.map((feature) => (
                <Box
                  key={feature.title}
                  sx={{
                    minWidth: 0,
                    px: { xs: 0.25, sm: 0.75 },
                    py: { xs: 0.2, sm: 0.5 },
                    textAlign: 'center',
                  }}
                >
                  <Box sx={{ color: 'secondary.main', mb: 0.45, '& svg': { fontSize: { xs: 20, sm: 24 } } }}>
                    {feature.icon}
                  </Box>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      mb: 0.25,
                      fontSize: { xs: '0.74rem', sm: '0.88rem' },
                      lineHeight: 1.15,
                      whiteSpace: 'normal',
                    }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      display: 'block',
                      fontSize: { xs: '0.58rem', sm: '0.68rem' },
                      lineHeight: 1.2,
                      '@media (max-height: 720px)': {
                        display: 'none',
                      },
                    }}
                  >
                    {feature.body}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Button
              component={RouterLink}
              to={isAuthenticated ? '/dashboard' : '/login'}
              variant="contained"
              disableElevation={isNativeApp}
              disableRipple={isNativeApp}
              size="large"
              endIcon={<ArrowForwardRoundedIcon />}
              fullWidth
              sx={{
                maxWidth: { xs: '100%', sm: 360 },
                ...(isNativeApp
                  ? {
                      boxShadow: 'none',
                      transform: 'none',
                      backgroundImage: 'none',
                      '&.MuiButton-containedPrimary': {
                        boxShadow: 'none',
                      },
                      '&:hover': {
                        boxShadow: 'none',
                        transform: 'none',
                      },
                      '&:active': {
                        boxShadow: 'none',
                        transform: 'none',
                      },
                      '&:focus': {
                        boxShadow: 'none',
                      },
                      '&:focus-visible': {
                        boxShadow: 'none',
                        outline: '2px solid rgba(31, 60, 74, 0.22)',
                        outlineOffset: 2,
                      },
                    }
                  : {}),
              }}
            >
              {isAuthenticated ? t('home.goToDashboard') : t('home.getStarted')}
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </Box>
  );
}
