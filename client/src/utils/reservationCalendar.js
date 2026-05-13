import {
  addDays,
  differenceInCalendarDays,
  format,
  isWithinInterval,
  parseISO,
} from 'date-fns';
import { getReservationStatusMeta } from './reservationStatus.js';

export function safeParseDate(value) {
  if (!value) return null;
  const parsed = parseISO(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function buildInitials(name, lastname) {
  const parts = `${name ?? ''} ${lastname ?? ''}`
    .trim()
    .split(' ')
    .filter(Boolean);
  if (parts.length === 0) return '';
  return parts
    .map((part) => part[0]?.toUpperCase() ?? '')
    .filter(Boolean)
    .slice(0, 2)
    .join('');
}

export function getReservationRoomId(reservation) {
  return reservation.room_id || reservation.room?.id;
}

export function buildRoomsFromReservations({
  providedRooms,
  reservations,
  fallbackRoomName,
  fallbackPropertyName,
}) {
  if (Array.isArray(providedRooms) && providedRooms.length > 0) {
    return providedRooms;
  }

  const map = new Map();
  reservations.forEach((reservation) => {
    const roomId = getReservationRoomId(reservation);
    if (!roomId) return;
    if (!map.has(roomId)) {
      map.set(roomId, {
        id: roomId,
        name: reservation.room?.name || fallbackRoomName,
        propertyName: reservation.property?.name || fallbackPropertyName,
      });
    }
  });

  return Array.from(map.values()).sort((a, b) => {
    if (a.propertyName === b.propertyName) {
      return a.name.localeCompare(b.name);
    }
    return a.propertyName.localeCompare(b.propertyName);
  });
}

export function getReservationsForRoom(reservations, roomId) {
  return reservations.filter((reservation) => getReservationRoomId(reservation) === roomId);
}

export function getWeekDays(weekStart) {
  return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
}

export function getWeekHeaderLabel({ weekStart, weekEnd, dateLocale }) {
  const startsAndEndsInSameMonth =
    weekStart.getMonth() === weekEnd.getMonth() && weekStart.getFullYear() === weekEnd.getFullYear();
  const startsAndEndsInSameYear = weekStart.getFullYear() === weekEnd.getFullYear();

  if (startsAndEndsInSameMonth) {
    return format(weekStart, 'LLLL yyyy', { locale: dateLocale });
  }

  if (startsAndEndsInSameYear) {
    return `${format(weekStart, 'LLLL', { locale: dateLocale })} / ${format(weekEnd, 'LLLL yyyy', { locale: dateLocale })}`;
  }

  return `${format(weekStart, 'LLLL yyyy', { locale: dateLocale })} / ${format(weekEnd, 'LLLL yyyy', { locale: dateLocale })}`;
}

export function groupRoomsByProperty(rooms) {
  const groups = [];
  const groupMap = new Map();

  rooms.forEach((room) => {
    const groupName = room.propertyName || '';
    if (!groupMap.has(groupName)) {
      const group = { name: groupName, rooms: [] };
      groupMap.set(groupName, group);
      groups.push(group);
    }
    groupMap.get(groupName).rooms.push(room);
  });

  return groups;
}

export function getEffectiveReservationEnd(start, end) {
  const inclusiveEnd = addDays(end, -1);
  return inclusiveEnd >= start ? inclusiveEnd : start;
}

export function findReservationForDay(reservations, day) {
  return reservations.find((item) => {
    const start = safeParseDate(item.start_date);
    const end = safeParseDate(item.end_date);
    if (!start || !end) return false;
    const effectiveEnd = getEffectiveReservationEnd(start, end);
    return isWithinInterval(day, { start, end: effectiveEnd });
  });
}

export function getReservationLength({ startDate, effectiveEnd, hasReservation }) {
  if (!hasReservation || !startDate || !effectiveEnd) return hasReservation ? 1 : 0;
  return differenceInCalendarDays(effectiveEnd, startDate) + 1;
}

export function buildWeeklyReservationBlocks({ roomReservations, weekStart, weekEnd }) {
  return roomReservations
    .map((reservation) => {
      const start = safeParseDate(reservation.start_date);
      const end = safeParseDate(reservation.end_date);
      if (!start || !end) return null;

      const effectiveEnd = getEffectiveReservationEnd(start, end);
      if (effectiveEnd < weekStart || start > weekEnd) return null;

      const visibleStart = start < weekStart ? weekStart : start;
      const visibleEnd = effectiveEnd > weekEnd ? weekEnd : effectiveEnd;
      const startIndex = Math.max(0, differenceInCalendarDays(visibleStart, weekStart));
      const endIndex = Math.min(6, differenceInCalendarDays(visibleEnd, weekStart));
      const span = endIndex - startIndex + 1;
      const statusMeta = getReservationStatusMeta(reservation.status);

      return {
        reservation,
        startIndex,
        span,
        color: statusMeta.background,
        textColor: statusMeta.color,
      };
    })
    .filter(Boolean);
}
