import { Link as RouterLink } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import GroupsIcon from '@mui/icons-material/Groups';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import useSheetData from '../hooks/useSheetData';
import { getStudents, getStaff, getClasses } from '../api/sheetsApi';

const TILES = [
  { to: '/students', label: 'Students', icon: SchoolIcon, fetcher: getStudents },
  { to: '/staff', label: 'Staff', icon: GroupsIcon, fetcher: getStaff },
  { to: '/classes', label: 'Classes Taught', icon: MenuBookIcon, fetcher: getClasses },
];

function CountTile({ to, label, icon: Icon, fetcher }) {
  const { data, loading, error } = useSheetData(fetcher);
  return (
    <Grid size={{ xs: 12, sm: 4 }}>
      <Card>
        <CardActionArea component={RouterLink} to={to} sx={{ p: 3 }}>
          <Stack spacing={1} alignItems="center">
            <Icon color="secondary" sx={{ fontSize: 40 }} />
            <Typography variant="h3" component="div">
              {loading ? '—' : error ? '!' : data.length}
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

      <Grid container spacing={3}>
        {TILES.map((tile) => (
          <CountTile key={tile.to} {...tile} />
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
