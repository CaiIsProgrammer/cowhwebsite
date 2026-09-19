import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
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
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { useAuth } from '../context/AuthContext';
import useSheetData from '../hooks/useSheetData';
import { getStudents, addStudent, updateStudent, deleteStudent } from '../api/sheetsApi';
import { RANKS, SCHOOLS } from '../theme/theme';
import RankChip from '../components/RankChip';

const EMPTY_FORM = { name: '', school: '', rank: '', house: '' };

export default function StudentsPage() {
  const navigate = useNavigate();
  const { isAdmin, password } = useAuth();
  const { data: students, loading, error, refetch } = useSheetData(getStudents);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const knownHouses = useMemo(
    () => [...new Set(students.map((s) => s.House).filter(Boolean))],
    [students]
  );

  const handleField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const openAddDialog = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setDialogOpen(true);
  };

  const openEditDialog = (student) => {
    setEditingId(student.ID);
    setForm({
      name: student.Name ?? '',
      school: student.School ?? '',
      rank: student.Rank ?? '',
      house: student.House ?? '',
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
        await updateStudent({ id: editingId, ...form, password });
      } else {
        await addStudent({ ...form, password });
      }
      setDialogOpen(false);
      setForm(EMPTY_FORM);
      setEditingId(null);
      await refetch();
    } catch (err) {
      setFormError(err.message || 'Could not save student.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this student from the roster?')) return;
    await deleteStudent({ id, password });
    refetch();
  };

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Students</Typography>
        {isAdmin && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openAddDialog}>
            Add Student
          </Button>
        )}
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>School of Magic</TableCell>
              <TableCell>Rank</TableCell>
              <TableCell>House</TableCell>
              {isAdmin && <TableCell />}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <CircularProgress size={24} sx={{ my: 2 }} />
                </TableCell>
              </TableRow>
            )}
            {!loading && students.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography color="text.secondary">
                    No students enrolled yet.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {students.map((s) => (
              <TableRow
                key={s.ID}
                hover
                onClick={() => navigate(`/students/${s.ID}`)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>{s.Name}</TableCell>
                <TableCell>{s.School}</TableCell>
                <TableCell>
                  <RankChip rank={s.Rank} />
                </TableCell>
                <TableCell>{s.House || '—'}</TableCell>
                {isAdmin && (
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditDialog(s);
                      }}
                    >
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(s.ID);
                      }}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>{editingId ? 'Edit Student' : 'Enroll a Student'}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Name"
                required
                value={form.name}
                onChange={handleField('name')}
                autoFocus
              />
              <TextField
                select
                label="School of Magic"
                required
                value={form.school}
                onChange={handleField('school')}
              >
                {SCHOOLS.map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Rank"
                required
                value={form.rank}
                onChange={handleField('rank')}
              >
                {RANKS.map((r) => (
                  <MenuItem key={r} value={r}>
                    {r}
                  </MenuItem>
                ))}
              </TextField>
              <Autocomplete
                freeSolo
                options={knownHouses}
                value={form.house}
                onInputChange={(_, value) => setForm((f) => ({ ...f, house: value }))}
                renderInput={(params) => <TextField {...params} label="House" />}
              />
              {formError && <Alert severity="error">{formError}</Alert>}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDialogOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Student'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Stack>
  );
}
