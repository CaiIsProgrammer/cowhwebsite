import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import useSheetData from '../hooks/useSheetData';
import { getAdmissions } from '../api/sheetsApi';

const NAME_FIELD = 'What is your full name?';

function statusChip(value) {
  if (value === 'Approved') return <Chip label="Approved" size="small" color="success" variant="outlined" />;
  if (value === 'Denied') return <Chip label="Denied" size="small" color="error" variant="outlined" />;
  return <Chip label="Pending" size="small" variant="outlined" />;
}

function paidChip(value) {
  const paid = !!value;
  return (
    <Chip
      label={paid ? 'Paid' : 'Unpaid'}
      size="small"
      color={paid ? 'success' : 'default'}
      variant="outlined"
    />
  );
}

// Data fetch is broken out into its own component, keyed by password in the
// parent — that forces a full remount (fresh useSheetData) if the logged-in
// role changes while this page is open, instead of quietly fetching with a
// stale closed-over password.
function AdmissionsTable({ password }) {
  const navigate = useNavigate();
  const fetcher = useCallback(() => getAdmissions(password), [password]);
  const { data: applications, loading, error } = useSheetData(fetcher);

  return (
    <Stack spacing={3}>
      <Typography variant="h4">Admissions</Typography>

      {error && <Alert severity="error">{error}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Applied</TableCell>
              <TableCell>Tuition</TableCell>
              <TableCell>Application Fee</TableCell>
              <TableCell>Status</TableCell>
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
            {!loading && applications.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography color="text.secondary">No applications yet.</Typography>
                </TableCell>
              </TableRow>
            )}
            {applications.map((app) => (
              <TableRow
                key={app.Timestamp}
                hover
                onClick={() => navigate(`/admissions/${encodeURIComponent(app.Timestamp)}`)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>{app[NAME_FIELD] || '—'}</TableCell>
                <TableCell>{app.Timestamp ? new Date(app.Timestamp).toLocaleDateString() : '—'}</TableCell>
                <TableCell>{paidChip(app['Paid Tuiton'])}</TableCell>
                <TableCell>{paidChip(app['Paid Application Fee'])}</TableCell>
                <TableCell>{statusChip(app.Approved)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}

export default function AdmissionsPage() {
  const { isAdmin, isAdmissions, password } = useAuth();

  if (!isAdmin && !isAdmissions) {
    return (
      <Stack spacing={2}>
        <Typography variant="h4">Admissions</Typography>
        <Alert severity="info">
          Log in with the Archivist or Admissions password (top right) to view applications.
        </Alert>
      </Stack>
    );
  }

  return <AdmissionsTable key={password} password={password} />;
}
