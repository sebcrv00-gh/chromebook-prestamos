import React, { useEffect, useState } from 'react';
import ApiClient from '../../services/api';
import toast from 'react-hot-toast';
import {
  FileCheck2, Check, X, RotateCcw, Filter,
  ChevronDown, ChevronUp, Clock, CheckCircle2,
  XCircle, AlertTriangle, Package
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'PENDIENTE', label: 'Pendientes' },
  { value: 'APROBADA', label: 'Aprobadas' },
  { value: 'PARCIAL', label: 'Parciales' },
  { value: 'RECHAZADA', label: 'Rechazadas' },
  { value: 'DEVUELTA', label: 'Devueltas' },
  { value: 'CANCELADA', label: 'Canceladas' },
];

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

export const ReservationsManagementPage = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  // Approve modal
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveTarget, setApproveTarget] = useState(null);
  const [approvedQty, setApprovedQty] = useState(0);

  // Reject modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchReservations();
  }, [statusFilter]);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const query = statusFilter ? `?status=${statusFilter}&limit=100` : '?limit=100';
      const res = await ApiClient.get(`/reservations${query}`);
      if (res.data) {
        setReservations(res.data.reservations || res.data || []);
      }
    } catch (e) {
      toast.error('Error cargando reservas');
    } finally {
      setLoading(false);
    }
  };

  // ── Approve ──
  const openApproveModal = (r) => {
    setApproveTarget(r);
    setApprovedQty(r.quantityRequested);
    setShowApproveModal(true);
  };

  const handleApprove = async () => {
    try {
      await ApiClient.patch(`/reservations/${approveTarget.id}/approve`, {
        quantityApproved: parseInt(approvedQty, 10),
      });
      toast.success(
        approvedQty < approveTarget.quantityRequested
          ? 'Reserva aprobada parcialmente'
          : 'Reserva aprobada exitosamente'
      );
      setShowApproveModal(false);
      fetchReservations();
    } catch (err) {
      toast.error(err.message || 'Error al aprobar');
    }
  };

  // ── Reject ──
  const openRejectModal = (r) => {
    setRejectTarget(r);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Debes indicar el motivo del rechazo');
      return;
    }
    try {
      await ApiClient.patch(`/reservations/${rejectTarget.id}/reject`, {
        rejectionReason,
      });
      toast.success('Reserva rechazada');
      setShowRejectModal(false);
      fetchReservations();
    } catch (err) {
      toast.error(err.message || 'Error al rechazar');
    }
  };

  // ── Return ──
  const handleReturn = async (id) => {
    try {
      await ApiClient.patch(`/reservations/${id}/return`, {});
      toast.success('Chromebooks marcados como devueltos');
      fetchReservations();
    } catch (err) {
      toast.error(err.message || 'Error al marcar devolución');
    }
  };

  const pendingCount = reservations.filter((r) => r.status === 'PENDIENTE').length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestión de Solicitudes de Préstamo</h1>
          <p className="page-subtitle">
            Revisa, aprueba o rechaza solicitudes de Chromebooks de docentes y estudiantes
          </p>
        </div>
        {pendingCount > 0 && (
          <div style={styles.pendingBadge}>
            <Clock size={16} />
            <span>{pendingCount} pendiente{pendingCount > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div style={styles.filterBar}>
        <Filter size={16} color="var(--color-gray-500)" />
        <select
          className="form-control"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ maxWidth: '240px' }}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-container" style={{ border: 'none' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Solicitante</th>
                <th>Carro / Ciclo</th>
                <th>Cantidad</th>
                <th>Fecha y Horario</th>
                <th>Motivo</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={styles.emptyCell}>Cargando solicitudes...</td>
                </tr>
              ) : reservations.length === 0 ? (
                <tr>
                  <td colSpan="7" style={styles.emptyCell}>
                    No se encontraron solicitudes {statusFilter && `con estado "${statusFilter}"`}
                  </td>
                </tr>
              ) : (
                reservations.map((r) => {
                  const StatusIcon = STATUS_ICON_MAP[r.status] || Clock;
                  const isExpanded = expandedId === r.id;
                  return (
                    <React.Fragment key={r.id}>
                      <tr
                        style={{ cursor: 'pointer' }}
                        onClick={() => setExpandedId(isExpanded ? null : r.id)}
                      >
                        <td style={{ fontWeight: 600 }}>
                          {r.user?.firstName} {r.user?.lastName}
                          <div style={{ fontSize: '0.7rem', color: 'var(--color-gray-500)' }}>
                            {r.user?.role}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{r.cartCycle?.cart?.name || '—'}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--color-gray-500)' }}>
                            {r.cartCycle?.cycle?.name || ''}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                            {r.quantityRequested}
                          </span>
                          {r.quantityApproved != null && r.quantityApproved !== r.quantityRequested && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--color-gray-500)', marginLeft: '0.25rem' }}>
                              (aprobados: {r.quantityApproved})
                            </span>
                          )}
                        </td>
                        <td>
                          <div>{new Date(r.reservationDate).toLocaleDateString()}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>
                            {r.startTime} – {r.endTime}
                          </div>
                        </td>
                        <td style={{ maxWidth: '200px' }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {r.purpose}
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${STATUS_BADGE_MAP[r.status] || ''}`}>
                            <StatusIcon size={12} />
                            {r.status}
                          </span>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                            {r.status === 'PENDIENTE' && (
                              <>
                                <button
                                  onClick={() => openApproveModal(r)}
                                  className="btn btn-primary btn-sm"
                                  title="Aprobar"
                                >
                                  <Check size={14} /> Aprobar
                                </button>
                                <button
                                  onClick={() => openRejectModal(r)}
                                  className="btn btn-danger btn-sm"
                                  title="Rechazar"
                                >
                                  <X size={14} /> Rechazar
                                </button>
                              </>
                            )}
                            {(r.status === 'APROBADA' || r.status === 'PARCIAL') && (
                              <button
                                onClick={() => handleReturn(r.id)}
                                className="btn btn-secondary btn-sm"
                                title="Marcar devuelto"
                              >
                                <RotateCcw size={14} /> Devolver
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan="7" style={styles.expandedRow}>
                            <div style={styles.detailGrid}>
                              <div>
                                <strong>Notas:</strong>
                                <p>{r.notes || 'Sin notas adicionales'}</p>
                              </div>
                              {r.rejectionReason && (
                                <div>
                                  <strong>Razón de rechazo:</strong>
                                  <p style={{ color: 'var(--color-red-600)' }}>{r.rejectionReason}</p>
                                </div>
                              )}
                              <div>
                                <strong>Creada:</strong>
                                <p>{new Date(r.createdAt).toLocaleString()}</p>
                              </div>
                              {r.quantityApproved != null && (
                                <div>
                                  <strong>Chromebooks aprobados:</strong>
                                  <p>{r.quantityApproved} de {r.quantityRequested} solicitados</p>
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

      {/* ── Approve Modal ── */}
      {showApproveModal && approveTarget && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Aprobar Solicitud</h3>
              <button onClick={() => setShowApproveModal(false)} style={styles.closeBtn}>✕</button>
            </div>
            <div className="modal-body">
              <div style={styles.approveInfo}>
                <p>
                  <strong>{approveTarget.user?.firstName} {approveTarget.user?.lastName}</strong> solicita{' '}
                  <strong style={{ color: 'var(--color-primary)' }}>{approveTarget.quantityRequested} Chromebooks</strong>
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-gray-600)' }}>
                  Carro: {approveTarget.cartCycle?.cart?.name} — {new Date(approveTarget.reservationDate).toLocaleDateString()} ({approveTarget.startTime} – {approveTarget.endTime})
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-gray-600)' }}>
                  Motivo: {approveTarget.purpose}
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Cantidad a Aprobar</label>
                <input
                  type="number"
                  min="1"
                  max={approveTarget.quantityRequested}
                  className="form-control"
                  value={approvedQty}
                  onChange={(e) => setApprovedQty(e.target.value)}
                />
                {parseInt(approvedQty, 10) < approveTarget.quantityRequested && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-red-600)', marginTop: '0.25rem' }}>
                    ⚠ Aprobación parcial: se aprobarán {approvedQty} de {approveTarget.quantityRequested} solicitados
                  </p>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowApproveModal(false)} className="btn btn-secondary">Cancelar</button>
              <button onClick={handleApprove} className="btn btn-primary">
                <Check size={16} /> Aprobar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reject Modal ── */}
      {showRejectModal && rejectTarget && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Rechazar Solicitud</h3>
              <button onClick={() => setShowRejectModal(false)} style={styles.closeBtn}>✕</button>
            </div>
            <div className="modal-body">
              <div style={styles.approveInfo}>
                <p>
                  <strong>{rejectTarget.user?.firstName} {rejectTarget.user?.lastName}</strong> —{' '}
                  {rejectTarget.quantityRequested} Chromebooks
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-gray-600)' }}>
                  {rejectTarget.purpose}
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Motivo del Rechazo *</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Indica por qué se rechaza esta solicitud..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowRejectModal(false)} className="btn btn-secondary">Cancelar</button>
              <button onClick={handleReject} className="btn btn-danger">
                <X size={16} /> Rechazar Solicitud
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  pendingBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    backgroundColor: 'var(--color-red-50)',
    color: 'var(--color-red-700)',
    borderRadius: 'var(--radius-full)',
    fontWeight: 700,
    fontSize: '0.875rem',
    border: '1px solid var(--color-red-200)',
  },
  filterBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1.5rem',
  },
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    fontSize: '0.85rem',
    color: 'var(--color-gray-700)',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1.1rem',
    color: 'var(--color-gray-500)',
  },
  approveInfo: {
    padding: '1rem',
    backgroundColor: 'var(--color-gray-50)',
    borderRadius: 'var(--radius-md)',
    marginBottom: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem',
  },
};
