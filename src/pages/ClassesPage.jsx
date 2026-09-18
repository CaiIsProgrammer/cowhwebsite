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
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { useAuth } from '../context/AuthContext';
import useSheetData from '../hooks/useSheetData';
import { getClasses, addClass, deleteClass, getStaff, getStudents } from '../api/sheetsApi';

const EMPTY_FORM = { staffName: '', className: '', date: '', time: '', attendees: [] };

export default function ClassesPage() {
  const { isAdmin, isInstructor, password } = useAuth();
  const canAddClass = isAdmin || isInstructor;
  const { data: classes, loading, error, refetch } = useSheetData(getClasses);
  const { data: staff } = useSheetData(getStaff);
  const { data: students } = useSheetData(getStudents);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const studentNames = students.map((s) => s.Name);

  const handleField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      await addClass({ ...form, password });
      setDialogOpen(false);
      setForm(EMPTY_FORM);
      await refetch();
    } catch (err) {
      setFormError(err.message || 'Could not record this class.');
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
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
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
              <TableCell>Date</TableCell>
              <TableCell>Time</TableCell>
              <TableCell>Attendees</TableCell>
              {isAdmin && <TableCell />}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <CircularProgress size={24} sx={{ my: 2 }} />
                </TableCell>
              </TableRow>
            )}
            {!loading && classes.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="text.secondary">No classes recorded yet.</Typography>
                </TableCell>
              </TableRow>
            )}
            {classes.map((c) => (
              <TableRow key={c.ID} hover>
                <TableCell>{c.StaffName}</TableCell>
                <TableCell>{c.ClassName}</TableCell>
                <TableCell>{c.Date}</TableCell>
                <TableCell>{c.Time}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                    {(c.Attendees || '')
                      .split(',')
                      .map((name) => name.trim())
                      .filter(Boolean)
                      .map((name) => (
                        <Chip key={name} label={name} size="small" variant="outlined" />
                      ))}
                  </Stack>
                </TableCell>
                {isAdmin && (
                  <TableCell align="right">
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
          <DialogTitle>Record a Class</DialogTitle>
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
                multiple
                options={studentNames}
                value={form.attendees}
                onChange={(_, value) => setForm((f) => ({ ...f, attendees: value }))}
                renderInput={(params) => (
                  <TextField {...params} label="Students in Attendance" placeholder="Select students" />
                )}
              />
              {formError && <Alert severity="error">{formError}</Alert>}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDialogOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? 'Saving…' : 'Save Class'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Stack>
  );
}
