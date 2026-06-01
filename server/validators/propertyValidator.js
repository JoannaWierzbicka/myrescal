import { createHttpError } from '../utils/httpError.js';
import { z } from 'zod';
import {
  optionalNonNegativeInteger,
  optionalNonNegativeNumber,
  optionalTrimmedString,
  parseSchema,
  requiredTrimmedString,
} from './schemaUtils.js';

const MAX_EMAIL_LENGTH = 254;
const MAX_PHONE_LENGTH = 25;
const MAX_ADDRESS_LENGTH = 500;
const MAX_INSTRUCTIONS_LENGTH = 2000;
const MAX_CANCELLATION_NOTE_LENGTH = 2000;
const MAX_TERMS_LENGTH = 10000;
const MAX_PAYMENT_RECIPIENT_LENGTH = 160;
const MAX_PAYMENT_ACCOUNT_LENGTH = 80;
const PHONE_INPUT_REGEX = /^\+?[\d\s\-()]{6,25}$/;
const EMAIL_INPUT_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEPOSIT_REFUND_POLICIES = new Set([
  'refundable',
  'non_refundable',
  'partially_refundable',
  'custom',
]);
const DEPOSIT_TYPES = new Set(['percent', 'amount']);

const propertySchema = z
  .object({
    name: requiredTrimmedString(120, 'Property name'),
    description: optionalTrimmedString(1000, 'Description').optional(),
    contactEmail: optionalTrimmedString(MAX_EMAIL_LENGTH, 'Contact email').optional(),
    contact_email: optionalTrimmedString(MAX_EMAIL_LENGTH, 'Contact email').optional(),
    contactPhone: optionalTrimmedString(MAX_PHONE_LENGTH, 'Contact phone').optional(),
    contact_phone: optionalTrimmedString(MAX_PHONE_LENGTH, 'Contact phone').optional(),
    address: optionalTrimmedString(MAX_ADDRESS_LENGTH, 'Address').optional(),
    checkInTime: optionalTrimmedString(20, 'Check-in time').optional(),
    check_in_time: optionalTrimmedString(20, 'Check-in time').optional(),
    checkOutTime: optionalTrimmedString(20, 'Check-out time').optional(),
    check_out_time: optionalTrimmedString(20, 'Check-out time').optional(),
    checkInInstructions: optionalTrimmedString(MAX_INSTRUCTIONS_LENGTH, 'Check-in instructions').optional(),
    check_in_instructions: optionalTrimmedString(MAX_INSTRUCTIONS_LENGTH, 'Check-in instructions').optional(),
    checkOutInstructions: optionalTrimmedString(MAX_INSTRUCTIONS_LENGTH, 'Check-out instructions').optional(),
    check_out_instructions: optionalTrimmedString(MAX_INSTRUCTIONS_LENGTH, 'Check-out instructions').optional(),
    cancellationFreeUntilDays: optionalNonNegativeInteger('cancellationFreeUntilDays').optional(),
    cancellation_free_until_days: optionalNonNegativeInteger('cancellation_free_until_days').optional(),
    depositRefundPolicy: optionalTrimmedString(40, 'Deposit refund policy').optional(),
    deposit_refund_policy: optionalTrimmedString(40, 'Deposit refund policy').optional(),
    cancellationPolicyNote: optionalTrimmedString(MAX_CANCELLATION_NOTE_LENGTH, 'Cancellation policy note').optional(),
    cancellation_policy_note: optionalTrimmedString(MAX_CANCELLATION_NOTE_LENGTH, 'Cancellation policy note').optional(),
    termsText: optionalTrimmedString(MAX_TERMS_LENGTH, 'Property rules').optional(),
    terms_text: optionalTrimmedString(MAX_TERMS_LENGTH, 'Property rules').optional(),
    paymentRecipient: optionalTrimmedString(MAX_PAYMENT_RECIPIENT_LENGTH, 'Payment recipient').optional(),
    payment_recipient: optionalTrimmedString(MAX_PAYMENT_RECIPIENT_LENGTH, 'Payment recipient').optional(),
    paymentAccount: optionalTrimmedString(MAX_PAYMENT_ACCOUNT_LENGTH, 'Payment account').optional(),
    payment_account: optionalTrimmedString(MAX_PAYMENT_ACCOUNT_LENGTH, 'Payment account').optional(),
    depositType: optionalTrimmedString(20, 'Deposit type').optional(),
    deposit_type: optionalTrimmedString(20, 'Deposit type').optional(),
    depositValue: optionalNonNegativeNumber('depositValue').optional(),
    deposit_value: optionalNonNegativeNumber('deposit_value').optional(),
    depositDueDays: optionalNonNegativeInteger('depositDueDays').optional(),
    deposit_due_days: optionalNonNegativeInteger('deposit_due_days').optional(),
    guestMessagesEnabled: z.boolean().optional(),
    guest_messages_enabled: z.boolean().optional(),
    messageDepositRequestEnabled: z.boolean().optional(),
    message_deposit_request_enabled: z.boolean().optional(),
    messageDepositConfirmationEnabled: z.boolean().optional(),
    message_deposit_confirmation_enabled: z.boolean().optional(),
    messageBookingConfirmationEnabled: z.boolean().optional(),
    message_booking_confirmation_enabled: z.boolean().optional(),
    messageCustomEnabled: z.boolean().optional(),
    message_custom_enabled: z.boolean().optional(),
  })
  .passthrough();

