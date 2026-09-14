import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Settings, Shield, Server, UserCheck, HardDrive } from 'lucide-react';

export const SettingsPage = () => {
  const { user } = useAuth();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Configuración del Sistema</h1>
          <p className="page-subtitle">Información del sistema, políticas de préstamo y parámetros generales</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* System Info */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={styles.iconBox}><Server size={20} /></div>
              <h3 className="card-title">Información del Servidor</h3>
            </div>
          </div>
          <div style={styles.infoList}>
            <div style={styles.infoRow}>
              <span style={styles.label}>Institución:</span>
              <span style={styles.val}>Corporación San Bonifacio de las Lanzas</span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.label}>Aplicativo:</span>
              <span style={styles.val}>Sistema de Préstamo de Chromebooks v1.0</span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.label}>Entorno Backend:</span>
              <span style={styles.val}>Node.js Express + Prisma ORM</span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.label}>Base de Datos:</span>
              <span style={styles.val}>PostgreSQL</span>
            </div>
          </div>
        </div>

        {/* Current User Details */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={styles.iconBox}><Shield size={20} /></div>
              <h3 className="card-title">Cuenta Superadministrador</h3>
            </div>
          </div>
          <div style={styles.infoList}>
            <div style={styles.infoRow}>
              <span style={styles.label}>Nombre:</span>
              <span style={styles.val}>{user?.firstName} {user?.lastName}</span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.label}>Correo:</span>
              <span style={styles.val}>{user?.email}</span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.label}>Rol:</span>
              <span className="badge badge-parcial">{user?.role}</span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.label}>Estado:</span>
              <span className="badge badge-aprobada">ACTIVO</span>
            </div>
          </div>
        </div>

        {/* Loan Policy Info */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={styles.iconBox}><HardDrive size={20} /></div>
              <h3 className="card-title">Parámetros de Reserva</h3>
            </div>
          </div>
          <div style={styles.infoList}>
            <div style={styles.infoRow}>
              <span style={styles.label}>Aprobación requerida:</span>
              <span style={styles.val}>Sí (Administrador / Superadmin)</span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.label}>Modo de Control:</span>
              <span style={styles.val}>Asignación dinámica por Ciclo y Carro</span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.label}>Notificaciones:</span>
              <span style={styles.val}>En tiempo real (polling 15s)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  iconBox: {
    padding: '0.5rem',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--color-red-50)',
    color: 'var(--color-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.875rem',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.875rem',
    borderBottom: '1px solid var(--color-gray-100)',
    paddingBottom: '0.5rem',
  },
  label: {
    color: 'var(--color-gray-500)',
    fontWeight: 500,
  },
  val: {
    fontWeight: 600,
    color: 'var(--color-gray-900)',
  },
};
