import { createHttpError } from '../utils/httpError.js';
import { calculateNumberOfNights } from '../utils/reservationRules.js';

export const GUEST_MESSAGE_TYPES = {
  deposit_request: {
    labelKey: 'guestMessages.types.depositRequest',
    propertyFlag: 'message_deposit_request_enabled',
  },
  deposit_received_confirmation: {
    labelKey: 'guestMessages.types.depositReceivedConfirmation',
    propertyFlag: 'message_deposit_confirmation_enabled',
  },
  booking_confirmation: {
    labelKey: 'guestMessages.types.bookingConfirmation',
    propertyFlag: 'message_booking_confirmation_enabled',
  },
  custom_message: {
    labelKey: 'guestMessages.types.customMessage',
    propertyFlag: 'message_custom_enabled',
  },
};

const MESSAGE_TYPE_VALUES = Object.keys(GUEST_MESSAGE_TYPES);
const SUPPORTED_LANGUAGES = new Set(['pl', 'en']);

const COPY = {
  pl: {
    fallbackPropertyName: 'obiekcie',
    reservationPrefix: 'Rezerwacja',
    depositRequestSubject: (propertyName) => `Rezerwacja w ${propertyName} - dane do wpłaty zaliczki`,
    depositReceivedSubject: (propertyName) => `Potwierdzenie rezerwacji - ${propertyName}`,
    bookingConfirmationSubject: (propertyName) => `Potwierdzenie rezerwacji w ${propertyName}`,
    greeting: (firstName) => `Dzień dobry${firstName ? ` ${firstName}` : ''},`,
    thanksInterest: 'dziękujemy za zainteresowanie naszym obiektem.',
    depositRequest: (propertyName, depositAmount, dueDate) =>
      `Aby potwierdzić rezerwację w obiekcie ${propertyName}, prosimy o wpłatę zaliczki w wysokości ${depositAmount} do ${dueDate}.`,
    paymentDetails: 'Dane do przelewu:',
    paymentRecipient: (value) => `Odbiorca: ${value}`,
    paymentAccount: (value) => `Numer konta: ${value}`,
    transferTitle: (value) => `Tytuł przelewu: ${value}`,
    rulesAttachment:
      'W załączniku przesyłamy regulamin obiektu. Prosimy o zapoznanie się z nim przed dokonaniem wpłaty.',
    depositAfterPayment: 'Po zaksięgowaniu zaliczki wyślemy potwierdzenie rezerwacji.',
    thanksDeposit: 'dziękujemy za dokonanie wpłaty zaliczki.',
    reservationConfirmed: (propertyName) => `Rezerwacja w obiekcie ${propertyName} jest potwierdzona.`,
    bookingConfirmed: (propertyName) => `potwierdzamy rezerwację w obiekcie ${propertyName}.`,
    paymentSummary: 'Podsumowanie płatności:',
    totalPrice: (value) => `Kwota za pobyt: ${value}`,
    depositPaid: (value) => `Wpłacona zaliczka: ${value}`,
    deposit: (value) => `Zaliczka: ${value}`,
    remainingAmount: (value) => `Pozostało do zapłaty: ${value}`,
    checkIn: (value) => `Zameldowanie: od ${value}`,
    checkOut: (value) => `Wymeldowanie: do ${value}`,
    staySummary: 'Szczegóły pobytu:',
    property: (value) => `Obiekt: ${value}`,
    dateRange: (start, end) => `Termin: ${start} - ${end}`,
    nights: (value) => `Liczba nocy: ${value}`,
    adults: (value) => `Dorośli: ${value}`,
    children: (value) => `Dzieci: ${value}`,
    cancellationHeader: 'Warunki anulacji:',
    rulesHeader: 'Regulamin obiektu:',
    cancellationDays: (days) =>
      Number(days) === 0
        ? 'Gość może bezpłatnie anulować rezerwację najpóźniej w dniu przyjazdu.'
        : Number(days) === 1
          ? 'Gość może bezpłatnie anulować rezerwację najpóźniej 1 dzień przed przyjazdem.'
        : `Gość może bezpłatnie anulować rezerwację najpóźniej ${days} dni przed przyjazdem.`,
    depositRefundPolicy: {
      refundable: 'W przypadku anulacji w bezpłatnym terminie wpłacona zaliczka podlega zwrotowi.',
      non_refundable: 'Wpłacona zaliczka nie podlega zwrotowi.',
      partially_refundable: 'Zasady częściowego zwrotu zaliczki opisuje dodatkowa informacja.',
      custom: 'Zasady zwrotu zaliczki opisuje dodatkowa informacja.',
    },
    contactHeader: 'W razie pytań prosimy o kontakt:',
  },
  en: {
    fallbackPropertyName: 'the property',
    reservationPrefix: 'Reservation',
    depositRequestSubject: (propertyName) => `Reservation at ${propertyName} - deposit payment details`,
    depositReceivedSubject: (propertyName) => `Reservation confirmation - ${propertyName}`,
    bookingConfirmationSubject: (propertyName) => `Reservation confirmation at ${propertyName}`,
    greeting: (firstName) => `Hello${firstName ? ` ${firstName}` : ''},`,
    thanksInterest: 'thank you for your interest in our property.',
    depositRequest: (propertyName, depositAmount, dueDate) =>
      `To confirm your reservation at ${propertyName}, please pay a deposit of ${depositAmount} by ${dueDate}.`,
    paymentDetails: 'Bank transfer details:',
    paymentRecipient: (value) => `Recipient: ${value}`,
    paymentAccount: (value) => `Account / IBAN: ${value}`,
    transferTitle: (value) => `Transfer title: ${value}`,
    rulesAttachment: 'We are attaching the property rules. Please read them before making the payment.',
    depositAfterPayment: 'After the deposit is booked, we will send the reservation confirmation.',
    thanksDeposit: 'thank you for paying the deposit.',
    reservationConfirmed: (propertyName) => `Your reservation at ${propertyName} is confirmed.`,
    bookingConfirmed: (propertyName) => `we confirm your reservation at ${propertyName}.`,
    paymentSummary: 'Payment summary:',
    totalPrice: (value) => `Total stay price: ${value}`,
    depositPaid: (value) => `Deposit paid: ${value}`,
    deposit: (value) => `Deposit: ${value}`,
    remainingAmount: (value) => `Remaining amount: ${value}`,
    checkIn: (value) => `Check-in: from ${value}`,
    checkOut: (value) => `Check-out: by ${value}`,
    staySummary: 'Stay summary:',
    property: (value) => `Property: ${value}`,
    dateRange: (start, end) => `Dates: ${start} - ${end}`,
    nights: (value) => `Number of nights: ${value}`,
    adults: (value) => `Adults: ${value}`,
    children: (value) => `Children: ${value}`,
    cancellationHeader: 'Cancellation terms:',
    rulesHeader: 'Property rules:',
    cancellationDays: (days) =>
      Number(days) === 0
        ? 'The guest may cancel free of charge no later than on the arrival day.'
        : Number(days) === 1
          ? 'The guest may cancel free of charge no later than 1 day before arrival.'
        : `The guest may cancel free of charge no later than ${days} days before arrival.`,
    depositRefundPolicy: {
      refundable: 'The paid deposit is refundable if the reservation is cancelled within the free cancellation period.',
      non_refundable: 'The paid deposit is non-refundable.',
      partially_refundable: 'Partial deposit refund rules are described in the additional note.',
      custom: 'Deposit refund rules are described in the additional note.',
    },
    contactHeader: 'If you have any questions, please contact us:',
  },
};

