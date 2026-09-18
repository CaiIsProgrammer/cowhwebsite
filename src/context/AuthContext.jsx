import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { verifyPassword } from '../api/sheetsApi';

const PASSWORD_KEY = 'cowh_session_password';
const ROLE_KEY = 'cowh_session_role';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [password, setPassword] = useState(() => sessionStorage.getItem(PASSWORD_KEY));
  const [role, setRole] = useState(() => sessionStorage.getItem(ROLE_KEY));
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  const login = useCallback(async (candidate) => {
    setPending(true);
    setError('');
    try {
      const { success, role: grantedRole } = await verifyPassword(candidate);
      if (success) {
        sessionStorage.setItem(PASSWORD_KEY, candidate);
        sessionStorage.setItem(ROLE_KEY, grantedRole);
        setPassword(candidate);
        setRole(grantedRole);
        return true;
      }
      setError('That is not the correct password.');
      return false;
    } catch (err) {
      setError(err.message || 'Could not reach the College archives.');
      return false;
    } finally {
      setPending(false);
    }
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(PASSWORD_KEY);
    sessionStorage.removeItem(ROLE_KEY);
    setPassword(null);
    setRole(null);
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated: !!password,
      // 'admin' (the Archivist password): full access — students, staff, classes.
      // 'instructor': can only add a class/attendance entry.
      role,
      isAdmin: role === 'admin',
      isInstructor: role === 'instructor',
      password,
      error,
      pending,
      login,
      logout,
    }),
    [password, role, error, pending, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
