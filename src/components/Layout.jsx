import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  AppBar,
  Box,
  Button,
  Chip,
  Container,
  Toolbar,
  Typography,
  Stack,
} from '@mui/material';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import { useAuth } from '../context/AuthContext';
import LoginDialog from './LoginDialog';

const NAV_ITEMS = [
  { to: '/', label: 'Hall', end: true },
  { to: '/students', label: 'Students' },
  { to: '/staff', label: 'Staff' },
  { to: '/classes', label: 'Instruction' },
];

export default function Layout() {
  const { isAuthenticated, isAdmin, logout } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="sticky" elevation={0}>
        <Toolbar sx={{ gap: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mr: 2 }}>
            <AcUnitIcon color="primary" />
            <Typography variant="h6" component="div" sx={{ letterSpacing: '0.05em' }}>
              College of Winterhold
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1} sx={{ flexGrow: 1 }}>
            {NAV_ITEMS.map((item) => (
              <Button
                key={item.to}
                component={NavLink}
                to={item.to}
                end={item.end}
                color="inherit"
                sx={{
                  '&.active': {
                    color: 'secondary.main',
                    borderBottom: '2px solid',
                    borderColor: 'secondary.main',
                    borderRadius: 0,
                  },
                }}
              >
                {item.label}
              </Button>
            ))}
          </Stack>

          {isAuthenticated ? (
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Chip
                label={isAdmin ? 'Archivist Access' : 'Instructor Access'}
                color="secondary"
                size="small"
                variant="outlined"
              />
              <Button color="inherit" onClick={logout}>
                Log out
              </Button>
            </Stack>
          ) : (
            <Button variant="outlined" color="secondary" onClick={() => setLoginOpen(true)}>
              Staff Login
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4, flexGrow: 1 }}>
        <Outlet />
      </Container>

      <Box component="footer" sx={{ py: 2, textAlign: 'center', opacity: 0.6 }}>
        <Typography variant="caption">
          Winterhold, Skyrim — records kept by order of the Arch-Mage
        </Typography>
      </Box>

      <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />
    </Box>
  );
}