const normalizeLanguage = (language) => (SUPPORTED_LANGUAGES.has(language) ? language : 'pl');

const moneyFormatter = (language) =>
  new Intl.NumberFormat(language === 'en' ? 'en-US' : 'pl-PL', {
    style: 'currency',
    currency: 'PLN',
    maximumFractionDigits: 2,
  });

const dateFormatter = (language) =>
  new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

const normalizeMessageType = (type) => {
  if (MESSAGE_TYPE_VALUES.includes(type)) return type;
  throw createHttpError(400, 'Invalid guest message type.', { field: 'type' }, 'VALIDATION_ERROR');
};

const toBooleanOption = (value, fallback) => {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  return String(value).toLowerCase() === 'true';
};

const formatDate = (value, language) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? dateFormatter(language).format(date) : '—';
};

const formatMoney = (value, language) =>
  value !== undefined && value !== null && value !== ''
    ? moneyFormatter(language).format(Number(value))
    : '—';

const numberOrNull = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const firstNonEmpty = (...values) =>
  values.find((value) => value !== undefined && value !== null && String(value).trim() !== '') ?? null;

export function getAvailableGuestMessageTypes(reservation) {
  const property = reservation?.property || {};
  if (property.guest_messages_enabled === false) {
    return [];
  }

  const externalReservation = reservation?.confirmation_method === 'booking_com';

  return MESSAGE_TYPE_VALUES
    .filter((type) => property[GUEST_MESSAGE_TYPES[type].propertyFlag] !== false)
    .map((type) => ({
      type,
      labelKey: GUEST_MESSAGE_TYPES[type].labelKey,
      recommended: type === getRecommendedGuestMessageType(reservation),
      discouraged: externalReservation && type !== 'custom_message',
    }));
}

