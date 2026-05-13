import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDays, format, isBefore, startOfToday } from 'date-fns';
import { fetchProperties } from '../api/properties.js';
import { fetchRooms } from '../api/rooms.js';
import {
  createReservation,
  deleteReservation,
  loadReservations,
  updateReservation,
} from '../api/reservations.js';

const formatDateInput = (date) => format(date, 'yyyy-MM-dd');

export function useDashboardReservations({ isCalendarView, t }) {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [rooms, setRooms] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [roomFilterId, setRoomFilterId] = useState('all');
  const [mobileActiveRoomId, setMobileActiveRoomId] = useState('');

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

  const showLoaderOverlay = loadingProperties || loadingRooms || loadingReservations;
  const missingSetupStep = !selectedPropertyId
    ? 'properties'
    : (!loadingRooms && rooms.length === 0 ? 'rooms' : null);

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

  const openReservationDetail = (reservation) => {
    if (!reservation?.id) return;
    navigate(`/dashboard/detail/${reservation.id}`, {
      state: { from: isCalendarView ? '/dashboard/calendar' : '/dashboard' },
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

  const handleRoomChange = (roomId) => {
    const targetRoom = rooms.find((room) => room.id === roomId);
    if (targetRoom?.property_id) {
      setSelectedPropertyId(targetRoom.property_id);
    }
    setMobileActiveRoomId(roomId);
    if (roomId) {
      setRoomFilterId(roomId);
    }
  };

  const handlePropertyChange = (propertyId) => {
    setSelectedPropertyId(propertyId);
    setRoomFilterId('all');
  };

  const dialogSubmit = async (values) => {
    if (dialogState.mode === 'create') {
      await handleCreate(values);
    } else {
      await handleUpdate(values);
    }
    closeDialog();
  };

  return {
    properties,
    selectedPropertyId,
    selectedProperty,
    rooms,
    reservations,
    roomsForCalendar,
    filteredReservations,
    roomFilterId,
    mobileActiveRoomId,
    loadingProperties,
    loadingRooms,
    loadingReservations,
    propertiesError,
    roomsError,
    reservationsError,
    dialogState,
    showLoaderOverlay,
    missingSetupStep,
    createReservationMinDate: formatDateInput(startOfToday()),
    setRoomFilterId,
    handlePropertyChange,
    handleRoomChange,
    openCreateDialog,
    openEditDialog,
    openReservationDetail,
    handleDelete,
    handleDayClick,
    dialogSubmit,
    closeDialog,
  };
}
