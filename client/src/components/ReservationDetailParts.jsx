import { Fragment } from 'react';
import { Box, Stack, Typography } from '@mui/material';

export function SectionCard({ icon, title, children }) {
  return (
    <Box
      sx={{
        p: { xs: 2, sm: 2.5 },
        borderRadius: 1.5,
        backgroundColor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 16px 34px rgba(25, 41, 49, 0.08)',
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 1.75 }}>
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: 1,
            display: 'grid',
            placeItems: 'center',
            color: 'primary.main',
            backgroundColor: 'rgba(51, 180, 172, 0.14)',
          }}
        >
          {icon}
        </Box>
        <Typography variant="h6">{title}</Typography>
      </Stack>
      {children}
    </Box>
  );
}

export function InfoGrid({ children, sx }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
        gap: 1.5,
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

export function DatePanel({ label, value }) {
  return (
    <Box
      sx={{
        p: { xs: 1.5, sm: 1.75 },
        borderRadius: 1.25,
        backgroundColor: 'rgba(31, 60, 74, 0.035)',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.6 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.dark' }}>
        {value}
      </Typography>
    </Box>
  );
}

export function DetailItem({ label, value, icon, valueSx }) {
  return (
    <Box sx={{ minWidth: 0, display: 'flex', gap: 1, alignItems: 'flex-start' }}>
      {icon ? (
        <Box
          sx={{
            mt: 0.1,
            color: 'secondary.main',
            '& svg': { fontSize: 18 },
          }}
        >
          {icon}
        </Box>
      ) : null}
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.35 }}>
          {label}
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: 'text.primary', fontWeight: 700, overflowWrap: 'anywhere', ...valueSx }}
        >
          {value}
        </Typography>
      </Box>
    </Box>
  );
}

export function BreakableEmail({ email }) {
  if (!email) return '—';

  return String(email)
    .split(/([@._-])/g)
    .map((part, index) => (
      <Fragment key={`${part}-${index}`}>
        {part}
        {part === '@' || part === '.' || part === '_' || part === '-' ? <wbr /> : null}
      </Fragment>
    ));
}

export function ReservationHeroIllustration() {
  const leaves = [
    { right: 50, bottom: 60, width: 24, height: 13, rotate: -34 },
    { right: 28, bottom: 74, width: 26, height: 14, rotate: 24 },
    { right: 48, bottom: 88, width: 23, height: 13, rotate: -22 },
    { right: 22, bottom: 102, width: 24, height: 13, rotate: 32 },
    { right: 46, bottom: 116, width: 20, height: 11, rotate: -16 },
  ];

  return (
    <Box
      aria-hidden="true"
      sx={{
        position: 'absolute',
        right: { xs: 18, sm: 38 },
        bottom: { xs: 62, sm: 64 },
        width: { xs: 104, sm: 128 },
        height: { xs: 128, sm: 150 },
        display: { xs: 'block', sm: 'block' },
        opacity: { xs: 0.5, sm: 0.72 },
        pointerEvents: 'none',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          right: 36,
          bottom: 32,
          width: 1,
          height: 96,
          backgroundColor: 'rgba(201, 135, 74, 0.46)',
          transform: 'rotate(9deg)',
          transformOrigin: 'bottom center',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          right: 18,
          bottom: 4,
          width: 48,
          height: 78,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          border: '1px solid rgba(201, 135, 74, 0.58)',
          borderBottom: 0,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          right: 21,
          bottom: 0,
          width: 30,
          height: 34,
          borderRadius: '4px 4px 8px 8px',
          background: 'linear-gradient(180deg, rgba(201,135,74,0.92), rgba(149,98,53,0.8))',
        }}
      />
      {leaves.map((leaf) => (
        <Box
          key={`${leaf.right}-${leaf.bottom}`}
          sx={{
            position: 'absolute',
            right: leaf.right,
            bottom: leaf.bottom,
            width: leaf.width,
            height: leaf.height,
            borderRadius: '70% 30% 70% 30%',
            background:
              'linear-gradient(135deg, rgba(191, 230, 213, 0.72), rgba(95, 126, 105, 0.38))',
            border: '1px solid rgba(201, 135, 74, 0.22)',
            transform: `rotate(${leaf.rotate}deg)`,
            transformOrigin: 'center',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.22)',
          }}
        />
      ))}
    </Box>
  );
}
