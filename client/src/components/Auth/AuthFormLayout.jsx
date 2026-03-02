import { Box, Paper } from '@mui/material';

const AUTH_PANEL_MAX_WIDTH = 420;

export default function AuthFormLayout({ children }) {
  return (
    <Box sx={{ width: '100%', maxWidth: AUTH_PANEL_MAX_WIDTH, mx: 'auto' }}>
      <Paper
        elevation={0}
        sx={{
          px: { xs: 2.5, sm: 3.5 },
          py: { xs: 3, sm: 3.5 },
        }}
      >
        {children}
      </Paper>
    </Box>
  );
}
