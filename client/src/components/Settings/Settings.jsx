import { useState } from 'react';
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
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { Add, Delete, Edit } from '@mui/icons-material';
import AccountSettingsSection from './AccountSettingsSection.jsx';
import DeleteAccountSection from './DeleteAccountSection.jsx';
import PropertyFormDialog from './PropertyFormDialog.jsx';
import PropertyConfirmationSettingsSection from './PropertyConfirmationSettingsSection.jsx';
import RoomFormDialog from './RoomFormDialog.jsx';
import { useLocale } from '../../context/LocaleContext.jsx';
import { useSettingsData } from '../../hooks/useSettingsData.js';

export default function Settings() {
  const [propertyDialogOpen, setPropertyDialogOpen] = useState(false);
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [editingRoom, setEditingRoom] = useState(null);
  const [activeTab, setActiveTab] = useState('account');
  const { t } = useLocale();
  const {
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
  } = useSettingsData(t);

  return (
    <Box>
      {(propertiesError || roomsError) && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {propertiesError || roomsError}
        </Alert>
      )}

      <Stack spacing={{ xs: 2, lg: 3 }}>
        <Card sx={{ borderRadius: 1.5 }}>
          <Tabs
            value={activeTab}
            onChange={(_event, value) => setActiveTab(value)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ px: { xs: 1, sm: 2 } }}
          >
            <Tab value="account" label={t('settings.tabs.account')} />
            <Tab value="properties" label={t('settings.tabs.properties')} />
            <Tab value="confirmations" label={t('settings.tabs.confirmations')} />
          </Tabs>
        </Card>

        {activeTab === 'account' && (
          <Stack spacing={{ xs: 2, lg: 3 }}>
            <AccountSettingsSection />
            <DeleteAccountSection />
          </Stack>
        )}

        {activeTab === 'properties' && (
          <Stack
            direction={{ xs: 'column', lg: 'row' }}
            spacing={{ xs: 2, lg: 3 }}
            alignItems="stretch"
          >
            <Card
              sx={{
                flex: { xs: '1 1 100%', lg: '1 1 40%' },
                minWidth: { xs: '100%', lg: 0 },
                borderRadius: 1.5,
                px: { xs: 2, sm: 3, lg: 4 },
                py: { xs: 2.4, sm: 3, lg: 3.5 },
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
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  spacing={1.25}
                  sx={{ width: '100%' }}
                >
                  <Typography variant="h6" sx={{ minWidth: 0 }}>
                    {t('settings.propertiesTitle')}
                  </Typography>
                  <Button
                    startIcon={<Add />}
                    variant="contained"
                    size="small"
                    onClick={() => {
                      setEditingProperty(null);
                      setPropertyDialogOpen(true);
                    }}
                    sx={{
                      minHeight: { xs: 36, sm: 44 },
                      px: { xs: 1.25, sm: 3 },
                      minWidth: { xs: 'auto', sm: 170 },
                      whiteSpace: 'nowrap',
                      fontSize: { xs: '0.78rem', sm: '0.875rem' },
                      '& .MuiButton-startIcon': {
                        mr: { xs: 0.5, sm: 1 },
                      },
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
                            borderRadius: '8px',
                            px: { xs: 2, sm: 2.4 },
                            py: { xs: 1.4, sm: 1.6 },
                            '&.Mui-selected': {
                              backgroundColor: 'success.light',
                              color: 'primary.main',
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
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: { xs: 0.5, sm: 1 } }}
                      >
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
                borderRadius: 1.5,
                px: { xs: 2, sm: 3, lg: 4 },
                py: { xs: 2.4, sm: 3, lg: 3.5 },
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
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  spacing={1.25}
                  sx={{ width: '100%' }}
                >
                  <Typography variant="h6" sx={{ minWidth: 0, overflowWrap: 'anywhere' }}>
                    {roomsHeading}
                  </Typography>
                  <Button
                    startIcon={<Add />}
                    variant="contained"
                    size="small"
                    onClick={() => {
                      setEditingRoom(null);
                      setRoomDialogOpen(true);
                    }}
                    disabled={!selectedProperty || properties.length === 0}
                    sx={{
                      minHeight: { xs: 36, sm: 44 },
                      px: { xs: 1.25, sm: 3 },
                      minWidth: { xs: 'auto', sm: 170 },
                      whiteSpace: 'nowrap',
                      fontSize: { xs: '0.78rem', sm: '0.875rem' },
                      '& .MuiButton-startIcon': {
                        mr: { xs: 0.5, sm: 1 },
                      },
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
                            borderRadius: '8px',
                            '&:hover': {
                              backgroundColor: 'success.light',
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
                            sx={{ mx: { xs: 2.4, sm: 2.8 }, borderColor: 'divider' }}
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
        )}

        {activeTab === 'confirmations' && (
          <Stack spacing={{ xs: 2, lg: 3 }}>
            <Card
              sx={{
                borderRadius: 1.5,
                px: { xs: 2, sm: 3, lg: 4 },
                py: { xs: 2.4, sm: 3, lg: 3.5 },
              }}
            >
              <CardContent
                sx={{
                  p: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                <Box>
                  <Typography variant="h6">{t('settings.confirmationsIntroTitle')}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {t('settings.confirmationsIntroBody')}
                  </Typography>
                </Box>
                <FormControl fullWidth disabled={loading || properties.length === 0}>
                  <InputLabel id="confirmation-property-label">
                    {t('propertyConfirmationSettings.property')}
                  </InputLabel>
                  <Select
                    labelId="confirmation-property-label"
                    value={selectedPropertyId ?? ''}
                    label={t('propertyConfirmationSettings.property')}
                    onChange={(event) => setSelectedPropertyId(event.target.value)}
                  >
                    {properties.map((property) => (
                      <MenuItem key={property.id} value={property.id}>
                        {property.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </CardContent>
            </Card>
            <PropertyConfirmationSettingsSection
              property={selectedProperty}
              onSubmit={handleUpdateProperty}
            />
          </Stack>
        )}
      </Stack>

      <PropertyFormDialog
        open={propertyDialogOpen}
        onClose={() => setPropertyDialogOpen(false)}
        onSubmit={(payload) =>
          editingProperty
            ? handleUpdateProperty(editingProperty.id, { ...editingProperty, ...payload })
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
          <Alert severity="warning" sx={{ mt: 2 }}>
            {confirmDialog?.type === 'property'
              ? t('settings.deletePropertyWarning')
              : t('settings.deleteRoomWarning')}
          </Alert>
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
