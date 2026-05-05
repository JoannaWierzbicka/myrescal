import { useCallback, useMemo, useState } from 'react';
import { Link, useLoaderData, useNavigate } from 'react-router-dom';
import { deleteReservation } from '../api/reservations.js';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import HotelOutlinedIcon from '@mui/icons-material/HotelOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import StickyNote2OutlinedIcon from '@mui/icons-material/StickyNote2Outlined';
import { format } from 'date-fns';
import { useLocale } from '../context/LocaleContext.jsx';
import { getReservationStatusMeta } from '../utils/reservationStatus.js';

function ReservationDetail() {
  const reservation = useLoaderData() ?? {};
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);
  const { t, language, dateLocale } = useLocale();
  const statusMeta = getReservationStatusMeta(reservation.status);
  const guestName = [reservation.name, reservation.lastname].filter(Boolean).join(' ') || '—';
  const propertyName = reservation.property?.name || '—';
  const roomName = reservation.room?.name || '—';

  const formatDate = useCallback(
    (value) => {
      const date = value ? new Date(value) : null;
      return date && !Number.isNaN(date.getTime())
        ? format(date, 'd MMM yyyy', { locale: dateLocale })
        : '—';
    },
    [dateLocale],
  );

  const numberFormatter = useMemo(
    () =>
      new Intl.NumberFormat(language === 'pl' ? 'pl-PL' : 'en-US', {
        style: 'currency',
        currency: 'PLN',
        maximumFractionDigits: 2,
      }),
    [language],
  );

  const formatMoney = (value) =>
    value !== undefined && value !== null && value !== ''
      ? numberFormatter.format(Number(value))
      : '—';

  const nightlyRate = reservation.nightly_rate;
  const totalPrice = reservation.total_price ?? reservation.price;

  const handleDelete = async () => {
    if (!window.confirm(t('reservationDetail.deleteConfirm'))) return;

    setIsDeleting(true);
    try {
      await deleteReservation(reservation.id);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || t('reservationDetail.deleteError'));
      setIsDeleting(false);
    }
  };

  if (!reservation?.id) {
    return (
      <Box sx={{ maxWidth: 720, mx: 'auto' }}>
        <Alert severity="error">{t('reservationDetail.notFound')}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 980, mx: 'auto', pb: { xs: 10, sm: 0 } }}>
      <Stack spacing={{ xs: 2, md: 2.5 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton component={Link} to="/dashboard" aria-label={t('reservationDetail.back')}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="body2" color="text.secondary">
            {t('reservationDetail.back')}
          </Typography>
        </Stack>

        {error && <Alert severity="error">{error}</Alert>}

        <Box
          sx={{
            p: { xs: 2.25, sm: 3, md: 3.5 },
            borderRadius: 1.5,
            backgroundColor: 'primary.main',
            color: 'primary.contrastText',
            boxShadow: '0 20px 44px rgba(21, 40, 50, 0.2)',
          }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'flex-start' }}
            spacing={2}
          >
            <Stack spacing={1.25} sx={{ minWidth: 0 }}>
              <Chip
                label={t(statusMeta.labelKey)}
                size="small"
                sx={{
                  alignSelf: 'flex-start',
                  backgroundColor: statusMeta.background,
                  color: statusMeta.color,
                }}
              />
              <Box>
                <Typography
                  variant="h3"
                  component="h1"
                  sx={{
                    color: 'inherit',
                    fontSize: { xs: '1.75rem', sm: '2.05rem' },
                    overflowWrap: 'anywhere',
                  }}
                >
                  {guestName}
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.82)', mt: 0.5 }}>
                  {propertyName} · {roomName}
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1} sx={{ display: { xs: 'none', sm: 'flex' } }}>
              <Button
                component={Link}
                to={`/dashboard/edit/${reservation.id}`}
                variant="contained"
                color="secondary"
                startIcon={<EditOutlinedIcon />}
              >
                {t('reservationDetail.edit')}
              </Button>
              <Button
                variant="outlined"
                onClick={handleDelete}
                disabled={isDeleting}
                startIcon={<DeleteOutlineIcon />}
                sx={{
                  color: 'primary.contrastText',
                  borderColor: 'rgba(255,255,255,0.55)',
                  '&:hover': {
                    borderColor: 'primary.contrastText',
                    backgroundColor: 'rgba(255,255,255,0.08)',
                  },
                }}
              >
                {isDeleting ? t('reservationDetail.deleting') : t('reservationDetail.delete')}
              </Button>
            </Stack>
          </Stack>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1.05fr 0.95fr' },
            gap: { xs: 2, md: 2.5 },
          }}
        >
          <SectionCard icon={<CalendarMonthOutlinedIcon />} title={t('reservationDetail.stay')}>
            <InfoGrid>
              <DetailItem label={t('reservationDetail.from')} value={formatDate(reservation.start_date)} />
              <DetailItem label={t('reservationDetail.to')} value={formatDate(reservation.end_date)} />
              <DetailItem label={t('reservationDetail.property')} value={propertyName} />
              <DetailItem label={t('reservationDetail.room')} value={roomName} />
            </InfoGrid>
          </SectionCard>

          <SectionCard icon={<PersonOutlineOutlinedIcon />} title={t('reservationDetail.guest')}>
            <InfoGrid>
              <DetailItem label={t('reservationDetail.name')} value={guestName} />
              <DetailItem label={t('reservationDetail.phone')} value={reservation.phone || '—'} />
              <DetailItem label={t('reservationDetail.email')} value={reservation.mail || '—'} />
              <DetailItem
                label={t('reservationDetail.guests')}
                value={t('reservationCard.guestsSummary', {
                  adults: reservation.adults ?? '—',
                  children: reservation.children ?? '—',
                })}
              />
            </InfoGrid>
          </SectionCard>

          <SectionCard icon={<PaymentsOutlinedIcon />} title={t('reservationDetail.payment')}>
            <InfoGrid>
              <DetailItem label={t('reservationDetail.nightlyRate')} value={formatMoney(nightlyRate)} />
              <DetailItem label={t('reservationDetail.totalPrice')} value={formatMoney(totalPrice)} />
              <DetailItem label={t('reservationForm.fields.depositAmount')} value={formatMoney(reservation.deposit_amount)} />
              <DetailItem label={t('reservationForm.fields.status')} value={t(statusMeta.labelKey)} />
            </InfoGrid>
          </SectionCard>

          <SectionCard icon={<StickyNote2OutlinedIcon />} title={t('reservationDetail.notes')}>
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
              {reservation.notes || '—'}
            </Typography>
          </SectionCard>
        </Box>

        <Stack direction="row" spacing={1.25} sx={{ display: { xs: 'none', sm: 'flex' } }}>
          <Button component={Link} to="/dashboard" variant="outlined" startIcon={<ArrowBackIcon />}>
            {t('reservationDetail.back')}
          </Button>
        </Stack>
      </Stack>

      {isMobile ? (
        <Box
          sx={{
            position: 'fixed',
            right: 0,
            bottom: 72,
            left: 0,
            zIndex: (theme) => theme.zIndex.appBar + 1,
            px: 2,
            py: 1.25,
            backgroundColor: 'rgba(251, 247, 240, 0.94)',
            borderTop: '1px solid',
            borderColor: 'divider',
            backdropFilter: 'blur(14px)',
          }}
        >
          <Stack direction="row" spacing={1}>
            <Button
              component={Link}
              to={`/dashboard/edit/${reservation.id}`}
              variant="contained"
              startIcon={<EditOutlinedIcon />}
              fullWidth
            >
              {t('reservationDetail.edit')}
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={handleDelete}
              disabled={isDeleting}
              startIcon={<DeleteOutlineIcon />}
              fullWidth
            >
              {isDeleting ? t('reservationDetail.deleting') : t('reservationDetail.delete')}
            </Button>
          </Stack>
        </Box>
      ) : null}
    </Box>
  );
}

function SectionCard({ icon, title, children }) {
  return (
    <Box
      sx={{
        p: { xs: 2, sm: 2.5 },
        borderRadius: 1.5,
        backgroundColor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 18px 42px rgba(25, 41, 49, 0.1)',
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 1.75 }}>
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: 1,
            display: 'grid',
            placeItems: 'center',
            color: 'primary.main',
            backgroundColor: 'rgba(51, 180, 172, 0.14)',
          }}
        >
          {icon}
        </Box>
        <Typography variant="h6">{title}</Typography>
      </Stack>
      {children}
    </Box>
  );
}

function InfoGrid({ children }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
        gap: 1.5,
      }}
    >
      {children}
    </Box>
  );
}

function DetailItem({ label, value }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.35 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600, overflowWrap: 'anywhere' }}>
        {value}
      </Typography>
    </Box>
  );
}

export default ReservationDetail;
