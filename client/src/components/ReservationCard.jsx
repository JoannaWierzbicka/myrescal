import { useCallback, useMemo } from 'react';
import { Box, Button, Card, CardActions, CardContent, Tooltip, Typography } from '@mui/material';
import { format } from 'date-fns';
import { useLocale } from '../context/LocaleContext.jsx';
import { getReservationStatusMeta } from '../utils/reservationStatus.js';

function ReservationCard({ reservation, onEdit, onDelete, onView, disabled = false }) {
  const { t, dateLocale, language } = useLocale();
  const statusMeta = getReservationStatusMeta(reservation.status);
  const numberFormatter = useMemo(
    () =>
      new Intl.NumberFormat(language === 'pl' ? 'pl-PL' : 'en-US', {
        style: 'currency',
        currency: 'PLN',
        maximumFractionDigits: 2,
      }),
    [language],
  );

  const formatDate = useCallback(
    (value) => {
      const date = value ? new Date(value) : null;
      return date && !Number.isNaN(date.getTime())
        ? format(date, 'd MMM yyyy', { locale: dateLocale })
        : '—';
    },
    [dateLocale],
  );

  const formattedStart = formatDate(reservation.start_date);
  const formattedEnd = formatDate(reservation.end_date);
  const propertyName = reservation.property?.name ?? '—';
  const roomName = reservation.room?.name ?? '—';
  const nightlyRate = reservation.nightly_rate;
  const totalPrice = reservation.total_price ?? reservation.price;
  const notes = reservation.notes?.trim() || '';
  const adultsProvided = reservation.adults !== undefined && reservation.adults !== null;
  const childrenProvided = reservation.children !== undefined && reservation.children !== null;
  const guestSummary = (() => {
    if (adultsProvided && childrenProvided) {
      return t('reservationCard.guestsSummary', {
        adults: reservation.adults,
        children: reservation.children,
      });
    }
    if (adultsProvided) {
      return `${t('common.adults')}: ${reservation.adults}`;
    }
    if (childrenProvided) {
      return `${t('common.children')}: ${reservation.children}`;
    }
    return '—';
  })();

  return (
    <Card
      onClick={() => {
        if (disabled) return;
        onView?.();
      }}
      sx={{
        position: 'relative',
        height: '100%',
        width: '100%',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflow: 'visible',
        border: '2px solid rgba(195, 111, 43, 0.42)',
        background: 'linear-gradient(165deg, #fbf5ea 0%, #f0e1c8 100%)',
        transition: 'transform 0.25s ease, box-shadow 0.3s ease',
        '&:hover': {
          transform: disabled ? 'none' : 'translateY(-10px)',
          boxShadow: disabled
            ? 'none'
            : '0 32px 48px rgba(25, 41, 49, 0.22)',
        },
      }}
      elevation={0}
    >
      <CardContent
        sx={{
          position: 'relative',
          zIndex: 1,
          display: 'grid',
          gap: 2,
          pt: 4,
          pb: 3,
          px: 4,
        }}
      >
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontSize: '1.4rem',
              letterSpacing: '0.08rem',
            }}
          >
            {reservation.name} {reservation.lastname}
          </Typography>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              borderRadius: 999,
              px: 1.8,
              py: 0.6,
              mt: 1.5,
              backgroundColor: statusMeta.background,
              color: statusMeta.color,
              letterSpacing: '0.14em',
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            {t(statusMeta.labelKey)}
          </Box>
          <Typography
            sx={{
              fontFamily: 'var(--app-font-script)',
              fontSize: '1.2rem',
              color: 'info.dark',
              mt: 1.5,
            }}
          >
            {guestSummary}
          </Typography>
        </Box>
        <Box
          component="dl"
          sx={{
            display: 'grid',
            gridTemplateColumns: 'max-content 1fr',
            columnGap: 2,
            rowGap: 1.2,
            fontSize: '0.95rem',
            color: 'text.secondary',
          }}
        >
          <Typography component="dt" sx={{ textTransform: 'uppercase', letterSpacing: '0.08rem' }}>
            {t('reservationCard.guestName')}
          </Typography>
          <Typography component="dd" sx={{ margin: 0 }}>
            {reservation.name} {reservation.lastname}
          </Typography>

          <Typography component="dt" sx={{ textTransform: 'uppercase', letterSpacing: '0.08rem' }}>
            {t('reservationCard.property')}
          </Typography>
          <Typography component="dd" sx={{ margin: 0 }}>{propertyName}</Typography>

          <Typography component="dt" sx={{ textTransform: 'uppercase', letterSpacing: '0.08rem' }}>
            {t('reservationCard.room')}
          </Typography>
          <Typography component="dd" sx={{ margin: 0 }}>{roomName}</Typography>

          <Typography component="dt" sx={{ textTransform: 'uppercase', letterSpacing: '0.08rem' }}>
            {t('reservationCard.from')}
          </Typography>
          <Typography component="dd" sx={{ margin: 0, fontWeight: 600 }}>{formattedStart}</Typography>

          <Typography component="dt" sx={{ textTransform: 'uppercase', letterSpacing: '0.08rem' }}>
            {t('reservationCard.to')}
          </Typography>
          <Typography component="dd" sx={{ margin: 0, fontWeight: 600 }}>{formattedEnd}</Typography>

          <Typography component="dt" sx={{ textTransform: 'uppercase', letterSpacing: '0.08rem' }}>
            {t('reservationCard.nightlyRate')}
          </Typography>
          <Typography component="dd" sx={{ margin: 0, fontWeight: 600 }}>
            {nightlyRate !== undefined && nightlyRate !== null
              ? numberFormatter.format(Number(nightlyRate))
              : '—'}
          </Typography>

          <Typography component="dt" sx={{ textTransform: 'uppercase', letterSpacing: '0.08rem' }}>
            {t('reservationCard.totalPrice')}
          </Typography>
          <Typography component="dd" sx={{ margin: 0, fontWeight: 600 }}>
            {totalPrice !== undefined && totalPrice !== null
              ? numberFormatter.format(Number(totalPrice))
              : '—'}
          </Typography>

          <Typography component="dt" sx={{ textTransform: 'uppercase', letterSpacing: '0.08rem' }}>
            {t('reservationCard.notes')}
          </Typography>
          <Typography component="dd" sx={{ margin: 0 }}>
            {notes ? (
              <Tooltip title={notes} arrow>
                <Box
                  component="span"
                  sx={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'normal',
                    wordBreak: 'break-word',
                  }}
                >
                  {notes}
                </Box>
              </Tooltip>
            ) : '—'}
          </Typography>
        </Box>
      </CardContent>

      <Box
        sx={{
          position: 'absolute',
          top: 18,
          right: 32,
          width: 72,
          height: 72,
          borderRadius: '50%',
          border: '2px solid rgba(51, 180, 172, 0.65)',
          backgroundColor: 'rgba(51, 180, 172, 0.15)',
          display: 'grid',
          placeItems: 'center',
          fontFamily: 'var(--app-font-script)',
          fontSize: '1.15rem',
          color: 'info.dark',
          transform: 'rotate(10deg)',
          pointerEvents: 'none',
        }}
      >
        RSVP
      </Box>

      <CardActions
        onClick={(event) => event.stopPropagation()}
        sx={{
          px: 4,
          pb: 3,
          pt: 1,
          display: 'flex',
          justifyContent: 'space-between',
          gap: 1.5,
        }}
      >
        <Button
          variant="outlined"
          color="primary"
          onClick={() => onEdit?.()}
          disabled={disabled}
          sx={{ flex: 1 }}
        >
          {t('reservationCard.actions.edit')}
        </Button>
        <Button
          variant="outlined"
          color="error"
          onClick={() => onDelete?.()}
          disabled={disabled}
          sx={{ flex: 1 }}
        >
          {t('reservationCard.actions.delete')}
        </Button>
      </CardActions>
    </Card>
  );
}

export default ReservationCard;
