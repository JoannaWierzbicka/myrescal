import { useEffect, useMemo, useState } from 'react';
import {
  createProperty,
  deleteProperty,
  fetchProperties,
  updateProperty,
} from '../api/properties.js';
import {
  createRoom,
  deleteRoom,
  fetchRooms,
  updateRoom,
} from '../api/rooms.js';
import { notifyReservationSetupChanged } from '../utils/reservationSetupEvents.js';

export function useSettingsData(t) {
  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [propertiesError, setPropertiesError] = useState(null);
  const [roomsError, setRoomsError] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetchProperties({ signal: controller.signal })
      .then((data) => {
        setProperties(data);
        if (data.length > 0) {
          setSelectedPropertyId((current) => current ?? data[0].id);
        }
        setPropertiesError(null);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setPropertiesError(err.message || t('dashboard.errors.properties'));
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [t]);

  useEffect(() => {
    if (!selectedPropertyId) {
      setRooms([]);
      return undefined;
    }

    const controller = new AbortController();
    fetchRooms({ propertyId: selectedPropertyId, signal: controller.signal })
      .then((data) => {
        setRooms(data);
        setRoomsError(null);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setRoomsError(err.message || t('dashboard.errors.rooms'));
      });

    return () => controller.abort();
  }, [selectedPropertyId, t]);

  const selectedProperty = useMemo(
    () => properties.find((property) => property.id === selectedPropertyId) ?? null,
    [properties, selectedPropertyId],
  );

  const roomsHeading = useMemo(
    () =>
      selectedProperty
        ? t('settings.roomsTitle', { name: selectedProperty.name })
        : t('settings.roomsTitle', { name: t('settings.selectPropertyFallback') }),
    [selectedProperty, t],
  );

  const handleCreateProperty = async (payload) => {
    const result = await createProperty(payload);
    setProperties((prev) => [...prev, result]);
    setSelectedPropertyId(result.id);
    setPropertiesError(null);
    notifyReservationSetupChanged();
  };

  const handleUpdateProperty = async (id, payload) => {
    const updated = await updateProperty(id, payload);
    setProperties((prev) => prev.map((item) => (item.id === id ? updated : item)));
    setSelectedPropertyId(updated.id);
    setPropertiesError(null);
    notifyReservationSetupChanged();
    return updated;
  };

  const deletePropertyById = async (id) => {
    await deleteProperty(id);
    setProperties((prev) => {
      const next = prev.filter((item) => item.id !== id);
      if (selectedPropertyId === id) {
        setSelectedPropertyId(next[0]?.id ?? null);
        setRooms([]);
      }
      return next;
    });
    setPropertiesError(null);
    notifyReservationSetupChanged();
  };

  const handleCreateRoom = async (payload) => {
    const result = await createRoom(payload);
    if (result.property_id === selectedPropertyId) {
      setRooms((prev) => [...prev, result]);
    }
    setRoomsError(null);
    notifyReservationSetupChanged();
  };

  const handleUpdateRoom = async (id, payload) => {
    const updated = await updateRoom(id, payload);
    if (updated.property_id === selectedPropertyId) {
      setRooms((prev) => prev.map((room) => (room.id === id ? updated : room)));
    } else {
      setRooms((prev) => prev.filter((room) => room.id !== id));
    }
    setRoomsError(null);
    notifyReservationSetupChanged();
  };

  const deleteRoomById = async (id) => {
    await deleteRoom(id);
    setRooms((prev) => prev.filter((room) => room.id !== id));
    setRoomsError(null);
    notifyReservationSetupChanged();
  };

  const requestDeleteProperty = (property) => {
    setConfirmDialog({ type: 'property', entity: property });
  };

  const requestDeleteRoom = (room) => {
    setConfirmDialog({ type: 'room', entity: room });
  };

  const closeConfirmDialog = () => {
    if (isDeleting) return;
    setConfirmDialog(null);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDialog?.entity) return;
    setIsDeleting(true);
    try {
      if (confirmDialog.type === 'property') {
        await deletePropertyById(confirmDialog.entity.id);
      } else {
        await deleteRoomById(confirmDialog.entity.id);
      }
    } catch (error) {
      const fallback =
        confirmDialog.type === 'property'
          ? t('settings.deletePropertyConfirm')
          : t('settings.deleteRoomConfirm');
      if (confirmDialog.type === 'property') {
        setPropertiesError(error.message || fallback);
      } else {
        setRoomsError(error.message || fallback);
      }
    } finally {
      setIsDeleting(false);
      setConfirmDialog(null);
    }
  };

  return {
    properties,
    selectedPropertyId,
    setSelectedPropertyId,
    selectedProperty,
    rooms,
    roomsHeading,
    loading,
    propertiesError,
    roomsError,
    confirmDialog,
    isDeleting,
    handleCreateProperty,
    handleUpdateProperty,
    handleCreateRoom,
    handleUpdateRoom,
    requestDeleteProperty,
    requestDeleteRoom,
    closeConfirmDialog,
    handleConfirmDelete,
  };
}
