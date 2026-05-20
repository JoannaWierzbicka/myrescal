import { useState } from 'react';
import { Alert, Button, TextField, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../../api/auth.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLocale } from '../../context/LocaleContext.jsx';
import AuthFormLayout from './AuthFormLayout.jsx';
import { getApiErrorCode, isApiErrorCode } from '../../api/errorUtils.js';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useLocale();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const authResult = await loginUser({ email, password });
      login({
        user: authResult.user,
        session: authResult.session,
        profile: authResult.profile ?? null,
      });
      navigate('/dashboard');
    } catch (err) {
      console.warn('Login failed', {
        status: err?.status ?? null,
        code: getApiErrorCode(err),
        requestId: err?.requestId ?? null,
      });
      if (isApiErrorCode(err, 'AUTH_INVALID_CREDENTIALS')) {
        setError(t('auth.loginError'));
      } else if (isApiErrorCode(err, 'AUTH_EMAIL_NOT_CONFIRMED')) {
        setError(t('auth.emailNotConfirmed'));
      } else {
        setError(err.message || t('auth.loginError'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthFormLayout>
      <Typography variant="h5" gutterBottom>{t('auth.loginTitle')}</Typography>
      {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
      <form onSubmit={handleSubmit}>
        <TextField
          label={t('auth.email')}
          type="email"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
          fullWidth
          margin="normal"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <TextField
          label={t('auth.password')}
          fullWidth
          required
          type="password"
          autoComplete="current-password"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          margin="normal"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <Button
          type="submit"
          variant="contained"
          fullWidth
          sx={{ mt: 2 }}
          disabled={isSubmitting}
        >
          {isSubmitting ? t('auth.loginSubmitting') : t('auth.loginButton')}
        </Button>
      </form>
    </AuthFormLayout>
  );
}

export default Login;
