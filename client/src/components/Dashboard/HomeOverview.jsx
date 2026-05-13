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
import ReservationCalendar from '../ReservationCalendar.jsx';
import ReservationList from '../ReservationList.jsx';
import ReservationFormDialog from '../ReservationFormDialog.jsx';
import ReservationSetupPrompt from '../ReservationSetupPrompt.jsx';
import AppLoader from '../AppLoader.jsx';
import { useLocale } from '../../context/LocaleContext.jsx';
import { useDashboardReservations } from '../../hooks/useDashboardReservations.js';

export default function HomeOverview({ view = 'reservations' }) {
  const { t } = useLocale();
  const isCalendarView = view === 'calendar';
  const {
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
    createReservationMinDate,
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
  } = useDashboardReservations({ isCalendarView, t });

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
          gap: { xs: 2.5, md: 3 },
          px: { xs: 0, sm: 1, md: 2 },
          pt: { xs: 0.5, sm: 1.5, md: 2 },
          opacity: showLoaderOverlay ? 0.35 : 1,
          pointerEvents: showLoaderOverlay ? 'none' : 'auto',
          transition: 'opacity 0.3s ease',
        }}
      >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        alignItems={{ xs: 'stretch', md: 'center' }}
        spacing={{ xs: 1.75, md: 2 }}
        sx={{ flexWrap: { md: 'wrap' }, rowGap: { md: 2 } }}
      >
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" component="h1" sx={{ color: 'primary.dark', mb: 0.5 }}>
            {isCalendarView ? t('calendar.title') : t('reservationList.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isCalendarView ? t('calendar.subtitle') : t('reservationList.subtitle')}
          </Typography>
        </Box>

        <FormControl
          size="small"
          sx={{
            minWidth: { xs: '100%', sm: 260, md: 240 },
            maxWidth: { xs: '100%', md: 260 },
            mb: { xs: 0.5, md: 0 }
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
            onChange={(event) => handlePropertyChange(event.target.value)}
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

      {missingSetupStep && !loadingProperties ? (
        <ReservationSetupPrompt missingStep={missingSetupStep} />
      ) : (
        <>
          {isCalendarView ? (
          <Box>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              spacing={{ xs: 1.5, sm: 0 }}
              mb={2}
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
                  display: { xs: 'none', sm: 'inline-flex' },
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
                <Box
                  sx={{
                    width: '100%',
                    overflow: 'hidden',
                    mt: { xs: 1.5, sm: 1.5 },
                    p: { xs: 1.5, sm: 2 },
                    borderRadius: 1.5,
                    backgroundColor: '#FFFFFF',
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: '0 18px 42px rgba(16, 42, 51, 0.08)',
                  }}
                >
                  <ReservationCalendar
                    rooms={roomsForCalendar}
                    reservations={reservations}
                    onDayClick={handleDayClick}
                    onReservationSelect={openReservationDetail}
                    onRoomChange={handleRoomChange}
                    selectedRoomId={mobileActiveRoomId}
                  />
                </Box>
              </>
            )}
          </Box>
          ) : null}

          {!isCalendarView ? (
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
          ) : null}
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
            onPropertyChange={handlePropertyChange}
            loadingProperties={loadingProperties}
            loadingRooms={loadingRooms}
            minDate={dialogState.mode === 'create' ? createReservationMinDate : undefined}
            existingReservations={reservations}
            reservationId={dialogState.reservation?.id}
          />
        )}
      </Box>
    </Box>
  );
}
