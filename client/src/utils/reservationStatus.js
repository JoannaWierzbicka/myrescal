export const DEFAULT_RESERVATION_STATUS = 'preliminary';

export const RESERVATION_STATUS_META = {
  preliminary: {
    labelKey: 'reservationStatus.preliminary',
    background: 'rgba(247, 200, 85, 0.35)',
    color: '#AD6B00',
  },
  deposit_paid: {
    labelKey: 'reservationStatus.depositPaid',
    background: 'rgba(33, 111, 177, 0.35)',
    color: '#0E406C',
  },
  booking: {
    labelKey: 'reservationStatus.booking',
    background: 'rgba(51, 180, 172, 0.18)',
    color: '#1E746E',
  },
  past: {
    labelKey: 'reservationStatus.past',
    background: 'rgba(94, 79, 69, 0.16)',
    color: '#5E4F45',
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
