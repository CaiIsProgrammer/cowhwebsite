import { useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { useAuth } from '../context/AuthContext';
import useSheetData from '../hooks/useSheetData';
import { getClasses, addClass, updateClass, deleteClass, getStaff, getStudents } from '../api/sheetsApi';
import {
  toDateInputValue,
  toTimeInputValue,
  getBrowserTimeZone,
  formatInViewerTimeZone,
} from '../utils/dateInput';
import { SCHOOLS, CLASS_TYPES, CLASS_DIFFICULTIES } from '../theme/theme';

// Falls back to a short curated list on the rare browser without this API
// (all evergreen browsers since 2022 support it).
const TIME_ZONES =
  typeof Intl.supportedValuesOf === 'function'
    ? Intl.supportedValuesOf('timeZone')
    : ['UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London'];

const EMPTY_FORM = {
  staffName: '',
  className: '',
  classType: '',
  difficulty: '',
  school: '',
  date: '',
  time: '',
  timezone: getBrowserTimeZone(),
  attendees: [],
  homeworkCompletedBy: [],
};

export default function ClassesPage() {
  const { isAdmin, isInstructor, password } = useAuth();
  const canAddClass = isAdmin || isInstructor;
  const { data: classes, loading, error, refetch } = useSheetData(getClasses);
  const { data: staff } = useSheetData(getStaff);
  const { data: students } = useSheetData(getStudents);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const studentNames = students.map((s) => s.Name);

  const handleField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const openAddDialog = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setDialogOpen(true);
  };

  const openEditDialog = (cls) => {
    setEditingId(cls.ID);
    setForm({
      staffName: cls.StaffName ?? '',
      className: cls.ClassName ?? '',
      classType: cls.ClassType ?? '',
      difficulty: cls.Difficulty ?? '',
      school: cls.School ?? '',
      date: toDateInputValue(cls.Date),
      time: toTimeInputValue(cls.Time),
      timezone: cls.Timezone || getBrowserTimeZone(),
      attendees: (cls.Attendees || '')
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean),
      homeworkCompletedBy: (cls.HomeworkCompletedBy || '')
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean),
    });
    setFormError('');
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      if (editingId) {
        await updateClass({ id: editingId, ...form, password });
      } else {
        await addClass({ ...form, password });
      }
      setDialogOpen(false);
      setForm(EMPTY_FORM);
      setEditingId(null);
      await refetch();
    } catch (err) {
      setFormError(err.message || 'Could not save this class.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this class entry?')) return;
    await deleteClass({ id, password });
    refetch();
  };

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Instruction Log</Typography>
        {canAddClass && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openAddDialog}>
            Record a Class
          </Button>
        )}
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Staff</TableCell>
              <TableCell>Class</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Difficulty</TableCell>
              <TableCell>School of Magic</TableCell>
              <TableCell>When (your time)</TableCell>
              <TableCell>Attendees</TableCell>
              <TableCell>Homework</TableCell>
              {isAdmin && <TableCell />}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <CircularProgress size={24} sx={{ my: 2 }} />
                </TableCell>
              </TableRow>
            )}
            {!loading && classes.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <Typography color="text.secondary">No classes recorded yet.</Typography>
                </TableCell>
              </TableRow>
            )}
            {classes.map((c) => (
              <TableRow key={c.ID} hover>
                <TableCell>{c.StaffName}</TableCell>
                <TableCell>{c.ClassName}</TableCell>
                <TableCell>{c.ClassType || '—'}</TableCell>
                <TableCell>{c.Difficulty || '—'}</TableCell>
                <TableCell>{c.School || '—'}</TableCell>
                <TableCell>{formatInViewerTimeZone(c.Date, c.Time, c.Timezone) || `${c.Date} ${c.Time}`}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5} useFlexGap sx={{ flexWrap: 'wrap' }}>
                    {(c.Attendees || '')
                      .split(',')
                      .map((name) => name.trim())
                      .filter(Boolean)
                      .map((name) => (
                        <Chip key={name} label={name} size="small" variant="outlined" />
                      ))}
                  </Stack>
                </TableCell>
                <TableCell>
                  {(() => {
                    const attendeeCount = (c.Attendees || '').split(',').map((n) => n.trim()).filter(Boolean).length;
                    const doneCount = (c.HomeworkCompletedBy || '').split(',').map((n) => n.trim()).filter(Boolean).length;
                    if (attendeeCount === 0) return <Chip label="—" size="small" variant="outlined" />;
                    return (
                      <Chip
                        label={`${doneCount}/${attendeeCount}`}
                        size="small"
                        color={doneCount === attendeeCount ? 'success' : 'default'}
                        variant="outlined"
                      />
                    );
                  })()}
                </TableCell>
                {isAdmin && (
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => openEditDialog(c)}>
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(c.ID)}>
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>{editingId ? 'Edit Class' : 'Record a Class'}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                select
                label="Staff"
                required
                value={form.staffName}
                onChange={handleField('staffName')}
                autoFocus
              >
                {staff.map((s) => (
                  <MenuItem key={s.ID} value={s.Name}>
                    {s.Name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Class Name"
                required
                value={form.className}
                onChange={handleField('className')}
                placeholder="e.g. Fundamentals of Destruction"
              />
              <Stack direction="row" spacing={2}>
                <TextField
                  select
                  label="Class Type"
                  required
                  value={form.classType}
                  onChange={handleField('classType')}
                  fullWidth
                >
                  {CLASS_TYPES.map((t) => (
                    <MenuItem key={t} value={t}>
                      {t}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label="School of Magic"
                  required
                  value={form.school}
                  onChange={handleField('school')}
                  fullWidth
                >
                  {SCHOOLS.map((s) => (
                    <MenuItem key={s} value={s}>
                      {s}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>
              <TextField
                select
                label="Difficulty"
                required
                value={form.difficulty}
                onChange={handleField('difficulty')}
              >
                {CLASS_DIFFICULTIES.map((d) => (
                  <MenuItem key={d} value={d}>
                    {d}
                  </MenuItem>
                ))}
              </TextField>
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Date"
                  type="date"
                  required
                  value={form.date}
                  onChange={handleField('date')}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
                <TextField
                  label="Time"
                  type="time"
                  required
                  value={form.time}
                  onChange={handleField('time')}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Stack>
              <Autocomplete
                options={TIME_ZONES}
                value={form.timezone}
                onChange={(_, value) => setForm((f) => ({ ...f, timezone: value || '' }))}
                renderInput={(params) => (
                  <TextField {...params} label="Timezone" required helperText="What timezone the date/time above are in" />
                )}
              />
              <Autocomplete
                multiple
                options={studentNames}
                value={form.attendees}
                onChange={(_, value) =>
                  setForm((f) => ({
                    ...f,
                    attendees: value,
                    // Someone no longer marked as attending can't stay marked
                    // as having completed the homework either.
                    homeworkCompletedBy: f.homeworkCompletedBy.filter((name) => value.includes(name)),
                  }))
                }
                renderInput={(params) => (
                  <TextField {...params} label="Students in Attendance" placeholder="Select students" />
                )}
              />
              <Autocomplete
                multiple
                options={form.attendees}
                value={form.homeworkCompletedBy}
                onChange={(_, value) => setForm((f) => ({ ...f, homeworkCompletedBy: value }))}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Homework Completed By"
                    placeholder={form.attendees.length ? 'Select students' : 'Add attendees first'}
                  />
                )}
                disabled={form.attendees.length === 0}
              />
              {formError && <Alert severity="error">{formError}</Alert>}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDialogOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Save Class'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Stack>
  );
}
