import { Box, Paper, Stack, Typography } from '@mui/material';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';

const AUTH_PANEL_MAX_WIDTH = 420;

export default function AuthFormLayout({ children }) {
  return (
    <Box sx={{ width: '100%', maxWidth: AUTH_PANEL_MAX_WIDTH, mx: 'auto' }}>
      <Stack alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        <Box
          sx={{
            width: 54,
            height: 54,
            borderRadius: '10px',
            display: 'grid',
            placeItems: 'center',
            color: 'primary.main',
            backgroundColor: 'success.light',
            border: '1px solid rgba(15, 76, 79, 0.12)',
          }}
        >
          <ApartmentOutlinedIcon />
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
