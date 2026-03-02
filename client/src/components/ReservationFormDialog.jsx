import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { FaSave, FaTimes } from 'react-icons/fa';
import { useLocale } from '../context/LocaleContext.jsx';
import {
  DEFAULT_RESERVATION_STATUS,
  RESERVATION_STATUS_OPTIONS,
} from '../utils/reservationStatus.js';

const DEFAULT_FORM_VALUES = {
  name: '',
  lastname: '',
  phone: '',
  mail: '',
  start_date: '',
  end_date: '',
  property_id: '',
  room_id: '',
  price: '',
  adults: '',
  children: '',
  status: DEFAULT_RESERVATION_STATUS,
};

const ADULT_OPTIONS = Array.from({ length: 6 }, (_, index) => String(index + 1));
const CHILDREN_OPTIONS = Array.from({ length: 7 }, (_, index) => String(index));

const toFormValues = (values = {}) => ({
  ...DEFAULT_FORM_VALUES,
  ...Object.entries(values).reduce((acc, [key, value]) => {
    if (value === null || value === undefined) return acc;
    if (['adults', 'children', 'price'].includes(key)) {
      acc[key] = String(value);
    } else if (['room_id', 'property_id'].includes(key)) {
      acc[key] = String(value);
    } else {
      acc[key] = value;
    }
    return acc;
  }, {}),
});

const toPayload = (values) => {
  const normalizeString = (value) => {
    if (value === undefined || value === null) return null;
    const trimmed = String(value).trim();
    return trimmed.length === 0 ? null : trimmed;
  };

  const normalizeNumber = (value) => {
    if (value === undefined || value === null || value === '') return null;
    return Number(value);
  };

  return {
    name: values.name.trim(),
    lastname: values.lastname.trim(),
    phone: normalizeString(values.phone),
    mail: normalizeString(values.mail),
    start_date: values.start_date,
    end_date: values.end_date,
    property_id: values.property_id || null,
    room_id: values.room_id || null,
    price: normalizeNumber(values.price),
    adults: normalizeNumber(values.adults),
    children: normalizeNumber(values.children),
    status: values.status,
  };
};

const validateForm = (values, t) => {
  if (!values.name.trim()) return t('reservationForm.errors.firstName');
  if (!values.lastname.trim()) return t('reservationForm.errors.lastName');
  if (!values.start_date) return t('reservationForm.errors.startDate');
  if (!values.end_date) return t('reservationForm.errors.endDate');
  if (!values.property_id) return t('reservationForm.errors.property');
  if (!values.room_id) return t('reservationForm.errors.room');
  if (!values.status) return t('reservationForm.errors.status');
  if (values.start_date && values.end_date) {
    const start = new Date(values.start_date);
    const end = new Date(values.end_date);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end <= start) {
      return t('reservationForm.errors.dateOrder');
    }
  }
  return null;
};

