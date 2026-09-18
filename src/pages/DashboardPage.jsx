import { Link as RouterLink } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import GroupsIcon from '@mui/icons-material/Groups';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import useSheetData from '../hooks/useSheetData';
import { getAllSheets } from '../api/sheetsApi';

const TILES = [
  { to: '/students', label: 'Students', icon: SchoolIcon, key: 'students' },
  { to: '/staff', label: 'Staff', icon: GroupsIcon, key: 'staff' },
  { to: '/classes', label: 'Classes Taught', icon: MenuBookIcon, key: 'classes' },
];

const EMPTY = { students: [], staff: [], classes: [] };

function CountTile({ to, label, icon: Icon, count, loading, error }) {
  return (
    <Grid size={{ xs: 12, sm: 4 }}>
      <Card>
        <CardActionArea component={RouterLink} to={to} sx={{ p: 3 }}>
          <Stack spacing={1} alignItems="center">
            <Icon color="secondary" sx={{ fontSize: 40 }} />
            <Typography variant="h3" component="div">
              {loading ? '—' : error ? '!' : count}
            </Typography>
            <Typography variant="overline" color="text.secondary">
              {label}
            </Typography>
          </Stack>
        </CardActionArea>
      </Card>
    </Grid>
  );
}

export default function DashboardPage() {
  const missingConfig = !import.meta.env.VITE_SHEETS_API_URL;
  // One round trip for all three counts instead of three separate calls —
  // Apps Script's per-call latency makes that difference very noticeable.
  const { data, loading, error } = useSheetData(getAllSheets, EMPTY);

  return (
    <Stack spacing={4}>
      <Box textAlign="center">
        <Typography variant="h2" gutterBottom>
          The Hall of the Elements
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 640, mx: 'auto' }}>
          Records of the College of Winterhold: its students, its instructors, and the
          lessons taught beneath the shattered bridge. All entries are drawn directly
          from the College's ledger — a Google Sheet — and require no keep of their own.
        </Typography>
      </Box>

      {missingConfig && (
        <Alert severity="warning">
          No Sheet is linked yet. Set <code>VITE_SHEETS_API_URL</code> in a{' '}
          <code>.env</code> file to your Apps Script deployment URL — see{' '}
          <code>google-apps-script/README.md</code>.
        </Alert>
      )}

      {error && <Alert severity="error">{error}</Alert>}

      <Grid container spacing={3}>
        {TILES.map((tile) => (
          <CountTile
            key={tile.to}
            to={tile.to}
            label={tile.label}
            icon={tile.icon}
            count={data[tile.key].length}
            loading={loading}
            error={error}
          />
        ))}
      </Grid>

      <Stack direction="row" spacing={2} justifyContent="center">
        <Button component={RouterLink} to="/students" variant="outlined" color="secondary">
          View Students
        </Button>
        <Button component={RouterLink} to="/staff" variant="outlined" color="secondary">
          View Staff
        </Button>
        <Button component={RouterLink} to="/classes" variant="outlined" color="secondary">
          View Instruction Log
        </Button>
      </Stack>
    </Stack>
  );
}
