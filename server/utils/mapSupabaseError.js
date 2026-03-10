import { createHttpError } from './httpError.js';

export const isReservationOverlapError = (error) => {
  if (!error) return false;

  if (error.code === '23P01') {
    return true;
  }

  const details = String(error.details || '').toLowerCase();
  const message = String(error.message || '').toLowerCase();
  return details.includes('reservations_no_overlap') || message.includes('reservations_no_overlap');
};

export const mapSupabaseError = (error, fallbackStatus = 500, fallbackMessage = 'Supabase error.') =>
  createHttpError(
    error?.status || fallbackStatus,
    error?.message || fallbackMessage,
    error?.details,
    mapSupabaseCode(error),
  );

function mapSupabaseCode(error) {
  const code = error?.code;
  if (code === '23P01') return 'RESERVATION_OVERLAP';
  if (code === '23505') return 'DB_UNIQUE_VIOLATION';
  if (code === '42501') return 'FORBIDDEN';
  if (typeof code === 'string' && code.trim()) return `SUPABASE_${code.toUpperCase()}`;
  return undefined;
}
