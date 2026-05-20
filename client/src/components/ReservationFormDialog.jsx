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
  FormHelperText,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { FaSave, FaTimes } from 'react-icons/fa';
import { useLocale } from '../context/LocaleContext.jsx';
import { isApiErrorCode } from '../api/errorUtils.js';
import {
  DEFAULT_CONFIRMATION_METHOD,
  DEFAULT_RESERVATION_STATUS,
  RESERVATION_CONFIRMATION_METHOD_OPTIONS,
  RESERVATION_STATUS_OPTIONS,
  normalizeConfirmationMethod,
} from '../utils/reservationStatus.js';
import {
  calculateReservationNights,
  formatReservationNights,
} from '../utils/reservationDates.js';

const DEFAULT_FORM_VALUES = {
  name: '',
  lastname: '',
  phone: '',
  mail: '',
  start_date: '',
  end_date: '',
  property_id: '',
  room_id: '',
  nightly_rate: '',
  deposit_amount: '',
  notes: '',
  adults: '',
  children: '',
  status: DEFAULT_RESERVATION_STATUS,
  confirmation_method: DEFAULT_CONFIRMATION_METHOD,
};

const ADULT_OPTIONS = Array.from({ length: 6 }, (_, index) => String(index + 1));
const CHILDREN_OPTIONS = Array.from({ length: 7 }, (_, index) => String(index));
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_INPUT_REGEX = /^\+?[\d\s\-()]{6,25}$/;
const MAX_NOTES_LENGTH = 1000;
const STAY_DETAILS_ROW_MARGIN = { xs: 2, sm: 2.5 };

const parseDecimalInput = (value) => {
  if (value === undefined || value === null) return null;

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : Number.NaN;
  }

  const normalized = String(value).trim().replace(/\s+/g, '').replace(/,/g, '.');
  if (normalized === '') return null;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
};

const formatDecimalForInput = (value, maximumFractionDigits = 2) => {
  if (!Number.isFinite(value)) return '';
  return String(Number(value.toFixed(maximumFractionDigits)));
};

const normalizeString = (value) => {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed.length === 0 ? null : trimmed;
};

const normalizeDecimalForPayload = (value) => {
  const parsed = parseDecimalInput(value);
  if (parsed === null || Number.isNaN(parsed)) return null;
  return parsed;
};

const resolveSafeAmount = (value) => {
  const parsed = parseDecimalInput(value);
  if (parsed === null || Number.isNaN(parsed)) return 0;
  return parsed;
};

const parseDateToUtcDay = (value) => {
  const parts = String(value || '').split('-');
  if (parts.length !== 3) return null;

  const [yearRaw, monthRaw, dayRaw] = parts;
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;

  const utc = Date.UTC(year, month - 1, day);
  const parsedDate = new Date(utc);

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.getUTCFullYear() !== year ||
    parsedDate.getUTCMonth() !== month - 1 ||
    parsedDate.getUTCDate() !== day
  ) {
    return null;
  }

  return utc;
};

const addDaysToDateValue = (value, days) => {
  const utc = parseDateToUtcDay(value);
  if (utc === null) return '';

  const date = new Date(utc);
  date.setUTCDate(date.getUTCDate() + days);

  const year = String(date.getUTCFullYear());
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const ensureEndDateAfterStart = (values) => {
  if (!values.start_date) return values;

  const startUtc = parseDateToUtcDay(values.start_date);
  const endUtc = parseDateToUtcDay(values.end_date);

  if (startUtc === null) return values;
  if (endUtc !== null && endUtc > startUtc) return values;

  return {
    ...values,
    end_date: addDaysToDateValue(values.start_date, 1),
  };
};

const calculateNumberOfNights = (startDate, endDate) => {
  return calculateReservationNights(startDate, endDate);
};

const computeAutomaticTotalPrice = (values) => {
  const nights = calculateNumberOfNights(values.start_date, values.end_date);
  if (!nights) return '';

  const nightlyRate = parseDecimalInput(values.nightly_rate);
  if (nightlyRate === null || Number.isNaN(nightlyRate) || nightlyRate < 0) return '';

  return formatDecimalForInput(nightlyRate * nights);
};

const computeRemainingAmount = (totalPrice, depositAmount) =>
  formatDecimalForInput(resolveSafeAmount(totalPrice) - resolveSafeAmount(depositAmount));

const hasValue = (value) => value !== undefined && value !== null && String(value).trim() !== '';

const formatDateForDisplay = (value) => {
  const parts = String(value || '').split('-');
  if (parts.length !== 3) return '';
  const [year, month, day] = parts;
  if (!year || !month || !day) return '';
  return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
};

const formatDateDisplayInput = (value) => {
  const raw = String(value || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return formatDateForDisplay(raw);
  }

  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

const parseDisplayDate = (value) => {
  const normalized = String(value || '').trim();
  const match = normalized.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return '';

  const [, dayRaw, monthRaw, yearRaw] = match;
  const day = Number(dayRaw);
  const month = Number(monthRaw);
  const year = Number(yearRaw);

  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) return '';

  const utc = Date.UTC(year, month - 1, day);
  const parsed = new Date(utc);

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return '';
  }

  return `${yearRaw}-${monthRaw}-${dayRaw}`;
};

