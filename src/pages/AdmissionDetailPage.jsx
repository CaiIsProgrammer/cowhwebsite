import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import { useAuth } from '../context/AuthContext';
import useSheetData from '../hooks/useSheetData';
import { getAdmissions, updateAdmission } from '../api/sheetsApi';
import { SCHOOLS } from '../theme/theme';

const NAME_FIELD = 'What is your full name?';
const SCHOOL_FIELD = 'What school of magic would you like to study?';
const FACTION_FIELD = 'What faction do you belong to?';
const TRACKED_FIELDS = ['Timestamp', 'Paid Tuiton', 'Paid Application Fee', 'Approved'];

// The Form answer is free text even though it's really picking from the
// same five schools — match it up if it lines up, otherwise leave the
// School field blank on the pre-filled Add Student form rather than guess.
function matchSchool(answer) {
  if (!answer) return '';
  const found = SCHOOLS.find((s) => s.toLowerCase() === answer.trim().toLowerCase());
  return found || '';
}

function statusChip(value) {
  if (value === 'Approved') return <Chip label="Approved" color="success" variant="outlined" />;
  if (value === 'Denied') return <Chip label="Denied" color="error" variant="outlined" />;
  return <Chip label="Pending" variant="outlined" />;
}

function pendingFromApplication(application) {
  return {
    paidTuition: !!application['Paid Tuiton'],
    paidFee: !!application['Paid Application Fee'],
    approved: application.Approved || '',
  };
}

function ApplicationView({ password, isAdmin, isAdmissions, timestamp }) {
  const navigate = useNavigate();
  const fetcher = useCallback(() => getAdmissions(password), [password]);
  const { data: applications, loading, error, refetch } = useSheetData(fetcher);
  const [actionError, setActionError] = useState('');
  const [saving, setSaving] = useState(false);
  const [pending, setPending] = useState(null);
  const [approvedNotice, setApprovedNotice] = useState(false);

  const application = useMemo(
    () => applications.find((a) => a.Timestamp === timestamp),
    [applications, timestamp]
  );

  // Re-sync the local staged edits whenever the underlying row changes
  // (initial load, or after a save refetches it).
  useEffect(() => {
    if (application) setPending(pendingFromApplication(application));
  }, [application]);

  const questionFields = useMemo(
    () => (application ? Object.keys(application).filter((k) => !TRACKED_FIELDS.includes(k)) : []),
    [application]
  );

  const canManagePayment = isAdmin || isAdmissions;
  const saved = application ? pendingFromApplication(application) : null;
  const isDirty =
    pending && saved && (pending.paidTuition !== saved.paidTuition || pending.paidFee !== saved.paidFee || pending.approved !== saved.approved);

  const handleSave = async () => {
    if (!isDirty) return;
    const fields = {};
    if (pending.paidTuition !== saved.paidTuition) fields['Paid Tuiton'] = pending.paidTuition ? 'Yes' : '';
    if (pending.paidFee !== saved.paidFee) fields['Paid Application Fee'] = pending.paidFee ? 'Yes' : '';
    if (pending.approved !== saved.approved) fields.Approved = pending.approved;

    setSaving(true);
    setActionError('');
    setApprovedNotice(false);
    try {
      await updateAdmission({ id: timestamp, fields, password });
      await refetch();
      if (fields.Approved === 'Approved') {
        if (isAdmin) {
          // Only an Archivist can actually complete enrollment, so only
          // launch the Add Student form for that role — an Admissions-only
          // approver would just hit a permissions error trying to submit it.
          navigate('/students', {
            state: {
              prefill: {
                name: application[NAME_FIELD] || '',
                school: matchSchool(application[SCHOOL_FIELD]),
                faction: application[FACTION_FIELD] || '',
              },
            },
          });
          return;
        }
        setApprovedNotice(true);
      }
    } catch (err) {
      setActionError(err.message || 'Could not save these changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (application) setPending(pendingFromApplication(application));
    setActionError('');
  };

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

  if (!application || !pending) {
    return <Alert severity="warning">No application found with that timestamp.</Alert>;
  }

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4">{application[NAME_FIELD] || 'Unnamed Applicant'}</Typography>
          <Typography variant="body2" color="text.secondary">
            Applied {new Date(application.Timestamp).toLocaleString()}
          </Typography>
        </Box>
        {statusChip(application.Approved)}
      </Box>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Status
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Stack spacing={2}>
          {canManagePayment && (
            <Stack direction="row" spacing={3}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={pending.paidTuition}
                    disabled={saving}
                    onChange={(e) => setPending((p) => ({ ...p, paidTuition: e.target.checked }))}
                  />
                }
                label="Paid Tuition"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={pending.paidFee}
                    disabled={saving}
                    onChange={(e) => setPending((p) => ({ ...p, paidFee: e.target.checked }))}
                  />
                }
                label="Paid Application Fee"
              />
            </Stack>
          )}

          {isAdmissions && (
            <ToggleButtonGroup
              exclusive
              size="small"
              value={pending.approved}
              disabled={saving}
              onChange={(_, value) => {
                if (value !== null) setPending((p) => ({ ...p, approved: value }));
              }}
            >
              <ToggleButton value="">
                <HourglassEmptyIcon fontSize="small" sx={{ mr: 1 }} />
                Pending
              </ToggleButton>
              <ToggleButton value="Approved" color="success">
                <CheckCircleIcon fontSize="small" sx={{ mr: 1 }} />
                Approve
              </ToggleButton>
              <ToggleButton value="Denied" color="error">
                <CancelIcon fontSize="small" sx={{ mr: 1 }} />
                Deny
              </ToggleButton>
            </ToggleButtonGroup>
          )}

          {!canManagePayment && !isAdmissions && (
            <Typography variant="body2" color="text.secondary">
              You don't have permission to update this application.
            </Typography>
          )}

          {approvedNotice && (
            <Alert severity="success">
              Approved. An Archivist can add {application[NAME_FIELD] || 'this applicant'} to the
              roster from Students → Add Student.
            </Alert>
          )}

          {actionError && <Alert severity="error">{actionError}</Alert>}

          {(canManagePayment || isAdmissions) && (
            <Stack direction="row" spacing={1.5}>
              <Button variant="contained" disabled={!isDirty || saving} onClick={handleSave}>
                {saving ? 'Saving…' : 'Save Changes'}
              </Button>
              <Button color="inherit" disabled={!isDirty || saving} onClick={handleDiscard}>
                Discard
              </Button>
            </Stack>
          )}
        </Stack>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Application
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Stack spacing={2.5}>
          {questionFields.map((field) => (
            <Box key={field}>
              <Typography variant="subtitle2" color="secondary.light">
                {field}
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {application[field] || '—'}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Paper>
    </Stack>
  );
}

export default function AdmissionDetailPage() {
  const { timestamp } = useParams();
  const { isAdmin, isAdmissions, password } = useAuth();
  const decodedTimestamp = decodeURIComponent(timestamp);

  return (
    <Stack spacing={3}>
      <Button
        component={RouterLink}
        to="/admissions"
        startIcon={<ArrowBackIcon />}
        color="inherit"
        sx={{ alignSelf: 'flex-start' }}
      >
        Back to Admissions
      </Button>

      {!isAdmin && !isAdmissions ? (
        <Alert severity="info">
          Log in with the Archivist or Admissions password (top right) to view this application.
        </Alert>
      ) : (
        <ApplicationView
          key={password}
          password={password}
          isAdmin={isAdmin}
          isAdmissions={isAdmissions}
          timestamp={decodedTimestamp}
        />
      )}
    </Stack>
  );
}
