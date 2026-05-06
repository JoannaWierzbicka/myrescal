import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import LoginOutlinedIcon from '@mui/icons-material/LoginOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import { isSameDay, startOfToday } from 'date-fns';
import { fetchProperties } from '../../api/properties.js';
import { loadReservations } from '../../api/reservations.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLocale } from '../../context/LocaleContext.jsx';

export default function Summary() {
  const { t } = useLocale();
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [reservations, setReservations] = useState([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [loadingReservations, setLoadingReservations] = useState(false);
  const [propertiesError, setPropertiesError] = useState(null);
  const [reservationsError, setReservationsError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoadingProperties(true);
    fetchProperties({ signal: controller.signal })
      .then((data) => {
        setProperties(data);
        if (data.length > 0) {
          setSelectedPropertyId((current) => current || data[0].id);
        }
        setPropertiesError(null);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setPropertiesError(t('dashboard.errors.properties'));
      })
      .finally(() => setLoadingProperties(false));

    return () => controller.abort();
  }, [t]);

  useEffect(() => {
    if (!selectedPropertyId) {
      setReservations([]);
      setReservationsError(null);
      return undefined;
    }

    const controller = new AbortController();
    setLoadingReservations(true);
    loadReservations({
      signal: controller.signal,
      filters: { property_id: selectedPropertyId },
    })
      .then((data) => {
        setReservations(data);
        setReservationsError(null);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setReservationsError(t('dashboard.errors.reservations'));
      })
      .finally(() => setLoadingReservations(false));

    return () => controller.abort();
  }, [selectedPropertyId, t]);

  const stats = useMemo(() => {
    const today = startOfToday();
    const arrivals = reservations.filter((reservation) => {
      const date = reservation.start_date ? new Date(reservation.start_date) : null;
      return date && !Number.isNaN(date.getTime()) && isSameDay(date, today);
    }).length;
    const departures = reservations.filter((reservation) => {
      const date = reservation.end_date ? new Date(reservation.end_date) : null;
      return date && !Number.isNaN(date.getTime()) && isSameDay(date, today);
    }).length;

    return [
      {
        key: 'arrivals',
        icon: <LoginOutlinedIcon />,
        label: t('dashboard.todayArrivals'),
        value: arrivals,
      },
      {
        key: 'departures',
        icon: <LogoutOutlinedIcon />,
        label: t('dashboard.todayDepartures'),
        value: departures,
      },
    ];
  }, [reservations, t]);

  const userName = user?.email ? user.email.split('@')[0] : null;

  return (
    <Box sx={{ maxWidth: 980, mx: 'auto' }}>
      <Stack spacing={{ xs: 2.5, md: 3 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'stretch', md: 'center' }}
          justifyContent="space-between"
          spacing={2}
        >
          <Box>
            <Typography variant="h4" component="h1" sx={{ color: 'primary.dark', mb: 0.5 }}>
              {userName ? t('summary.greeting', { name: userName }) : t('summary.greetingFallback')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('summary.subtitle')}
            </Typography>
          </Box>

          <FormControl
            size="small"
            sx={{
              minWidth: { xs: '100%', sm: 260 },
              maxWidth: { xs: '100%', md: 300 },
            }}
            disabled={loadingProperties || properties.length === 0}
          >
            <InputLabel id="summary-property-select-label">
              {t('reservationForm.fields.property')}
            </InputLabel>
            <Select
              labelId="summary-property-select-label"
              value={selectedPropertyId}
              label={t('reservationForm.fields.property')}
              onChange={(event) => setSelectedPropertyId(event.target.value)}
            >
              {properties.map((property) => (
                <MenuItem key={property.id} value={property.id}>
                  {property.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        {(propertiesError || reservationsError) && (
          <Alert severity="error">{propertiesError || reservationsError}</Alert>
        )}

        {!selectedPropertyId && !loadingProperties ? (
          <Alert severity="info">{t('dashboard.infoNoProperty')}</Alert>
        ) : null}

        {loadingProperties || loadingReservations ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(2, minmax(0, 1fr))' },
              gap: { xs: 1.25, md: 2 },
              maxWidth: 640,
            }}
          >
            {stats.map((stat) => (
              <Box
                key={stat.key}
                sx={{
                  p: { xs: 2, md: 2.5 },
                  borderRadius: 1.5,
                  backgroundColor: '#FFFFFF',
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow: '0 16px 34px rgba(16, 42, 51, 0.07)',
                }}
              >
                <Box
                  sx={{
                    width: 34,
                    height: 34,
                    borderRadius: 1,
                    display: 'grid',
                    placeItems: 'center',
                    color: 'secondary.main',
                    backgroundColor: 'rgba(195, 111, 43, 0.1)',
                    mb: 1.5,
                  }}
                >
                  {stat.icon}
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
                  {stat.label}
                </Typography>
                <Typography variant="h4" sx={{ color: 'primary.dark', fontSize: { xs: '1.75rem', md: '2rem' } }}>
                  {stat.value}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Stack>
    </Box>
  );
}
