import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiClient from '../../services/api';
import toast from 'react-hot-toast';
import { Laptop, CalendarDays, Clock, Send, AlertCircle } from 'lucide-react';

export const DocenteNewReservation = () => {
  const navigate = useNavigate();
  const [cartCycles, setCartCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [selectedCartCycleId, setSelectedCartCycleId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [reservationDate, setReservationDate] = useState('');
  const [startTime, setStartTime] = useState('07:00');
  const [endTime, setEndTime] = useState('08:00');
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');

  // Availability
  const [availability, setAvailability] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const cyclesRes = await ApiClient.get('/cycles');

      const allCartCycles = [];
      for (const cycle of cyclesRes.data || []) {
        if (cycle.active && cycle.cartCycles) {
          for (const cc of cycle.cartCycles) {
            if (cc.cart && cc.cart.active) {
              allCartCycles.push({
                id: cc.id,
                label: `${cc.cart.name || 'Carro'} — ${cycle.name}`,
                cartName: cc.cart.name,
                cycleName: cycle.name,
                allocated: cc.allocatedQuantity,
                reserved: cc.reservedQuantity,
                available: cc.availableQuantity,
              });
            }
          }
        }
      }
      setCartCycles(allCartCycles);
    } catch (e) {
      toast.error('Error cargando datos de disponibilidad');
    } finally {
      setLoading(false);
    }
  };

  // Fetch availability when cart-cycle changes
  useEffect(() => {
    if (selectedCartCycleId) {
      fetchAvailability(selectedCartCycleId);
    } else {
      setAvailability(null);
    }
  }, [selectedCartCycleId]);

  const fetchAvailability = async (ccId) => {
    try {
      const res = await ApiClient.get(`/cart-cycles/${ccId}/availability`);
      if (res.data) setAvailability(res.data);
    } catch (e) {
      setAvailability(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCartCycleId) {
      toast.error('Selecciona un carro y ciclo');
      return;
    }
    setSubmitting(true);
    try {
      await ApiClient.post('/reservations', {
        cartCycleId: selectedCartCycleId,
        quantityRequested: parseInt(quantity, 10),
        reservationDate: new Date(reservationDate).toISOString(),
        startTime,
        endTime,
        purpose,
        notes: notes || undefined,
      });
      toast.success('¡Solicitud enviada exitosamente! Espera la aprobación del administrador.');
      navigate('/docente/mis-reservas');
    } catch (err) {
      toast.error(err.message || 'Error al enviar la solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  if (loading) return <p style={{ padding: '2rem', color: 'var(--color-gray-400)' }}>Cargando formulario...</p>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Solicitar Chromebooks</h1>
          <p className="page-subtitle">Completa el formulario para solicitar equipos para tu clase</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', alignItems: 'start' }}>
        {/* Form */}
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Carro de Chromebooks y Ciclo *</label>
              <select
                className="form-control"
                value={selectedCartCycleId}
                onChange={(e) => setSelectedCartCycleId(e.target.value)}
                required
                disabled={cartCycles.length === 0}
              >
                <option value="">
                  {cartCycles.length === 0
                    ? '— No hay carritos disponibles para el ciclo actual —'
                    : '— Seleccionar —'}
                </option>
                {cartCycles.map((cc) => (
                  <option key={cc.id} value={cc.id}>
                    {cc.label} ({cc.available} disponibles)
                  </option>
                ))}
              </select>
              {cartCycles.length === 0 && (
                <div style={{
                  marginTop: '0.75rem',
                  padding: '0.75rem 1rem',
                  backgroundColor: 'var(--color-yellow-50)',
                  border: '1px solid var(--color-yellow-200)',
                  color: 'var(--color-yellow-800)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                }}>
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>
                    Actualmente no hay carritos de Chromebooks configurados para el ciclo académico activo.
                    Por favor, contacta al administrador TIC para que habilite los carritos correspondientes.
                  </span>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Cantidad de Chromebooks *</label>
                <input
                  type="number"
                  min="1"
                  max={availability?.available || 100}
                  className="form-control"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Hora Inicio *</label>
                <input
                  type="time"
                  className="form-control"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Hora Fin *</label>
                <input
                  type="time"
                  className="form-control"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Fecha de Uso *</label>
              <input
                type="date"
                className="form-control"
                min={today}
                value={reservationDate}
                onChange={(e) => setReservationDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Motivo / Clase *</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ej: Clase de Ciencias Naturales - Grado 8°"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Notas Adicionales (opcional)</label>
              <textarea
                className="form-control"
                rows="2"
                placeholder="Información adicional para el administrador..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button type="button" onClick={() => navigate('/docente')} className="btn btn-secondary">
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
                <Send size={18} />
                {submitting ? 'Enviando...' : 'Enviar Solicitud'}
              </button>
            </div>
          </form>
        </div>

        {/* Availability Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {availability ? (
            <div className="card">
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Laptop size={18} color="var(--color-primary)" />
                Disponibilidad en Tiempo Real
              </h4>
              <div style={styles.availRow}>
                <span>Asignados</span>
                <span style={{ fontWeight: 700 }}>{availability.allocated}</span>
              </div>
              <div style={styles.availRow}>
                <span>Reservados</span>
                <span style={{ fontWeight: 700 }}>{availability.reserved}</span>
              </div>
              <div style={{ ...styles.availRow, borderTop: '2px solid var(--color-border)', paddingTop: '0.75rem' }}>
                <span style={{ fontWeight: 600 }}>Disponibles</span>
                <span style={{ fontWeight: 800, fontSize: '1.25rem', color: availability.available <= 0 ? 'var(--color-red-600)' : 'var(--color-gray-900)' }}>
                  {availability.available}
                </span>
              </div>
              {availability.available <= 0 && (
                <div style={styles.warningBox}>
                  <AlertCircle size={16} />
                  <span>No hay equipos disponibles en este carro/ciclo</span>
                </div>
              )}
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
              <CalendarDays size={32} color="var(--color-gray-300)" />
              <p style={{ color: 'var(--color-gray-400)', fontSize: '0.85rem', marginTop: '0.75rem' }}>
                Selecciona un carro y ciclo para ver la disponibilidad
              </p>
            </div>
          )}

          {/* Info */}
          <div style={styles.infoBox}>
            <Clock size={16} color="var(--color-gray-500)" />
            <p style={{ fontSize: '0.8rem', color: 'var(--color-gray-600)' }}>
              Tu solicitud será revisada por el administrador TIC. Recibirás una notificación cuando sea aprobada o rechazada.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  availRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.5rem 0',
    fontSize: '0.85rem',
    color: 'var(--color-gray-700)',
  },
  warningBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem',
    backgroundColor: 'var(--color-red-50)',
    color: 'var(--color-red-700)',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.8rem',
    fontWeight: 600,
    marginTop: '0.75rem',
  },
  infoBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
    padding: '1rem',
    backgroundColor: 'var(--color-gray-50)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
  },
};
