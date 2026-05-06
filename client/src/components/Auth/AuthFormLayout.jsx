import { Box, Paper, Stack, Typography } from '@mui/material';
import AppLogo from '../AppLogo.jsx';

const AUTH_PANEL_MAX_WIDTH = 420;

export default function AuthFormLayout({ children }) {
  return (
    <Box sx={{ width: '100%', maxWidth: AUTH_PANEL_MAX_WIDTH, mx: 'auto' }}>
      <Stack alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        <Box
          sx={{
            width: 54,
            height: 54,
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <AppLogo size="100%" />
        </Box>
        <Typography variant="h5" sx={{ color: 'primary.dark' }}>
          MyResCal
        </Typography>
      </Stack>
      <Paper
        elevation={0}
        sx={{
          px: { xs: 2.25, sm: 3.5 },
          py: { xs: 2.75, sm: 3.5 },
          borderRadius: 1.5,
        }}
      >
        {children}
      </Paper>
    </Box>
  );
}
