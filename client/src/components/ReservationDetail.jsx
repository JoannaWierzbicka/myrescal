import { Link, useLoaderData } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import CallOutlinedIcon from '@mui/icons-material/CallOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import HotelOutlinedIcon from '@mui/icons-material/HotelOutlined';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import StickyNote2OutlinedIcon from '@mui/icons-material/StickyNote2Outlined';
import { useLocale } from '../context/LocaleContext.jsx';
import { useReservationDetailData } from '../hooks/useReservationDetailData.js';
import ReservationGuestMessages from './ReservationGuestMessages.jsx';
import {
  BreakableEmail,
  DatePanel,
  DetailItem,
  InfoGrid,
  ReservationHeroIllustration,
  SectionCard,
} from './ReservationDetailParts.jsx';

function ReservationDetail() {
  const reservation = useLoaderData() ?? {};
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { t, language, dateLocale } = useLocale();
  const {
    backPath,
    statusMeta,
    normalizedStatus,
    confirmationMethodLabelKey,
    guestName,
    propertyName,
    roomName,
    totalPrice,
    stayNightsLabel,
    formatDate,
    formatMoney,
    isDeleting,
    confirmDeleteOpen,
    setConfirmDeleteOpen,
    error,
    handleDelete,
  } = useReservationDetailData({ reservation, t, language, dateLocale });
  const nightlyRate = reservation.nightly_rate;

  if (!reservation?.id) {
    return (
      <Box sx={{ maxWidth: 720, mx: 'auto' }}>
        <Alert severity="error">{t('reservationDetail.notFound')}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 980, mx: 'auto', pb: { xs: 11, sm: 0 } }}>
      <Stack spacing={{ xs: 2, md: 2.5 }}>
        {error && <Alert severity="error">{error}</Alert>}

        <Box
          sx={{
            position: 'relative',
            overflow: 'hidden',
            minHeight: { xs: 286, sm: 300 },
            p: { xs: 2, sm: 3, md: 3.5 },
            pb: { xs: 8.5, sm: 9 },
            borderRadius: { xs: 0, sm: 1.5 },
            mx: { xs: -2, sm: 0 },
            mt: { xs: -1.5, sm: 0 },
            background:
              'radial-gradient(circle at 84% 20%, rgba(195, 111, 43, 0.32) 0%, rgba(195, 111, 43, 0) 27%), linear-gradient(145deg, #0E3B40 0%, #122C36 58%, #0A232B 100%)',
            color: 'primary.contrastText',
            boxShadow: '0 20px 44px rgba(21, 40, 50, 0.2)',
            '&::before': {
              content: '""',
              position: 'absolute',
              right: { xs: -96, sm: -54 },
              top: { xs: 54, sm: 40 },
              width: { xs: 250, sm: 320 },
              height: { xs: 250, sm: 320 },
              borderRadius: '50%',
              border: '1px solid rgba(201, 135, 74, 0.42)',
              opacity: 0.75,
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              left: { xs: -48, sm: -24 },
              right: { xs: -48, sm: -24 },
              bottom: -58,
              height: 112,
              backgroundColor: 'background.default',
              borderTopLeftRadius: '58% 100%',
              borderTopRightRadius: '58% 100%',
              zIndex: 1,
            },
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 3 }}>
            <Stack direction="row" justifyContent="flex-start" alignItems="center" sx={{ mb: { xs: 2, sm: 3 } }}>
              <IconButton
                component={Link}
                to={backPath}
                aria-label={t('reservationDetail.back')}
                sx={{
                  color: 'primary.contrastText',
                  border: '1px solid rgba(255,255,255,0.22)',
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.14)' },
                }}
              >
                <ArrowBackIcon />
              </IconButton>
            </Stack>

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
                  fontWeight: 800,
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
                  {roomName}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.68)', mt: 0.25 }}>
                  {propertyName}
                </Typography>
              </Box>
            </Stack>

            <ReservationHeroIllustration />

            <Stack
              direction="row"
              spacing={1}
              sx={{
                display: { xs: 'none', sm: 'flex' },
                alignSelf: 'flex-end',
                mt: { sm: 7, md: 8 },
                position: 'relative',
                zIndex: 4,
              }}
            >
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
                onClick={() => setConfirmDeleteOpen(true)}
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
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1.05fr 0.95fr' },
            gap: { xs: 2, md: 2.5 },
            mt: { xs: -5.5, sm: -6 },
            position: 'relative',
            zIndex: 4,
          }}
        >
          <SectionCard icon={<CalendarMonthOutlinedIcon />} title={t('reservationDetail.stay')}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: 1.5,
              }}
            >
              <DatePanel label={t('reservationDetail.checkIn')} value={formatDate(reservation.start_date)} />
              <DatePanel label={t('reservationDetail.checkOut')} value={formatDate(reservation.end_date)} />
            </Box>
            <InfoGrid sx={{ mt: 2 }}>
              {stayNightsLabel ? (
                <DetailItem
                  label={t('reservationDetail.stayLength')}
                  value={stayNightsLabel}
                  icon={<CalendarMonthOutlinedIcon />}
                />
              ) : null}
              <DetailItem label={t('reservationDetail.property')} value={propertyName} icon={<HotelOutlinedIcon />} />
              <DetailItem label={t('reservationDetail.room')} value={roomName} icon={<HotelOutlinedIcon />} />
            </InfoGrid>
          </SectionCard>

          <SectionCard icon={<PersonOutlineOutlinedIcon />} title={t('reservationDetail.guest')}>
            <InfoGrid>
              <DetailItem label={t('reservationDetail.name')} value={guestName} />
              <DetailItem label={t('reservationDetail.phone')} value={reservation.phone || '—'} icon={<CallOutlinedIcon />} />
              <DetailItem
                label={t('reservationDetail.email')}
                value={<BreakableEmail email={reservation.mail} />}
                icon={<MailOutlineIcon />}
                valueSx={{ overflowWrap: 'break-word', wordBreak: 'normal' }}
              />
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
              {normalizedStatus === 'confirmed' ? (
                <DetailItem
                  label={t('reservationForm.fields.confirmationMethod')}
                  value={confirmationMethodLabelKey ? t(confirmationMethodLabelKey) : '—'}
                />
              ) : null}
            </InfoGrid>
          </SectionCard>

          <SectionCard icon={<StickyNote2OutlinedIcon />} title={t('reservationDetail.notes')}>
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
              {reservation.notes || '—'}
            </Typography>
          </SectionCard>

          <ReservationGuestMessages reservation={reservation} />
        </Box>

        <Stack direction="row" spacing={1.25} sx={{ display: { xs: 'none', sm: 'flex' } }}>
          <Button component={Link} to={backPath} variant="outlined" startIcon={<ArrowBackIcon />}>
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
              onClick={() => setConfirmDeleteOpen(true)}
              disabled={isDeleting}
              startIcon={<DeleteOutlineIcon />}
              fullWidth
            >
              {isDeleting ? t('reservationDetail.deleting') : t('reservationDetail.delete')}
            </Button>
          </Stack>
        </Box>
      ) : null}

      <Dialog
        open={confirmDeleteOpen}
        onClose={() => {
          if (!isDeleting) setConfirmDeleteOpen(false);
        }}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 1.5,
            border: '1px solid',
            borderColor: 'divider',
            backgroundColor: '#FFFDFC',
            boxShadow: '0 24px 58px rgba(16, 42, 51, 0.18)',
          },
        }}
      >
        <DialogTitle sx={{ color: 'primary.dark', pb: 1 }}>
          {t('reservationDetail.delete')}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {t('reservationDetail.deleteConfirm')}
          </Typography>
        </DialogContent>
        <DialogActions
          sx={{
            px: 3,
            pb: 2.5,
            gap: 1,
            flexDirection: { xs: 'column-reverse', sm: 'row' },
            alignItems: 'stretch',
            '& > :not(style) ~ :not(style)': { ml: { xs: 0, sm: 1 } },
          }}
        >
          <Button onClick={() => setConfirmDeleteOpen(false)} disabled={isDeleting} fullWidth={isMobile}>
            {t('reservationList.cancel')}
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={isDeleting}
            startIcon={<DeleteOutlineIcon />}
            fullWidth={isMobile}
          >
            {isDeleting ? t('reservationDetail.deleting') : t('reservationDetail.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ReservationDetail;
