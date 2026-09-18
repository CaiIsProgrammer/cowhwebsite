import { Chip } from '@mui/material';
import { RANK_COLORS } from '../theme/theme';

export default function RankChip({ rank }) {
  const color = RANK_COLORS[rank] ?? '#555';
  return (
    <Chip
      label={rank}
      size="small"
      sx={{
        bgcolor: 'transparent',
        color,
        border: `1px solid ${color}`,
        fontWeight: 600,
      }}
    />
  );
}
