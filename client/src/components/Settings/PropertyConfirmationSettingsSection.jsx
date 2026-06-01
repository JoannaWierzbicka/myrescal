import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { Save } from '@mui/icons-material';
import { useLocale } from '../../context/LocaleContext.jsx';

const EMPTY_FORM = {
  contactEmail: '',
  contactPhone: '',
  address: '',
  checkInTime: '',
  checkOutTime: '',
  checkInInstructions: '',
  checkOutInstructions: '',
  cancellationFreeUntilDays: '',
  depositRefundPolicy: '',
  cancellationPolicyNote: '',
  termsText: '',
  paymentRecipient: '',
  paymentAccount: '',
  depositType: '',
  depositValue: '',
  depositDueDays: '',
  guestMessagesEnabled: true,
  messageDepositRequestEnabled: true,
  messageDepositConfirmationEnabled: true,
  messageBookingConfirmationEnabled: true,
  messageCustomEnabled: true,
};

const FULL_HOUR_OPTIONS = Array.from({ length: 24 }, (_item, hour) =>
  `${String(hour).padStart(2, '0')}:00`,
);

const buildInitialValues = ({ property }) => ({
  contactEmail: property?.contact_email ?? '',
  contactPhone: property?.contact_phone ?? '',
  address: property?.address ?? '',
  checkInTime: property?.check_in_time ?? '',
  checkOutTime: property?.check_out_time ?? '',
  checkInInstructions: property?.check_in_instructions ?? '',
  checkOutInstructions: property?.check_out_instructions ?? '',
  cancellationFreeUntilDays:
    property?.cancellation_free_until_days === null ||
    property?.cancellation_free_until_days === undefined
      ? ''
      : String(property.cancellation_free_until_days),
  depositRefundPolicy: property?.deposit_refund_policy ?? '',
  cancellationPolicyNote: property?.cancellation_policy_note ?? '',
  termsText: property?.terms_text ?? '',
  paymentRecipient: property?.payment_recipient ?? '',
  paymentAccount: property?.payment_account ?? '',
  depositType: property?.deposit_type ?? '',
  depositValue:
    property?.deposit_value === null || property?.deposit_value === undefined
      ? ''
      : String(property.deposit_value),
  depositDueDays:
    property?.deposit_due_days === null || property?.deposit_due_days === undefined
      ? ''
      : String(property.deposit_due_days),
  guestMessagesEnabled: property?.guest_messages_enabled ?? true,
  messageDepositRequestEnabled: property?.message_deposit_request_enabled ?? true,
  messageDepositConfirmationEnabled: property?.message_deposit_confirmation_enabled ?? true,
  messageBookingConfirmationEnabled: property?.message_booking_confirmation_enabled ?? true,
  messageCustomEnabled: property?.message_custom_enabled ?? true,
});

