import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

// Auth
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// Superadmin
import { SuperadminDashboard } from './pages/superadmin/DashboardPage';
import { AdminsManagementPage } from './pages/superadmin/AdminsManagementPage';
import { AllUsersPage } from './pages/superadmin/AllUsersPage';
import { SuperadminReportsPage } from './pages/superadmin/ReportsPage';
import { SettingsPage } from './pages/superadmin/SettingsPage';

// Admin
import { AdminDashboard } from './pages/admin/DashboardPage';
import { ReservationsManagementPage } from './pages/admin/ReservationsManagementPage';
import { CyclesManagementPage } from './pages/admin/CyclesManagementPage';
import { UsersManagementPage } from './pages/admin/UsersManagementPage';

// Docente
import { DocenteDashboard } from './pages/docente/DashboardPage';
import { DocenteNewReservation } from './pages/docente/NewReservationPage';
import { DocenteMyReservations } from './pages/docente/MyReservationsPage';

// Estudiante
import { EstudianteDashboard } from './pages/estudiante/DashboardPage';
import { EstudianteNewReservation } from './pages/estudiante/NewReservationPage';
import { EstudianteMyReservations } from './pages/estudiante/MyReservationsPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              fontFamily: 'var(--font-family)',
              fontSize: '0.875rem',
              borderRadius: 'var(--radius-md)',
            },
          }}
        />
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Authenticated Layout */}
          <Route element={<Layout />}>

            {/* ─── SUPERADMIN ─── */}
            <Route element={<ProtectedRoute allowedRoles={['SUPERADMIN']} />}>
              <Route path="/superadmin" element={<SuperadminDashboard />} />
              <Route path="/superadmin/admins" element={<AdminsManagementPage />} />
              <Route path="/superadmin/users" element={<AllUsersPage />} />
              <Route path="/superadmin/reports" element={<SuperadminReportsPage />} />
              <Route path="/superadmin/settings" element={<SettingsPage />} />
            </Route>

            {/* ─── ADMIN + SUPERADMIN ─── */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPERADMIN']} />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/reservations" element={<ReservationsManagementPage />} />
              <Route path="/admin/cycles" element={<CyclesManagementPage />} />
              <Route path="/admin/users" element={<UsersManagementPage />} />
            </Route>

            {/* ─── DOCENTE ─── */}
            <Route element={<ProtectedRoute allowedRoles={['DOCENTE']} />}>
              <Route path="/docente" element={<DocenteDashboard />} />
              <Route path="/docente/nueva-reserva" element={<DocenteNewReservation />} />
              <Route path="/docente/mis-reservas" element={<DocenteMyReservations />} />
            </Route>

            {/* ─── ESTUDIANTE ─── */}
            <Route element={<ProtectedRoute allowedRoles={['ESTUDIANTE']} />}>
              <Route path="/estudiante" element={<EstudianteDashboard />} />
              <Route path="/estudiante/nueva-reserva" element={<EstudianteNewReservation />} />
              <Route path="/estudiante/mis-reservas" element={<EstudianteMyReservations />} />
            </Route>

          </Route>

          {/* Catch-all → login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
