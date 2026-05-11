import { useMemo, useState } from 'react';
import {
  AppBar,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Button,
  Divider,
  Drawer,
  Fab,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import CloseIcon from '@mui/icons-material/Close';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import ListAltOutlinedIcon from '@mui/icons-material/ListAltOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useLocale } from '../context/LocaleContext.jsx';
import { useReservationSetupStatus } from '../hooks/useReservationSetupStatus.js';
import AppLogo from './AppLogo.jsx';

const mobileNavSx = {
  position: 'fixed',
  right: 0,
  bottom: 0,
  left: 0,
  zIndex: (theme) => theme.zIndex.appBar + 2,
  pb: 'env(safe-area-inset-bottom)',
  backgroundColor: 'rgba(255, 255, 255, 0.94)',
};

export default function Navbar() {
  const { user, isAuthenticated, logout, isLoggingOut } = useAuth();
  const { t, language, setLanguage } = useLocale();
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const [menuOpen, setMenuOpen] = useState(false);
  const reservationSetup = useReservationSetupStatus({
    enabled: isAuthenticated,
    refreshKey: location.pathname,
  });

  const userLabel = user?.email || user?.phone || null;
  const toggleLanguage = () => setLanguage(language === 'en' ? 'pl' : 'en');
  const languageLabel = language === 'en' ? 'PL' : 'EN';
  const addReservationTarget = reservationSetup.canCreateReservation
    ? '/dashboard/add'
    : '/dashboard/settings';
  const addReservationLabel = reservationSetup.canCreateReservation
    ? t('navbar.addReservation')
    : t(
      reservationSetup.missingStep === 'rooms'
        ? 'navbar.addFirstRoom'
        : 'navbar.addFirstProperty',
    );

  const activeMobileTab = useMemo(() => {
    if (location.pathname.includes('/settings')) return null;
    if (location.pathname.includes('/summary')) return 'summary';
    if (location.pathname.includes('/add')) return null;
    if (location.pathname.includes('/calendar')) return 'calendar';
    if (location.pathname.startsWith('/dashboard')) return 'reservations';
    return 'reservations';
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
  };

  const renderLanguageButton = (props = {}) => (
    <Button
      variant="outlined"
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
        { key: 'calendar', label: t('calendar.title'), to: '/dashboard/calendar' },
        { key: 'reservations', label: t('reservationList.title'), to: '/dashboard', end: true },
        { key: 'summary', label: t('summary.title'), to: '/dashboard/summary' },
        { key: 'settings', label: t('navbar.settings'), to: '/dashboard/settings' },
      ]
    : [
        { key: 'login', label: t('navbar.login'), to: '/login' },
        { key: 'register', label: t('navbar.register'), to: '/register' },
      ];

  return (
    <>
      <AppBar position="sticky" color="inherit">
        <Toolbar
          disableGutters
          sx={{
            width: '100%',
            px: { xs: 2, sm: 3, md: 6 },
            py: { xs: 1, md: 1.4 },
            gap: 2,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.25} sx={{ flexGrow: 1, minWidth: 0 }}>
            <Box
              component={Link}
              to="/"
              sx={{
                width: { xs: 40, sm: 44 },
                height: { xs: 40, sm: 44 },
                display: 'grid',
                placeItems: 'center',
                flex: '0 0 auto',
              }}
            >
              <AppLogo size="100%" />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                component={Link}
                to="/"
                variant="h6"
                sx={{
                  display: 'block',
                  color: 'text.primary',
                  fontSize: { xs: '1.08rem', sm: '1.18rem' },
                  lineHeight: 1.15,
                }}
              >
                MyResCal
              </Typography>
              {userLabel && (
                <Typography
                  variant="caption"
                  noWrap
                  sx={{
                    display: { xs: 'none', sm: 'block' },
                    color: 'text.secondary',
                    maxWidth: 260,
                  }}
                >
                  {userLabel}
                </Typography>
              )}
            </Box>
          </Stack>

          {isDesktop ? (
            <Stack direction="row" spacing={1} alignItems="center">
              {isAuthenticated ? (
                <>
                  <Button component={NavLink} to="/dashboard/summary" variant="text" startIcon={<DashboardOutlinedIcon />}>
                    {t('summary.title')}
                  </Button>
                  <Button component={NavLink} to="/dashboard/calendar" variant="text" startIcon={<CalendarMonthOutlinedIcon />}>
                    {t('calendar.title')}
                  </Button>
                  <Button component={NavLink} to="/dashboard" end variant="text" startIcon={<ListAltOutlinedIcon />}>
                    {t('reservationList.title')}
                  </Button>
                  <Button
                    component={NavLink}
                    to={addReservationTarget}
                    variant="contained"
                    color="primary"
                    disabled={reservationSetup.loading}
                  >
                    {addReservationLabel}
                  </Button>
                  <Button component={NavLink} to="/dashboard/settings" variant="outlined">
                    {t('navbar.settings')}
                  </Button>
                  {renderLanguageButton()}
                  <Button variant="outlined" onClick={handleLogout} disabled={isLoggingOut}>
                    {isLoggingOut ? t('navbar.loggingOut') : t('navbar.logout')}
                  </Button>
                </>
              ) : (
                <>
                  <Button component={NavLink} to="/login" variant="outlined">
                    {t('navbar.login')}
                  </Button>
                  <Button component={NavLink} to="/register" variant="contained">
                    {t('navbar.register')}
                  </Button>
                  {renderLanguageButton()}
                </>
              )}
            </Stack>
          ) : (
            <Stack direction="row" spacing={1} alignItems="center">
              {renderLanguageButton({ sx: { minWidth: 48, px: 1.5 } })}
              <IconButton
                onClick={() => setMenuOpen(true)}
                aria-label="open navigation"
                sx={{
                  color: 'text.primary',
                  border: '1px solid',
                  borderColor: 'divider',
                  backgroundColor: '#FFFFFF',
                }}
              >
                <MenuIcon />
              </IconButton>
            </Stack>
          )}
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="right"
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        PaperProps={{
          sx: {
            width: 320,
            maxWidth: '88vw',
            background: '#FFFFFF',
            borderLeft: '1px solid',
            borderColor: 'divider',
            boxShadow: '-18px 0 46px rgba(16, 42, 51, 0.14)',
          },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2.5 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <AppLogo size={36} />
              <Typography variant="h6">MyResCal</Typography>
            </Stack>
            <IconButton onClick={() => setMenuOpen(false)} aria-label="close navigation">
              <CloseIcon />
            </IconButton>
          </Box>
          {userLabel && (
            <Typography variant="body2" sx={{ px: 3, pb: 1.5, color: 'text.secondary' }}>
              {userLabel}
            </Typography>
          )}
          <Divider />

          <List sx={{ flexGrow: 1, px: 1.5, py: 1.5 }}>
            {drawerNavItems.map((item) => (
              <ListItem disablePadding key={item.key}>
                <ListItemButton
                  component={NavLink}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMenuOpen(false)}
                  sx={{
                    borderRadius: 1.5,
                    px: 2,
                    py: 1.5,
                    mb: 0.75,
                    '&.active': {
                      backgroundColor: 'success.light',
                      color: 'primary.main',
                    },
                  }}
                >
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{ fontWeight: 700 }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>

          <Box sx={{ px: 3, pb: 3, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
            {renderLanguageButton({ fullWidth: true })}
            {isAuthenticated ? (
              <Button variant="outlined" onClick={handleLogout} disabled={isLoggingOut} fullWidth>
                {isLoggingOut ? t('navbar.loggingOut') : t('navbar.logout')}
              </Button>
            ) : (
              <>
                <Button component={NavLink} to="/login" variant="outlined" onClick={() => setMenuOpen(false)} fullWidth>
                  {t('navbar.login')}
                </Button>
                <Button component={NavLink} to="/register" variant="contained" onClick={() => setMenuOpen(false)} fullWidth>
                  {t('navbar.register')}
                </Button>
              </>
            )}
          </Box>
        </Box>
      </Drawer>

      {!isDesktop && isAuthenticated ? (
        <Box sx={mobileNavSx}>
          {reservationSetup.canCreateReservation ? (
            <Fab
              color="primary"
              aria-label={t('navbar.addReservation')}
              onClick={() => navigate('/dashboard/add')}
              sx={{
                position: 'absolute',
                left: '50%',
                top: -28,
                transform: 'translateX(-50%)',
                width: 58,
                height: 58,
                boxShadow: '0 16px 30px rgba(15, 76, 79, 0.3)',
              }}
            >
              <AddIcon />
            </Fab>
          ) : null}
          <BottomNavigation
            showLabels
            value={activeMobileTab}
            onChange={(_event, value) => {
              if (value === 'calendar') {
                navigate('/dashboard/calendar');
                return;
              }
              navigate('/dashboard');
            }}
          >
            <BottomNavigationAction label={t('calendar.title')} value="calendar" icon={<CalendarMonthOutlinedIcon />} />
            <BottomNavigationAction disabled label="" value="spacer" icon={<Box sx={{ width: 58 }} />} />
            <BottomNavigationAction label={t('reservationList.title')} value="reservations" icon={<ListAltOutlinedIcon />} />
          </BottomNavigation>
        </Box>
      ) : null}
    </>
  );
}
