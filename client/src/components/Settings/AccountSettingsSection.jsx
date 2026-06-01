import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Save } from '@mui/icons-material';
import { updateOwnerProfile } from '../../api/profile.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLocale } from '../../context/LocaleContext.jsx';

const buildInitialValues = ({ profile, user }) => ({
  firstName: profile?.first_name ?? '',
  lastName: profile?.last_name ?? '',
  email: user?.email ?? '',
  phone: profile?.phone ?? '',
  address: profile?.address ?? '',
  companyName: profile?.company_name ?? '',
});

export default function AccountSettingsSection() {
  const { profile, user, updateProfile } = useAuth();
  const { t } = useLocale();
  const [formValues, setFormValues] = useState(() => buildInitialValues({ profile, user }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    setFormValues(buildInitialValues({ profile, user }));
  }, [profile, user]);

  const disableSave = useMemo(
    () => saving || !formValues.firstName.trim() || !formValues.lastName.trim(),
    [formValues, saving],
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updated = await updateOwnerProfile({
        firstName: formValues.firstName,
        lastName: formValues.lastName,
        phone: formValues.phone,
        address: formValues.address,
        companyName: formValues.companyName,
      });
      updateProfile(updated);
      setSuccess(t('accountSettings.saveSuccess'));
    } catch (err) {
      setError(err.message || t('accountSettings.errors.save'));
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
          <Typography variant="h6">{t('accountSettings.title')}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {t('accountSettings.description')}
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label={t('accountSettings.firstName')}
                name="firstName"
                value={formValues.firstName}
                onChange={handleChange}
                required
                fullWidth
              />
              <TextField
                label={t('accountSettings.lastName')}
                name="lastName"
                value={formValues.lastName}
                onChange={handleChange}
                required
                fullWidth
              />
            </Stack>

            <TextField
              label={t('accountSettings.email')}
              name="email"
              type="email"
              value={formValues.email}
              InputProps={{ readOnly: true }}
              fullWidth
              sx={{
                '& .MuiInputBase-root': {
                  backgroundColor: 'action.hover',
                },
                '& .MuiInputBase-input': {
                  color: 'text.secondary',
                  WebkitTextFillColor: (theme) => theme.palette.text.secondary,
                },
              }}
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label={t('accountSettings.phone')}
                name="phone"
                value={formValues.phone}
                onChange={handleChange}
                fullWidth
              />
              <TextField
                label={t('accountSettings.companyName')}
                name="companyName"
                value={formValues.companyName}
                onChange={handleChange}
                fullWidth
              />
            </Stack>

            <TextField
              label={t('accountSettings.address')}
              name="address"
              value={formValues.address}
              onChange={handleChange}
              fullWidth
              multiline
              minRows={2}
              helperText={t('accountSettings.addressHelp')}
            />

            {error && <Alert severity="error">{error}</Alert>}
            {success && <Alert severity="success">{success}</Alert>}

            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="flex-end">
              <Button
                type="submit"
                variant="contained"
                startIcon={<Save />}
                disabled={disableSave}
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              >
                {saving ? t('accountSettings.saving') : t('accountSettings.save')}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}
