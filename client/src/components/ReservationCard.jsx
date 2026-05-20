import { useCallback } from 'react';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import {
  Box,
  Card,
  CardActions,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Typography,
} from '@mui/material';
import { format } from 'date-fns';
import { useLocale } from '../context/LocaleContext.jsx';
import { getReservationDisplayStatusMeta } from '../utils/reservationStatus.js';

function ReservationCard({ reservation, onEdit, onDelete, onView, disabled = false }) {
  const { t, dateLocale } = useLocale();
  const statusMeta = getReservationDisplayStatusMeta(reservation);
  const statusLabel = t(statusMeta.labelKey);

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
        width: { xs: '100%', sm: 320 },
        maxWidth: '100%',
        boxSizing: 'border-box',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        background: '#FFFFFF',
        transition: 'transform 0.25s ease, box-shadow 0.3s ease',
        '&:hover': {
          transform: disabled ? 'none' : 'translateY(-4px)',
          boxShadow: disabled
            ? 'none'
            : '0 22px 42px rgba(16, 42, 51, 0.12)',
        },
      }}
      elevation={0}
    >
      <CardContent
        sx={{
          position: 'relative',
          zIndex: 1,
          display: 'grid',
          gap: 1.75,
          pt: { xs: 2.25, sm: 2.5 },
          pb: { xs: 6.5, sm: 7 },
          px: { xs: 2.25, sm: 3 },
        }}
      >
        <Chip
          label={statusLabel}
          size="small"
          sx={{
            justifySelf: 'start',
            backgroundColor: statusMeta.background,
            color: statusMeta.color,
          }}
        />
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontSize: '1.1rem',
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
          <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
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
