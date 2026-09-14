import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ApiClient from '../../services/api';
import { PlusCircle, Clock, CheckCircle2, XCircle, Laptop, CalendarDays } from 'lucide-react';

export const DocenteDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [cartCycles, setCartCycles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [resRes, dashRes] = await Promise.all([
        ApiClient.get('/reservations?limit=10'),
        ApiClient.get('/reports/dashboard'),
      ]);
      if (resRes.data) setReservations(resRes.data.reservations || resRes.data || []);
      if (dashRes.data?.inventorySummary) setCartCycles(dashRes.data.inventorySummary);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const pendingCount = reservations.filter((r) => r.status === 'PENDIENTE').length;
  const approvedCount = reservations.filter((r) => r.status === 'APROBADA' || r.status === 'PARCIAL').length;
  const rejectedCount = reservations.filter((r) => r.status === 'RECHAZADA').length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">¡Bienvenido/a, {user?.firstName}!</h1>
          <p className="page-subtitle">Panel del Docente — Solicita y consulta tus préstamos de Chromebooks</p>
        </div>
        <button onClick={() => navigate('/docente/nueva-reserva')} className="btn btn-primary btn-lg">
          <PlusCircle size={20} />
          Solicitar Chromebooks
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="stat-card" onClick={() => navigate('/docente/mis-reservas')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon"><Clock size={24} /></div>
          <div>
            <div className="stat-value">{pendingCount}</div>
            <div className="stat-label">Pendientes</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--color-gray-100)', color: 'var(--color-gray-800)' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="stat-value">{approvedCount}</div>
            <div className="stat-label">Aprobadas</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--color-red-50)', color: 'var(--color-red-600)' }}>
            <XCircle size={24} />
          </div>
          <div>
            <div className="stat-value">{rejectedCount}</div>
            <div className="stat-label">Rechazadas</div>
          </div>
        </div>
      </div>

      {/* Availability */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <h3 className="card-title">Disponibilidad Actual de Chromebooks</h3>
        </div>
        {cartCycles.length === 0 ? (
          <p style={{ color: 'var(--color-gray-400)', textAlign: 'center', padding: '1.5rem' }}>
            No hay información de disponibilidad en este momento
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {cartCycles.map((item, idx) => {
              const pct = item.allocated > 0 ? Math.round((item.reserved / item.allocated) * 100) : 0;
              return (
                <div key={idx} style={styles.availCard}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div style={styles.miniIcon}><Laptop size={18} /></div>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.cartName}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.375rem' }}>
                    <span style={{ color: 'var(--color-gray-500)' }}>Ocupado: {item.reserved}/{item.allocated}</span>
                    <span style={{ fontWeight: 700, color: item.available === 0 ? 'var(--color-red-600)' : 'var(--color-gray-900)' }}>
                      {item.available} libres
                    </span>
                  </div>
                  <div style={styles.progressBar}>
                    <div style={{ ...styles.progressFill, width: `${pct}%`, backgroundColor: pct >= 90 ? 'var(--color-red-500)' : 'var(--color-gray-800)' }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Reservations */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Mis Solicitudes Recientes</h3>
          <button onClick={() => navigate('/docente/mis-reservas')} className="btn btn-secondary btn-sm">Ver Todas</button>
        </div>
        <div className="table-container" style={{ border: 'none' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Carro</th>
                <th>Cantidad</th>
                <th>Fecha</th>
                <th>Horario</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {reservations.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--color-gray-400)' }}>Aún no has realizado solicitudes</td></tr>
              ) : (
                reservations.slice(0, 5).map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.cartCycle?.cart?.name || '—'}</td>
                    <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{r.quantityRequested}</td>
                    <td>{new Date(r.reservationDate).toLocaleDateString()}</td>
                    <td>{r.startTime} – {r.endTime}</td>
                    <td>
                      <span className={`badge badge-${r.status.toLowerCase()}`}>{r.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const styles = {
  availCard: {
    padding: '1rem',
    backgroundColor: 'var(--color-gray-50)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
  },
  miniIcon: {
    width: '36px',
    height: '36px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--color-red-50)',
    color: 'var(--color-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBar: {
    height: '6px',
    backgroundColor: 'var(--color-gray-200)',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.3s ease',
  },
};
