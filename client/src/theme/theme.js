import { createTheme } from '@mui/material/styles';

const fonts = {
  sans: '"Work Sans", "Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
  display: '"Marcellus", "Times New Roman", serif',
  script: '"Great Vibes", "Brush Script MT", cursive',
};

const radius = {
  xs: 6,
  sm: 8,
  md: 10,
  lg: 12,
  pill: 10,
};

const colors = {
  teal: '#1F3C4A',
  tealLight: '#32586A',
  tealDark: '#152832',
  mint: '#DDEEEB',
  mintSoft: 'rgba(51, 180, 172, 0.18)',
  cream: '#F5EDDC',
  sand: '#FBF7F0',
  gold: '#C36F2B',
  charcoal: '#2F2A25',
  muted: '#5E4F45',
  line: 'rgba(195, 111, 43, 0.28)',
};

const softShadow = '0 18px 42px rgba(25, 41, 49, 0.12)';
const liftShadow = '0 26px 56px rgba(17, 32, 40, 0.2)';
const focusRing = '0 0 0 4px rgba(51, 180, 172, 0.18)';

const theme = createTheme({
  palette: {
    primary: {
      main: colors.teal,
      light: colors.tealLight,
      dark: colors.tealDark,
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: colors.gold,
      light: '#D9A66E',
      dark: '#956235',
      contrastText: colors.charcoal,
    },
    info: {
      main: '#33B4AC',
      light: '#A8E0DC',
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#5CA475',
      light: '#DCEFE3',
      contrastText: colors.charcoal,
    },
    warning: {
      main: '#C9874A',
      light: '#F4E2C9',
      contrastText: colors.charcoal,
    },
    error: {
      main: '#B75B55',
      light: '#F5DAD6',
    },
    background: {
      default: colors.cream,
      paper: colors.sand,
    },
    text: {
      primary: colors.charcoal,
      secondary: colors.muted,
    },
    divider: colors.line,
  },
  typography: {
    fontFamily: fonts.sans,
    h1: {
      fontFamily: fonts.display,
      fontSize: '2.75rem',
      lineHeight: 1.08,
      fontWeight: 400,
      letterSpacing: '0.08rem',
    },
    h2: {
      fontFamily: fonts.display,
      fontSize: '2.25rem',
      lineHeight: 1.12,
      fontWeight: 400,
      letterSpacing: '0.06rem',
    },
    h3: {
      fontFamily: fonts.display,
      fontSize: '1.9rem',
      lineHeight: 1.16,
      fontWeight: 400,
      letterSpacing: '0.05rem',
    },
    h4: {
      fontFamily: fonts.display,
      fontSize: '1.55rem',
      lineHeight: 1.22,
      fontWeight: 400,
      letterSpacing: '0.04rem',
    },
    h5: {
      fontFamily: fonts.display,
      fontSize: '1.3rem',
      lineHeight: 1.28,
      fontWeight: 400,
      letterSpacing: '0.03rem',
    },
    h6: {
      fontFamily: fonts.display,
      fontSize: '1.08rem',
      lineHeight: 1.32,
      fontWeight: 400,
      letterSpacing: '0.025rem',
    },
    subtitle1: {
      fontSize: '0.95rem',
      fontWeight: 700,
      letterSpacing: 0,
    },
    subtitle2: {
      fontSize: '0.78rem',
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.62,
    },
    body2: {
      fontSize: '0.92rem',
      lineHeight: 1.55,
    },
    button: {
      fontFamily: fonts.sans,
      fontWeight: 700,
      letterSpacing: 0,
      textTransform: 'none',
    },
    caption: {
      fontSize: '0.74rem',
      lineHeight: 1.35,
      fontWeight: 700,
      letterSpacing: '0.04em',
    },
  },
  shape: {
    borderRadius: radius.md,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ':root': {
          '--app-radius-sm': `${radius.sm}px`,
          '--app-radius-md': `${radius.md}px`,
          '--app-radius-lg': `${radius.lg}px`,
          '--app-font-script': fonts.script,
        },
        '*': {
          boxSizing: 'border-box',
        },
        'html, body': {
          minHeight: '100%',
          backgroundColor: colors.cream,
        },
        body: {
          margin: 0,
          padding: 0,
          fontFamily: fonts.sans,
          color: colors.charcoal,
          background:
            'linear-gradient(180deg, #F9F3E7 0%, #F5EDDC 52%, #EFE4CF 100%)',
          lineHeight: 1.6,
        },
        a: {
          color: 'inherit',
          textDecoration: 'none',
        },
        '::selection': {
          backgroundColor: 'rgba(51, 180, 172, 0.35)',
          color: colors.tealDark,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          color: colors.charcoal,
          background: 'rgba(251, 247, 240, 0.86)',
          backdropFilter: 'blur(18px)',
          boxShadow: 'none',
          borderBottom: `1px solid ${colors.line}`,
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          minHeight: 64,
          '@media (min-width:600px)': {
            minHeight: 72,
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: 44,
          borderRadius: radius.md,
          paddingLeft: 22,
          paddingRight: 22,
          paddingTop: 10,
          paddingBottom: 10,
          boxShadow: 'none',
          transition: 'background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: softShadow,
          },
          '&:focus-visible': {
            outline: 'none',
            boxShadow: focusRing,
          },
        },
        containedPrimary: {
          backgroundColor: colors.teal,
          color: '#FFFFFF',
          boxShadow: '0 14px 28px rgba(15, 76, 79, 0.2)',
          '&:hover': {
            backgroundColor: colors.tealDark,
          },
        },
        containedInfo: {
          backgroundColor: colors.teal,
          color: '#FFFFFF',
          boxShadow: '0 14px 28px rgba(15, 76, 79, 0.2)',
          '&:hover': {
            backgroundColor: colors.tealDark,
          },
        },
        outlined: {
          borderWidth: 1,
          borderColor: colors.line,
          color: colors.gold,
          backgroundColor: 'rgba(251, 247, 240, 0.72)',
          '&:hover': {
            borderWidth: 1,
            borderColor: colors.gold,
            backgroundColor: 'rgba(243, 217, 190, 0.35)',
          },
        },
        text: {
          color: colors.teal,
          '&:hover': {
            backgroundColor: 'rgba(15, 76, 79, 0.07)',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: radius.md,
          '&:focus-visible': {
            outline: 'none',
            boxShadow: focusRing,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: colors.sand,
          borderRadius: radius.lg,
          border: `1px solid ${colors.line}`,
          boxShadow: softShadow,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: colors.sand,
          borderRadius: radius.lg,
          border: `1px solid ${colors.line}`,
          boxShadow: softShadow,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          background: colors.sand,
          borderRadius: radius.lg,
          border: `1px solid ${colors.line}`,
          boxShadow: liftShadow,
        },
        paperFullScreen: {
          borderRadius: 0,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: '1.2rem',
          fontFamily: fonts.display,
          fontWeight: 400,
          letterSpacing: '0.03rem',
          paddingBottom: 8,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          minHeight: 48,
          borderRadius: radius.md,
          backgroundColor: colors.sand,
          '& fieldset': {
            borderColor: colors.line,
            borderWidth: 1,
          },
          '&:hover fieldset': {
            borderColor: 'rgba(15, 76, 79, 0.35)',
          },
          '&.Mui-focused fieldset': {
            borderColor: colors.teal,
            borderWidth: 1,
            boxShadow: focusRing,
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: colors.muted,
          fontWeight: 600,
          '&.Mui-focused': {
            color: colors.teal,
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
      styleOverrides: {
        root: {
          '& .MuiFormHelperText-root': {
            marginLeft: 4,
          },
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: radius.sm,
          marginLeft: 6,
          marginRight: 6,
          '&.Mui-selected': {
            backgroundColor: colors.mintSoft,
            color: colors.teal,
          },
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          height: 72,
          backgroundColor: 'rgba(251, 247, 240, 0.94)',
          borderTop: `1px solid ${colors.line}`,
          boxShadow: '0 -12px 34px rgba(16, 42, 51, 0.08)',
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          minWidth: 0,
          color: '#7B8B91',
          '&.Mui-selected': {
            color: colors.teal,
          },
          '& .MuiBottomNavigationAction-label': {
            fontSize: '0.68rem',
            fontWeight: 700,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          height: 28,
          borderRadius: radius.md,
          fontWeight: 700,
        },
      },
    },
    MuiSnackbarContent: {
      styleOverrides: {
        root: {
          borderRadius: radius.md,
          background: colors.charcoal,
          color: '#FFFFFF',
          boxShadow: liftShadow,
        },
      },
    },
  },
});

export default theme;
