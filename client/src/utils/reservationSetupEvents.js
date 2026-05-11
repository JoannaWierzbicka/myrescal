export const RESERVATION_SETUP_CHANGED_EVENT = 'reservation-setup-changed';

export function notifyReservationSetupChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(RESERVATION_SETUP_CHANGED_EVENT));
}