export default function PropertyConfirmationSettingsSection({ property, onSubmit }) {
  const { t } = useLocale();
  const [formValues, setFormValues] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (!property) {
      setFormValues(EMPTY_FORM);
      return;
    }

    setFormValues(buildInitialValues({ property }));
  }, [property]);

  const cancellationPreview = useMemo(() => {
    const days = Number.parseInt(formValues.cancellationFreeUntilDays, 10);
    const hasDays = Number.isFinite(days) && days >= 0;
    const policy = formValues.depositRefundPolicy;

    if (!hasDays && !policy && !formValues.cancellationPolicyNote.trim()) {
      return t('propertyConfirmationSettings.cancellationPreview.empty');
    }

    const daysText = hasDays
      ? days === 0
        ? t('propertyConfirmationSettings.cancellationPreview.arrivalDay')
        : days === 1
          ? t('propertyConfirmationSettings.cancellationPreview.oneDay')
          : t('propertyConfirmationSettings.cancellationPreview.days', { days })
      : t('propertyConfirmationSettings.cancellationPreview.noDays');
    const policyText = policy
      ? t(`propertyConfirmationSettings.depositPolicies.${policy}Text`)
      : t('propertyConfirmationSettings.cancellationPreview.noDepositPolicy');
    const note = formValues.cancellationPolicyNote.trim();

    return note ? `${daysText} ${policyText} ${note}` : `${daysText} ${policyText}`;
  }, [formValues, t]);

  const handleChange = (event) => {
    const { checked, name, type, value } = event.target;
    setFormValues((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!property) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await onSubmit(property.id, {
        name: property.name,
        description: property.description ?? null,
        contactEmail: formValues.contactEmail,
        contactPhone: formValues.contactPhone,
        address: formValues.address,
        checkInTime: formValues.checkInTime,
        checkOutTime: formValues.checkOutTime,
        checkInInstructions: formValues.checkInInstructions,
        checkOutInstructions: formValues.checkOutInstructions,
        cancellationFreeUntilDays: formValues.cancellationFreeUntilDays,
        depositRefundPolicy: formValues.depositRefundPolicy,
        cancellationPolicyNote: formValues.cancellationPolicyNote,
        termsText: formValues.termsText,
        paymentRecipient: formValues.paymentRecipient,
        paymentAccount: formValues.paymentAccount,
        depositType: formValues.depositType,
        depositValue: formValues.depositValue,
        depositDueDays: formValues.depositDueDays,
        guestMessagesEnabled: formValues.guestMessagesEnabled,
        messageDepositRequestEnabled: formValues.messageDepositRequestEnabled,
        messageDepositConfirmationEnabled: formValues.messageDepositConfirmationEnabled,
        messageBookingConfirmationEnabled: formValues.messageBookingConfirmationEnabled,
        messageCustomEnabled: formValues.messageCustomEnabled,
      });
      setSuccess(t('propertyConfirmationSettings.saveSuccess'));
    } catch (err) {
      setError(err.message || t('propertyConfirmationSettings.errors.save'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card
      sx={{
        borderRadius: 1.5,
        px: { xs: 2, sm: 3, lg: 4 },
        py: { xs: 2.4, sm: 3, lg: 3.5 },
      }}
    >
      <CardContent
        sx={{
          p: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: { xs: 2, sm: 2.5 },
        }}
      >
        <Box>
          <Typography variant="h6">{t('propertyConfirmationSettings.title')}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {property
              ? t('propertyConfirmationSettings.description', { name: property.name })
              : t('propertyConfirmationSettings.selectProperty')}
          </Typography>
        </Box>

        {!property ? (
          <Alert severity="info">{t('settings.selectPropertyHint')}</Alert>
        ) : (
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      name="guestMessagesEnabled"
                      checked={formValues.guestMessagesEnabled}
                      onChange={handleChange}
                    />
                  }
                  label={
                    formValues.guestMessagesEnabled
                      ? t('propertyConfirmationSettings.guestMessagesEnabled')
                      : t('propertyConfirmationSettings.guestMessagesDisabled')
                  }
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {t('propertyConfirmationSettings.guestMessagesEnabledHelp')}
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  {t('propertyConfirmationSettings.contactTitle')}
                </Typography>
                <Stack spacing={2}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                      label={t('propertyConfirmationSettings.contactEmail')}
                      name="contactEmail"
                      type="email"
                      value={formValues.contactEmail}
                      onChange={handleChange}
                      fullWidth
                    />
                    <TextField
                      label={t('propertyConfirmationSettings.contactPhone')}
                      name="contactPhone"
                      value={formValues.contactPhone}
                      onChange={handleChange}
                      fullWidth
                    />
                  </Stack>
                  <TextField
                    label={t('propertyConfirmationSettings.address')}
                    name="address"
                    value={formValues.address}
                    onChange={handleChange}
                    fullWidth
                    multiline
                    minRows={2}
                  />
                </Stack>
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  {t('propertyConfirmationSettings.stayTitle')}
                </Typography>
                <Stack spacing={2}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <FormControl fullWidth>
                      <InputLabel id="check-in-time-label">
                        {t('propertyConfirmationSettings.checkInTime')}
                      </InputLabel>
                      <Select
                        labelId="check-in-time-label"
                        name="checkInTime"
                        value={formValues.checkInTime}
                        label={t('propertyConfirmationSettings.checkInTime')}
                        onChange={handleChange}
                      >
                        <MenuItem value="">{t('propertyConfirmationSettings.timeNotSet')}</MenuItem>
                        {FULL_HOUR_OPTIONS.map((time) => (
                          <MenuItem key={time} value={time}>
                            {time}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl fullWidth>
                      <InputLabel id="check-out-time-label">
                        {t('propertyConfirmationSettings.checkOutTime')}
                      </InputLabel>
                      <Select
                        labelId="check-out-time-label"
                        name="checkOutTime"
                        value={formValues.checkOutTime}
                        label={t('propertyConfirmationSettings.checkOutTime')}
                        onChange={handleChange}
                      >
                        <MenuItem value="">{t('propertyConfirmationSettings.timeNotSet')}</MenuItem>
                        {FULL_HOUR_OPTIONS.map((time) => (
                          <MenuItem key={time} value={time}>
                            {time}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Stack>
                  <TextField
                    label={t('propertyConfirmationSettings.checkInInstructions')}
                    name="checkInInstructions"
                    value={formValues.checkInInstructions}
                    onChange={handleChange}
                    fullWidth
                    multiline
                    minRows={2}
                  />
                  <TextField
                    label={t('propertyConfirmationSettings.checkOutInstructions')}
                    name="checkOutInstructions"
                    value={formValues.checkOutInstructions}
                    onChange={handleChange}
                    fullWidth
                    multiline
                    minRows={2}
                  />
                </Stack>
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  {t('propertyConfirmationSettings.cancellationTitle')}
                </Typography>
                <Stack spacing={2}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                      label={t('propertyConfirmationSettings.cancellationDays')}
                      name="cancellationFreeUntilDays"
                      type="number"
                      value={formValues.cancellationFreeUntilDays}
                      onChange={handleChange}
                      inputProps={{ min: 0, max: 365 }}
                      fullWidth
                    />
                    <FormControl fullWidth>
                      <InputLabel id="deposit-refund-policy-label">
                        {t('propertyConfirmationSettings.depositRefundPolicy')}
                      </InputLabel>
                      <Select
                        labelId="deposit-refund-policy-label"
                        name="depositRefundPolicy"
                        value={formValues.depositRefundPolicy}
                        label={t('propertyConfirmationSettings.depositRefundPolicy')}
                        onChange={handleChange}
                      >
                        <MenuItem value="">{t('propertyConfirmationSettings.depositPolicies.none')}</MenuItem>
                        <MenuItem value="refundable">
                          {t('propertyConfirmationSettings.depositPolicies.refundable')}
                        </MenuItem>
                        <MenuItem value="non_refundable">
                          {t('propertyConfirmationSettings.depositPolicies.non_refundable')}
                        </MenuItem>
                        <MenuItem value="partially_refundable">
                          {t('propertyConfirmationSettings.depositPolicies.partially_refundable')}
                        </MenuItem>
                        <MenuItem value="custom">
                          {t('propertyConfirmationSettings.depositPolicies.custom')}
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Stack>
                  <TextField
                    label={t('propertyConfirmationSettings.cancellationPolicyNote')}
                    name="cancellationPolicyNote"
                    value={formValues.cancellationPolicyNote}
                    onChange={handleChange}
                    fullWidth
                    multiline
                    minRows={2}
                  />
                  <Alert severity="info">
                    <Typography variant="body2">{cancellationPreview}</Typography>
                  </Alert>
                </Stack>
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  {t('propertyConfirmationSettings.paymentTitle')}
                </Typography>
                <Stack spacing={2}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                      label={t('propertyConfirmationSettings.paymentRecipient')}
                      name="paymentRecipient"
                      value={formValues.paymentRecipient}
                      onChange={handleChange}
                      fullWidth
                    />
                    <TextField
                      label={t('propertyConfirmationSettings.paymentAccount')}
                      name="paymentAccount"
                      value={formValues.paymentAccount}
                      onChange={handleChange}
                      fullWidth
                    />
                  </Stack>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <FormControl fullWidth>
                      <InputLabel id="deposit-type-label">
                        {t('propertyConfirmationSettings.depositType')}
                      </InputLabel>
                      <Select
                        labelId="deposit-type-label"
                        name="depositType"
                        value={formValues.depositType}
                        label={t('propertyConfirmationSettings.depositType')}
                        onChange={handleChange}
                      >
                        <MenuItem value="">{t('propertyConfirmationSettings.depositTypes.none')}</MenuItem>
                        <MenuItem value="percent">
                          {t('propertyConfirmationSettings.depositTypes.percent')}
                        </MenuItem>
                        <MenuItem value="amount">
                          {t('propertyConfirmationSettings.depositTypes.amount')}
                        </MenuItem>
                      </Select>
                    </FormControl>
                    <TextField
                      label={
                        formValues.depositType === 'percent'
                          ? t('propertyConfirmationSettings.depositValuePercent')
                          : t('propertyConfirmationSettings.depositValueAmount')
                      }
                      name="depositValue"
                      type="number"
                      value={formValues.depositValue}
                      onChange={handleChange}
                      inputProps={{ min: 0, max: formValues.depositType === 'percent' ? 100 : undefined }}
                      disabled={!formValues.depositType}
                      fullWidth
                    />
                    <TextField
                      label={t('propertyConfirmationSettings.depositDueDays')}
                      name="depositDueDays"
                      type="number"
                      value={formValues.depositDueDays}
                      onChange={handleChange}
                      inputProps={{ min: 0, max: 365 }}
                      fullWidth
                    />
                  </Stack>
                </Stack>
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  {t('propertyConfirmationSettings.messageTypesTitle')}
                </Typography>
                <Stack spacing={0.5}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="messageDepositRequestEnabled"
                        checked={formValues.messageDepositRequestEnabled}
                        onChange={handleChange}
                        disabled={!formValues.guestMessagesEnabled}
                      />
                    }
                    label={t('propertyConfirmationSettings.messageDepositRequest')}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="messageDepositConfirmationEnabled"
                        checked={formValues.messageDepositConfirmationEnabled}
                        onChange={handleChange}
                        disabled={!formValues.guestMessagesEnabled}
                      />
                    }
                    label={t('propertyConfirmationSettings.messageDepositConfirmation')}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="messageBookingConfirmationEnabled"
                        checked={formValues.messageBookingConfirmationEnabled}
                        onChange={handleChange}
                        disabled={!formValues.guestMessagesEnabled}
                      />
                    }
                    label={t('propertyConfirmationSettings.messageBookingConfirmation')}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="messageCustomEnabled"
                        checked={formValues.messageCustomEnabled}
                        onChange={handleChange}
                        disabled={!formValues.guestMessagesEnabled}
                      />
                    }
                    label={t('propertyConfirmationSettings.messageCustom')}
                  />
                </Stack>
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  {t('propertyConfirmationSettings.termsTitle')}
                </Typography>
                <TextField
                  label={t('propertyConfirmationSettings.termsText')}
                  name="termsText"
                  value={formValues.termsText}
                  onChange={handleChange}
                  fullWidth
                  multiline
                  minRows={6}
                  helperText={t('propertyConfirmationSettings.termsHelp')}
                />
              </Box>

              {error && <Alert severity="error">{error}</Alert>}
              {success && <Alert severity="success">{success}</Alert>}

              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="flex-end">
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<Save />}
                  disabled={saving}
                  sx={{ width: { xs: '100%', sm: 'auto' } }}
                >
                  {saving ? t('propertyConfirmationSettings.saving') : t('propertyConfirmationSettings.save')}
                </Button>
              </Stack>
            </Stack>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