export function getRecommendedGuestMessageType(reservation) {
  if (reservation?.property?.guest_messages_enabled === false) {
    return '';
  }

  const available = new Set(
    MESSAGE_TYPE_VALUES.filter(
      (type) => reservation?.property?.[GUEST_MESSAGE_TYPES[type].propertyFlag] !== false,
    ),
  );

  if (reservation?.confirmation_method === 'booking_com' && available.has('custom_message')) {
    return 'custom_message';
  }

  if (reservation?.status === 'preliminary' && available.has('deposit_request')) {
    return 'deposit_request';
  }

  if (reservation?.status === 'deposit_paid' && available.has('deposit_received_confirmation')) {
    return 'deposit_received_confirmation';
  }

  if (available.has('booking_confirmation')) {
    return 'booking_confirmation';
  }

  return available.values().next().value ?? 'custom_message';
}

export function buildGuestMessagePreview(reservation, options = {}) {
  const language = normalizeLanguage(options.language);
  const text = COPY[language];
  if (reservation?.property?.guest_messages_enabled === false) {
    throw createHttpError(
      400,
      'Guest messages are disabled for this property.',
      { field: 'guest_messages_enabled' },
      'VALIDATION_ERROR',
    );
  }

  const type = normalizeMessageType(options.type || getRecommendedGuestMessageType(reservation));
  const includeRules = toBooleanOption(options.includeRules, type === 'deposit_request');
  const includeCancellation = toBooleanOption(options.includeCancellation, type !== 'custom_message');
  const includeSummary = toBooleanOption(options.includeSummary, type !== 'custom_message');
  const property = reservation.property || {};

  const context = buildContext(reservation, language, text);
  const draft = buildDraftByType(type, context, text, { includeRules });
  const sections = [];

  if (includeSummary && draft.includeSummary !== false) {
    sections.push(buildReservationSummary(context, text));
  }

  if (includeCancellation) {
    const cancellation = buildCancellationText(property, text);
    if (cancellation) {
      sections.push([text.cancellationHeader, cancellation].join('\n'));
    }
  }

  if (includeRules && property.terms_text) {
    sections.push([text.rulesHeader, property.terms_text].join('\n'));
  }

  const body = [draft.body, ...sections].filter(Boolean).join('\n\n');

  return {
    type,
    recipientEmail: reservation.mail || '',
    subject: draft.subject,
    body,
    availableTypes: getAvailableGuestMessageTypes(reservation),
    recommendedType: getRecommendedGuestMessageType(reservation),
    options: {
      includeRules,
      includeCancellation,
      includeSummary,
    },
    sendEnabled: false,
  };
}

function buildContext(reservation, language, text) {
  const property = reservation.property || {};
  const totalPrice = reservation.total_price ?? reservation.price;
  const depositAmount = resolveMessageDepositAmount(reservation, property);
  const remainingAmount =
    totalPrice !== undefined && totalPrice !== null && depositAmount !== null
      ? Number(totalPrice) - Number(depositAmount)
      : null;
  const nights = calculateNumberOfNights(reservation.start_date, reservation.end_date);
  const checkInDate = formatDate(reservation.start_date, language);

  return {
    guestFirstName: firstNonEmpty(reservation.name, ''),
    guestLastName: firstNonEmpty(reservation.lastname, ''),
    propertyName: firstNonEmpty(property.name, reservation.property?.name, text.fallbackPropertyName),
    checkInDate,
    checkOutDate: formatDate(reservation.end_date, language),
    depositDueDate: resolveDepositDueDate(reservation, property, language),
    depositAmount: formatMoney(depositAmount, language),
    totalPrice: formatMoney(totalPrice, language),
    remainingAmount: formatMoney(remainingAmount, language),
    nights: nights || '—',
    adults: reservation.adults ?? '—',
    children: reservation.children ?? '—',
    paymentRecipient: firstNonEmpty(property.payment_recipient, '—'),
    paymentAccount: firstNonEmpty(property.payment_account, '—'),
    propertyContactEmail: firstNonEmpty(property.contact_email, null),
    propertyContactPhone: firstNonEmpty(property.contact_phone, null),
    propertyAddress: firstNonEmpty(property.address, null),
    checkInTime: firstNonEmpty(property.check_in_time, '—'),
    checkOutTime: firstNonEmpty(property.check_out_time, '—'),
    checkInInstructions: firstNonEmpty(property.check_in_instructions, null),
    checkOutInstructions: firstNonEmpty(property.check_out_instructions, null),
    transferTitle: `${text.reservationPrefix} ${firstNonEmpty(reservation.lastname, '')} ${checkInDate}`.trim(),
  };
}

