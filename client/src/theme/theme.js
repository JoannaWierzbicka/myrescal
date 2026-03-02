// src/theme/theme.js
import { createTheme } from '@mui/material/styles';
import parchmentNoise from '../assets/noise.svg?url';

const fonts = {
  sans: '"Work Sans", "Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
  display: '"Marcellus", "Times New Roman", serif',
  script: '"Great Vibes", "Brush Script MT", cursive',
};

const parchmentLayers = [
  'radial-gradient(circle at 20% 15%, rgba(255, 233, 210, 0.85), rgba(245, 237, 220, 0) 60%)',
  'radial-gradient(circle at 80% 0%, rgba(233, 201, 178, 0.6), rgba(245, 237, 220, 0) 55%)',
  'linear-gradient(180deg, #f9f3e7 0%, #f5eddd 50%, #efe4cf 100%)',
  `url(${parchmentNoise})`,
];
const FORM_CONTROL_RADIUS = 28;

const theme = createTheme({
  palette: {
    primary: {
      main: '#1F3C4A',
      light: '#32586a',
      dark: '#152832',
      contrastText: '#FAF7F0',
    },
    secondary: {
      main: '#C36F2B',
      light: '#d38b4e',
      dark: '#8f4f1e',
      contrastText: '#2F271F',
    },
    info: {
      main: '#33B4AC',
      contrastText: '#FDFBF5',
    },
    success: {
      main: '#5CA475',
    },
    warning: {
      main: '#D49845',
    },
    error: {
      main: '#B9504D',
    },
    background: {
      default: '#F5EDDC',
      paper: '#FBF7F0',
    },
    text: {
      primary: '#2F2A25',
      secondary: '#5E4F45',
    },
    divider: 'rgba(195, 111, 43, 0.28)',
  },
  typography: {
    fontFamily: fonts.sans,
    h1: {
      fontFamily: fonts.display,
      fontSize: '3.25rem',
      letterSpacing: '0.18rem',
      textTransform: 'uppercase',
      fontWeight: 400,
    },
    h2: {
      fontFamily: fonts.display,
      fontSize: '2.6rem',
      letterSpacing: '0.12rem',
      textTransform: 'uppercase',
      fontWeight: 400,
    },
    h3: {
      fontFamily: fonts.display,
      fontSize: '2.2rem',
      letterSpacing: '0.08rem',
      textTransform: 'uppercase',
      fontWeight: 400,
    },
    h4: {
      fontFamily: fonts.display,
      fontSize: '1.8rem',
      letterSpacing: '0.06rem',
      textTransform: 'uppercase',
      fontWeight: 400,
    },
    h5: {
      fontFamily: fonts.display,
      fontSize: '1.6rem',
      letterSpacing: '0.05rem',
      fontWeight: 400,
    },
    h6: {
      fontFamily: fonts.display,
      fontSize: '1.3rem',
      letterSpacing: '0.04rem',
      fontWeight: 400,
    },
    subtitle1: {
      fontWeight: 500,
      letterSpacing: '0.04rem',
      textTransform: 'uppercase',
    },
    subtitle2: {
      fontWeight: 600,
      letterSpacing: '0.06rem',
      textTransform: 'uppercase',
    },
    body1: {
      fontSize: '1.05rem',
      lineHeight: 1.7,
    },
    body2: {
      fontSize: '0.95rem',
      lineHeight: 1.6,
    },
    button: {
      fontFamily: fonts.sans,
      fontWeight: 600,
      letterSpacing: '0.12rem',
      textTransform: 'uppercase',
    },
    caption: {
      textTransform: 'uppercase',
      letterSpacing: '0.08rem',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 18,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ':root': {
          '--app-font-script': fonts.script,
        },
        '*': {
          boxSizing: 'border-box',
        },
        'html, body': {
          minHeight: '100%',
        },
        body: {
          margin: 0,
          padding: 0,
          fontFamily: fonts.sans,
          backgroundColor: '#F5EDDC',
          color: '#2F2A25',
          backgroundImage: parchmentLayers.join(','),
          backgroundAttachment: 'fixed',
          backgroundSize: 'cover, 1200px 1200px, cover, 340px 340px',
          lineHeight: 1.6,
        },
        a: {
          color: 'inherit',
          textDecoration: 'none',
        },
        '::selection': {
          backgroundColor: 'rgba(51, 180, 172, 0.35)',
          color: '#1F3C4A',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'rgba(20, 47, 58, 0.76)',
          color: '#FAF7F0',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 10px 30px rgba(17, 32, 40, 0.18)',
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          minHeight: 72,
          '@media (min-width:600px)': {
            minHeight: 80,
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          lineHeight: 1.2,
          borderRadius: FORM_CONTROL_RADIUS,
          paddingLeft: 24,
          paddingRight: 24,
          paddingTop: 10,
          paddingBottom: 10,
          textTransform: 'uppercase',
          transition: 'transform 0.2s ease, box-shadow 0.25s ease',
          boxShadow: '0 12px 24px rgba(20, 47, 58, 0.14)',
          '&:hover': {
            transform: 'translateY(-3px)',
            boxShadow: '0 18px 30px rgba(20, 47, 58, 0.2)',
          },
          '&:focus-visible': {
            outline: '3px solid rgba(51, 180, 172, 0.45)',
            outlineOffset: '3px',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #1F3C4A 0%, #244e60 100%)',
          color: '#FDFBF5',
        },
        containedSecondary: {
          background: 'linear-gradient(135deg, #C36F2B 0%, #d38b4e 100%)',
          color: '#2F271F',
        },
        containedInfo: {
          background: 'linear-gradient(135deg, rgba(51, 180, 172, 0.95) 0%, rgba(22, 96, 90, 0.95) 100%)',
          color: '#FDFBF5',
        },
        outlined: {
          borderWidth: 2,
          borderColor: 'rgba(195, 111, 43, 0.65)',
          color: '#C36F2B',
          '&:hover': {
            borderWidth: 2,
            borderColor: '#C36F2B',
            backgroundColor: 'rgba(243, 217, 190, 0.35)',
          },
        },
        text: {
          color: 'inherit',
          paddingLeft: 12,
          paddingRight: 12,
          '&:hover': {
            backgroundColor: 'rgba(31, 60, 74, 0.08)',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: FORM_CONTROL_RADIUS,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#FBF7F0',
          borderRadius: 18,
          border: '1px solid rgba(195, 111, 43, 0.18)',
          boxShadow:
            '0 24px 40px rgba(32, 29, 22, 0.09), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#FBF5EA',
          borderRadius: 18,
          border: '2px solid rgba(195, 111, 43, 0.35)',
          boxShadow:
            '0 22px 35px rgba(25, 41, 49, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          background: '#FBF7F0',
          borderRadius: 18,
          border: '1px solid rgba(195, 111, 43, 0.35)',
          boxShadow:
            '0 34px 60px rgba(17, 32, 40, 0.33), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontFamily: fonts.display,
          fontSize: '1.75rem',
          letterSpacing: '0.08rem',
          textTransform: 'uppercase',
          paddingBottom: 0,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: FORM_CONTROL_RADIUS,
          '& fieldset': {
            borderColor: 'rgba(31, 60, 74, 0.22)',
            borderWidth: 2,
          },
          '&:hover fieldset': {
            borderColor: '#1F3C4A',
          },
          '&.Mui-focused fieldset': {
            borderColor: '#33B4AC',
            borderWidth: 2,
            boxShadow: '0 0 0 3px rgba(51, 180, 172, 0.18)',
          },
        },
      },
    },
    MuiFilledInput: {
      styleOverrides: {
        root: {
          borderRadius: FORM_CONTROL_RADIUS,
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          borderRadius: FORM_CONTROL_RADIUS,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-root': {
            borderRadius: FORM_CONTROL_RADIUS,
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          borderRadius: FORM_CONTROL_RADIUS,
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-root': {
            borderRadius: FORM_CONTROL_RADIUS,
          },
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          '&.Mui-selected': {
            backgroundColor: 'rgba(51, 180, 172, 0.18)',
            color: '#1F3C4A',
          },
        },
      },
    },
    MuiSnackbarContent: {
      styleOverrides: {
        root: {
          borderRadius: 18,
          background:
            'linear-gradient(135deg, rgba(31, 60, 74, 0.92), rgba(36, 78, 96, 0.92))',
          color: '#FAF7F0',
          boxShadow: '0 18px 35px rgba(20, 47, 58, 0.22)',
        },
      },
    },
  },
});

export default theme;
