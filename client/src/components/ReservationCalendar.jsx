import React, { useRef, useMemo, useState } from 'react';
import {
  Box,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { ArrowBackIos, ArrowForwardIos } from '@mui/icons-material';
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  format,
  isBefore,
  isSameDay,
  startOfMonth,
  startOfToday,
  startOfWeek,
} from 'date-fns';
import { useLocale } from '../context/LocaleContext.jsx';
import { getReservationDisplayStatusMeta } from '../utils/reservationStatus.js';
import {
  buildInitials,
  buildRoomsFromReservations,
  buildWeeklyReservationBlocks,
  findReservationForDay,
  getEffectiveReservationEnd,
  getReservationLength,
  getReservationsForRoom,
  getWeekDays,
  getWeekHeaderLabel,
  groupRoomsByProperty,
  safeParseDate,
} from '../utils/reservationCalendar.js';

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
  const [calendarView, setCalendarView] = useState(null);
  const touchStartRef = useRef(null);
  const resolvedCalendarView = calendarView || (isDesktop ? 'month' : 'week');
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
    return buildRoomsFromReservations({
      providedRooms,
      reservations,
      fallbackRoomName: t('reservationCard.room'),
      fallbackPropertyName: t('reservationCard.property'),
    });
  }, [providedRooms, reservations, t]);

  const navigateCalendar = (direction) => {
    const amount = direction === 'prev' ? -1 : 1;
    setCurrentMonth((prev) =>
      resolvedCalendarView === 'week' ? addWeeks(prev, amount) : addMonths(prev, amount),
    );
  };

  const handleTouchStart = (event) => {
    const touch = event.touches?.[0];
    if (!touch) return;
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
    };
  };

  const handleTouchEnd = (event) => {
    const start = touchStartRef.current;
    const touch = event.changedTouches?.[0];
    touchStartRef.current = null;
    if (!start || !touch) return;

    const diffX = touch.clientX - start.x;
    const diffY = touch.clientY - start.y;
    const isHorizontalSwipe = Math.abs(diffX) > 48 && Math.abs(diffX) > Math.abs(diffY) * 1.35;
    if (!isHorizontalSwipe) return;

    navigateCalendar(diffX < 0 ? 'next' : 'prev');
  };

  if (rooms.length === 0) {
    return (
      <Box sx={{ p: 2, border: '1px dashed', borderColor: 'grey.300', borderRadius: '8px' }}>
        <Typography variant="body2" color="text.secondary">
          {t('calendar.noRooms')}
        </Typography>
      </Box>
    );
  }

  if (!isDesktop) {
    return (
      <Box
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        sx={{ display: 'flex', flexDirection: 'column', gap: 2, touchAction: 'pan-y' }}
      >
        <CalendarViewToggle value={resolvedCalendarView} onChange={setCalendarView} t={t} />
        {resolvedCalendarView === 'week' ? (
          <WeeklyCalendar
            currentDate={currentMonth}
            onNavigate={navigateCalendar}
            rooms={rooms}
            reservations={reservations}
            onDayClick={onDayClick}
            onReservationSelect={onReservationSelect}
            weekdays={weekdayLabels}
            dateLocale={dateLocale}
          />
        ) : (
          <MonthlyCalendar
            currentMonth={currentMonth}
            onNavigate={navigateCalendar}
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
        )}
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <CalendarViewToggle value={resolvedCalendarView} onChange={setCalendarView} t={t} />
      </Box>
      {resolvedCalendarView === 'week' ? (
        <WeeklyCalendar
          currentDate={currentMonth}
          onNavigate={navigateCalendar}
          rooms={rooms}
          reservations={reservations}
          onDayClick={onDayClick}
          onReservationSelect={onReservationSelect}
          weekdays={weekdayLabels}
          dateLocale={dateLocale}
        />
      ) : (
      <>
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
          borderRadius: '8px',
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
          const reservationsForRoom = getReservationsForRoom(reservations, room.id);
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
      </>
      )}
    </Box>
  );
};

