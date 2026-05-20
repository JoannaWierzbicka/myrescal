import { useState } from 'react';
import { Alert, Button, TextField, Typography } from '@mui/material';
import { registerUser } from '../../api/auth.js';
import { useLocale } from '../../context/LocaleContext.jsx';
import AuthFormLayout from './AuthFormLayout.jsx';
import { isApiErrorCode } from '../../api/errorUtils.js';

function Register() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useLocale();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (password !== confirmPassword) {
      setConfirmPasswordError(t('auth.confirmPasswordMismatch'));
      return;
    }
    setConfirmPasswordError('');
    setIsSubmitting(true);

    try {
      const registrationResult = await registerUser({
        email,
        password,
        firstName,
        lastName,
      });
      if (registrationResult?.error) {
        throw new Error(registrationResult.error);
      }

      setSuccess(t('auth.registerSuccessWithSpamNotice'));
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      const message = err.message || t('auth.registerErrorGeneric');
      if (isApiErrorCode(err, 'AUTH_EMAIL_EXISTS')) {
        setError(t('auth.registerErrorExisting'));
      } else if (isApiErrorCode(err, 'AUTH_EMAIL_NOT_CONFIRMED')) {
        setError(t('auth.emailNotConfirmed'));
      } else {
        setError(message || t('auth.registerErrorGeneric'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthFormLayout>
      <Typography variant="h5" gutterBottom>{t('auth.registerTitle')}</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <form onSubmit={handleSubmit}>
        <TextField
          label={t('auth.firstName')}
          fullWidth
          required
          margin="normal"
          autoComplete="given-name"
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
        />
        <TextField
          label={t('auth.lastName')}
          fullWidth
          required
          margin="normal"
          autoComplete="family-name"
          value={lastName}
          onChange={(event) => setLastName(event.target.value)}
        />
        <TextField
          label={t('auth.email')}
          fullWidth
          required
          margin="normal"
          type="email"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <TextField
          label={t('auth.password')}
          fullWidth
          required
          type="password"
          autoComplete="new-password"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          margin="normal"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            if (confirmPasswordError) {
              setConfirmPasswordError('');
            }
          }}
        />
        <TextField
          label={t('auth.confirmPassword')}
          fullWidth
          required
          type="password"
          autoComplete="new-password"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          margin="normal"
          value={confirmPassword}
          onChange={(event) => {
            setConfirmPassword(event.target.value);
            if (confirmPasswordError) {
              setConfirmPasswordError('');
            }
          }}
          error={Boolean(confirmPasswordError)}
          helperText={confirmPasswordError}
        />
        <Button
          type="submit"
          variant="contained"
          fullWidth
          sx={{ mt: 2 }}
          disabled={isSubmitting}
        >
          {isSubmitting ? t('auth.registerSubmitting') : t('auth.registerButton')}
        </Button>
      </form>
    </AuthFormLayout>
  );
}

export default Register;
