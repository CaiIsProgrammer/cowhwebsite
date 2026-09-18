import { useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

export default function LoginDialog({ open, onClose }) {
  const { login, error, pending } = useAuth();
  const [value, setValue] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await login(value);
    if (ok) {
      setValue('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Wards of the Archives</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Enter the Archivist password for full access, or the
              Instructor password to log a class and its attendance.
            </Typography>
            <TextField
              autoFocus
              type="password"
              label="Password"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              fullWidth
            />
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={pending || !value}>
            {pending ? 'Verifying…' : 'Enter'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
