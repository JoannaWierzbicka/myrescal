import { useState } from 'react';
import { Alert, Button, TextField, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../../api/auth.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLocale } from '../../context/LocaleContext.jsx';
import AuthFormLayout from './AuthFormLayout.jsx';

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
      const { session, user } = await loginUser({ email, password });
      login({ user, session });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || t('auth.loginError'));
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