const normalizeString = (value) => {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed.length === 0 ? null : trimmed;
};

const normalizeEmail = (value) => {
  const normalized = normalizeString(value);
  if (!normalized) return null;

  const lowercased = normalized.toLowerCase();
  if (!EMAIL_INPUT_REGEX.test(lowercased)) {
    throw createHttpError(400, 'Invalid contact email.', { field: 'contact_email' }, 'VALIDATION_ERROR');
  }

  return lowercased;
};

const normalizePhone = (value) => {
  const normalized = normalizeString(value);
  if (!normalized) return null;

  if (!PHONE_INPUT_REGEX.test(normalized)) {
    throw createHttpError(400, 'Invalid contact phone.', { field: 'contact_phone' }, 'VALIDATION_ERROR');
  }

  const digits = normalized.replace(/\D/g, '');
  if (digits.length < 6 || digits.length > 15) {
    throw createHttpError(400, 'Invalid contact phone.', { field: 'contact_phone' }, 'VALIDATION_ERROR');
  }

  return `${normalized.startsWith('+') ? '+' : ''}${digits}`;
};

const normalizeDepositRefundPolicy = (value) => {
  const normalized = normalizeString(value);
  if (!normalized) return null;

  if (!DEPOSIT_REFUND_POLICIES.has(normalized)) {
    throw createHttpError(
      400,
      'Invalid deposit refund policy.',
      { field: 'deposit_refund_policy' },
      'VALIDATION_ERROR',
    );
  }

  return normalized;
};

const normalizeDepositType = (value) => {
  const normalized = normalizeString(value);
  if (!normalized) return null;

  if (!DEPOSIT_TYPES.has(normalized)) {
    throw createHttpError(
      400,
      'Invalid deposit type.',
      { field: 'deposit_type' },
      'VALIDATION_ERROR',
    );
  }

  return normalized;
};

const normalizeBoolean = (value, fallback) =>
  typeof value === 'boolean' ? value : fallback;

export const validatePropertyPayload = (payload) => {
  if (!payload || typeof payload !== 'object') {
    throw createHttpError(400, 'Invalid property payload.');
  }

  const parsedPayload = parseSchema(propertySchema, payload, 'Invalid property payload.');
  const depositType = normalizeDepositType(parsedPayload.depositType ?? parsedPayload.deposit_type);
  const depositValue = parsedPayload.depositValue ?? parsedPayload.deposit_value ?? null;

  if (depositType === 'percent' && depositValue !== null && depositValue > 100) {
    throw createHttpError(
      400,
      'Deposit percent must be between 0 and 100.',
      { field: 'deposit_value' },
      'VALIDATION_ERROR',
    );
  }

  return {
    name: parsedPayload.name,
    description: parsedPayload.description ?? null,
    contact_email: normalizeEmail(parsedPayload.contactEmail ?? parsedPayload.contact_email),
    contact_phone: normalizePhone(parsedPayload.contactPhone ?? parsedPayload.contact_phone),
    address: parsedPayload.address ?? null,
    check_in_time: parsedPayload.checkInTime ?? parsedPayload.check_in_time ?? null,
    check_out_time: parsedPayload.checkOutTime ?? parsedPayload.check_out_time ?? null,
    check_in_instructions:
      parsedPayload.checkInInstructions ?? parsedPayload.check_in_instructions ?? null,
    check_out_instructions:
      parsedPayload.checkOutInstructions ?? parsedPayload.check_out_instructions ?? null,
    cancellation_free_until_days:
      parsedPayload.cancellationFreeUntilDays ?? parsedPayload.cancellation_free_until_days ?? null,
    deposit_refund_policy: normalizeDepositRefundPolicy(
      parsedPayload.depositRefundPolicy ?? parsedPayload.deposit_refund_policy,
    ),
    cancellation_policy_note:
      parsedPayload.cancellationPolicyNote ?? parsedPayload.cancellation_policy_note ?? null,
    terms_text: parsedPayload.termsText ?? parsedPayload.terms_text ?? null,
    payment_recipient: parsedPayload.paymentRecipient ?? parsedPayload.payment_recipient ?? null,
    payment_account: parsedPayload.paymentAccount ?? parsedPayload.payment_account ?? null,
    deposit_type: depositType,
    deposit_value: depositValue,
    deposit_due_days: parsedPayload.depositDueDays ?? parsedPayload.deposit_due_days ?? null,
    guest_messages_enabled: normalizeBoolean(
      parsedPayload.guestMessagesEnabled ?? parsedPayload.guest_messages_enabled,
      true,
    ),
    message_deposit_request_enabled: normalizeBoolean(
      parsedPayload.messageDepositRequestEnabled ??
        parsedPayload.message_deposit_request_enabled,
      true,
    ),
    message_deposit_confirmation_enabled: normalizeBoolean(
      parsedPayload.messageDepositConfirmationEnabled ??
        parsedPayload.message_deposit_confirmation_enabled,
      true,
    ),
    message_booking_confirmation_enabled: normalizeBoolean(
      parsedPayload.messageBookingConfirmationEnabled ??
        parsedPayload.message_booking_confirmation_enabled,
      true,
    ),
    message_custom_enabled: normalizeBoolean(
      parsedPayload.messageCustomEnabled ?? parsedPayload.message_custom_enabled,
      true,
    ),
  };
};
