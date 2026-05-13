import { useCallback, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { deleteReservation } from '../api/reservations.js';
import { getReservationStatusMeta } from '../utils/reservationStatus.js';

export function useReservationDetailData({ reservation, t, language, dateLocale }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [error, setError] = useState(null);

  const statusMeta = getReservationStatusMeta(reservation.status);
  const normalizedStatus = reservation.status === 'booking' ? 'confirmed' : reservation.status;
  const normalizedConfirmationMethod =
    reservation.confirmation_method ?? (reservation.status === 'booking' ? 'booking_com' : null);
  const confirmationMethodLabelKey = {
    paid_full: 'reservationConfirmationMethod.paidFull',
    booking_com: 'reservationConfirmationMethod.bookingCom',
    other: 'reservationConfirmationMethod.other',
  }[normalizedConfirmationMethod];

  const guestName = [reservation.name, reservation.lastname].filter(Boolean).join(' ') || '—';
  const propertyName = reservation.property?.name || '—';
  const roomName = reservation.room?.name || '—';
  const totalPrice = reservation.total_price ?? reservation.price;

  const backPath = useMemo(() => {
    const from = location.state?.from;
    return from === '/dashboard/calendar' || from === '/dashboard' ? from : '/dashboard';
  }, [location.state]);

  const formatDate = useCallback(
    (value) => {
      const date = value ? new Date(value) : null;
      return date && !Number.isNaN(date.getTime())
        ? format(date, 'd MMM yyyy', { locale: dateLocale })
        : '—';
    },
    [dateLocale],
  );

  const numberFormatter = useMemo(
    () =>
      new Intl.NumberFormat(language === 'pl' ? 'pl-PL' : 'en-US', {
        style: 'currency',
        currency: 'PLN',
        maximumFractionDigits: 2,
      }),
    [language],
  );

  const formatMoney = (value) =>
    value !== undefined && value !== null && value !== ''
      ? numberFormatter.format(Number(value))
      : '—';

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteReservation(reservation.id);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || t('reservationDetail.deleteError'));
      setIsDeleting(false);
      setConfirmDeleteOpen(false);
    }
  };

  return {
    backPath,
    statusMeta,
    normalizedStatus,
    confirmationMethodLabelKey,
    guestName,
    propertyName,
    roomName,
    totalPrice,
    formatDate,
    formatMoney,
    isDeleting,
    confirmDeleteOpen,
    setConfirmDeleteOpen,
    error,
    handleDelete,
  };
}
