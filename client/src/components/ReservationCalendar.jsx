import React, { useMemo, useState } from 'react';
import {
  Box,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { ArrowBackIos, ArrowForwardIos } from '@mui/icons-material';
import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  isBefore,
  isSameDay,
  isWithinInterval,
  parseISO,
  startOfMonth,
  startOfToday,
  startOfWeek,
} from 'date-fns';
import { useLocale } from '../context/LocaleContext.jsx';
import { getReservationStatusMeta } from '../utils/reservationStatus.js';

const safeParseDate = (value) => {
  if (!value) return null;
  const parsed = parseISO(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const ReservationCalendar = ({
  reservations = [],
  rooms: providedRooms,
  onReservationSelect,
  onDayClick,
  onRoomChange,
  selectedRoomId,
}) => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const { t, language, dateLocale } = useLocale();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const weekdayLabels = useMemo(() => {
    const labels = t('calendar.weekdays');
    if (Array.isArray(labels)) {
      return labels;
    }
    return language === 'pl'
      ? ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Ndz']
      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  }, [t, language]);

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const rooms = useMemo(() => {
    if (Array.isArray(providedRooms) && providedRooms.length > 0) {
      return providedRooms;
    }
    const map = new Map();
    reservations.forEach((reservation) => {
      const roomId = reservation.room_id || reservation.room?.id;
      if (!roomId) return;
      if (!map.has(roomId)) {
        map.set(roomId, {
          id: roomId,
          name: reservation.room?.name || t('reservationCard.room'),
          propertyName: reservation.property?.name || t('reservationCard.property'),
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => {
      if (a.propertyName === b.propertyName) {
        return a.name.localeCompare(b.name);
      }
      return a.propertyName.localeCompare(b.propertyName);
    });
  }, [providedRooms, reservations, t]);

  const getReservationsForRoom = (roomId) =>
    reservations.filter((reservation) => (reservation.room_id || reservation.room?.id) === roomId);

  if (rooms.length === 0) {
    return (
      <Box sx={{ p: 2, border: '1px dashed', borderColor: 'grey.300', borderRadius: '12px' }}>
        <Typography variant="body2" color="text.secondary">
          {t('calendar.noRooms')}
        </Typography>
      </Box>
    );
  }

  if (!isDesktop) {
    return (
      <MonthlyCalendar
        currentMonth={currentMonth}
        onNavigate={(direction) =>
          setCurrentMonth((prev) => addMonths(prev, direction === 'prev' ? -1 : 1))
        }
        rooms={rooms}
        activeRoomId={selectedRoomId || rooms[0]?.id}
        onRoomChange={onRoomChange}
        reservations={reservations}
        onDayClick={onDayClick}
        onReservationSelect={onReservationSelect}
        weekdays={weekdayLabels}
        instructions={t('calendar.mobileHint')}
        roomLabel={t('navbar.roomSelector')}
        dateLocale={dateLocale}
        t={t}
      />
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <IconButton onClick={() => setCurrentMonth((prev) => addMonths(prev, -1))}>
          <ArrowBackIos fontSize="small" />
        </IconButton>
        <Typography variant="h6">
          {format(currentMonth, 'LLLL yyyy', { locale: dateLocale })}
        </Typography>
        <IconButton onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}>
          <ArrowForwardIos fontSize="small" />
        </IconButton>
      </Box>
      <Box
        display="grid"
        gridTemplateColumns={`160px repeat(${daysInMonth.length}, minmax(0, 1fr))`}
        sx={{
          borderLeft: '1px solid',
          borderTop: '1px solid',
          borderColor: 'grey.300',
          borderRadius: '12px',
          overflow: 'hidden',
          minWidth: '100%',
          position: 'relative',
        }}
      >
        <Box
          sx={{
            position: 'relative',
            bgcolor: 'grey.200',
            borderRight: '1px solid',
            borderBottom: '1px solid',
            borderColor: 'grey.300',
            minHeight: 48,
            overflow: 'hidden',
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              borderTop: '1px solid rgba(47, 42, 37, 0.3)',
              borderLeft: 'none',
              borderRight: 'none',
              borderBottom: 'none',
              transform: 'skewY(-45deg)',
              transformOrigin: 'top left',
            },
          }}
        >
          <Typography
            variant="caption"
            sx={{
              position: 'absolute',
              bottom: 6,
              left: 8,
              fontWeight: 700,
              letterSpacing: '0.12em',
            }}
          >
            {t('calendar.room').toUpperCase()}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              position: 'absolute',
              top: 6,
              right: 8,
              fontWeight: 700,
              letterSpacing: '0.12em',
            }}
          >
            {t('calendar.date').toUpperCase()}
          </Typography>
        </Box>
        {daysInMonth.map((day) => (
          <Box
            key={day.toISOString()}
            sx={{
              borderRight: '1px solid',
              borderBottom: '1px solid',
              borderColor: 'grey.300',
          bgcolor: 'grey.100',
          minHeight: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
            }}
          >
            <Typography variant="caption">
              {format(day, 'd', { locale: dateLocale })}
            </Typography>
          </Box>
        ))}

        {rooms.map((room) => {
          const reservationsForRoom = getReservationsForRoom(room.id);
          return (
            <React.Fragment key={room.id}>
              <Box
                sx={{
                  borderRight: '1px solid',
                  borderBottom: '1px solid',
                  borderColor: 'grey.300',
                  bgcolor: 'grey.200',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  px: 1,
                  minHeight: 40,
                  fontWeight: 500,
                }}
              >
                <Typography variant="subtitle2" noWrap>
                  {room.name}
                </Typography>
              </Box>

              {daysInMonth.map((day) => (
                <DayCell
                  key={day.toISOString()}
                  day={day}
                  room={room}
                  reservationsForRoom={reservationsForRoom}
                  onDayClick={onDayClick}
                  onReservationSelect={onReservationSelect}
                />
              ))}
            </React.Fragment>
          );
        })}
      </Box>
    </Box>
  );
};

export default ReservationCalendar;

const buildInitials = (name, lastname) => {
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
};

const DayCell = ({ day, room, reservationsForRoom, onDayClick, onReservationSelect }) => {
  const reservation = reservationsForRoom.find((item) => {
    const start = safeParseDate(item.start_date);
    const end = safeParseDate(item.end_date);
    if (!start || !end) return false;
    const endInclusive = addDays(end, -1);
    const effectiveEnd = endInclusive >= start ? endInclusive : start;
    return isWithinInterval(day, { start, end: effectiveEnd });
  });

  const hasReservation = Boolean(reservation);
  const isStart = hasReservation && isSameDay(day, safeParseDate(reservation.start_date));
  const today = startOfToday();
  const isPast = !hasReservation && onDayClick && isBefore(day, today);
  const startDate = hasReservation ? safeParseDate(reservation.start_date) : null;
  const endDate = hasReservation ? safeParseDate(reservation.end_date) : null;
  const inclusiveEnd = startDate && endDate ? addDays(endDate, -1) : null;
  const effectiveEnd = inclusiveEnd && startDate && inclusiveEnd >= startDate ? inclusiveEnd : startDate;

  const reservationLength = (() => {
    if (!hasReservation || !startDate || !effectiveEnd) return hasReservation ? 1 : 0;
    return differenceInCalendarDays(effectiveEnd, startDate) + 1;
  })();

  const handleClick = () => {
    if (hasReservation) {
      onReservationSelect?.(reservation);
    } else if (!isPast) {
      onDayClick?.(day, room);
    }
  };

  const fullName = `${reservation?.name ?? ''} ${reservation?.lastname ?? ''}`.trim();
  const initials = buildInitials(reservation?.name, reservation?.lastname);
  const spanColumns = Math.max(reservationLength, 1);
  const displayName = initials || fullName || reservation?.name || '';
  const statusMeta = reservation ? getReservationStatusMeta(reservation.status) : null;
  const blockColor = statusMeta?.background || '#235369';

  return (
    <Box
      sx={{
        position: 'relative',
        borderRight: '1px solid',
        borderBottom: '1px solid',
        borderColor: hasReservation ? blockColor : 'grey.300',
        backgroundColor: hasReservation ? blockColor : 'transparent',
        minHeight: 48,
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'flex-start',
        px: 0.6,
        cursor: hasReservation ? 'pointer' : isPast ? 'not-allowed' : onDayClick ? 'pointer' : 'default',
        color: hasReservation ? '#fff' : 'inherit',
        borderTopLeftRadius: isStart ? 6 : 0,
        borderBottomLeftRadius: isStart ? 6 : 0,
        borderTopRightRadius:
          hasReservation && effectiveEnd && isSameDay(day, effectiveEnd) ? 6 : 0,
        borderBottomRightRadius:
          hasReservation && effectiveEnd && isSameDay(day, effectiveEnd) ? 6 : 0,
        transition: 'background-color 0.2s ease',
        overflow: 'visible',
        zIndex: isStart ? 10 : hasReservation ? 5 : 1,
        '&:hover':
          !hasReservation && !isPast && onDayClick
            ? {
                backgroundColor: 'grey.100',
              }
            : undefined,
      }}
      onClick={handleClick}
    >
      {hasReservation && isStart && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: `calc(100% * ${spanColumns})`,
            display: 'flex',
            alignItems: 'center',
            pl: 0.6,
            pr: 0.8,
            pointerEvents: 'none',
            zIndex: 15,
          }}
        >
          <Typography
            variant="caption"
            noWrap
            sx={{
              fontWeight: 600,
              color: 'common.white',
              textShadow: '0 1px 2px rgba(0,0,0,0.2)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '100%',
            }}
          >
            {displayName}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

const MonthlyCalendar = ({
  currentMonth,
  onNavigate,
  rooms,
  activeRoomId,
  onRoomChange,
  reservations,
  onDayClick,
  onReservationSelect,
  weekdays,
  instructions,
  roomLabel,
  dateLocale,
  t,
}) => {
  const today = startOfToday();
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    return Array.from({ length: 42 }, (_, index) => addDays(start, index));
  }, [currentMonth]);

  const room = rooms.find((item) => item.id === activeRoomId) || rooms[0];
  const reservationsForRoom = reservations.filter(
    (reservation) => (reservation.room_id || reservation.room?.id) === room.id,
  );

  const weekChunks = useMemo(() => {
    const chunked = [];
    for (let i = 0; i < days.length; i += 7) {
      chunked.push(days.slice(i, i + 7));
    }
    return chunked;
  }, [days]);

  const handleDayClick = (day) => {
    if (isBefore(day, today)) return;
    onDayClick?.(day, room);
  };

  const resolvedRoomLabel = roomLabel || t('calendar.room');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, paddingTop: 1 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={{ xs: 1.5, sm: 0 }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton onClick={() => onNavigate('prev')} size="small">
            <ArrowBackIos fontSize="inherit" />
          </IconButton>
          <Typography variant="h6">
            {format(currentMonth, 'LLLL yyyy', { locale: dateLocale })}
          </Typography>
          <IconButton onClick={() => onNavigate('next')} size="small">
            <ArrowForwardIos fontSize="inherit" />
          </IconButton>
        </Box>

        <FormControl
          size="small"
          fullWidth
          sx={{
            minWidth: { xs: 'auto', sm: 200 },
            maxWidth: { xs: '70%', sm: 280 },
            width: { xs: '100%', sm: 'auto' },
            mt: { xs: 1, sm: 0 },
            '& .MuiOutlinedInput-root': {
              fontSize: { xs: '0.95rem', sm: '1rem' },
              '& .MuiSelect-select': {
                py: { xs: 0.7, sm: 1 },
              },
            },
          }}
        >
          <InputLabel id="calendar-room-select" shrink>
            {resolvedRoomLabel}
          </InputLabel>
          <Select
            labelId="calendar-room-select"
            value={room.id}
            label={resolvedRoomLabel}
            onChange={(event) => onRoomChange?.(event.target.value)}
          >
            {rooms.map((item) => (
              <MenuItem key={item.id} value={item.id}>
                {item.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {instructions && (
        <Typography variant="caption" color="text.secondary">
          {instructions}
        </Typography>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 0.5 }}>
        {(weekdays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']).map((label) => (
          <Box key={label} sx={{ textAlign: 'center', fontWeight: 600, py: 0.75 }}>
            <Typography variant="caption">{label}</Typography>
          </Box>
        ))}
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {weekChunks.map((week, index) => (
          <Box
            key={index.toString()}
            sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 0.5 }}
          >
            {week.map((day) => (
              <MobileDayCell
                key={day.toISOString()}
                day={day}
                reservations={reservationsForRoom}
                currentMonth={currentMonth}
                onClick={() => handleDayClick(day)}
                onReservationSelect={onReservationSelect}
                dateLocale={dateLocale}
              />
            ))}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

const MobileDayCell = ({
  day,
  reservations,
  currentMonth,
  onClick,
  onReservationSelect,
  dateLocale,
}) => {
  const today = startOfToday();
  const reservation = reservations.find((item) => {
    const start = safeParseDate(item.start_date);
    const end = safeParseDate(item.end_date);
    if (!start || !end) return false;
    const endInclusive = addDays(end, -1);
    const effectiveEnd = endInclusive >= start ? endInclusive : start;
    return isWithinInterval(day, { start, end: effectiveEnd });
  });

  const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
  const isPast = isBefore(day, today);
  const hasReservation = Boolean(reservation);
  const label = format(day, 'd', { locale: dateLocale });
  const startDate = hasReservation ? safeParseDate(reservation.start_date) : null;
  const isStart = hasReservation && startDate && isSameDay(day, startDate);
  const statusMeta = reservation ? getReservationStatusMeta(reservation.status) : null;
  const blockColor = statusMeta?.background || '#235369';

  const handleClick = () => {
    if (hasReservation) {
      onReservationSelect?.(reservation);
    } else if (!isPast) {
      onClick?.();
    }
  };

  return (
    <Box
      onClick={handleClick}
      sx={{
        minHeight: 60,
        borderRadius: 1,
        border: '1px solid',
        borderColor: hasReservation ? blockColor : 'grey.300',
        backgroundColor: hasReservation ? blockColor : 'background.paper',
        color: isPast && !hasReservation ? 'text.disabled' : 'inherit',
        opacity: isCurrentMonth ? 1 : 0.4,
        p: 0.75,
        cursor: hasReservation ? 'pointer' : isPast ? 'not-allowed' : 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5,
      }}
    >
      <Typography variant="subtitle2" sx={{ fontSize: '0.9rem', fontWeight: 600 }}>
        {label}
      </Typography>
      {hasReservation && (
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            color: 'common.white',
            backgroundColor: blockColor,
            borderRadius: 0.5,
            px: 0.5,
            py: 0.25,
            alignSelf: 'flex-start',
            display: isStart ? 'inline-flex' : 'none',
          }}
        >
          {buildInitials(reservation?.name, reservation?.lastname) || `${reservation.name ?? ''}`.trim()}
        </Typography>
      )}
    </Box>
  );
};
