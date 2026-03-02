import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Typography,
} from '@mui/material';
import LocalPostOfficeIcon from '@mui/icons-material/LocalPostOffice';
import ReservationCard from './ReservationCard.jsx';
import { useLocale } from '../context/LocaleContext.jsx';

const SORT_OPTIONS = [
  { value: 'date', labelKey: 'reservationList.sortOptions.date' },
  { value: 'lastname', labelKey: 'reservationList.sortOptions.lastname' },
  { value: 'property', labelKey: 'reservationList.sortOptions.property' },
  { value: 'room', labelKey: 'reservationList.sortOptions.room' },
];
const CARD_MIN_WIDTH = 280;
const CARD_MAX_WIDTH = 320;
const GRID_GAP_PX = 24;

const getRoomName = (reservation) => reservation?.room?.name ?? '';
const getPropertyName = (reservation) => reservation?.property?.name ?? '';

function ReservationList({
  reservations = [],
  onDeleteReservation,
  onEditReservation,
  onAddReservation,
  showHeader = true,
  canAdd = true,
  rooms = [],
  roomFilterId = 'all',
  onRoomFilterChange,
}) {
  const navigate = useNavigate();
  const { t, language } = useLocale();
  const [sortBy, setSortBy] = useState('date');
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmReservation, setConfirmReservation] = useState(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const collator = useMemo(
    () => new Intl.Collator(language === 'pl' ? 'pl-PL' : 'en-US', { sensitivity: 'base' }),
    [language],
  );

  const sorters = useMemo(
    () => ({
      date: (a, b) => new Date(a.start_date) - new Date(b.start_date),
      lastname: (a, b) => collator.compare(a.lastname ?? '', b.lastname ?? ''),
      property: (a, b) => collator.compare(getPropertyName(a), getPropertyName(b)),
      room: (a, b) => collator.compare(getRoomName(a), getRoomName(b)),
    }),
    [collator],
  );

  const hasRoomFilter = typeof onRoomFilterChange === 'function' && Array.isArray(rooms) && rooms.length > 0;

  const reservationsFilteredByRoom = useMemo(() => {
    if (!Array.isArray(reservations)) return [];
    if (!hasRoomFilter || roomFilterId === 'all') return reservations;
    return reservations.filter((reservation) => {
      const reservationRoomId = reservation.room_id || reservation.room?.id;
      return reservationRoomId === roomFilterId;
    });
  }, [reservations, roomFilterId, hasRoomFilter]);

  const sortedReservations = useMemo(() => {
    const items = [...reservationsFilteredByRoom];
    const sorter = sorters[sortBy] ?? sorters.date;
    return items.sort(sorter);
  }, [reservationsFilteredByRoom, sortBy, sorters]);

  const requestDelete = (reservation) => {
    if (!reservation?.id) return;
    setConfirmReservation(reservation);
  };

  const closeDeleteDialog = () => {
    if (isConfirmingDelete) return;
    setConfirmReservation(null);
  };

  const handleConfirmDelete = async () => {
    if (!confirmReservation?.id) return;
    setIsConfirmingDelete(true);
    setPendingDeleteId(confirmReservation.id);
    try {
      if (!onDeleteReservation) {
        throw new Error(t('reservationList.deleteError'));
      }
      await onDeleteReservation(confirmReservation.id);
      setToast({ type: 'success', message: t('reservationList.deleteSuccess') });
      setConfirmReservation(null);
    } catch (error) {
      setToast({
        type: 'error',
        message: error.message || t('reservationList.deleteError'),
      });
    } finally {
      setIsConfirmingDelete(false);
      setPendingDeleteId(null);
    }
  };

  const handleToastClose = (_, reason) => {
    if (reason === 'clickaway') return;
    setToast(null);
  };

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: {
            xs: 'flex-start',
            sm: showHeader ? 'space-between' : 'center',
          },
          alignItems: { xs: 'stretch', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          mb: 3,
          p: { xs: 2.4, sm: 3, md: 0 },
          borderRadius: { xs: '12px', md: 0 },
          border: { xs: '1px solid rgba(195, 111, 43, 0.25)', md: 'none' },
          backgroundColor: { xs: 'rgba(251, 247, 240, 0.95)', md: 'transparent' },
          boxShadow: {
            xs: '0 18px 40px rgba(25, 41, 49, 0.12)',
            md: 'none',
          },
        }}
      >
        {showHeader && (
          <Box sx={{ flex: '1 1 auto', minWidth: 0 }}>
            <Typography
              variant="h4"
              component="h2"
              sx={{
                fontSize: { xs: '1.8rem', sm: '2rem' },
                letterSpacing: '0.12rem',
                textTransform: 'uppercase',
              }}
            >
              {t('reservationList.title')}
            </Typography>
          </Box>
        )}

        <Box
          display="flex"
          flexDirection={{ xs: 'column', lg: 'row' }}
          gap={{ xs: 1.5, lg: 2 }}
          alignItems={{ xs: 'stretch', lg: 'center' }}
          sx={{
            width: { xs: '100%', sm: 'auto' },
            backgroundColor: { xs: 'transparent', sm: 'rgba(251, 247, 240, 0.92)' },
            borderRadius: { xs: 0, sm: '12px' },
            border: { xs: 'none', sm: '1px solid rgba(195, 111, 43, 0.3)' },
            boxShadow: {
              xs: 'none',
              md: '0 18px 40px rgba(25, 41, 49, 0.16)',
            },
            px: { xs: 0, sm: 2.4, md: 3 },
            py: { xs: 0, sm: 1.8, md: 1.8 },
          }}
        >
          {hasRoomFilter && (
            <FormControl
              size="small"
              fullWidth
              sx={{
                minWidth: { xs: '100%', sm: 200 },
                '& .MuiOutlinedInput-root': {
                  fontSize: { xs: '0.95rem', sm: '1rem' },
                  '& .MuiSelect-select': {
                    py: { xs: 0.55, sm: 0.9 },
                  },
                },
                '& .MuiInputLabel-root': {
                  fontSize: { xs: '0.85rem', sm: '0.9rem' },
                },
              }}
            >
              <InputLabel id="reservation-room-filter-label">
                {t('reservationList.filterByRoom')}
              </InputLabel>
              <Select
                labelId="reservation-room-filter-label"
                value={roomFilterId}
                label={t('reservationList.filterByRoom')}
                onChange={(event) => onRoomFilterChange?.(event.target.value)}
              >
                <MenuItem value="all">{t('reservationList.allRooms')}</MenuItem>
                {rooms.map((room) => (
                  <MenuItem key={room.id} value={room.id}>
                    {room.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <FormControl
            size="small"
            fullWidth
            sx={{
              minWidth: { xs: '100%', sm: 200 },
              '& .MuiOutlinedInput-root': {
                fontSize: { xs: '0.95rem', sm: '1rem' },
                '& .MuiSelect-select': {
                  py: { xs: 0.55, sm: 0.9 },
                },
              },
              '& .MuiInputLabel-root': {
                fontSize: { xs: '0.85rem', sm: '0.9rem' },
              },
            }}
          >
            <InputLabel id="reservation-sort-label">{t('reservationList.sortBy')}</InputLabel>
            <Select
              labelId="reservation-sort-label"
              value={sortBy}
              label={t('reservationList.sortBy')}
              onChange={(event) => setSortBy(event.target.value)}
            >
              {SORT_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

        </Box>
      </Box>

      {sortedReservations.length === 0 ? (
        <Card
          sx={{
            background: 'linear-gradient(135deg, rgba(251, 245, 234, 0.94), rgba(233, 220, 198, 0.9))',
            border: '2px dashed rgba(195, 111, 43, 0.35)',
            textAlign: 'center',
          }}
        >
          <CardContent sx={{ px: { xs: 3, sm: 5 }, py: { xs: 3, sm: 4 } }}>
            <Typography sx={{ mb: 2 }}>{t('reservationList.empty')}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t('reservationList.addFirst')}
            </Typography>
          </CardContent>
          <CardActions sx={{ justifyContent: 'center', pb: { xs: 3, sm: 4 } }}>
            <Button
              variant="contained"
              color="info"
              onClick={() => onAddReservation?.()}
              disabled={!canAdd || !onAddReservation}
              sx={{
                px: { xs: 3, sm: 4 },
                py: { xs: 0.9, sm: 1 },
                fontSize: { xs: '0.85rem', sm: '0.95rem' },
                letterSpacing: { xs: '0.16em', sm: '0.18em' },
              }}
            >
              {t('reservationList.addFirst')}
            </Button>
          </CardActions>
        </Card>
      ) : (
        <Box
          sx={(theme) => ({
            display: 'grid',
            width: '100%',
            maxWidth: `${CARD_MAX_WIDTH * 3 + GRID_GAP_PX * 2}px`,
            mx: 'auto',
            px: { xs: 2, sm: 3 },
            gridTemplateColumns: `minmax(0, ${CARD_MAX_WIDTH}px)`,
            [theme.breakpoints.between(700, 1199.95)]: {
              gridTemplateColumns: `repeat(2, minmax(${CARD_MIN_WIDTH}px, ${CARD_MAX_WIDTH}px))`,
            },
            [theme.breakpoints.up('lg')]: {
              gridTemplateColumns: `repeat(3, minmax(${CARD_MIN_WIDTH}px, ${CARD_MAX_WIDTH}px))`,
            },
            justifyContent: 'center',
            gap: 3,
          })}
        >
          {sortedReservations.map((reservation) => (
            <ReservationCard
              key={reservation.id}
              reservation={reservation}
              onView={() => navigate(`/dashboard/detail/${reservation.id}`)}
              onEdit={() => onEditReservation?.(reservation)}
              onDelete={() => requestDelete(reservation)}
              disabled={pendingDeleteId === reservation.id}
            />
          ))}
        </Box>
      )}

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={4000}
        onClose={handleToastClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {toast ? (
          <Alert onClose={handleToastClose} severity={toast.type} sx={{ width: '100%' }}>
            {toast.message}
          </Alert>
        ) : null}
      </Snackbar>
      <Dialog open={Boolean(confirmReservation)} onClose={closeDeleteDialog} maxWidth="xs" fullWidth>
        <DialogTitle>{t('reservationList.deleteConfirmTitle')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {t('reservationList.deleteConfirmMessage')}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeDeleteDialog} disabled={isConfirmingDelete}>
            {t('reservationList.cancel')}
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            disabled={isConfirmingDelete}
          >
            {t('reservationList.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ReservationList;
