import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import EditNoteOutlinedIcon from '@mui/icons-material/EditNoteOutlined';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { fetchReservationMessagePreview } from '../api/reservationMessages.js';
import { useLocale } from '../context/LocaleContext.jsx';
import { SectionCard } from './ReservationDetailParts.jsx';

const MESSAGE_TYPES = [
  'deposit_request',
  'deposit_received_confirmation',
  'booking_confirmation',
  'custom_message',
];

const MESSAGE_TYPE_LABEL_KEYS = {
  deposit_request: 'guestMessages.types.depositRequest',
  deposit_received_confirmation: 'guestMessages.types.depositReceivedConfirmation',
  booking_confirmation: 'guestMessages.types.bookingConfirmation',
  custom_message: 'guestMessages.types.customMessage',
};

const MESSAGE_TYPE_FLAGS = {
  deposit_request: 'message_deposit_request_enabled',
  deposit_received_confirmation: 'message_deposit_confirmation_enabled',
  booking_confirmation: 'message_booking_confirmation_enabled',
  custom_message: 'message_custom_enabled',
};

export default function ReservationGuestMessages({ reservation }) {
  const { t } = useLocale();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const property = reservation?.property || {};
  const guestMessagesEnabled = property.guest_messages_enabled !== false;
  const isExternalReservation = reservation?.confirmation_method === 'booking_com';

  const availableTypes = useMemo(
    () =>
      MESSAGE_TYPES.filter((type) => property[MESSAGE_TYPE_FLAGS[type]] !== false).map((type) => ({
        type,
        label: t(MESSAGE_TYPE_LABEL_KEYS[type]),
      })),
    [property, t],
  );

  const recommendedType = useMemo(() => {
    if (isExternalReservation && availableTypes.some((item) => item.type === 'custom_message')) {
      return 'custom_message';
    }
    if (reservation?.status === 'preliminary' && availableTypes.some((item) => item.type === 'deposit_request')) {
      return 'deposit_request';
    }
    if (
      reservation?.status === 'deposit_paid' &&
      availableTypes.some((item) => item.type === 'deposit_received_confirmation')
    ) {
      return 'deposit_received_confirmation';
    }
    if (availableTypes.some((item) => item.type === 'booking_confirmation')) {
      return 'booking_confirmation';
    }
    return availableTypes[0]?.type ?? '';
  }, [availableTypes, isExternalReservation, reservation?.status]);

  const handleOpen = (type = recommendedType) => {
    setSelectedType(type);
    setDialogOpen(true);
  };

  return (
    <>
      <SectionCard icon={<MailOutlineIcon />} title={t('guestMessages.title')}>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            {t('guestMessages.description')}
          </Typography>

          {!guestMessagesEnabled ? (
            <Alert severity="info">{t('guestMessages.disabledForProperty')}</Alert>
          ) : null}

          {isExternalReservation ? (
            <Alert severity="info">{t('guestMessages.externalReservationNotice')}</Alert>
          ) : null}

          {guestMessagesEnabled ? (
            <>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(auto-fit, minmax(180px, 1fr))' },
                  gap: 1,
                }}
              >
                {availableTypes.map((item) => {
                  const recommended = item.type === recommendedType;
                  return (
                    <Button
                      key={item.type}
                      variant={recommended ? 'contained' : 'outlined'}
                      startIcon={<VisibilityOutlinedIcon />}
                      onClick={() => handleOpen(item.type)}
                      sx={{
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        minHeight: 42,
                        px: 1.25,
                        py: 0.75,
                        textAlign: 'left',
                        whiteSpace: 'normal',
                        '& .MuiButton-startIcon': {
                          mr: 0.75,
                        },
                        '& .MuiButton-startIcon svg': {
                          fontSize: 18,
                        },
                        '& .MuiButton-label, &': {
                          fontSize: '0.82rem',
                          lineHeight: 1.2,
                        },
                      }}
                    >
                      {item.label}
                    </Button>
                  );
                })}
              </Box>

              {!recommendedType ? (
                <Alert severity="info">{t('guestMessages.noAvailableTypes')}</Alert>
              ) : null}
            </>
          ) : null}
        </Stack>
      </SectionCard>

      {guestMessagesEnabled ? (
        <GuestMessagePreviewDialog
          open={dialogOpen}
          reservationId={reservation?.id}
          selectedType={selectedType}
          availableTypes={availableTypes}
          onTypeChange={setSelectedType}
          onClose={() => setDialogOpen(false)}
        />
      ) : null}
    </>
  );
}

function GuestMessagePreviewDialog({
  open,
  reservationId,
  selectedType,
  availableTypes,
  onTypeChange,
  onClose,
}) {
  const { t, language } = useLocale();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [includeRules, setIncludeRules] = useState(false);
  const [includeCancellation, setIncludeCancellation] = useState(true);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [preview, setPreview] = useState(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !reservationId || !selectedType) return undefined;

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetchReservationMessagePreview(reservationId, {
      type: selectedType,
      language,
      includeRules,
      includeCancellation,
      includeSummary,
      signal: controller.signal,
    })
      .then((data) => {
        setPreview(data);
        setSubject(data.subject ?? '');
        setBody(data.body ?? '');
        setEditing(data.type === 'custom_message');
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setError(err.message || t('guestMessages.previewError'));
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [includeCancellation, includeRules, includeSummary, language, open, reservationId, selectedType, t]);

  useEffect(() => {
    if (!open) return;
    setIncludeRules(selectedType === 'deposit_request');
    setIncludeCancellation(selectedType !== 'custom_message');
    setIncludeSummary(selectedType !== 'custom_message');
  }, [open, selectedType]);

  const readonly = !editing;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth fullScreen={fullScreen}>
      <DialogTitle>{t('guestMessages.dialogTitle')}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          {!preview?.sendEnabled ? (
            <Alert severity="info">{t('guestMessages.previewOnlyNotice')}</Alert>
          ) : null}

          <FormControl fullWidth>
            <InputLabel id="guest-message-type-label">{t('guestMessages.messageType')}</InputLabel>
            <Select
              labelId="guest-message-type-label"
              value={selectedType}
              label={t('guestMessages.messageType')}
              onChange={(event) => onTypeChange(event.target.value)}
            >
              {availableTypes.map((item) => (
                <MenuItem key={item.type} value={item.type}>
                  {item.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={includeRules}
                  onChange={(event) => setIncludeRules(event.target.checked)}
                />
              }
              label={t('guestMessages.includeRules')}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={includeCancellation}
                  onChange={(event) => setIncludeCancellation(event.target.checked)}
                />
              }
              label={t('guestMessages.includeCancellation')}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={includeSummary}
                  onChange={(event) => setIncludeSummary(event.target.checked)}
                />
              }
              label={t('guestMessages.includeSummary')}
            />
          </Stack>

          <TextField
            label={t('guestMessages.recipient')}
            value={preview?.recipientEmail || ''}
            fullWidth
            InputProps={{ readOnly: true }}
          />
          <TextField
            label={t('guestMessages.subject')}
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            fullWidth
            InputProps={{ readOnly: readonly }}
          />
          <TextField
            label={t('guestMessages.body')}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            fullWidth
            multiline
            minRows={14}
            InputProps={{ readOnly: readonly }}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>{t('reservationList.cancel')}</Button>
        <Button
          variant="outlined"
          startIcon={<EditNoteOutlinedIcon />}
          onClick={() => setEditing((current) => !current)}
          disabled={loading}
        >
          {editing ? t('guestMessages.previewMode') : t('guestMessages.edit')}
        </Button>
        <Button variant="contained" disabled>
          {t('guestMessages.sendDisabled')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
