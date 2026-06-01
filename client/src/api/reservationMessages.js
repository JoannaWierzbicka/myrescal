import { apiClient, withQueryParams } from './client.js';

export const fetchReservationMessagePreview = (
  reservationId,
  {
    type,
    language,
    includeRules,
    includeCancellation,
    includeSummary,
    signal,
  } = {},
) => {
  if (!reservationId) {
    throw new Error('Reservation id is required');
  }

  const path = withQueryParams(`/reservations/${reservationId}/messages/preview`, {
    type,
    language,
    include_rules: includeRules,
    include_cancellation: includeCancellation,
    include_summary: includeSummary,
  });

  return apiClient(path, { signal });
};