const isValidEmail = (value) => {
  const normalized = String(value || '').trim();
  if (!normalized) return true;
  return EMAIL_REGEX.test(normalized);
};

const isValidPhone = (value) => {
  const normalized = String(value || '').trim();
  if (!normalized) return true;

  if (!PHONE_INPUT_REGEX.test(normalized)) {
    return false;
  }

  const digits = normalized.replace(/\D/g, '');
  return digits.length >= 6 && digits.length <= 15;
};

const validateDecimalField = (value, t, invalidKey, negativeKey) => {
  if (!hasValue(value)) return null;

  const parsed = parseDecimalInput(value);
  if (Number.isNaN(parsed)) return t(invalidKey);
  if (parsed < 0) return t(negativeKey);

  return null;
};

const resolveStoredTotalPrice = (values = {}) => {
  const totalPrice = parseDecimalInput(values.total_price);
  if (totalPrice !== null && !Number.isNaN(totalPrice)) {
    return totalPrice;
  }

  const legacyPrice = parseDecimalInput(values.price);
  if (legacyPrice !== null && !Number.isNaN(legacyPrice)) {
    return legacyPrice;
  }

  return null;
};

const deriveNightlyRateFromStoredTotal = (values = {}) => {
  const nights = calculateNumberOfNights(values.start_date, values.end_date);
  const storedTotalPrice = resolveStoredTotalPrice(values);

  if (!nights || storedTotalPrice === null) {
    return '';
  }

  return formatDecimalForInput(storedTotalPrice / nights, 4);
};

const normalizeReservationStatus = (status) => {
  const normalized = String(status || '').trim();
  if (normalized === 'booking') return 'confirmed';
  const isSelectableStatus = RESERVATION_STATUS_OPTIONS.some((option) => option.value === normalized);
  if (!normalized || !isSelectableStatus) {
    return DEFAULT_RESERVATION_STATUS;
  }
  return normalized;
};

const toFormValues = (values = {}) => {
  const mapped = { ...DEFAULT_FORM_VALUES };

  Object.entries(values).forEach(([key, value]) => {
    if (value === null || value === undefined) return;

    if (['price', 'remaining_amount', 'total_price'].includes(key)) {
      return;
    }

    if (['adults', 'children', 'nightly_rate', 'deposit_amount'].includes(key)) {
      mapped[key] = String(value);
      return;
    }

    if (['room_id', 'property_id'].includes(key)) {
      mapped[key] = String(value);
      return;
    }

    if (key === 'status') {
      mapped.status = normalizeReservationStatus(value);
      return;
    }

    if (key === 'confirmation_method') {
      mapped.confirmation_method = normalizeConfirmationMethod(value);
      return;
    }

    mapped[key] = value;
  });

  if (!hasValue(mapped.nightly_rate)) {
    mapped.nightly_rate = deriveNightlyRateFromStoredTotal(values);
  }

  if (mapped.status === 'confirmed') {
    mapped.confirmation_method =
      values.status === 'booking' && !values.confirmation_method
        ? 'booking_com'
        : normalizeConfirmationMethod(mapped.confirmation_method);
  }

  return mapped;
};

