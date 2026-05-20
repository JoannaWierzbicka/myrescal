import { formatDateValue } from './reservationDates.js';

export const DEFAULT_RESERVATION_STATUS = 'preliminary';

export const RESERVATION_STATUS_META = {
  preliminary: {
    labelKey: 'reservationStatus.preliminary',
    background: '#F6A23A',
    color: '#3F2505',
  },
  deposit_paid: {
    labelKey: 'reservationStatus.depositPaid',
    background: '#BFD9FF',
    color: '#123E7A',
  },
  confirmed: {
    labelKey: 'reservationStatus.confirmed',
    background: '#BFE6D5',
    color: '#0E4B2F',
  },
  in_progress: {
    labelKey: 'reservationStatus.inProgress',
    background: '#33B4AC',
    color: '#073C3A',
  },
  past: {
    labelKey: 'reservationStatus.past',
    background: '#DDE2E1',
    color: '#415158',
  },
};

export const RESERVATION_STATUS_OPTIONS = Object.entries(RESERVATION_STATUS_META)
  .filter(([value]) => !['in_progress', 'past'].includes(value))
  .map(([value, meta]) => ({
    value,
    ...meta,
  }));

export const getReservationStatusMeta = (status) =>
  RESERVATION_STATUS_META[status === 'booking' ? 'confirmed' : status] ??
  RESERVATION_STATUS_META.preliminary;

export const getReservationDisplayStatus = (reservation, todayDateValue = formatDateValue()) => {
  const rawStatus = reservation?.status === 'booking' ? 'confirmed' : reservation?.status;

  if (rawStatus === 'past') return 'past';

  const startDate = reservation?.start_date;
  const endDate = reservation?.end_date;

  if (startDate && endDate && todayDateValue) {
    if (todayDateValue >= endDate) return 'past';
    if (todayDateValue >= startDate && todayDateValue < endDate) return 'in_progress';
  }

  return rawStatus || DEFAULT_RESERVATION_STATUS;
};

export const getReservationDisplayStatusMeta = (reservation, todayDateValue) =>
  getReservationStatusMeta(getReservationDisplayStatus(reservation, todayDateValue));

export const DEFAULT_CONFIRMATION_METHOD = 'paid_full';

export const RESERVATION_CONFIRMATION_METHOD_META = {
  paid_full: {
    labelKey: 'reservationConfirmationMethod.paidFull',
  },
  booking_com: {
    labelKey: 'reservationConfirmationMethod.bookingCom',
  },
  other: {
    labelKey: 'reservationConfirmationMethod.other',
  },
};

export const RESERVATION_CONFIRMATION_METHOD_OPTIONS = Object.entries(
  RESERVATION_CONFIRMATION_METHOD_META,
).map(([value, meta]) => ({
  value,
  ...meta,
}));

export const normalizeConfirmationMethod = (method) =>
  Object.prototype.hasOwnProperty.call(RESERVATION_CONFIRMATION_METHOD_META, method)
    ? method
    : DEFAULT_CONFIRMATION_METHOD;
