export const DEFAULT_RESERVATION_STATUS = 'preliminary';

export const RESERVATION_STATUS_META = {
  preliminary: {
    labelKey: 'reservationStatus.preliminary',
    background: '#F4E2C9',
    color: '#8A5B2B',
  },
  deposit_paid: {
    labelKey: 'reservationStatus.depositPaid',
    background: '#BFE6D5',
    color: '#0F4C4F',
  },
  booking: {
    labelKey: 'reservationStatus.booking',
    background: '#DDEEEB',
    color: '#0F4C4F',
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
  RESERVATION_STATUS_META[status] ?? RESERVATION_STATUS_META.preliminary;
