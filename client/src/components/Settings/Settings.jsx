import { useEffect, useMemo, useState } from 'react';
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
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import { Add, Delete, Edit } from '@mui/icons-material';
import {
  fetchProperties,
  createProperty,
  updateProperty,
  deleteProperty,
} from '../../api/properties.js';
import {
  fetchRooms,
  createRoom,
  updateRoom,
  deleteRoom,
} from '../../api/rooms.js';
import PropertyFormDialog from './PropertyFormDialog.jsx';
import RoomFormDialog from './RoomFormDialog.jsx';
import { useLocale } from '../../context/LocaleContext.jsx';

export default function Settings() {
  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [propertiesError, setPropertiesError] = useState(null);
  const [roomsError, setRoomsError] = useState(null);

  const [propertyDialogOpen, setPropertyDialogOpen] = useState(false);
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [editingRoom, setEditingRoom] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { t } = useLocale();

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

  const handleCreateProperty = async (payload) => {
    const result = await createProperty(payload);
    setProperties((prev) => [...prev, result]);
    setSelectedPropertyId(result.id);
    setPropertiesError(null);
  };

  const handleUpdateProperty = async (id, payload) => {
    const updated = await updateProperty(id, payload);
    setProperties((prev) => prev.map((item) => (item.id === id ? updated : item)));
    setSelectedPropertyId(updated.id);
    setPropertiesError(null);
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
  };

  const handleCreateRoom = async (payload) => {
    const result = await createRoom(payload);
    if (result.property_id === selectedPropertyId) {
      setRooms((prev) => [...prev, result]);
    }
    setRoomsError(null);
  };

  const handleUpdateRoom = async (id, payload) => {
    const updated = await updateRoom(id, payload);
    if (updated.property_id === selectedPropertyId) {
      setRooms((prev) => prev.map((room) => (room.id === id ? updated : room)));
    } else {
      setRooms((prev) => prev.filter((room) => room.id !== id));
    }
    setRoomsError(null);
  };

  const deleteRoomById = async (id) => {
    await deleteRoom(id);
    setRooms((prev) => prev.filter((room) => room.id !== id));
    setRoomsError(null);
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

  const roomsHeading = useMemo(
    () =>
      selectedProperty
        ? t('settings.roomsTitle', { name: selectedProperty.name })
        : t('settings.roomsTitle', { name: t('settings.selectPropertyFallback') }),
    [selectedProperty, t],
  );

  return (
    <Box>
      {(propertiesError || roomsError) && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {propertiesError || roomsError}
        </Alert>
      )}

      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        spacing={{ xs: 3, lg: 4 }}
        alignItems="stretch"
      >
        <Card
          sx={{
            flex: { xs: '1 1 100%', lg: '1 1 40%' },
            minWidth: { xs: '100%', lg: 0 },
            borderRadius: '12px',
            px: { xs: 3, sm: 4, lg: 4.5 },
            py: { xs: 3.2, sm: 3.8, lg: 4.2 },
          }}
        >
          <CardContent
            sx={{
              p: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: { xs: 2, sm: 2.5 },
            }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              spacing={{ xs: 1.5, sm: 2 }}
              sx={{ width: '100%' }}
            >
              <Typography variant="h6">{t('settings.propertiesTitle')}</Typography>
              <Button
                startIcon={<Add />}
                variant="contained"
                onClick={() => {
                  setEditingProperty(null);
                  setPropertyDialogOpen(true);
                }}
                sx={{
                  px: { xs: 2.5, sm: 3 },
                  minWidth: { xs: 0, sm: 170 },
                  alignSelf: { xs: 'flex-end', sm: 'center' },
                }}
              >
                {t('settings.addProperty')}
              </Button>
            </Stack>

            {loading ? (
              <Typography variant="body2">{t('settings.loading')}</Typography>
            ) : propertiesError ? (
              <Alert severity="error">{propertiesError}</Alert>
            ) : (
              <List
                disablePadding
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: { xs: 1.2, sm: 1.4 },
                }}
              >
                {properties.map((property) => (
                  <ListItem
                    key={property.id}
                    disablePadding
                    secondaryAction={
                      <Stack direction="row" spacing={1}>
                        <IconButton
                          edge="end"
                          aria-label={t('reservationCard.actions.edit')}
                          onClick={() => {
                            setEditingProperty(property);
                            setPropertyDialogOpen(true);
                          }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          edge="end"
                          aria-label={t('reservationCard.actions.delete')}
                          onClick={() => requestDeleteProperty(property)}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Stack>
                    }
                  >
                      <ListItemButton
                        selected={property.id === selectedPropertyId}
                        onClick={() => setSelectedPropertyId(property.id)}
                        sx={{
                          borderRadius: '12px',
                          px: { xs: 2.4, sm: 2.8 },
                          py: { xs: 1.4, sm: 1.6 },
                          '&.Mui-selected': {
                            backgroundColor: 'rgba(51, 180, 172, 0.14)',
                          },
                        }}
                      >
                      <ListItemText
                        primary={property.name}
                        secondary={property.description}
                        primaryTypographyProps={{ fontWeight: 500 }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}

                {properties.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: { xs: 0.5, sm: 1 } }}>
                    {t('settings.emptyProperties')}
                  </Typography>
                )}
              </List>
            )}
          </CardContent>
        </Card>

        <Card
          sx={{
            flex: { xs: '1 1 100%', lg: '1 1 60%' },
            minWidth: { xs: '100%', lg: 0 },
            borderRadius: '12px',
            px: { xs: 3, sm: 4, lg: 4.5 },
            py: { xs: 3.2, sm: 3.8, lg: 4.2 },
          }}
        >
          <CardContent
            sx={{
              p: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: { xs: 2, sm: 2.5 },
            }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              spacing={{ xs: 1.5, sm: 2 }}
              sx={{ width: '100%' }}
            >
              <Typography variant="h6">{roomsHeading}</Typography>
              <Button
                startIcon={<Add />}
                variant="contained"
                onClick={() => {
                  setEditingRoom(null);
                  setRoomDialogOpen(true);
                }}
                disabled={!selectedProperty || properties.length === 0}
                sx={{
                  px: { xs: 2.5, sm: 3 },
                  minWidth: { xs: 0, sm: 170 },
                  alignSelf: { xs: 'flex-end', sm: 'center' },
                }}
              >
                {t('roomForm.addTitle')}
              </Button>
            </Stack>

            {!selectedProperty ? (
              <Typography variant="body2" color="text.secondary">
                {t('settings.selectPropertyHint')}
              </Typography>
            ) : roomsError ? (
              <Alert severity="error">{roomsError}</Alert>
            ) : rooms.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                {t('settings.emptyRooms')}
              </Typography>
            ) : (
              <List
                disablePadding
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: { xs: 1.2, sm: 1.4 },
                }}
              >
                {rooms.map((room, index) => (
                  <Box key={room.id}>
                    <ListItem
                      disablePadding
                      sx={{
                        px: { xs: 2.4, sm: 2.8 },
                        py: { xs: 1.2, sm: 1.4 },
                        borderRadius: '12px',
                        '&:hover': {
                          backgroundColor: 'rgba(51, 180, 172, 0.08)',
                        },
                      }}
                      secondaryAction={
                        <Stack direction="row" spacing={1}>
                        <IconButton
                          edge="end"
                          aria-label={t('reservationCard.actions.edit')}
                          onClick={() => {
                            setEditingRoom(room);
                            setRoomDialogOpen(true);
                          }}
                        >
                            <Edit fontSize="small" />
                          </IconButton>
                        <IconButton
                          edge="end"
                          aria-label={t('reservationCard.actions.delete')}
                          onClick={() => requestDeleteRoom(room)}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Stack>
                      }
                    >
                      <ListItemText
                        primary={room.name}
                        primaryTypographyProps={{ fontWeight: 500 }}
                      />
                    </ListItem>
                    {index < rooms.length - 1 && (
                      <Divider
                        component="li"
                        sx={{ mx: { xs: 2.4, sm: 2.8 }, borderColor: 'rgba(195, 111, 43, 0.2)' }}
                      />
                    )}
                  </Box>
                ))}
              </List>
            )}
          </CardContent>
          <CardActions sx={{ px: { xs: 0, sm: 0 }, pt: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ px: { xs: 1, sm: 0 } }}>
              {t('settings.roomsInfo')}
            </Typography>
          </CardActions>
        </Card>
      </Stack>

      <PropertyFormDialog
        open={propertyDialogOpen}
        onClose={() => setPropertyDialogOpen(false)}
        onSubmit={(payload) =>
          editingProperty
            ? handleUpdateProperty(editingProperty.id, payload)
            : handleCreateProperty(payload)
        }
        initialValues={editingProperty}
      />

      <RoomFormDialog
        open={roomDialogOpen}
        onClose={() => setRoomDialogOpen(false)}
        onSubmit={(payload) =>
          editingRoom ? handleUpdateRoom(editingRoom.id, payload) : handleCreateRoom(payload)
        }
        initialValues={editingRoom}
        properties={properties}
      />

      <Dialog open={Boolean(confirmDialog)} onClose={closeConfirmDialog} maxWidth="xs" fullWidth>
        <DialogTitle>
          {confirmDialog?.type === 'property'
            ? t('settings.deletePropertyTitle')
            : t('settings.deleteRoomTitle')}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {confirmDialog?.type === 'property'
              ? t('settings.deletePropertyConfirm')
              : t('settings.deleteRoomConfirm')}
          </Typography>
          {confirmDialog?.entity?.name && (
            <Typography variant="subtitle2" sx={{ mt: 1.5 }}>
              {confirmDialog.entity.name}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeConfirmDialog} disabled={isDeleting}>
            {t('reservationList.cancel')}
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            disabled={isDeleting}
          >
            {isDeleting ? t('reservationDetail.deleting') : t('reservationList.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
