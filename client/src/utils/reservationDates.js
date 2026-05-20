export const parseDateValueToUtcDay = (value) => {
  const parts = String(value || '').split('-');
  if (parts.length !== 3) return null;

  const [yearRaw, monthRaw, dayRaw] = parts;
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  const utc = Date.UTC(year, month - 1, day);
  const parsedDate = new Date(utc);

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.getUTCFullYear() !== year ||
    parsedDate.getUTCMonth() !== month - 1 ||
    parsedDate.getUTCDate() !== day
  ) {
    return null;
  }

  return utc;
};

export const calculateReservationNights = (startDate, endDate) => {
  const startUtc = parseDateValueToUtcDay(startDate);
  const endUtc = parseDateValueToUtcDay(endDate);

  if (startUtc === null || endUtc === null) return null;

  const nights = (endUtc - startUtc) / (1000 * 60 * 60 * 24);

  if (!Number.isInteger(nights) || nights <= 0) return null;

  return nights;
};

export const formatDateValue = (date = new Date()) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';

  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const formatPolishNights = (nights) => {
  const lastDigit = nights % 10;
  const lastTwoDigits = nights % 100;

  if (nights === 1) return '1 doba';
  if (lastDigit >= 2 && lastDigit <= 4 && !(lastTwoDigits >= 12 && lastTwoDigits <= 14)) {
    return `${nights} doby`;
  }
  return `${nights} dób`;
};

export const formatReservationNights = (nights, language = 'en') => {
  if (!Number.isInteger(nights) || nights <= 0) return '';

  if (language === 'pl') {
    return formatPolishNights(nights);
  }

  return `${nights} ${nights === 1 ? 'night' : 'nights'}`;
};
