import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import { useLocale } from '../../context/LocaleContext.jsx';

const EMPTY_FORM = {
  property_id: '',
  name: '',
};

export default function RoomFormDialog({
  open,
  onClose,
  onSubmit,
  initialValues,
  properties = [],
}) {
  const [formValues, setFormValues] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [nameError, setNameError] = useState(null);
  const { t } = useLocale();

  useEffect(() => {
    if (initialValues) {
      setFormValues({
        property_id: initialValues.property_id ?? '',
        name: initialValues.name ?? '',
      });
    } else {
      setFormValues(EMPTY_FORM);
    }
    setError(null);
    setNameError(null);
  }, [initialValues]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name === 'name' || name === 'property_id') {
      setNameError(null);
    }
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formValues.property_id) {
      setError(t('roomForm.errors.property'));
      return;
    }
    if (!formValues.name.trim()) {
      setNameError(t('roomForm.errors.name'));
      setError(null);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setNameError(null);

    try {
      await onSubmit({
        property_id: formValues.property_id,
        name: formValues.name.trim(),
      });
      onClose();
    } catch (err) {
      if (err?.message === 'Room name must be unique within this property.') {
        setNameError(t('roomForm.errors.uniqueName'));
        setError(null);
      } else {
        setError(err.message || t('roomForm.errors.generic'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const disableSave = isSubmitting || properties.length === 0 || !formValues.property_id || !formValues.name.trim() || Boolean(nameError);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {initialValues ? t('roomForm.editTitle') : t('roomForm.addTitle')}
      </DialogTitle>
      <DialogContent dividers>
        <form onSubmit={handleSubmit}>
          <FormControl fullWidth margin="normal" required>
            <InputLabel id="room-property-label">{t('roomForm.property')}</InputLabel>
            <Select
              labelId="room-property-label"
              name="property_id"
              value={formValues.property_id}
              label={t('roomForm.property')}
              onChange={handleChange}
              disabled={Boolean(initialValues)}
            >
              {properties.map((property) => (
                <MenuItem key={property.id} value={property.id}>
                  {property.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            margin="normal"
            label={t('roomForm.name')}
            name="name"
            fullWidth
            required
            value={formValues.name}
            onChange={handleChange}
            error={Boolean(nameError)}
            helperText={nameError || ' '}
          />

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('roomForm.cancel')}</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={disableSave}
        >
          {isSubmitting ? t('roomForm.saving') : t('roomForm.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
