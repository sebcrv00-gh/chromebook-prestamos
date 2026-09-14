import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--color-gray-600)', fontWeight: 500 }}>Cargando sistema...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate role dashboard
    if (user.role === 'SUPERADMIN') return <Navigate to="/superadmin" replace />;
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (user.role === 'DOCENTE') return <Navigate to="/docente" replace />;
    if (user.role === 'ESTUDIANTE') return <Navigate to="/estudiante" replace />;
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