const serializeFormValues = (values = {}) =>
  JSON.stringify(
    Object.keys(DEFAULT_FORM_VALUES).reduce((acc, key) => {
      acc[key] = values[key] ?? '';
      return acc;
    }, {}),
  );

const toPayload = (values, totalPrice) => {
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
    nightly_rate: normalizeDecimalForPayload(values.nightly_rate),
    total_price: normalizeDecimalForPayload(totalPrice),
    deposit_amount:
      values.status === 'deposit_paid'
        ? normalizeDecimalForPayload(values.deposit_amount) ?? 0
        : null,
    confirmation_method:
      values.status === 'confirmed'
        ? normalizeConfirmationMethod(values.confirmation_method)
        : null,
    notes: normalizeString(values.notes),
    adults: normalizeNumber(values.adults),
    children: normalizeNumber(values.children),
    status: values.status,
  };
};

const validateForm = (values, t, derivedErrors) => {
  if (!values.name.trim()) return t('reservationForm.errors.firstName');
  if (!values.lastname.trim()) return t('reservationForm.errors.lastName');
  if (!values.start_date) return t('reservationForm.errors.startDate');
  if (!values.end_date) return t('reservationForm.errors.endDate');
  if (!values.property_id) return t('reservationForm.errors.property');
  if (!values.room_id) return t('reservationForm.errors.room');
  if (!values.status) return t('reservationForm.errors.status');
  if (values.status === 'confirmed' && !values.confirmation_method) {
    return t('reservationForm.errors.confirmationMethod');
  }

  if (derivedErrors.email) return derivedErrors.email;
  if (derivedErrors.phone) return derivedErrors.phone;
  if (derivedErrors.nightlyRate) return derivedErrors.nightlyRate;
  if (derivedErrors.depositAmount) return derivedErrors.depositAmount;
  if (derivedErrors.notes) return derivedErrors.notes;

  const nights = calculateNumberOfNights(values.start_date, values.end_date);
  if (values.start_date && values.end_date && !nights) {
    return t('reservationForm.errors.dateOrder');
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
  existingReservations = [],
  reservationId,
}) {
  const { t, language } = useLocale();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const startDatePickerRef = useRef(null);
  const endDatePickerRef = useRef(null);
  const [formValues, setFormValues] = useState(() => toFormValues(initialValues));
  const [baselineValues, setBaselineValues] = useState(() => toFormValues(initialValues));
  const [dateDisplayValues, setDateDisplayValues] = useState(() => {
    const values = toFormValues(initialValues);
    return {
      start_date: formatDateForDisplay(values.start_date),
      end_date: formatDateForDisplay(values.end_date),
    };
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);
  const isDepositPaid = formValues.status === 'deposit_paid';
  const isConfirmed = formValues.status === 'confirmed';

  useEffect(() => () => {
    isMountedRef.current = false;
  }, []);

  useEffect(() => {
    const nextValues = toFormValues(initialValues);
    setFormValues(nextValues);
    setBaselineValues(nextValues);
    setDateDisplayValues({
      start_date: formatDateForDisplay(nextValues.start_date),
      end_date: formatDateForDisplay(nextValues.end_date),
    });
    setConfirmCloseOpen(false);
  }, [initialValues]);

  useEffect(() => {
    if (!rooms || rooms.length === 0) return;
    setFormValues((prev) => {
      if (prev.room_id && rooms.some((room) => room.id === prev.room_id)) {
        return prev;
      }
      const nextValues = {
        ...prev,
        room_id: rooms[0].id,
      };
      setBaselineValues((currentBaseline) =>
        serializeFormValues(prev) === serializeFormValues(currentBaseline) ? nextValues : currentBaseline,
      );
      return nextValues;
    });
  }, [rooms]);

  const emailErrorText = useMemo(
    () => (isValidEmail(formValues.mail) ? null : t('reservationForm.errors.invalidEmail')),
    [formValues.mail, t],
  );

  const phoneErrorText = useMemo(
    () => (isValidPhone(formValues.phone) ? null : t('reservationForm.errors.invalidPhone')),
    [formValues.phone, t],
  );

  const nightlyRateErrorText = useMemo(
    () =>
      validateDecimalField(
        formValues.nightly_rate,
        t,
        'reservationForm.errors.invalidNightlyRate',
        'reservationForm.errors.negativeNightlyRate',
      ),
    [formValues.nightly_rate, t],
  );

  const computedTotalPrice = useMemo(
    () =>
      computeAutomaticTotalPrice({
        start_date: formValues.start_date,
        end_date: formValues.end_date,
        nightly_rate: formValues.nightly_rate,
      }),
    [formValues.end_date, formValues.nightly_rate, formValues.start_date],
  );

  const stayNights = useMemo(
    () => calculateNumberOfNights(formValues.start_date, formValues.end_date),
    [formValues.end_date, formValues.start_date],
  );

  const stayNightsLabel = useMemo(
    () => formatReservationNights(stayNights, language),
    [language, stayNights],
  );

  const remainingAmount = useMemo(
    () => computeRemainingAmount(computedTotalPrice, formValues.deposit_amount),
    [computedTotalPrice, formValues.deposit_amount],
  );

  const depositAmountErrorText = useMemo(() => {
    if (!isDepositPaid) return null;

    const baseError = validateDecimalField(
      formValues.deposit_amount,
      t,
      'reservationForm.errors.invalidDepositAmount',
      'reservationForm.errors.negativeDepositAmount',
    );

    if (baseError) return baseError;

    const depositAmount = resolveSafeAmount(formValues.deposit_amount);
    const totalPrice = resolveSafeAmount(computedTotalPrice);

    if (depositAmount > totalPrice) {
      return t('reservationForm.errors.depositGreaterThanTotal');
    }

    return null;
  }, [computedTotalPrice, formValues.deposit_amount, isDepositPaid, t]);

  const notesErrorText = useMemo(() => {
    if (!formValues.notes) return null;
    if (formValues.notes.length > MAX_NOTES_LENGTH) {
      return t('reservationForm.errors.notesTooLong', { max: MAX_NOTES_LENGTH });
    }
    return null;
  }, [formValues.notes, t]);

  const formValidationError = useMemo(
    () =>
      validateForm(formValues, t, {
        email: emailErrorText,
        phone: phoneErrorText,
        nightlyRate: nightlyRateErrorText,
        depositAmount: depositAmountErrorText,
        notes: notesErrorText,
      }),
    [
      formValues,
      t,
      emailErrorText,
      phoneErrorText,
      nightlyRateErrorText,
      depositAmountErrorText,
      notesErrorText,
    ],
  );

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
      Boolean(formValidationError) ||
      dateConflict
    );
  }, [formValues, dateConflict, formValidationError]);

  const hasUnsavedChanges = useMemo(
    () => serializeFormValues(formValues) !== serializeFormValues(baselineValues),
    [baselineValues, formValues],
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleStatusChange = (event) => {
    const { value } = event.target;
    setFormValues((prev) => ({
      ...prev,
      status: value,
      deposit_amount: value === 'deposit_paid' ? prev.deposit_amount : '',
      confirmation_method:
        value === 'confirmed'
          ? normalizeConfirmationMethod(prev.confirmation_method)
          : DEFAULT_CONFIRMATION_METHOD,
    }));
  };

  const handleDateDisplayChange = (event) => {
    const { name, value } = event.target;
    const displayValue = formatDateDisplayInput(value);
    const parsedValue = parseDisplayDate(displayValue);

    setFormValues((prev) => {
      const nextValues = ensureEndDateAfterStart({
        ...prev,
        [name]: parsedValue,
      });

      setDateDisplayValues((currentDisplayValues) => ({
        ...currentDisplayValues,
        [name]: displayValue,
        ...(name === 'start_date' && nextValues.end_date !== prev.end_date
          ? { end_date: formatDateForDisplay(nextValues.end_date) }
          : {}),
      }));

      return nextValues;
    });
  };

  const handleNativeDateChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => {
      const nextValues = ensureEndDateAfterStart({
        ...prev,
        [name]: value,
      });

      setDateDisplayValues((currentDisplayValues) => ({
        ...currentDisplayValues,
        [name]: formatDateForDisplay(value),
        ...(name === 'start_date' && nextValues.end_date !== prev.end_date
          ? { end_date: formatDateForDisplay(nextValues.end_date) }
          : {}),
      }));

      return nextValues;
    });
  };

  const openNativeDatePicker = (ref) => {
    const input = ref.current;
    if (!input) return;

    if (typeof input.showPicker === 'function') {
      input.showPicker();
      return;
    }

    input.click();
  };

  const requestClose = () => {
    if (isSubmitting) return;

    if (hasUnsavedChanges) {
      setConfirmCloseOpen(true);
      return;
    }

    onCancel?.();
  };

  const handleDialogClose = (_event, reason) => {
    if (reason === 'backdropClick') {
      return;
    }
    requestClose();
  };

  const submitForm = async () => {
    if (formValidationError) {
      setError(formValidationError);
      return false;
    }

    if (dateConflict) {
      setError(t('reservationForm.errors.conflict'));
      return false;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(toPayload(formValues, computedTotalPrice));
      return true;
    } catch (submissionError) {
      if (
        isApiErrorCode(submissionError, 'RESERVATION_OVERLAP')
        || submissionError?.status === 409
      ) {
        setError(t('reservationForm.errors.conflict'));
      } else {
        setError(submissionError?.message || t('reservationForm.errors.generic'));
      }
      return false;
    } finally {
      if (isMountedRef.current) {
        setIsSubmitting(false);
      }
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await submitForm();
  };

  const handleConfirmSave = async () => {
    const success = await submitForm();
    if (!success && isMountedRef.current) {
      setConfirmCloseOpen(false);
    }
  };

  return (
    <>
    <Dialog open onClose={handleDialogClose} maxWidth="sm" fullWidth fullScreen={fullScreen}>
      <DialogTitle sx={{ pr: 7, color: 'primary.dark' }}>
        {title}
        <IconButton
          aria-label={t('reservationForm.close')}
          onClick={requestClose}
          sx={{ position: 'absolute', right: 10, top: 10 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ backgroundColor: '#FAF7F0', px: { xs: 2, sm: 3 } }}>
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, pb: { xs: 2, sm: 0 } }}
        >
          <Box
            sx={{
              borderRadius: 1.5,
              border: '1px solid',
              borderColor: 'divider',
              backgroundColor: '#FFFFFF',
              px: { xs: 2, sm: 3 },
              py: { xs: 2, sm: 2.5 },
              boxShadow: '0 14px 30px rgba(16, 42, 51, 0.06)',
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
                error={Boolean(phoneErrorText)}
                helperText={phoneErrorText || ' '}
                fullWidth
              />
              <TextField
                label={t('reservationForm.fields.email')}
                name="mail"
                type="email"
                value={formValues.mail}
                onChange={handleChange}
                error={Boolean(emailErrorText)}
                helperText={emailErrorText || ' '}
                fullWidth
              />
            </Stack>
          </Box>

          <Box
            sx={{
              borderRadius: 1.5,
              border: '1px solid',
              borderColor: 'divider',
              backgroundColor: '#FFFFFF',
              px: { xs: 2, sm: 3 },
              py: { xs: 2, sm: 2.5 },
              boxShadow: '0 14px 30px rgba(16, 42, 51, 0.06)',
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              {language === 'pl' ? 'Szczegóły pobytu' : 'Stay details'}
            </Typography>
            <Stack spacing={2.5} direction={{ xs: 'column', sm: 'row' }}>
              <Box sx={{ position: 'relative', width: '100%' }}>
                <TextField
                  label={t('reservationForm.fields.startDate')}
                  name="start_date"
                  type="text"
                  value={dateDisplayValues.start_date}
                  onChange={handleDateDisplayChange}
                  required
                  fullWidth
                  placeholder="DD/MM/YYYY"
                  inputProps={{ inputMode: 'numeric', maxLength: 10 }}
                  InputProps={{
                    endAdornment: (
                      <IconButton
                        edge="end"
                        aria-label={t('reservationForm.fields.startDate')}
                        onClick={() => openNativeDatePicker(startDatePickerRef)}
                      >
                        <CalendarMonthOutlinedIcon fontSize="small" />
                      </IconButton>
                    ),
                  }}
                  error={dateConflict}
                  helperText={dateConflict ? t('reservationForm.errors.conflict') : 'DD/MM/YYYY'}
                />
                <Box
                  component="input"
                  ref={startDatePickerRef}
                  name="start_date"
                  type="date"
                  value={formValues.start_date}
                  min={undefined}
                  onChange={handleNativeDateChange}
                  aria-hidden="true"
                  tabIndex={-1}
                  sx={{
                    position: 'absolute',
                    right: 8,
                    bottom: 8,
                    width: 1,
                    height: 1,
                    opacity: 0,
                    pointerEvents: 'none',
                  }}
                />
              </Box>
              <Box sx={{ position: 'relative', width: '100%' }}>
                <TextField
                  label={t('reservationForm.fields.endDate')}
                  name="end_date"
                  type="text"
                  value={dateDisplayValues.end_date}
                  onChange={handleDateDisplayChange}
                  required
                  fullWidth
                  placeholder="DD/MM/YYYY"
                  inputProps={{ inputMode: 'numeric', maxLength: 10 }}
                  InputProps={{
                    endAdornment: (
                      <IconButton
                        edge="end"
                        aria-label={t('reservationForm.fields.endDate')}
                        onClick={() => openNativeDatePicker(endDatePickerRef)}
                      >
                        <CalendarMonthOutlinedIcon fontSize="small" />
                      </IconButton>
                    ),
                  }}
                  error={dateConflict}
                  helperText={dateConflict ? t('reservationForm.errors.conflict') : 'DD/MM/YYYY'}
                />
                <Box
                  component="input"
                  ref={endDatePickerRef}
                  name="end_date"
                  type="date"
                  value={formValues.end_date}
                  min={formValues.start_date || undefined}
                  onChange={handleNativeDateChange}
                  aria-hidden="true"
                  tabIndex={-1}
                  sx={{
                    position: 'absolute',
                    right: 8,
                    bottom: 8,
                    width: 1,
                    height: 1,
                    opacity: 0,
                    pointerEvents: 'none',
                  }}
                />
              </Box>
            </Stack>
            {stayNightsLabel ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1.5, fontWeight: 700 }}
              >
                {t('reservationForm.stayLength')}: {stayNightsLabel}
              </Typography>
            ) : null}

            <Stack spacing={2.5} direction={{ xs: 'column', sm: 'row' }} sx={{ mt: STAY_DETAILS_ROW_MARGIN }}>
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
                <FormHelperText> </FormHelperText>
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
                <FormHelperText> </FormHelperText>
              </FormControl>
            </Stack>

            <Grid container spacing={2.5} sx={{ mt: STAY_DETAILS_ROW_MARGIN }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label={t('reservationForm.fields.nightlyRate')}
                  name="nightly_rate"
                  type="text"
                  value={formValues.nightly_rate}
                  onChange={handleChange}
                  fullWidth
                  inputProps={{ inputMode: 'decimal' }}
                  error={Boolean(nightlyRateErrorText)}
                  helperText={nightlyRateErrorText || ' '}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label={t('reservationForm.fields.totalPrice')}
                  name="total_price"
                  type="text"
                  value={computedTotalPrice}
                  fullWidth
                  inputProps={{ inputMode: 'decimal' }}
                  InputProps={{ readOnly: true }}
                  helperText=" "
                />
              </Grid>
            </Grid>

            <FormControl required fullWidth sx={{ mt: STAY_DETAILS_ROW_MARGIN }}>
              <InputLabel id="reservation-status-label">{t('reservationForm.fields.status')}</InputLabel>
              <Select
                labelId="reservation-status-label"
                name="status"
                value={formValues.status}
                label={t('reservationForm.fields.status')}
                onChange={handleStatusChange}
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

            {isDepositPaid ? (
              <Grid container spacing={2.5} sx={{ mt: { xs: 2, sm: 2.5 } }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label={t('reservationForm.fields.depositAmount')}
                    name="deposit_amount"
                    type="text"
                    value={formValues.deposit_amount}
                    onChange={handleChange}
                    fullWidth
                    inputProps={{ inputMode: 'decimal' }}
                    error={Boolean(depositAmountErrorText)}
                    helperText={depositAmountErrorText || ' '}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label={t('reservationForm.fields.remainingAmount')}
                    name="remaining_amount"
                    type="text"
                    value={remainingAmount}
                    fullWidth
                    inputProps={{ inputMode: 'decimal' }}
                    InputProps={{ readOnly: true }}
                    helperText=" "
                  />
                </Grid>
              </Grid>
            ) : null}

            {isConfirmed ? (
              <FormControl required fullWidth sx={{ mt: { xs: 2, sm: 2.5 } }}>
                <InputLabel id="confirmation-method-label">
                  {t('reservationForm.fields.confirmationMethod')}
                </InputLabel>
                <Select
                  labelId="confirmation-method-label"
                  name="confirmation_method"
                  value={formValues.confirmation_method}
                  label={t('reservationForm.fields.confirmationMethod')}
                  onChange={handleChange}
                >
                  {RESERVATION_CONFIRMATION_METHOD_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {t(option.labelKey)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : null}
          </Box>

          <Box
            sx={{
              borderRadius: 1.5,
              border: '1px solid',
              borderColor: 'divider',
              backgroundColor: '#FFFFFF',
              px: { xs: 2, sm: 3 },
              py: { xs: 2, sm: 2.5 },
              boxShadow: '0 14px 30px rgba(16, 42, 51, 0.06)',
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

          <Box
            sx={{
              borderRadius: 1.5,
              border: '1px solid',
              borderColor: 'divider',
              backgroundColor: '#FFFFFF',
              px: { xs: 2, sm: 3 },
              py: { xs: 2, sm: 2.5 },
              boxShadow: '0 14px 30px rgba(16, 42, 51, 0.06)',
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              {language === 'pl' ? 'Uwagi' : 'Notes'}
            </Typography>
            <TextField
              label={t('reservationForm.fields.notes')}
              name="notes"
              value={formValues.notes}
              onChange={handleChange}
              fullWidth
              multiline
              rows={4}
              error={Boolean(notesErrorText)}
              helperText={
                notesErrorText
                  || `${formValues.notes?.length ?? 0}/${MAX_NOTES_LENGTH}`
              }
            />
          </Box>
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

          <DialogActions
            sx={{
              justifyContent: 'space-between',
              mt: 0.5,
              px: 0,
              gap: 1,
              flexDirection: { xs: 'column-reverse', sm: 'row' },
              '& > :not(style) ~ :not(style)': { ml: { xs: 0, sm: 1 } },
            }}
          >
            <Button
              onClick={requestClose}
              color="secondary"
              startIcon={<FaTimes />}
              disabled={isSubmitting || dateConflict || dataError}
              fullWidth={fullScreen}
            >
              {t('reservationForm.cancel')}
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isSubmitting || disableSubmit}
              startIcon={<FaSave />}
              fullWidth={fullScreen}
            >
              {isSubmitting ? submittingLabel : submitLabel}
            </Button>
          </DialogActions>
        </Box>
      </DialogContent>
    </Dialog>
    <Dialog
      open={confirmCloseOpen}
      onClose={() => {
        if (!isSubmitting) setConfirmCloseOpen(false);
      }}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 1.5,
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: '#FFFDFC',
          boxShadow: '0 24px 58px rgba(16, 42, 51, 0.18)',
        },
      }}
    >
      <DialogTitle sx={{ color: 'primary.dark', pb: 1 }}>
        {t('reservationForm.unsavedChanges.title')}
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {t('reservationForm.unsavedChanges.message')}
        </Typography>
      </DialogContent>
      <DialogActions
        sx={{
          px: 3,
          pb: 2.5,
          pt: 1,
          gap: 1,
          flexDirection: { xs: 'column-reverse', sm: 'row' },
          alignItems: 'stretch',
          '& > :not(style) ~ :not(style)': { ml: { xs: 0, sm: 1 } },
        }}
      >
        <Button
          onClick={() => setConfirmCloseOpen(false)}
          disabled={isSubmitting}
          fullWidth={fullScreen}
        >
          {t('reservationForm.unsavedChanges.keepEditing')}
        </Button>
        <Button
          onClick={onCancel}
          color="secondary"
          variant="outlined"
          disabled={isSubmitting}
          fullWidth={fullScreen}
        >
          {t('reservationForm.unsavedChanges.discard')}
        </Button>
        <Button
          onClick={handleConfirmSave}
          variant="contained"
          disabled={isSubmitting || disableSubmit}
          fullWidth={fullScreen}
        >
          {isSubmitting ? submittingLabel : t('reservationForm.unsavedChanges.save')}
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
}

export default ReservationFormDialog;
