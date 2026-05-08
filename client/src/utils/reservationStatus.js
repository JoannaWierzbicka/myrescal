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
  past: {
    labelKey: 'reservationStatus.past',
    background: '#EEF0EF',
    color: '#61727A',
  },
};

export const RESERVATION_STATUS_OPTIONS = Object.entries(RESERVATION_STATUS_META)
  .filter(([value]) => value !== 'past')
  .map(([value, meta]) => ({
    value,
    ...meta,
  }));

export const getReservationStatusMeta = (status) =>
  RESERVATION_STATUS_META[status === 'booking' ? 'confirmed' : status] ??
  RESERVATION_STATUS_META.preliminary;

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
