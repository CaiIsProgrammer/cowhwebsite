import { ThemeProvider, CssBaseline } from '@mui/material';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import theme from './theme/theme';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import StudentsPage from './pages/StudentsPage';
import StudentDetailPage from './pages/StudentDetailPage';
import StaffPage from './pages/StaffPage';
import ClassesPage from './pages/ClassesPage';
import AdmissionsPage from './pages/AdmissionsPage';
import AdmissionDetailPage from './pages/AdmissionDetailPage';

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<DashboardPage />} />
              <Route path="students" element={<StudentsPage />} />
              <Route path="students/:id" element={<StudentDetailPage />} />
              <Route path="staff" element={<StaffPage />} />
              <Route path="classes" element={<ClassesPage />} />
              <Route path="admissions" element={<AdmissionsPage />} />
              <Route path="admissions/:timestamp" element={<AdmissionDetailPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
