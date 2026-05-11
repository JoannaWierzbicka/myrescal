import { Alert, Button, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext.jsx';

export default function ReservationSetupPrompt({ missingStep = 'properties', sx }) {
  const { t } = useLocale();
  const navigate = useNavigate();
  const messageKey =
    missingStep === 'rooms'
      ? 'dashboard.setup.addFirstRoom'
      : 'dashboard.setup.addFirstProperty';

  return (
    <Alert severity="info" sx={sx}>
      <Stack spacing={1.5} alignItems="flex-start">
        <span>{t(messageKey)}</span>
        <Button
          variant="outlined"
          size="small"
          onClick={() => navigate('/dashboard/settings')}
        >
          {t('dashboard.setup.goToSettings')}
        </Button>
      </Stack>
    </Alert>
  );
}
