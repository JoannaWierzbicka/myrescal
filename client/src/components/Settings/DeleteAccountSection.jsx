import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';
import { Delete } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLocale } from '../../context/LocaleContext.jsx';

const DELETE_CONFIRMATION = 'DELETE ACCOUNT';

export default function DeleteAccountSection() {
  const { removeAccount } = useAuth();
  const { t } = useLocale();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteError, setDeleteError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError(null);

    try {
      await removeAccount({ confirmation: deleteConfirmation });
    } catch (err) {
      setDeleteError(err.message || t('accountSettings.delete.errors.generic'));
      setDeleting(false);
    }
  };

  return (
    <>
      <Card
        sx={{
          borderRadius: 1.5,
          px: { xs: 2, sm: 3, lg: 4 },
          py: { xs: 2.4, sm: 3, lg: 3.5 },
          borderColor: 'error.light',
        }}
        variant="outlined"
      >
        <CardActions
          sx={{
            p: 0,
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'stretch',
            gap: 2,
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6">{t('accountSettings.delete.title')}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {t('accountSettings.delete.description')}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            color="error"
            startIcon={<Delete />}
            onClick={() => {
              setDeleteDialogOpen(true);
              setDeleteConfirmation('');
              setDeleteError(null);
            }}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            {t('accountSettings.delete.button')}
          </Button>
        </CardActions>
      </Card>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deleting && setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('accountSettings.delete.dialogTitle')}</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            {t('accountSettings.delete.warning')}
          </Alert>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('accountSettings.delete.confirmInstruction', { confirmation: DELETE_CONFIRMATION })}
          </Typography>
          <TextField
            label={t('accountSettings.delete.confirmLabel')}
            value={deleteConfirmation}
            onChange={(event) => setDeleteConfirmation(event.target.value)}
            fullWidth
            autoFocus
          />
          {deleteError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {deleteError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            {t('reservationList.cancel')}
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteAccount}
            disabled={deleting || deleteConfirmation !== DELETE_CONFIRMATION}
          >
            {deleting ? t('accountSettings.delete.deleting') : t('accountSettings.delete.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
