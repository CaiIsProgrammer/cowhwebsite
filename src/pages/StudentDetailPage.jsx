import { useMemo } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import useSheetData from '../hooks/useSheetData';
import { getAllSheets } from '../api/sheetsApi';
import { SCHOOLS, CLASS_TYPES } from '../theme/theme';
import RankChip from '../components/RankChip';

const EMPTY = { students: [], staff: [], classes: [] };

function attendedBy(cls, studentName) {
  return (cls.Attendees || '')
    .split(',')
    .map((name) => name.trim())
    .includes(studentName);
}

function ClassList({ classes }) {
  if (classes.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
        None recorded.
      </Typography>
    );
  }
  return (
    <List dense disablePadding>
      {classes.map((c) => (
        <ListItem key={c.ID} disableGutters>
          <ListItemText
            primary={c.ClassName}
            secondary={[c.StaffName, c.Date, c.Time].filter(Boolean).join(' · ')}
          />
        </ListItem>
      ))}
    </List>
  );
}

export default function StudentDetailPage() {
  const { id } = useParams();
  const { data, loading, error } = useSheetData(getAllSheets, EMPTY);

  const student = useMemo(
    () => data.students.find((s) => s.ID === id),
    [data.students, id]
  );

  const attendedClasses = useMemo(
    () => (student ? data.classes.filter((c) => attendedBy(c, student.Name)) : []),
    [data.classes, student]
  );

  const bySchool = useMemo(() => {
    const grouped = {};
    SCHOOLS.forEach((school) => {
      grouped[school] = {};
      CLASS_TYPES.forEach((type) => {
        grouped[school][type] = attendedClasses.filter(
          (c) => c.School === school && c.ClassType === type
        );
      });
    });
    return grouped;
  }, [attendedClasses]);

  const schoolsWithAttendance = SCHOOLS.filter((school) =>
    CLASS_TYPES.some((type) => bySchool[school][type].length > 0)
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!student) {
    return (
      <Stack spacing={2}>
        <Alert severity="warning">No student found with that ID.</Alert>
        <Button component={RouterLink} to="/students" startIcon={<ArrowBackIcon />} sx={{ alignSelf: 'flex-start' }}>
          Back to Students
        </Button>
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <Button
        component={RouterLink}
        to="/students"
        startIcon={<ArrowBackIcon />}
        color="inherit"
        sx={{ alignSelf: 'flex-start' }}
      >
        Back to Students
      </Button>

      <Box>
        <Typography variant="h4">{student.Name}</Typography>
        <Stack direction="row" spacing={1.5} sx={{ mt: 1, alignItems: 'center' }}>
          <RankChip rank={student.Rank} />
          <Typography variant="body2" color="text.secondary">
            {student.School}
          </Typography>
          {student.House && (
            <>
              <Typography variant="body2" color="text.secondary">
                ·
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {student.House}
              </Typography>
            </>
          )}
        </Stack>
      </Box>

      <Typography variant="body2" color="text.secondary">
        {attendedClasses.length} class{attendedClasses.length === 1 ? '' : 'es'} attended.
      </Typography>

      {schoolsWithAttendance.length === 0 && (
        <Alert severity="info">No attendance recorded for this student yet.</Alert>
      )}

      {schoolsWithAttendance.map((school) => (
        <Paper key={school} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            {school}
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={3}>
            {CLASS_TYPES.map((type) => (
              <Grid key={type} size={{ xs: 12, sm: 6 }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                  <Chip label={type} size="small" color="secondary" variant="outlined" />
                  <Typography variant="caption" color="text.secondary">
                    {bySchool[school][type].length}
                  </Typography>
                </Stack>
                <ClassList classes={bySchool[school][type]} />
              </Grid>
            ))}
          </Grid>
        </Paper>
      ))}
    </Stack>
  );
}
