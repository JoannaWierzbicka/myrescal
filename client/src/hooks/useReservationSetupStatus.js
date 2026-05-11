import { useEffect, useMemo, useState } from 'react';
import { fetchProperties } from '../api/properties.js';
import { fetchRooms } from '../api/rooms.js';
import { RESERVATION_SETUP_CHANGED_EVENT } from '../utils/reservationSetupEvents.js';

const initialState = {
  properties: [],
  rooms: [],
  loading: true,
  error: null,
};

export function useReservationSetupStatus({ enabled = true, refreshKey } = {}) {
  const [state, setState] = useState(initialState);
  const [eventRefreshKey, setEventRefreshKey] = useState(0);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      return undefined;
    }

    const handleSetupChanged = () => {
      setEventRefreshKey((current) => current + 1);
    };

    window.addEventListener(RESERVATION_SETUP_CHANGED_EVENT, handleSetupChanged);
    return () => {
      window.removeEventListener(RESERVATION_SETUP_CHANGED_EVENT, handleSetupChanged);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setState({ ...initialState, loading: false });
      return undefined;
    }

    const controller = new AbortController();
    setState((current) => ({ ...current, loading: true, error: null }));

    fetchProperties({ signal: controller.signal })
      .then(async (properties) => {
        if (!Array.isArray(properties) || properties.length === 0) {
          setState({ properties: [], rooms: [], loading: false, error: null });
          return;
        }

        const rooms = await fetchRooms({ signal: controller.signal });
        setState({
          properties,
          rooms: Array.isArray(rooms) ? rooms : [],
          loading: false,
          error: null,
        });
      })
      .catch((error) => {
        if (error?.name === 'AbortError') return;
        setState({
          properties: [],
          rooms: [],
          loading: false,
          error,
        });
      });

    return () => controller.abort();
  }, [enabled, refreshKey, eventRefreshKey]);

  return useMemo(() => {
    const hasProperties = state.properties.length > 0;
    const hasRooms = state.rooms.length > 0;

    return {
      ...state,
      hasProperties,
      hasRooms,
      canCreateReservation: hasProperties && hasRooms,
      missingStep: hasProperties ? 'rooms' : 'properties',
    };
  }, [state]);
}
