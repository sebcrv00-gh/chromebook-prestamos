import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiClient from '../../services/api';
import { Laptop, Clock, CheckCircle2, AlertCircle, ArrowRightLeft, FileCheck } from 'lucide-react';

export const AdminDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [pendingReservations, setPendingReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sumRes, pendingRes] = await Promise.all([
        ApiClient.get('/reports/dashboard'),
        ApiClient.get('/reservations?status=PENDIENTE&limit=5'),
      ]);

      if (sumRes.data) setSummary(sumRes.data);
      if (pendingRes.data) setPendingReservations(pendingRes.data.reservations || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const kpis = summary?.kpis || {};

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Panel del Administrador TIC</h1>
          <p className="page-subtitle">Gestión de stock de Chromebooks, aprobación de reservas y transferencias</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => navigate('/admin/transfer')} className="btn btn-secondary">
            <ArrowRightLeft size={18} />
            Transferir Chromebooks
          </button>
          <button onClick={() => navigate('/admin/reservations')} className="btn btn-primary">
            <FileCheck size={18} />
            Gestionar Solicitudes ({kpis.pendingReservations || 0})
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-icon"><Clock size={24} /></div>
          <div>
            <div className="stat-value">{kpis.pendingReservations || 0}</div>
            <div className="stat-label">Solicitudes Pendientes</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><CheckCircle2 size={24} /></div>
          <div>
            <div className="stat-value">{kpis.approvedReservations || 0}</div>
            <div className="stat-label">Reservas Aprobadas</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><Laptop size={24} /></div>
          <div>
            <div className="stat-value">{kpis.activeCarts || 0}</div>
            <div className="stat-label">Carros Activos</div>
          </div>
        </div>
      </div>

      {/* Quick Action: Pending Reservations */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <h3 className="card-title">Solicitudes Pendientes por Aprobar</h3>
          <button onClick={() => navigate('/admin/reservations')} className="btn btn-secondary btn-sm">Ver Todas</button>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Solicitante</th>
                <th>Carro Solicitado</th>
                <th>Cantidad</th>
                <th>Fecha y Hora</th>
                <th>Motivo / Clase</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {pendingReservations.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: 'var(--color-gray-400)' }}>
                    ¡No hay reservas pendientes por revisar!
                  </td>
                </tr>
              ) : (
                pendingReservations.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.user?.firstName} {r.user?.lastName}</td>
                    <td>{r.cartCycle?.cart?.name}</td>
                    <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{r.quantityRequested} Chromebooks</td>
                    <td>{new Date(r.reservationDate).toLocaleDateString()} ({r.startTime} - {r.endTime})</td>
                    <td>{r.purpose}</td>
                    <td>
                      <button onClick={() => navigate('/admin/reservations')} className="btn btn-primary btn-sm">
                        Revisar
                      </button>
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