export default ReservationCalendar;

function CalendarViewToggle({ value, onChange, t }) {
  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      size="small"
      onChange={(_event, nextValue) => {
        if (nextValue) onChange(nextValue);
      }}
      sx={{
        alignSelf: 'flex-end',
        backgroundColor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1.5,
        p: 0.35,
        '& .MuiToggleButton-root': {
          border: 0,
          borderRadius: 1,
          px: 1.5,
          py: 0.6,
          color: 'text.secondary',
          fontWeight: 700,
          '&.Mui-selected': {
            backgroundColor: 'primary.main',
            color: 'primary.contrastText',
            '&:hover': {
              backgroundColor: 'primary.dark',
            },
          },
        },
      }}
    >
      <ToggleButton value="month">{t('calendar.views.month')}</ToggleButton>
      <ToggleButton value="week">{t('calendar.views.week')}</ToggleButton>
    </ToggleButtonGroup>
  );
}

function WeeklyCalendar({
  currentDate,
  onNavigate,
  rooms,
  reservations,
  onDayClick,
  onReservationSelect,
  weekdays,
  dateLocale,
}) {
  const today = startOfToday();
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = useMemo(
    () => getWeekDays(weekStart),
    [weekStart],
  );
  const weekEnd = weekDays[6];
  const weekHeaderLabel = useMemo(
    () => getWeekHeaderLabel({ weekStart, weekEnd, dateLocale }),
    [dateLocale, weekEnd, weekStart],
  );
  const groupedRooms = useMemo(() => groupRoomsByProperty(rooms), [rooms]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.6 }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1}
        sx={{
          px: { xs: 1, sm: 1.5 },
          py: { xs: 0.75, sm: 1 },
          borderRadius: 1.5,
          backgroundColor: 'rgba(255,255,255,0.72)',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 10px 24px rgba(16, 42, 51, 0.04)',
        }}
      >
        <IconButton onClick={() => onNavigate('prev')} size="small" sx={{ color: 'text.primary' }}>
          <ArrowBackIos fontSize="inherit" />
        </IconButton>
        <Typography variant="h6" sx={{ color: 'primary.dark', textAlign: 'center', fontSize: { xs: '1rem', sm: '1.1rem' } }}>
          {weekHeaderLabel}
        </Typography>
        <IconButton onClick={() => onNavigate('next')} size="small" sx={{ color: 'text.primary' }}>
          <ArrowForwardIos fontSize="inherit" />
        </IconButton>
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(7, minmax(0, 1fr))', sm: '58px repeat(7, minmax(0, 1fr))' },
          alignItems: 'center',
          columnGap: { xs: 0.25, sm: 0.5 },
        }}
      >
        <Box sx={{ display: { xs: 'none', sm: 'block' } }} />
        {weekDays.map((day, index) => {
          const isActive = isSameDay(day, currentDate);
          return (
            <Box
              key={day.toISOString()}
              sx={{
                minWidth: 0,
                height: 52,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.25,
              }}
            >
              <Box
                sx={{
                  width: isActive ? 38 : 'auto',
                  height: isActive ? 38 : 'auto',
                  minWidth: isActive ? 38 : 0,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  backgroundColor: isActive ? 'primary.main' : 'transparent',
                  color: isActive ? 'primary.contrastText' : 'text.primary',
                }}
              >
                <Stack spacing={0} alignItems="center" sx={{ lineHeight: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontSize: isActive ? '0.9rem' : '0.82rem', lineHeight: 1 }}>
                    {format(day, 'd', { locale: dateLocale })}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'inherit',
                      opacity: isActive ? 0.9 : 0.72,
                      fontSize: isActive ? '0.52rem' : '0.58rem',
                      lineHeight: 1.1,
                    }}
                  >
                    {weekdays[index]}
                  </Typography>
                </Stack>
              </Box>
            </Box>
          );
        })}
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(7, minmax(0, 1fr))', sm: '58px repeat(7, minmax(0, 1fr))', lg: '96px repeat(7, minmax(0, 1fr))' },
          alignItems: 'stretch',
          overflow: 'hidden',
        }}
      >
        {groupedRooms.map((group) => (
          <React.Fragment key={group.name || 'rooms'}>
            {group.name ? (
              <Box
                sx={{
                  gridColumn: '1 / -1',
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  pt: 1,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontWeight: 800,
                    fontSize: { xs: '0.62rem', sm: '0.68rem' },
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  {group.name}
                </Typography>
              </Box>
            ) : null}
            {group.rooms.map((room) => {
              const roomReservations = getReservationsForRoom(reservations, room.id);
              const blocks = buildWeeklyReservationBlocks({ roomReservations, weekStart, weekEnd });

              return (
                <React.Fragment key={room.id}>
                  <Box
                    sx={{
                      gridColumn: { xs: '1 / -1', sm: 'auto' },
                      minHeight: { xs: 22, sm: 46 },
                      display: 'flex',
                      alignItems: { xs: 'flex-end', sm: 'center' },
                      pr: { xs: 0, sm: 1 },
                      pt: { xs: 0.6, sm: 0 },
                      pb: { xs: 0.15, sm: 0 },
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{
                        width: '100%',
                        color: 'text.primary',
                        fontSize: { xs: '0.75rem', sm: '0.88rem' },
                        fontWeight: 700,
                        lineHeight: { xs: 1.15, sm: 1 },
                        overflowWrap: 'anywhere',
                      }}
                    >
                      {room.name}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      gridColumn: { xs: '1 / -1', sm: 'span 7' },
                      position: 'relative',
                      minHeight: { xs: 38, sm: 46 },
                      display: 'grid',
                      gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                      backgroundImage:
                        'repeating-linear-gradient(to right, rgba(16,42,51,0.065) 0 1px, transparent 1px calc(100% / 7))',
                    }}
                  >
                    {weekDays.map((day) => {
                      const isPast = isBefore(day, today);
                      return (
                        <Box
                          key={day.toISOString()}
                          onClick={() => {
                            if (!isPast) onDayClick?.(day, room);
                          }}
                          sx={{
                            minHeight: { xs: 38, sm: 46 },
                            cursor: isPast ? 'not-allowed' : 'pointer',
                            backgroundColor: isPast ? 'rgba(16,42,51,0.012)' : 'transparent',
                            '&:hover': !isPast ? { backgroundColor: 'rgba(51,180,172,0.06)' } : undefined,
                          }}
                        />
                      );
                    })}

                    {blocks.map((block) => {
                      const guestName = [block.reservation.name, block.reservation.lastname]
                        .filter(Boolean)
                        .join(' ');
                      return (
                        <Box
                          key={block.reservation.id}
                          onClick={(event) => {
                            event.stopPropagation();
                            onReservationSelect?.(block.reservation);
                          }}
                          sx={{
                            position: 'absolute',
                            top: { xs: 5, sm: 8 },
                            left: `calc(${(block.startIndex / 7) * 100}% + 3px)`,
                            width: `calc(${(block.span / 7) * 100}% - 6px)`,
                            height: { xs: 28, sm: 30 },
                            display: 'flex',
                            alignItems: 'center',
                            px: { xs: 0.75, sm: 1 },
                            borderRadius: 1,
                            backgroundColor: block.color,
                            color: block.textColor,
                            fontWeight: 700,
                            fontSize: { xs: '0.68rem', sm: '0.74rem', lg: '0.78rem' },
                            lineHeight: 1,
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                            cursor: 'pointer',
                            boxShadow: '0 8px 16px rgba(16, 42, 51, 0.06)',
                          }}
                          title={guestName}
                        >
                          {guestName || buildInitials(block.reservation.name, block.reservation.lastname)}
                        </Box>
                      );
                    })}
                  </Box>
                </React.Fragment>
              );
            })}
          </React.Fragment>
        ))}
      </Box>
    </Box>
  );
}

