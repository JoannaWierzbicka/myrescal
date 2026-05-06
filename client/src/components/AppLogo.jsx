import { Box } from '@mui/material';
import logoGold from '../assets/myrescal_icon_gold.svg';
import logoPrimary from '../assets/myrescal_icon_primary.svg';

const logoVariants = {
  gold: logoGold,
  primary: logoPrimary,
};

export default function AppLogo({ size = 44, variant = 'primary', sx }) {
  const logoSrc = logoVariants[variant] || logoPrimary;

  return (
    <Box
      component="img"
      src={logoSrc}
      alt="MyResCal"
      sx={{
        display: 'block',
        width: size,
        height: size,
        objectFit: 'contain',
        flex: '0 0 auto',
        ...sx,
      }}
    />
  );
}
