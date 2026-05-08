import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDays, format, startOfToday } from 'date-fns';
import ReservationFormDialog from './ReservationFormDialog.jsx';
import { createReservation } from '../api/reservations.js';
import { useLocale } from '../context/LocaleContext.jsx';
import { DEFAULT_RESERVATION_STATUS } from '../utils/reservationStatus.js';
import { useReservationFormData } from '../hooks/useReservationFormData.js';

const formatDateInput = (date) => format(date, 'yyyy-MM-dd');

const buildInitialValues = (propertyId = '') => {
  const today = startOfToday();
  return {
    property_id: propertyId,
    start_date: formatDateInput(today),
    end_date: formatDateInput(addDays(today, 1)),
    status: DEFAULT_RESERVATION_STATUS,
  };
};

function AddReservation() {
  const navigate = useNavigate();
  const { t } = useLocale();
  const errorMessages = useMemo(
    () => ({
      properties: t('dashboard.errors.properties'),
      rooms: t('dashboard.errors.rooms'),
      reservations: t('dashboard.errors.reservations'),
    }),
    [t],
  );

  const {
    properties,
    rooms,
    reservations,
    selectedPropertyId,
    setSelectedPropertyId,
    loading,
    errors,
  } = useReservationFormData('', errorMessages);
  const [initialValues, setInitialValues] = useState(() => buildInitialValues());

  useEffect(() => {
    if (!selectedPropertyId) return;
    setInitialValues((current) => {
      if (current.property_id) return current;
      return {
        ...current,
        property_id: selectedPropertyId,
      };
    });
  }, [selectedPropertyId]);

  const handleSubmit = async (formValues) => {
    await createReservation(formValues);
    navigate('/dashboard');
  };

  const handleCancel = () => navigate('/dashboard');

  return (
    <ReservationFormDialog
      title={t('reservationForm.addTitle')}
      initialValues={initialValues}
      submitLabel={t('reservationForm.submitCreate')}
      submittingLabel={t('reservationForm.submitCreating')}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      properties={properties}
      rooms={rooms}
      onPropertyChange={setSelectedPropertyId}
      loadingProperties={loading.properties}
      loadingRooms={loading.rooms}
      dataError={errors.combined}
      minDate={formatDateInput(startOfToday())}
      existingReservations={reservations}
    />
  );
}

export default AddReservation;
