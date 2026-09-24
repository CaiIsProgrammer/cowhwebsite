import { useMemo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  Chip,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import GroupsIcon from '@mui/icons-material/Groups';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import useSheetData from '../hooks/useSheetData';
import { getAllSheets } from '../api/sheetsApi';
import { zonedDateTimeToInstant, formatInViewerTimeZone } from '../utils/dateInput';

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
          <Stack spacing={1} sx={{ alignItems: 'center' }}>
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

  // Only Lectures and Expeditions belong on the homepage — Quests and
  // Trials don't show here. Also only classes that haven't happened yet
  // (in the viewer's own timezone); a past class is instruction history,
  // which lives on the full Instruction Log instead.
  const upcomingClasses = useMemo(() => {
    const now = Date.now();
    return data.classes
      .filter((c) => c.ClassType === 'Lecture' || c.ClassType === 'Expedition')
      .map((c) => ({ ...c, _instant: zonedDateTimeToInstant(c.Date, c.Time, c.Timezone) }))
      .filter((c) => c._instant && c._instant.getTime() > now)
      .sort((a, b) => a._instant - b._instant);
  }, [data.classes]);

  return (
    <Stack spacing={4}>
      <Box sx={{ textAlign: 'center' }}>
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

      <Stack direction="row" spacing={2} sx={{ justifyContent: 'center' }}>
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

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Upcoming Classes
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Shown in your local time.
        </Typography>
        <Divider sx={{ my: 2 }} />
        {upcomingClasses.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            {loading ? 'Loading…' : 'No classes scheduled yet.'}
          </Typography>
        ) : (
          <List dense disablePadding>
            {upcomingClasses.map((c) => (
              <ListItem key={c.ID} disableGutters>
                <ListItemText
                  primary={
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                      <Typography variant="body2" component="span">
                        {c.ClassName}
                      </Typography>
                      {c.School && <Chip label={c.School} size="small" variant="outlined" />}
                      {c.ClassType && <Chip label={c.ClassType} size="small" variant="outlined" />}
                    </Stack>
                  }
                  secondary={[c.StaffName, formatInViewerTimeZone(c.Date, c.Time, c.Timezone)]
                    .filter(Boolean)
                    .join(' · ')}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    </Stack>
  );
}
