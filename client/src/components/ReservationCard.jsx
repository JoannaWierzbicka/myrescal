import { useCallback } from 'react';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import {
  Box,
  Card,
  CardActions,
  CardContent,
  Divider,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import { format } from 'date-fns';
import { useLocale } from '../context/LocaleContext.jsx';
import { getReservationStatusMeta } from '../utils/reservationStatus.js';

function ReservationCard({ reservation, onEdit, onDelete, onView, disabled = false }) {
  const { t, dateLocale } = useLocale();
  const isDepositPaid = reservation.deposit_paid === true || reservation.status === 'deposit_paid';
  const effectiveStatus = isDepositPaid
    ? 'deposit_paid'
    : (typeof reservation.status === 'string' && reservation.status.trim()) || 'preliminary';
  const statusMeta = getReservationStatusMeta(effectiveStatus);
  const statusLabel = (() => {
    if (effectiveStatus === 'deposit_paid') return t('reservationStatus.depositPaid');
    if (effectiveStatus === 'confirmed') return t('reservationStatus.confirmed');
    if (effectiveStatus === 'booking') return t('reservationStatus.booking');
    if (effectiveStatus === 'past') return t('reservationStatus.past');
    if (effectiveStatus === 'preliminary') return t('reservationStatus.preliminary');
    if (typeof reservation.status === 'string' && reservation.status.trim()) {
      return reservation.status.replaceAll('_', ' ');
    }
    return t('reservationStatus.preliminary');
  })();

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
  const guestName = [reservation.name, reservation.lastname].filter(Boolean).join(' ') || '—';
  const roomName = reservation.room?.name ?? '—';

  return (
    <Card
      onClick={() => {
        if (disabled) return;
        onView?.();
      }}
      sx={{
        position: 'relative',
        height: '100%',
        width: { xs: 'min(100%, 320px)', sm: 320 },
        maxWidth: '100%',
        boxSizing: 'border-box',
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
      <Tooltip title={statusLabel} arrow>
        <Box
          sx={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            zIndex: 2,
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            backgroundColor: statusMeta.color,
          }}
        />
      </Tooltip>

      <CardContent
        sx={{
          position: 'relative',
          zIndex: 1,
          display: 'grid',
          gap: 2,
          pt: { xs: 2.5, sm: 3 },
          pb: { xs: 6.5, sm: 7 },
          px: { xs: 3, sm: 4 },
        }}
      >
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontSize: '1.4rem',
              letterSpacing: '0.08rem',
              width: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {guestName}
          </Typography>
        </Box>
        <Divider />
        <Box sx={{ display: 'grid', gap: 1.5 }}>
          <Typography variant="body1">
            {t('reservationCard.room')} {roomName}
          </Typography>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
            <CalendarMonthOutlinedIcon fontSize="small" />
            <Typography variant="body2">
              {formattedStart} — {formattedEnd}
            </Typography>
          </Box>
        </Box>
      </CardContent>

      <CardActions
        onClick={(event) => event.stopPropagation()}
        sx={{
          position: 'absolute',
          right: 3,
          bottom: 2,
          p: 0,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 0.5,
          zIndex: 1,
        }}
      >
        <IconButton
          color="primary"
          size="small"
          aria-label={t('reservationCard.actions.edit')}
          onClick={() => onEdit?.()}
          disabled={disabled}
        >
          <EditOutlinedIcon fontSize="small" />
        </IconButton>
        <IconButton
          color="error"
          size="small"
          aria-label={t('reservationCard.actions.delete')}
          onClick={() => onDelete?.()}
          disabled={disabled}
        >
          <DeleteOutlineIcon fontSize="small" />
        </IconButton>
      </CardActions>
    </Card>
  );
}

export default ReservationCard;
