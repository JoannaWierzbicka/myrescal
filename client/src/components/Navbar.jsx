import { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Stack,
  IconButton,
  Drawer,
  Box,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import FilterHdrIcon from '@mui/icons-material/FilterHdr';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useLocale } from '../context/LocaleContext.jsx';

export default function Navbar() {
  const { user, isAuthenticated, logout, isLoggingOut } = useAuth();
  const { t, language, setLanguage } = useLocale();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const [menuOpen, setMenuOpen] = useState(false);

  const userLabel = user?.email || user?.phone || null;
  const brandTagline = t('navbar.brandTagline');
  const toggleLanguage = () => setLanguage(language === 'en' ? 'pl' : 'en');
  const languageLabel = language === 'en' ? 'PL' : 'EN';
  const authActionButtonSx = {
    boxShadow: 'none',
    transform: 'none',
    borderWidth: 2,
    borderColor: 'rgba(250, 247, 240, 0.58)',
    color: 'rgba(250, 247, 240, 0.92)',
    backgroundColor: 'rgba(250, 247, 240, 0.06)',
    '&:hover': {
      boxShadow: 'none',
      transform: 'none',
      borderWidth: 2,
      borderColor: 'rgba(250, 247, 240, 0.82)',
      backgroundColor: 'rgba(250, 247, 240, 0.16)',
    },
    '&.active': {
      borderColor: 'rgba(250, 247, 240, 0.9)',
      backgroundColor: 'rgba(250, 247, 240, 0.2)',
    },
    '&.Mui-disabled': {
      opacity: 1,
      boxShadow: 'none',
      transform: 'none',
      borderColor: 'rgba(250, 247, 240, 0.58)',
      color: 'rgba(250, 247, 240, 0.92)',
      backgroundColor: 'rgba(250, 247, 240, 0.06)',
    },
  };
  const drawerAuthActionButtonSx = {
    boxShadow: 'none',
    transform: 'none',
    borderWidth: 2,
    borderColor: 'rgba(31, 60, 74, 0.4)',
    color: 'primary.main',
    '&:hover': {
      boxShadow: 'none',
      transform: 'none',
      borderWidth: 2,
      borderColor: 'rgba(31, 60, 74, 0.6)',
      backgroundColor: 'rgba(31, 60, 74, 0.08)',
    },
    '&.Mui-disabled': {
      opacity: 1,
      boxShadow: 'none',
      transform: 'none',
      borderColor: 'rgba(31, 60, 74, 0.4)',
      color: 'primary.main',
      backgroundColor: 'transparent',
    },
  };

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
  };

  const renderLanguageButton = (props = {}) => (
    <Button
      variant="outlined"
      color="inherit"
      onClick={toggleLanguage}
      aria-label={t('navbar.language')}
      size="small"
      {...props}
    >
      {languageLabel}
    </Button>
  );

  const drawerNavItems = isAuthenticated
    ? [
        { key: 'dashboard', label: t('navbar.allReservations'), to: '/dashboard' },
        { key: 'add', label: t('navbar.addReservation'), to: '/dashboard/add' },
        { key: 'settings', label: t('navbar.settings'), to: '/dashboard/settings' },
      ]
    : [
        { key: 'login', label: t('navbar.login'), to: '/login' },
        { key: 'register', label: t('navbar.register'), to: '/register' },
      ];

  return (
    <AppBar
      position="sticky"
      color="primary"
      sx={{
        borderRadius: 0,
        boxShadow: '0 18px 48px rgba(15, 36, 46, 0.26)',
        borderBottom: '1px solid rgba(195, 111, 43, 0.25)',
      }}
    >
      <Toolbar
        disableGutters
        sx={{
          width: '100%',
          px: { xs: 2.5, sm: 4, md: 6 },
          py: { xs: 1.5, md: 2 },
          gap: 2,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2} sx={{ flexGrow: 1 }}>
          <Box
            component={Link}
            to="/"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.6,
              px: { xs: 2.4, md: 2.6 },
              py: { xs: 1.1, md: 1.3 },
              borderRadius: '28px',
              border: '1px solid rgba(195, 111, 43, 0.45)',
              background: 'rgba(250, 247, 240, 0.1)',
              boxShadow: '0 14px 28px rgba(15, 36, 46, 0.32)',
              transition: 'transform 0.25s ease, box-shadow 0.3s ease',
              minWidth: { xs: 'auto', md: 220 },
              textDecoration: 'none',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 20px 36px rgba(15, 36, 46, 0.38)',
              },
            }}
          >
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                border: '2px solid rgba(51, 180, 172, 0.6)',
                background: 'rgba(51, 180, 172, 0.15)',
              }}
            >
              <FilterHdrIcon sx={{ fontSize: 22 }} />
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  color: 'secondary.light',
                  letterSpacing: '0.18em',
                  fontSize: { xs: '0.78rem', md: '0.8rem' },
                  textTransform: 'uppercase',
                }}
              >
                MyResCal
              </Typography>
              <Typography
                component="span"
                sx={{
                  fontFamily: 'var(--app-font-script)',
                  fontSize: { xs: '1.3rem', md: '1rem' },
                  color: 'info.light',
                  mt: 0.4,
                }}
              >
                {brandTagline}
              </Typography>
            </Box>
          </Box>
          {userLabel && isDesktop && (
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(250, 247, 240, 0.85)',
                fontSize: '0.95rem',
                letterSpacing: '0.08em',
              }}
            >
              {userLabel}
            </Typography>
          )}
        </Stack>

        {isDesktop ? (
          <Stack direction="row" spacing={1.5} alignItems="center">
            {isAuthenticated ? (
              <>
                <Button
                  component={NavLink}
                  to="/dashboard"
                  variant="contained"
                  color="info"
                  sx={{
                    background: 'linear-gradient(135deg, rgba(51, 180, 172, 0.85), rgba(22, 96, 90, 0.95))',
                    '&.active': {
                      boxShadow: '0 0 0 2px rgba(250, 247, 240, 0.6)',
                    },
                  }}
                >
                  {t('navbar.allReservations')}
                </Button>
                <Button
                  component={NavLink}
                  to="/dashboard/add"
                  variant="outlined"
                  color="inherit"
                  sx={{
                    borderColor: 'rgba(250, 247, 240, 0.45)',
                    color: 'rgba(250, 247, 240, 0.85)',
                    '&.active': {
                      backgroundColor: 'rgba(250, 247, 240, 0.16)',
                      borderColor: 'rgba(250, 247, 240, 0.6)',
                    },
                  }}
                >
                  {t('navbar.addReservation')}
                </Button>
                <Button
                  component={NavLink}
                  to="/dashboard/settings"
                  variant="outlined"
                  color="inherit"
                  sx={{
                    borderColor: 'rgba(250, 247, 240, 0.45)',
                    color: 'rgba(250, 247, 240, 0.85)',
                    '&.active': {
                      backgroundColor: 'rgba(250, 247, 240, 0.16)',
                      borderColor: 'rgba(250, 247, 240, 0.6)',
                    },
                  }}
                >
                  {t('navbar.settings')}
                </Button>
                {renderLanguageButton()}
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  sx={authActionButtonSx}
                >
                  {isLoggingOut ? t('navbar.loggingOut') : t('navbar.logout')}
                </Button>
              </>
            ) : (
              <>
                <Button
                  component={NavLink}
                  to="/login"
                  color="inherit"
                  variant="outlined"
                  sx={authActionButtonSx}
                >
                  {t('navbar.login')}
                </Button>
                <Button component={NavLink} to="/register" color="inherit" variant="outlined">
                  {t('navbar.register')}
                </Button>
                {renderLanguageButton()}
              </>
            )}
          </Stack>
        ) : (
          <Stack direction="row" spacing={1} alignItems="center">
            {renderLanguageButton({ sx: { minWidth: 'auto' } })}
            <IconButton
              color="inherit"
              onClick={() => setMenuOpen(true)}
              aria-label="open navigation"
              sx={{
                border: '1px solid rgba(250, 247, 240, 0.35)',
                backgroundColor: 'rgba(250, 247, 240, 0.08)',
              }}
            >
              <MenuIcon />
            </IconButton>
          </Stack>
        )}
      </Toolbar>

      <Drawer
        anchor="right"
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        PaperProps={{
          sx: {
            width: 320,
            background: 'rgba(251, 247, 240, 0.96)',
            backdropFilter: 'blur(14px)',
            borderLeft: '1px solid rgba(195, 111, 43, 0.28)',
            boxShadow: '-20px 0 45px rgba(15, 36, 46, 0.18)',
          },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 3,
              py: 2.5,
            }}
          >
            <Typography variant="subtitle1" sx={{ letterSpacing: '0.18rem' }}>
              MyResCal
            </Typography>
            <IconButton onClick={() => setMenuOpen(false)} aria-label="close navigation">
              <CloseIcon />
            </IconButton>
          </Box>
          {userLabel && (
            <Typography variant="body2" sx={{ px: 3, pb: 1, color: 'text.secondary' }}>
              {userLabel}
            </Typography>
          )}
          <Divider />

          <List sx={{ flexGrow: 1, px: 1 }}>
            {drawerNavItems.map((item) => (
              <ListItem disablePadding key={item.key}>
                <ListItemButton
                  component={NavLink}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  sx={{
                    borderRadius: 16,
                    px: 2.5,
                    py: 1.5,
                    mt: 1.5,
                    '&.active': {
                      backgroundColor: 'rgba(51, 180, 172, 0.18)',
                      boxShadow: 'inset 0 0 0 1px rgba(31, 60, 74, 0.35)',
                    },
                  }}
                >
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{ letterSpacing: '0.12rem', textTransform: 'uppercase' }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>

          <Box sx={{ px: 3, pb: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {renderLanguageButton({ fullWidth: true })}
            {isAuthenticated ? (
              <Button
                variant="outlined"
                onClick={handleLogout}
                disabled={isLoggingOut}
                fullWidth
                sx={drawerAuthActionButtonSx}
              >
                {isLoggingOut ? t('navbar.loggingOut') : t('navbar.logout')}
              </Button>
            ) : (
              <>
                <Button
                  component={NavLink}
                  to="/login"
                  variant="outlined"
                  onClick={() => setMenuOpen(false)}
                  fullWidth
                  sx={drawerAuthActionButtonSx}
                >
                  {t('navbar.login')}
                </Button>
                <Button
                  component={NavLink}
                  to="/register"
                  variant="outlined"
                  onClick={() => setMenuOpen(false)}
                  fullWidth
                >
                  {t('navbar.register')}
                </Button>
              </>
            )}
          </Box>
        </Box>
      </Drawer>
    </AppBar>
  );
}
