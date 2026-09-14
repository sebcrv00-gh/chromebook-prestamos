import React, { useEffect, useState } from 'react';
import ApiClient from '../../services/api';
import toast from 'react-hot-toast';
import { Clock, CheckCircle2, XCircle, AlertTriangle, RotateCcw, X, ChevronDown, ChevronUp } from 'lucide-react';

const STATUS_BADGE_MAP = {
  PENDIENTE: 'badge-pendiente',
  APROBADA: 'badge-aprobada',
  PARCIAL: 'badge-parcial',
  RECHAZADA: 'badge-rechazada',
  DEVUELTA: 'badge-devuelta',
  CANCELADA: 'badge-cancelada',
};

const STATUS_ICON_MAP = {
  PENDIENTE: Clock,
  APROBADA: CheckCircle2,
  PARCIAL: AlertTriangle,
  RECHAZADA: XCircle,
  DEVUELTA: RotateCcw,
  CANCELADA: X,
};

export const EstudianteMyReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      const res = await ApiClient.get('/reservations?limit=100');
      if (res.data) setReservations(res.data.reservations || res.data || []);
    } catch (e) {
      toast.error('Error cargando tus solicitudes');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('¿Deseas cancelar esta solicitud de préstamo?')) return;
    try {
      await ApiClient.patch(`/reservations/${id}/cancel`, {});
      toast.success('Solicitud cancelada');
      fetchReservations();
    } catch (err) {
      toast.error(err.message || 'Error al cancelar');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Mis Solicitudes</h1>
          <p className="page-subtitle">Revisa el estado de tus solicitudes de Chromebooks</p>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-container" style={{ border: 'none' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Carro</th>
                <th>Cantidad</th>
                <th>Fecha</th>
                <th>Horario</th>
                <th>Materia / Actividad</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={styles.emptyCell}>Cargando historial...</td></tr>
              ) : reservations.length === 0 ? (
                <tr><td colSpan="7" style={styles.emptyCell}>Aún no tienes solicitudes registradas</td></tr>
              ) : (
                reservations.map((r) => {
                  const StatusIcon = STATUS_ICON_MAP[r.status] || Clock;
                  const isExpanded = expandedId === r.id;
                  return (
                    <React.Fragment key={r.id}>
                      <tr style={{ cursor: 'pointer' }} onClick={() => setExpandedId(isExpanded ? null : r.id)}>
                        <td style={{ fontWeight: 600 }}>{r.cartCycle?.cart?.name || '—'}</td>
                        <td>
                          <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{r.quantityRequested}</span>
                        </td>
                        <td>{new Date(r.reservationDate).toLocaleDateString()}</td>
                        <td>{r.startTime} – {r.endTime}</td>
                        <td style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.purpose}
                        </td>
                        <td>
                          <span className={`badge ${STATUS_BADGE_MAP[r.status] || ''}`}>
                            <StatusIcon size={12} />
                            {r.status}
                          </span>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          {r.status === 'PENDIENTE' && (
                            <button onClick={() => handleCancel(r.id)} className="btn btn-danger btn-sm">
                              <X size={14} /> Cancelar
                            </button>
                          )}
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : r.id)}
                            className="btn btn-secondary btn-sm"
                            style={{ marginLeft: '0.25rem' }}
                          >
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan="7" style={styles.expandedRow}>
                            <div style={styles.detailGrid}>
                              <div>
                                <strong>Ciclo:</strong>
                                <p>{r.cartCycle?.cycle?.name || '—'}</p>
                              </div>
                              <div>
                                <strong>Observaciones:</strong>
                                <p>{r.notes || 'Sin observaciones'}</p>
                              </div>
                              <div>
                                <strong>Solicitado el:</strong>
                                <p>{new Date(r.createdAt).toLocaleString()}</p>
                              </div>
                              {r.rejectionReason && (
                                <div>
                                  <strong style={{ color: 'var(--color-red-600)' }}>Motivo de rechazo:</strong>
                                  <p style={{ color: 'var(--color-red-600)' }}>{r.rejectionReason}</p>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const styles = {
  emptyCell: {
    textAlign: 'center',
    color: 'var(--color-gray-400)',
    padding: '2rem',
  },
  expandedRow: {
    backgroundColor: 'var(--color-gray-50)',
    padding: '1.25rem 1.5rem',
  },
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '1rem',
    fontSize: '0.85rem',
    color: 'var(--color-gray-700)',
  },
};
