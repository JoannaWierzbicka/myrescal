import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useLocale } from '../context/LocaleContext.jsx';

export default function Home() {
  const { isAuthenticated } = useAuth();
  const { t } = useLocale();

  const features = [
    { icon: <CalendarMonthOutlinedIcon />, title: t('home.featureCalendarTitle'), body: t('home.featureCalendarBody') },
    { icon: <InsightsOutlinedIcon />, title: t('home.featureBookingsTitle'), body: t('home.featureBookingsBody') },
    { icon: <NotificationsNoneOutlinedIcon />, title: t('home.featureUpdatesTitle'), body: t('home.featureUpdatesBody') },
  ];

  return (
    <Box
      sx={{
        minHeight: { xs: 'calc(100vh - 120px)', md: '70vh' },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: { xs: 2, sm: 4, md: 8 },
      }}
    >
      <Stack
        spacing={{ xs: 4, md: 6 }}
        sx={{ width: '100%', maxWidth: 520, mx: 'auto', textAlign: 'center' }}
      >
        <Stack spacing={2.5} alignItems="center">
          <Box
            sx={{
              width: 68,
              height: 68,
              borderRadius: '12px',
              display: 'grid',
              placeItems: 'center',
              color: 'primary.main',
              backgroundColor: 'success.light',
              border: '1px solid rgba(15, 76, 79, 0.12)',
              boxShadow: '0 18px 34px rgba(15, 76, 79, 0.12)',
            }}
          >
            <ApartmentOutlinedIcon sx={{ fontSize: 34 }} />
          </Box>
          <Box>
            <Typography
              variant="h1"
              component="h1"
              sx={{
                fontSize: { xs: '2.6rem', sm: '3.2rem' },
                color: 'primary.dark',
                mb: 1,
              }}
            >
              MyResCal
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 360, mx: 'auto' }}>
              {t('home.heroSubtitle')}
            </Typography>
          </Box>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: { xs: 1, sm: 1.25 },
          }}
        >
          {features.map((feature) => (
            <Paper
              key={feature.title}
              elevation={0}
              sx={{
                minWidth: 0,
                p: { xs: 1.25, sm: 2 },
                textAlign: 'left',
                borderRadius: 1.5,
              }}
            >
              <Box sx={{ color: 'secondary.main', mb: 1 }}>{feature.icon}</Box>
              <Typography variant="subtitle1" sx={{ mb: 0.5, fontSize: { xs: '0.78rem', sm: '0.95rem' } }}>
                {feature.title}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', fontSize: { xs: '0.62rem', sm: '0.74rem' } }}
              >
                {feature.body}
              </Typography>
            </Paper>
          ))}
        </Box>

        <Stack spacing={1.25}>
          {isAuthenticated ? (
            <Button component={RouterLink} to="/dashboard" variant="contained" size="large" fullWidth>
              {t('home.goToDashboard')}
            </Button>
          ) : (
            <>
              <Button component={RouterLink} to="/login" variant="contained" size="large" fullWidth>
                {t('home.login')}
              </Button>
              <Button component={RouterLink} to="/register" variant="outlined" size="large" fullWidth>
                {t('home.createAccount')}
              </Button>
            </>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}
