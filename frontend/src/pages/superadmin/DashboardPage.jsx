import React, { useEffect, useState } from 'react';
import ApiClient from '../../services/api';
import { ShieldCheck, Laptop, Calendar, Users, FileText, CheckCircle2, Clock } from 'lucide-react';

export const SuperadminDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const res = await ApiClient.get('/reports/dashboard');
      if (res.data) setSummary(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Cargando panel de control...</p>;

  const kpis = summary?.kpis || {};

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Panel de Control General (Superadmin)</h1>
          <p className="page-subtitle">Visión global de inventario, ciclos y actividad del sistema</p>
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-icon"><Users size={24} /></div>
          <div>
            <div className="stat-value">{kpis.totalUsers || 0}</div>
            <div className="stat-label">Usuarios Activos</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><Laptop size={24} /></div>
          <div>
            <div className="stat-value">{kpis.activeCarts || 0}</div>
            <div className="stat-label">Carros Disponibles</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><Clock size={24} /></div>
          <div>
            <div className="stat-value">{kpis.pendingReservations || 0}</div>
            <div className="stat-label">Reservas Pendientes</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><CheckCircle2 size={24} /></div>
          <div>
            <div className="stat-value">{kpis.approvedReservations || 0}</div>
            <div className="stat-label">Reservas Aprobadas</div>
          </div>
        </div>
      </div>

      {/* Live Inventory Status */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <h3 className="card-title">Disponibilidad en Tiempo Real — {summary?.activeCycleName}</h3>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Carro / Kit</th>
                <th>Capacidad Asignada</th>
                <th>Equipos Reservados</th>
                <th>Stock Libre Disponible</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {summary?.inventorySummary?.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: 'var(--color-gray-400)' }}>
                    No hay inventario configurado para el ciclo activo
                  </td>
                </tr>
              ) : (
                summary?.inventorySummary?.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{item.cartName}</td>
                    <td>{item.allocated} unidades</td>
                    <td>{item.reserved} reservadas</td>
                    <td style={{ fontWeight: 700, color: item.available === 0 ? 'var(--color-red-600)' : 'var(--color-gray-900)' }}>
                      {item.available} unidades libres
                    </td>
                    <td>
                      {item.available === 0 ? (
                        <span className="badge badge-rechazada">AGOTADO</span>
                      ) : item.available <= 5 ? (
                        <span className="badge badge-parcial">STOCK BAJO</span>
                      ) : (
                        <span className="badge badge-aprobada">DISPONIBLE</span>
                      )}
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
