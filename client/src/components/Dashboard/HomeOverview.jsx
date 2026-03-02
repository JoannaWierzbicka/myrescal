import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { format } from 'date-fns';
import ReservationCalendar from '../ReservationCalendar.jsx';
import ReservationList from '../ReservationList.jsx';
import ReservationFormDialog from '../ReservationFormDialog.jsx';
import AppLoader from '../AppLoader.jsx';
import { fetchProperties } from '../../api/properties.js';
import { fetchRooms } from '../../api/rooms.js';
import {
  loadReservations,
  createReservation,
  updateReservation,
  deleteReservation,
} from '../../api/reservations.js';
import { addDays, startOfToday, isBefore } from 'date-fns';
import { useLocale } from '../../context/LocaleContext.jsx';

const formatDateInput = (date) => format(date, 'yyyy-MM-dd');

export default function HomeOverview() {
  const { t } = useLocale();
  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [rooms, setRooms] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [roomFilterId, setRoomFilterId] = useState('all');

  const [loadingProperties, setLoadingProperties] = useState(true);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingReservations, setLoadingReservations] = useState(false);

  const [propertiesError, setPropertiesError] = useState(null);
  const [roomsError, setRoomsError] = useState(null);
  const [reservationsError, setReservationsError] = useState(null);

  const [dialogState, setDialogState] = useState({
    open: false,
    mode: 'create',
    reservation: null,
    initialValues: null,
  });
  const showLoaderOverlay = loadingProperties || loadingRooms || loadingReservations;

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
    setRoomFilterId('all');
  }, [selectedPropertyId]);

  useEffect(() => {
    if (!selectedPropertyId) {
      setRooms([]);
      setRoomsError(null);
      setReservations([]);
      setReservationsError(null);
      return undefined;
    }

    const controller = new AbortController();
    setLoadingRooms(true);
    fetchRooms({ propertyId: selectedPropertyId, signal: controller.signal })
      .then((data) => {
        setRooms(data);
        setRoomsError(null);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setRoomsError(t('dashboard.errors.rooms'));
      })
      .finally(() => setLoadingRooms(false));

    return () => controller.abort();
  }, [selectedPropertyId, t]);

  useEffect(() => {
    if (!selectedPropertyId) {
      setReservations([]);
      setReservationsError(null);
      return undefined;
    }

    const controller = new AbortController();
    setLoadingReservations(true);
    setReservations([]);
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

  const selectedProperty = useMemo(
    () => properties.find((property) => property.id === selectedPropertyId) ?? null,
    [properties, selectedPropertyId],
  );

  const roomsForCalendar = useMemo(() => {
    if (!selectedProperty) {
      return rooms.map((room) => ({ ...room, propertyName: '' }));
    }
    return rooms.map((room) => ({ ...room, propertyName: selectedProperty.name }));
  }, [rooms, selectedProperty]);

  const filteredReservations = useMemo(() => {
    if (roomFilterId === 'all') return reservations;
    return reservations.filter((reservation) => {
      const reservationRoomId = reservation.room_id || reservation.room?.id;
      return reservationRoomId === roomFilterId;
    });
  }, [reservations, roomFilterId]);

  const [mobileActiveRoomId, setMobileActiveRoomId] = useState('');

  useEffect(() => {
    const roomFromFilter = rooms.find((room) => room.property_id === selectedPropertyId)?.id;
    const fallback = roomFromFilter || rooms[0]?.id || '';
    setMobileActiveRoomId((prev) => (prev && rooms.some((room) => room.id === prev) ? prev : fallback));
  }, [rooms, selectedPropertyId]);

  useEffect(() => {
    if (roomFilterId === 'all') return;
    if (rooms.some((room) => room.id === roomFilterId)) {
      setMobileActiveRoomId(roomFilterId);
    }
  }, [roomFilterId, rooms]);

  useEffect(() => {
    if (roomFilterId === 'all') return;
    const exists = rooms.some((room) => room.id === roomFilterId);
    if (!exists) {
      setRoomFilterId('all');
    }
  }, [rooms, roomFilterId]);

  const closeDialog = () => {
    setDialogState({
      open: false,
      mode: 'create',
      reservation: null,
      initialValues: null,
    });
  };

  const openCreateDialog = (initialValues = {}) => {
    const propertyId = initialValues.property_id || selectedPropertyId;
    if (!propertyId) return;
    setSelectedPropertyId(propertyId);

    const today = startOfToday();
    const rawStart = initialValues.start_date ? new Date(initialValues.start_date) : today;
    const startDate = isBefore(rawStart, today) ? today : rawStart;
    const startDateStr = formatDateInput(startDate);
    const endDateStr =
      initialValues.end_date || formatDateInput(addDays(startDate, 1));

    const roomsForProperty = rooms.filter((room) => room.property_id === propertyId);
    let defaultRoomId = initialValues.room_id || '';

    if (!defaultRoomId && roomFilterId !== 'all') {
      const roomFromFilter = roomsForProperty.find((room) => room.id === roomFilterId);
      if (roomFromFilter) {
        defaultRoomId = roomFromFilter.id;
      }
    }

    if (!defaultRoomId) {
      defaultRoomId = roomsForProperty[0]?.id || '';
    }

    setDialogState({
      open: true,
      mode: 'create',
      reservation: null,
      initialValues: {
        property_id: propertyId,
        start_date: startDateStr,
        end_date: endDateStr,
        room_id: defaultRoomId,
        ...initialValues,
      },
    });
  };

  const openEditDialog = (reservation) => {
    if (!reservation) return;
    setSelectedPropertyId(reservation.property_id || reservation.property?.id || selectedPropertyId);
    setDialogState({
      open: true,
      mode: 'edit',
      reservation,
      initialValues: {
        ...reservation,
        property_id: reservation.property_id || reservation.property?.id || selectedPropertyId,
        room_id: reservation.room_id || reservation.room?.id || '',
      },
    });
  };

  const handleCreate = async (values) => {
    const payload = {
      ...values,
      property_id: values.property_id || selectedPropertyId,
    };
    const created = await createReservation(payload);
    setReservations((prev) => [...prev, created]);
  };

  const handleUpdate = async (values) => {
    if (!dialogState.reservation) return;
    const updated = await updateReservation(dialogState.reservation.id, values);
    setReservations((prev) =>
      prev.map((reservation) => (reservation.id === updated.id ? updated : reservation)),
    );
  };

  const handleDelete = async (id) => {
    await deleteReservation(id);
    setReservations((prev) => prev.filter((reservation) => reservation.id !== id));
  };

  const handleDayClick = (date, room) => {
    const today = startOfToday();
    if (isBefore(date, today)) return;

    const startDate = date;
    const endDate = addDays(date, 1);
    const propertyIdForRoom = room?.property_id || selectedPropertyId;
    if (propertyIdForRoom) {
      setSelectedPropertyId(propertyIdForRoom);
    }
    if (room?.id) {
      setRoomFilterId(room.id);
    }
    openCreateDialog({
      property_id: propertyIdForRoom,
      start_date: formatDateInput(startDate),
      end_date: formatDateInput(endDate),
      room_id: room?.id || rooms.find((r) => r.property_id === propertyIdForRoom)?.id || '',
    });
  };

  const dialogSubmit = async (values) => {
    if (dialogState.mode === 'create') {
      await handleCreate(values);
    } else {
      await handleUpdate(values);
    }
    closeDialog();
  };

  return (
    <Box sx={{ position: 'relative' }}>
      {showLoaderOverlay ? (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            zIndex: 20,
            background: 'rgba(245, 237, 220, 0.88)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AppLoader label={t('loader.preparing')} />
        </Box>
      ) : null}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          px: { xs: 1, sm: 1.5, md: 2 },
          pt: { xs: 1, sm: 1.5, md: 2 },
          opacity: showLoaderOverlay ? 0.35 : 1,
          pointerEvents: showLoaderOverlay ? 'none' : 'auto',
          transition: 'opacity 0.3s ease',
        }}
      >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        alignItems={{ xs: 'stretch', md: 'center' }}
        spacing={{ xs: 2.5, md: 2 }}
        sx={{ flexWrap: { md: 'wrap' }, rowGap: { md: 2 } }}
      >
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" component="h1">
            {t('dashboard.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('dashboard.subtitle')}
          </Typography>
        </Box>

        <FormControl
          size="small"
          sx={{
            minWidth: { xs: '100%', sm: 260, md: 240 },
            maxWidth: { xs: '100%', md: 260 },
            mb: { xs: 1.5, md: 0 }
          }}
          disabled={loadingProperties || properties.length === 0}
        >
          <InputLabel id="dashboard-property-select-label">
            {t('reservationForm.fields.property')}
          </InputLabel>
          <Select
            labelId="dashboard-property-select-label"
            value={selectedPropertyId}
            label={t('reservationForm.fields.property')}
            onChange={(event) => {
              const nextPropertyId = event.target.value;
              setSelectedPropertyId(nextPropertyId);
              setRoomFilterId('all');
            }}
          >
            {properties.map((property) => (
              <MenuItem key={property.id} value={property.id}>
                {property.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

      </Stack>

      {propertiesError && <Alert severity="error">{propertiesError}</Alert>}

      {!selectedPropertyId && !loadingProperties ? (
        <Alert severity="info">
          {t('dashboard.infoNoProperty')}
        </Alert>
      ) : (
        <>
          <Box>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              spacing={{ xs: 2, sm: 0 }}
              mb={2.5}
            >
              <Typography variant="h6">
                {`${t('dashboard.availability')} ${
                  selectedProperty ? `— ${selectedProperty.name}` : ''
                }`}
              </Typography>
              <Button
                variant="contained"
                disabled={rooms.length === 0}
                color="info"
                onClick={() =>
                  openCreateDialog({
                    property_id: selectedPropertyId,
                    room_id: roomFilterId !== 'all' ? roomFilterId : undefined,
                  })
                }
                sx={{
                  width: { xs: 'auto', sm: 'auto' },
                  px: { xs: 3.2, sm: 4 },
                  py: { xs: 0.95, sm: 1.1 },
                  letterSpacing: { xs: '0.16em', sm: '0.18em' },
                  alignSelf: { xs: 'center', sm: 'flex-start' },
                  mb: { xs: 3, sm: 0 },
                }}
              >
                {t('dashboard.addReservation')}
              </Button>
            </Stack>

            {loadingRooms || loadingReservations ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                {(roomsError || reservationsError) && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {roomsError || reservationsError}
                  </Alert>
                )}
                <Box sx={{ width: '100%', overflow: 'hidden', mt: { xs: 2, sm: 1.5 } }}>
                  <ReservationCalendar
                    rooms={roomsForCalendar}
                    reservations={reservations}
                    onDayClick={handleDayClick}
                    onReservationSelect={openEditDialog}
                    onRoomChange={(roomId) => {
                      const targetRoom = rooms.find((room) => room.id === roomId);
                      if (targetRoom?.property_id) {
                        setSelectedPropertyId(targetRoom.property_id);
                      }
                      setMobileActiveRoomId(roomId);
                      if (roomId) {
                        setRoomFilterId(roomId);
                      }
                    }}
                    selectedRoomId={mobileActiveRoomId}
                  />
                </Box>
              </>
            )}
          </Box>

          <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
            {t('dashboard.reservations')}
          </Typography>

          <ReservationList
            reservations={filteredReservations}
            onDeleteReservation={handleDelete}
            onEditReservation={openEditDialog}
            onAddReservation={() =>
              openCreateDialog({
                property_id: selectedPropertyId,
                room_id: roomFilterId !== 'all' ? roomFilterId : undefined,
              })
            }
            showHeader={false}
            canAdd={rooms.length > 0}
            rooms={rooms}
            roomFilterId={roomFilterId}
            onRoomFilterChange={setRoomFilterId}
          />
        </>
      )}

        {dialogState.open && (
          <ReservationFormDialog
            title={
              dialogState.mode === 'create'
                ? t('reservationForm.addTitle')
                : t('reservationForm.editTitle')
            }
            initialValues={dialogState.initialValues}
            submitLabel={
              dialogState.mode === 'create'
                ? t('reservationForm.submitCreate')
                : t('reservationForm.submitSave')
            }
            submittingLabel={
              dialogState.mode === 'create'
                ? t('reservationForm.submitCreating')
                : t('reservationForm.submitSaving')
            }
            onSubmit={dialogSubmit}
            onCancel={closeDialog}
            properties={properties}
            rooms={rooms}
            onPropertyChange={(propertyId) => {
              setSelectedPropertyId(propertyId);
              setRoomFilterId('all');
            }}
            loadingProperties={loadingProperties}
            loadingRooms={loadingRooms}
            minDate={dialogState.mode === 'create' ? formatDateInput(startOfToday()) : undefined}
            existingReservations={reservations}
            reservationId={dialogState.reservation?.id}
          />
        )}
      </Box>
    </Box>
  );
}
