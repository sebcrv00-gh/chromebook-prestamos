import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Laptop,
  CalendarDays,
  FileCheck2,
  Users,
  ArrowRightLeft,
  Settings,
  BarChart3,
  PlusCircle,
  Clock,
  Laptop2,
} from 'lucide-react';

export const Sidebar = () => {
  const { user } = useAuth();
  if (!user) return null;

  const getRoleNavItems = () => {
    switch (user.role) {
      case 'SUPERADMIN':
        return [
          { to: '/superadmin', label: 'Dashboard Global', icon: LayoutDashboard },
          { to: '/superadmin/admins', label: 'Gestión Admins', icon: Users },
          { to: '/superadmin/users', label: 'Todos los Usuarios', icon: Users },
          { to: '/admin/cycles', label: 'Ciclos Académicos', icon: CalendarDays },
          { to: '/admin/reservations', label: 'Todas las Reservas', icon: FileCheck2 },
          { to: '/superadmin/reports', label: 'Reportes & Auditoría', icon: BarChart3 },
          { to: '/superadmin/settings', label: 'Configuración', icon: Settings },
        ];

      case 'ADMIN':
        return [
          { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/admin/reservations', label: 'Gestión Reservas', icon: FileCheck2 },
          { to: '/admin/cycles', label: 'Ciclos Académicos', icon: CalendarDays },
          { to: '/admin/users', label: 'Gestión Usuarios', icon: Users },
        ];

      case 'DOCENTE':
        return [
          { to: '/docente', label: 'Inicio', icon: LayoutDashboard },
          { to: '/docente/nueva-reserva', label: 'Solicitar Chromebooks', icon: PlusCircle },
          { to: '/docente/mis-reservas', label: 'Mis Solicitudes', icon: Clock },
        ];

      case 'ESTUDIANTE':
        return [
          { to: '/estudiante', label: 'Inicio', icon: LayoutDashboard },
          { to: '/estudiante/nueva-reserva', label: 'Solicitar Préstamo', icon: PlusCircle },
          { to: '/estudiante/mis-reservas', label: 'Mis Solicitudes', icon: Clock },
        ];

      default:
        return [];
    }
  };

  const navItems = getRoleNavItems();

  return (
    <aside style={styles.sidebar}>
      {/* Institution Branding Header */}
      <div style={styles.brandContainer}>
        <div style={styles.logoBadge}>
          <Laptop2 size={24} color="#FFFFFF" />
        </div>
        <div>
          <h1 style={styles.brandTitle}>SAN BONIFACIO</h1>
          <p style={styles.brandSubtitle}>Préstamo de Chromebooks</p>
        </div>
      </div>

      {/* Role Badge */}
      <div style={styles.roleBanner}>
        <span style={styles.roleLabel}>ROL ACTIVO</span>
        <span style={styles.roleValue}>{user.role}</span>
      </div>

      {/* Navigation Links */}
      <nav style={styles.nav}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to.split('/').length === 2}
              style={({ isActive }) => ({
                ...styles.navLink,
                ...(isActive ? styles.activeNavLink : {}),
              })}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div style={styles.footerInfo}>
        <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)' }}>
          Corporación San Bonifacio de las Lanzas © 2026
        </p>
      </div>
    </aside>
  );
};

const styles = {
  sidebar: {
    width: 'var(--sidebar-width)',
    height: '100vh',
    position: 'fixed',
    top: 0,
    left: 0,
    backgroundColor: 'var(--color-white)',
    borderRight: '1px solid var(--color-border)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 100,
  },
  brandContainer: {
    padding: '1.25rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    borderBottom: '1px solid var(--color-border)',
  },
  logoBadge: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    backgroundColor: 'var(--color-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: '0.95rem',
    fontWeight: '800',
    color: 'var(--color-gray-900)',
    letterSpacing: '0.05em',
    lineHeight: '1.1',
  },
  brandSubtitle: {
    fontSize: '0.75rem',
    color: 'var(--color-red-600)',
    fontWeight: '600',
  },
  roleBanner: {
    margin: '1rem 1.25rem 0.5rem 1.25rem',
    padding: '0.5rem 0.75rem',
    backgroundColor: 'var(--color-gray-100)',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roleLabel: {
    fontSize: '0.68rem',
    fontWeight: '700',
    color: 'var(--color-gray-500)',
  },
  roleValue: {
    fontSize: '0.75rem',
    fontWeight: '700',
    color: 'var(--color-primary)',
  },
  nav: {
    flex: 1,
    padding: '0.75rem 1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    overflowY: 'auto',
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.65rem 0.875rem',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: 'var(--color-gray-700)',
    textDecoration: 'none',
    transition: 'all 0.15s ease',
  },
  activeNavLink: {
    backgroundColor: 'var(--color-red-50)',
    color: 'var(--color-primary)',
    fontWeight: '600',
  },
  footerInfo: {
    padding: '1rem 1.25rem',
    borderTop: '1px solid var(--color-border)',
    textAlign: 'center',
  },
};