function ReservationFormDialog({
  title,
  initialValues,
  submitLabel,
  submittingLabel,
  onSubmit,
  onCancel,
  properties,
  rooms,
  onPropertyChange,
  loadingProperties = false,
  loadingRooms = false,
  dataError,
  minDate,
  existingReservations = [],
  reservationId,
}) {
  const { t, language } = useLocale();
  const [formValues, setFormValues] = useState(() => toFormValues(initialValues));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);

  useEffect(() => () => {
    isMountedRef.current = false;
  }, []);

  useEffect(() => {
    setFormValues(toFormValues(initialValues));
  }, [initialValues]);

  useEffect(() => {
    if (!rooms || rooms.length === 0) return;
    setFormValues((prev) => {
      if (prev.room_id && rooms.some((room) => room.id === prev.room_id)) {
        return prev;
      }
      return {
        ...prev,
        room_id: rooms[0].id,
      };
    });
  }, [rooms]);

  const dateConflict = useMemo(() => {
    if (!Array.isArray(existingReservations) || existingReservations.length === 0) return false;
    const { room_id: selectedRoomId, start_date: startDateValue, end_date: endDateValue } = formValues;
    if (!selectedRoomId || !startDateValue || !endDateValue) return false;

    const start = new Date(startDateValue);
    const end = new Date(endDateValue);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return false;
    }

    return existingReservations.some((reservation) => {
      const reservationIdMatch = reservation?.id;
      if (reservationId && reservationIdMatch === reservationId) {
        return false;
      }

      const reservationRoomId = reservation?.room_id || reservation?.room?.id;
      if (!reservationRoomId || reservationRoomId !== selectedRoomId) {
        return false;
      }

      const reservationStart = new Date(reservation.start_date);
      const reservationEnd = new Date(reservation.end_date);

      if (Number.isNaN(reservationStart.getTime()) || Number.isNaN(reservationEnd.getTime())) {
        return false;
      }

      return reservationStart < end && reservationEnd > start;
    });
  }, [existingReservations, formValues, reservationId]);

  const disableSubmit = useMemo(() => {
    return (
      !formValues.name.trim() ||
      !formValues.lastname.trim() ||
      !formValues.start_date ||
      !formValues.end_date ||
      !formValues.property_id ||
      !formValues.room_id ||
      !formValues.status ||
      dateConflict
    );
  }, [formValues, dateConflict]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validateForm(formValues, t);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (dateConflict) {
      setError(t('reservationForm.errors.conflict'));
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(toPayload(formValues));
    } catch (submissionError) {
      if (submissionError?.status === 409) {
        setError(t('reservationForm.errors.conflict'));
      } else {
        setError(submissionError?.message || t('reservationForm.errors.generic'));
      }
    } finally {
      if (isMountedRef.current) {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <Dialog open onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        {dataError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {dataError}
          </Alert>
        )}

        {(properties?.length === 0 && !loadingProperties) && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {t('reservationForm.info.addProperty')}
          </Alert>
        )}

        {dateConflict && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {t('reservationForm.errors.conflict')}
          </Alert>
        )}

        {error && (
          <Typography color="error" variant="body2" mb={2}>
            {error}
          </Typography>
        )}

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}
        >
          <Box
            sx={{
              borderRadius: '12px',
              border: '1px solid rgba(195, 111, 43, 0.35)',
              backgroundColor: 'rgba(251, 245, 234, 0.8)',
              px: { xs: 2.5, sm: 3.5 },
              py: { xs: 2.5, sm: 3 },
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.35)',
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              {language === 'pl' ? 'Dane gościa' : 'Guest details'}
            </Typography>
            <Stack spacing={2.5} direction={{ xs: 'column', sm: 'row' }}>
              <TextField
                label={t('reservationForm.fields.firstName')}
                name="name"
                value={formValues.name}
                onChange={handleChange}
                required
                fullWidth
              />
              <TextField
                label={t('reservationForm.fields.lastName')}
                name="lastname"
                value={formValues.lastname}
                onChange={handleChange}
                required
                fullWidth
              />
            </Stack>
            <Stack spacing={2.5} direction={{ xs: 'column', sm: 'row' }} sx={{ mt: { xs: 2, sm: 2.5 } }}>
              <TextField
                label={t('reservationForm.fields.phone')}
                name="phone"
                value={formValues.phone}
                onChange={handleChange}
                fullWidth
              />
              <TextField
                label={t('reservationForm.fields.email')}
                name="mail"
                type="email"
                value={formValues.mail}
                onChange={handleChange}
                fullWidth
              />
            </Stack>
          </Box>

          <Box
            sx={{
              borderRadius: '12px',
              border: '1px solid rgba(195, 111, 43, 0.35)',
              backgroundColor: 'rgba(251, 245, 234, 0.92)',
              px: { xs: 2.5, sm: 3.5 },
              py: { xs: 2.5, sm: 3 },
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.35)',
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              {language === 'pl' ? 'Szczegóły pobytu' : 'Stay details'}
            </Typography>
            <Stack spacing={2.5} direction={{ xs: 'column', sm: 'row' }}>
              <TextField
                label={t('reservationForm.fields.startDate')}
                name="start_date"
                type="date"
                value={formValues.start_date}
                onChange={handleChange}
                required
                fullWidth
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: minDate }}
                error={dateConflict}
                helperText={dateConflict ? t('reservationForm.errors.conflict') : undefined}
              />
              <TextField
                label={t('reservationForm.fields.endDate')}
                name="end_date"
                type="date"
                value={formValues.end_date}
                onChange={handleChange}
                required
                fullWidth
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: formValues.start_date || minDate }}
                error={dateConflict}
                helperText={dateConflict ? t('reservationForm.errors.conflict') : undefined}
              />
            </Stack>

            <Stack spacing={2.5} direction={{ xs: 'column', sm: 'row' }} sx={{ mt: { xs: 2, sm: 2.5 } }}>
              <FormControl required fullWidth disabled={loadingProperties || (properties?.length ?? 0) === 0}>
                <InputLabel id="property-label">{t('reservationForm.fields.property')}</InputLabel>
                <Select
                  labelId="property-label"
                  name="property_id"
                  value={formValues.property_id}
                  label={t('reservationForm.fields.property')}
                  onChange={(event) => {
                    handleChange(event);
                    onPropertyChange?.(event.target.value);
                    setFormValues((prev) => ({
                      ...prev,
                      room_id: '',
                    }));
                  }}
                >
                  {properties?.map((property) => (
                    <MenuItem key={property.id} value={property.id}>
                      {property.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl required fullWidth>
                <InputLabel id="room-label">{t('reservationForm.fields.room')}</InputLabel>
                <Select
                  labelId="room-label"
                  name="room_id"
                  value={formValues.room_id}
                  onChange={handleChange}
                  label={t('reservationForm.fields.room')}
                  disabled={!formValues.property_id || loadingRooms || !rooms?.length}
                >
                  {rooms?.map((room) => (
                    <MenuItem key={room.id} value={room.id}>
                      {room.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

          <TextField
            sx={{ mt: { xs: 2, sm: 2.5 } }}
            label={t('reservationForm.fields.price')}
            name="price"
            type="number"
            value={formValues.price}
            onChange={handleChange}
            fullWidth
            inputProps={{ min: 0 }}
          />

          <FormControl required fullWidth sx={{ mt: { xs: 2, sm: 2.5 } }}>
            <InputLabel id="reservation-status-label">{t('reservationForm.fields.status')}</InputLabel>
            <Select
              labelId="reservation-status-label"
              name="status"
              value={formValues.status}
              label={t('reservationForm.fields.status')}
              onChange={handleChange}
            >
              {RESERVATION_STATUS_OPTIONS.map((option) => (
                <MenuItem
                  key={option.value}
                  value={option.value}
                >
                  {t(option.labelKey)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

          <Box
            sx={{
              borderRadius: '12px',
              border: '1px solid rgba(195, 111, 43, 0.35)',
              backgroundColor: 'rgba(251, 245, 234, 0.8)',
              px: { xs: 2.5, sm: 3.5 },
              py: { xs: 2.5, sm: 3 },
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.35)',
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              {language === 'pl' ? 'Goście' : 'Guests'}
            </Typography>
            <Stack spacing={2.5} direction={{ xs: 'column', sm: 'row' }}>
              <FormControl fullWidth>
                <InputLabel id="adults-label" shrink>{t('common.adults')}</InputLabel>
                <Select
                  labelId="adults-label"
                  name="adults"
                  value={formValues.adults}
                  onChange={handleChange}
                  label={t('common.adults')}
                  displayEmpty
                  renderValue={(selected) =>
                    selected
                      ? selected
                      : (
                          <Box component="span" sx={{ color: 'text.secondary' }}>
                            {t('common.notSet')}
                          </Box>
                        )
                  }
                >
                  <MenuItem value="">
                    <em>{t('common.notSet')}</em>
                  </MenuItem>
                  {ADULT_OPTIONS.map((value) => (
                    <MenuItem key={value} value={value}>
                      {value}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel id="children-label" shrink>{t('common.children')}</InputLabel>
                <Select
                  labelId="children-label"
                  name="children"
                  value={formValues.children}
                  onChange={handleChange}
                  label={t('common.children')}
                  displayEmpty
                  renderValue={(selected) =>
                    selected
                      ? selected
                      : (
                          <Box component="span" sx={{ color: 'text.secondary' }}>
                            {t('common.notSet')}
                          </Box>
                        )
                  }
                >
                  <MenuItem value="">
                    <em>{t('common.notSet')}</em>
                  </MenuItem>
                  {CHILDREN_OPTIONS.map((value) => (
                    <MenuItem key={value} value={value}>
                      {value}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </Box>

          <DialogActions sx={{ justifyContent: 'space-between', mt: 1, px: 0 }}>
            <Button
              onClick={onCancel}
              color="secondary"
              startIcon={<FaTimes />}
              disabled={isSubmitting}
            >
              {t('reservationForm.cancel')}
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isSubmitting || disableSubmit}
              startIcon={<FaSave />}
            >
              {isSubmitting ? submittingLabel : submitLabel}
            </Button>
          </DialogActions>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export default ReservationFormDialog;