function buildDraftByType(type, context, text, options = {}) {
  if (type === 'custom_message') {
    return {
      subject: '',
      body: '',
      includeSummary: false,
    };
  }

  if (type === 'deposit_request') {
    return {
      subject: text.depositRequestSubject(context.propertyName),
      body: [
        text.greeting(context.guestFirstName),
        '',
        text.thanksInterest,
        '',
        text.depositRequest(context.propertyName, context.depositAmount, context.depositDueDate),
        '',
        text.paymentDetails,
        text.paymentRecipient(context.paymentRecipient),
        text.paymentAccount(context.paymentAccount),
        text.transferTitle(context.transferTitle),
        '',
        options.includeRules ? text.rulesAttachment : null,
        options.includeRules ? '' : null,
        text.depositAfterPayment,
      ].filter((line) => line !== null).join('\n'),
    };
  }

  if (type === 'deposit_received_confirmation') {
    return {
      subject: text.depositReceivedSubject(context.propertyName),
      body: [
        text.greeting(context.guestFirstName),
        '',
        text.thanksDeposit,
        '',
        text.reservationConfirmed(context.propertyName),
        '',
        text.paymentSummary,
        text.totalPrice(context.totalPrice),
        text.depositPaid(context.depositAmount),
        text.remainingAmount(context.remainingAmount),
        '',
        text.checkIn(context.checkInTime),
        text.checkOut(context.checkOutTime),
        '',
        buildContactText(context, text),
      ].filter(Boolean).join('\n'),
    };
  }

  return {
    subject: text.bookingConfirmationSubject(context.propertyName),
    body: [
      text.greeting(context.guestFirstName),
      '',
      text.bookingConfirmed(context.propertyName),
      '',
      text.paymentSummary,
      text.totalPrice(context.totalPrice),
      text.deposit(context.depositAmount),
      text.remainingAmount(context.remainingAmount),
      '',
      text.checkIn(context.checkInTime),
      text.checkOut(context.checkOutTime),
      context.checkInInstructions,
      context.checkOutInstructions,
      '',
      buildContactText(context, text),
    ].filter(Boolean).join('\n'),
  };
}

function buildReservationSummary(context, text) {
  return [
    text.staySummary,
    text.property(context.propertyName),
    text.dateRange(context.checkInDate, context.checkOutDate),
    text.nights(context.nights),
    text.adults(context.adults),
    text.children(context.children),
  ].join('\n');
}

export function buildCancellationText(property, text = COPY.pl) {
  const parts = [];

  if (property.cancellation_free_until_days !== null && property.cancellation_free_until_days !== undefined) {
    parts.push(text.cancellationDays(property.cancellation_free_until_days));
  }

  const depositPolicyText = text.depositRefundPolicy[property.deposit_refund_policy];
  if (depositPolicyText) {
    parts.push(depositPolicyText);
  }

  if (property.cancellation_policy_note) {
    parts.push(property.cancellation_policy_note);
  }

  return parts.join(' ');
}

function buildContactText(context, text) {
  const lines = [
    text.contactHeader,
    context.propertyContactEmail,
    context.propertyContactPhone,
    context.propertyAddress,
  ].filter(Boolean);

  return lines.length > 1 ? lines.join('\n') : null;
}

function resolveMessageDepositAmount(reservation, property) {
  const configuredValue = numberOrNull(property.deposit_value);

  if (configuredValue !== null && property.deposit_type === 'percent') {
    const totalPrice = numberOrNull(reservation.total_price ?? reservation.price);
    return totalPrice !== null ? (totalPrice * configuredValue) / 100 : null;
  }

  if (configuredValue !== null && property.deposit_type === 'amount') {
    return configuredValue;
  }

  return numberOrNull(reservation.deposit_amount);
}

function resolveDepositDueDate(reservation, property, language) {
  const dueDays = numberOrNull(property.deposit_due_days);
  const startDate = reservation.start_date ? new Date(reservation.start_date) : null;

  if (dueDays === null || !startDate || Number.isNaN(startDate.getTime())) {
    return '—';
  }

  const dueDate = new Date(startDate);
  dueDate.setDate(dueDate.getDate() - dueDays);
  return formatDate(dueDate.toISOString(), language);
}
