import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
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
  ToggleButton,
  ToggleButtonGroup,
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

function statusOf(app) {
  return app.Approved === 'Approved' || app.Approved === 'Denied' ? app.Approved : 'Pending';
}

// Data fetch is broken out into its own component, keyed by password in the
// parent — that forces a full remount (fresh useSheetData) if the logged-in
// role changes while this page is open, instead of quietly fetching with a
// stale closed-over password.
function AdmissionsTable({ password }) {
  const navigate = useNavigate();
  const fetcher = useCallback(() => getAdmissions(password), [password]);
  const { data: applications, loading, error } = useSheetData(fetcher);

  // Each filter is a set of selected values for that column; an empty set
  // means "no filter" (show everything) rather than "show nothing".
  const [statusFilter, setStatusFilter] = useState([]);
  const [tuitionFilter, setTuitionFilter] = useState([]);
  const [feeFilter, setFeeFilter] = useState([]);

  const filtered = useMemo(
    () =>
      applications
        .filter((app) => {
          if (statusFilter.length > 0 && !statusFilter.includes(statusOf(app))) return false;
          const tuitionPaid = !!app['Paid Tuiton'] ? 'Paid' : 'Unpaid';
          if (tuitionFilter.length > 0 && !tuitionFilter.includes(tuitionPaid)) return false;
          const feePaid = !!app['Paid Application Fee'] ? 'Paid' : 'Unpaid';
          if (feeFilter.length > 0 && !feeFilter.includes(feePaid)) return false;
          return true;
        })
        .sort((a, b) => (a[NAME_FIELD] || '').localeCompare(b[NAME_FIELD] || '')),
    [applications, statusFilter, tuitionFilter, feeFilter]
  );

  const hasActiveFilters = statusFilter.length > 0 || tuitionFilter.length > 0 || feeFilter.length > 0;
  const clearFilters = () => {
    setStatusFilter([]);
    setTuitionFilter([]);
    setFeeFilter([]);
  };

  return (
    <Stack spacing={3}>
      <Typography variant="h4">Admissions</Typography>

      {error && <Alert severity="error">{error}</Alert>}

      <Stack spacing={1.5}>
        <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', alignItems: 'center' }} useFlexGap>
          <ToggleButtonGroup size="small" value={statusFilter} onChange={(_, v) => setStatusFilter(v)}>
            <ToggleButton value="Pending">Pending</ToggleButton>
            <ToggleButton value="Approved" color="success">
              Approved
            </ToggleButton>
            <ToggleButton value="Denied" color="error">
              Denied
            </ToggleButton>
          </ToggleButtonGroup>

          <ToggleButtonGroup size="small" value={tuitionFilter} onChange={(_, v) => setTuitionFilter(v)}>
            <ToggleButton value="Paid" color="success">
              Tuition Paid
            </ToggleButton>
            <ToggleButton value="Unpaid">Tuition Unpaid</ToggleButton>
          </ToggleButtonGroup>

          <ToggleButtonGroup size="small" value={feeFilter} onChange={(_, v) => setFeeFilter(v)}>
            <ToggleButton value="Paid" color="success">
              Fee Paid
            </ToggleButton>
            <ToggleButton value="Unpaid">Fee Unpaid</ToggleButton>
          </ToggleButtonGroup>

          {hasActiveFilters && (
            <Button size="small" color="inherit" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </Stack>

        {hasActiveFilters && (
          <Typography variant="body2" color="text.secondary">
            Showing {filtered.length} of {applications.length} applications.
          </Typography>
        )}
      </Stack>

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
            {!loading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography color="text.secondary">
                    {applications.length === 0 ? 'No applications yet.' : 'No applications match these filters.'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {filtered.map((app) => (
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