const DayCell = ({ day, room, reservationsForRoom, onDayClick, onReservationSelect }) => {
  const reservation = findReservationForDay(reservationsForRoom, day);
  const hasReservation = Boolean(reservation);
  const isStart = hasReservation && isSameDay(day, safeParseDate(reservation.start_date));
  const today = startOfToday();
  const isPast = !hasReservation && onDayClick && isBefore(day, today);
  const startDate = hasReservation ? safeParseDate(reservation.start_date) : null;
  const endDate = hasReservation ? safeParseDate(reservation.end_date) : null;
  const effectiveEnd = startDate && endDate ? getEffectiveReservationEnd(startDate, endDate) : startDate;
  const reservationLength = getReservationLength({ startDate, effectiveEnd, hasReservation });

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
  const statusMeta = reservation ? getReservationDisplayStatusMeta(reservation) : null;
  const blockColor = statusMeta?.background || '#235369';
  const blockTextColor = statusMeta?.color || '#FFFFFF';

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
        color: hasReservation ? blockTextColor : 'inherit',
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
              color: 'inherit',
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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, paddingTop: 0.5 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        spacing={1}
      >
        <IconButton onClick={() => onNavigate('prev')} size="small">
            <ArrowBackIos fontSize="inherit" />
        </IconButton>
        <Typography variant="h6" sx={{ color: 'primary.dark', textAlign: 'center' }}>
            {format(currentMonth, 'LLLL yyyy', { locale: dateLocale })}
        </Typography>
        <IconButton onClick={() => onNavigate('next')} size="small">
            <ArrowForwardIos fontSize="inherit" />
        </IconButton>
      </Stack>

        <FormControl
          size="small"
          fullWidth
          sx={{
          minWidth: { xs: 'auto', sm: 200 },
          maxWidth: { xs: '100%', sm: 280 },
          width: { xs: '100%', sm: 'auto' },
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

      {instructions && (
        <Typography variant="caption" color="text.secondary">
          {instructions}
        </Typography>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 0.5 }}>
        {(weekdays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']).map((label) => (
          <Box key={label} sx={{ textAlign: 'center', py: 0.6 }}>
            <Typography variant="caption" color="text.secondary">
              {label}
            </Typography>
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
  const reservation = findReservationForDay(reservations, day);
  const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
  const isPast = isBefore(day, today);
  const hasReservation = Boolean(reservation);
  const label = format(day, 'd', { locale: dateLocale });
  const startDate = hasReservation ? safeParseDate(reservation.start_date) : null;
  const isStart = hasReservation && startDate && isSameDay(day, startDate);
  const statusMeta = reservation ? getReservationDisplayStatusMeta(reservation) : null;
  const blockColor = statusMeta?.background || '#235369';
  const blockTextColor = statusMeta?.color || '#102A33';

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
        minHeight: 54,
        borderRadius: 1,
        border: '1px solid',
        borderColor: hasReservation ? blockColor : 'divider',
        backgroundColor: hasReservation ? blockColor : 'background.paper',
        color: hasReservation ? blockTextColor : isPast ? 'text.disabled' : 'inherit',
        opacity: isCurrentMonth ? 1 : 0.4,
        p: 0.65,
        cursor: hasReservation ? 'pointer' : isPast ? 'not-allowed' : 'pointer',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 0.5,
        boxShadow: 'none',
        transition: 'background-color 0.16s ease, border-color 0.16s ease',
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{ fontSize: '0.86rem', fontWeight: 700, color: 'inherit' }}
      >
        {label}
      </Typography>
      {hasReservation && (
        isStart ? (
          <Typography
            variant="caption"
            noWrap
            sx={{
              color: 'inherit',
              fontSize: '0.58rem',
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            {[reservation.name, reservation.lastname].filter(Boolean).join(' ') ||
              buildInitials(reservation.name, reservation.lastname)}
          </Typography>
        ) : (
          <Box sx={{ width: '100%', height: 1 }} />
        )
      )}
    </Box>
  );
};
