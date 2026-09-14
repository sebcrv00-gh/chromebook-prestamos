import React, { useEffect, useMemo, useState } from 'react';
import ApiClient from '../../services/api';
import toast from 'react-hot-toast';
import { GraduationCap, Plus, Edit2, ChevronRight, Layers, Monitor, Power, PowerOff, CheckCircle2 } from 'lucide-react';

const CYCLE_TYPES = [
  { value: 'EXPLORATORIO', label: 'Exploratorio', defaultGrades: 'Transición a 2°' },
  { value: 'CONCEPTUAL', label: 'Conceptual', defaultGrades: '3° a 5°' },
  { value: 'CONTEXTUAL', label: 'Contextual', defaultGrades: '6° a 8°' },
  { value: 'PROYECTIVO', label: 'Proyectivo', defaultGrades: '9° a 11°' },
];

export const CyclesManagementPage = () => {
  const [cycles, setCycles] = useState([]);
  const [carts, setCarts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showCycleModal, setShowCycleModal] = useState(false);
  const [editingCycle, setEditingCycle] = useState(null);
  const [cycleName, setCycleName] = useState('');
  const [cycleType, setCycleType] = useState('CONCEPTUAL');
  const [cycleYear, setCycleYear] = useState(new Date().getFullYear());
  const [gradeRange, setGradeRange] = useState('');
  const [cycleDescription, setCycleDescription] = useState('');
  const [cycleActive, setCycleActive] = useState(false);
  const [cartAllocations, setCartAllocations] = useState({}); // { cartId: allocatedQuantity }
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-fill grade range when cycle type changes (only for new cycles)
  useEffect(() => {
    if (!editingCycle && cycleType) {
      const found = CYCLE_TYPES.find((t) => t.value === cycleType);
      if (found) setGradeRange(found.defaultGrades);
    }
  }, [cycleType, editingCycle]);

  const totals = useMemo(() => {
    const items = Object.entries(cartAllocations || {});
    const cartCount = items.filter(([, qty]) => Number(qty) > 0).length;
    const chromebookCount = items.reduce((sum, [, qty]) => sum + (Number(qty) || 0), 0);
    return { cartCount, chromebookCount };
  }, [cartAllocations]);

  const fetchData = async () => {
    try {
      const [cyclesRes, cartsRes] = await Promise.all([
        ApiClient.get('/cycles'),
        ApiClient.get('/carts'),
      ]);
      if (cyclesRes.data) setCycles(cyclesRes.data);
      if (cartsRes.data) setCarts(cartsRes.data);
    } catch (e) {
      toast.error('Error cargando datos de ciclos y carros');
    } finally {
      setLoading(false);
    }
  };

  const openCycleModal = (cycle = null) => {
    if (cycle) {
      setEditingCycle(cycle);
      setCycleName(cycle.name);
      setCycleType(cycle.type);
      setCycleYear(cycle.year);
      setGradeRange(cycle.gradeRange || '');
      setCycleDescription(cycle.description || '');
      setCycleActive(cycle.active !== undefined ? cycle.active : false);
      const alloc = {};
      (cycle.cartCycles || []).forEach((cc) => { if (cc.cartId) alloc[cc.cartId] = cc.allocatedQuantity; });
      setCartAllocations(alloc);
    } else {
      setEditingCycle(null);
      setCycleName('');
      setCycleType('CONCEPTUAL');
      setCycleYear(new Date().getFullYear());
      setGradeRange(CYCLE_TYPES[1].defaultGrades);
      setCycleDescription('');
      setCycleActive(false);
      setCartAllocations({});
    }
    setShowCycleModal(true);
  };

  const updateAllocation = (cartId, value) => {
    const n = Math.max(0, parseInt(value, 10) || 0);
    setCartAllocations((prev) => ({ ...prev, [cartId]: n }));
  };

  const handleToggleActive = async (cycleId) => {
    setTogglingId(cycleId);
    try {
      const res = await ApiClient.request(`/cycles/${cycleId}/toggle-active`, { method: 'PATCH' });
      toast.success(res.message || 'Estado del ciclo actualizado');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Error al cambiar estado del ciclo');
    } finally {
      setTogglingId(null);
    }
  };

  const handleSaveCycle = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (!cycleName.trim()) {
        toast.error('Debes escribir un nombre para el ciclo');
        return;
      }
      if (!gradeRange.trim()) {
        toast.error('Debes especificar el rango de grados');
        return;
      }

      const cartCycles = Object.entries(cartAllocations)
        .filter(([, qty]) => Number(qty) > 0)
        .map(([cartId, allocatedQuantity]) => ({ cartId, allocatedQuantity: Number(allocatedQuantity) }));

      const payload = {
        name: cycleName.trim(),
        type: cycleType,
        gradeRange: gradeRange.trim(),
        description: cycleDescription.trim() || undefined,
        year: Number(cycleYear),
        active: cycleActive,
        cartCycles,
      };

      if (editingCycle) {
        await ApiClient.put(`/cycles/${editingCycle.id}`, payload);
        toast.success('Ciclo actualizado exitosamente');
      } else {
        await ApiClient.post('/cycles', payload);
        toast.success('Ciclo creado exitosamente');
      }

      setShowCycleModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Error al guardar ciclo');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container animate-fade-in-up">
      <div className="page-header">
        <div>
          <h1 className="page-title">Ciclos Académicos y Carros</h1>
          <p className="page-subtitle">Gestiona los ciclos por rango de grados y asigna Chromebooks por carro</p>
        </div>
        <button onClick={() => openCycleModal()} className="btn btn-primary">
          <Plus size={18} />
          Nuevo Ciclo
        </button>
      </div>

      {/* Cycles List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {loading ? (
          <p style={{ color: 'var(--color-gray-400)' }}>Cargando ciclos académicos...</p>
        ) : cycles.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <GraduationCap size={40} color="var(--color-gray-300)" style={{ marginBottom: '1rem' }} />
            <p style={{ color: 'var(--color-gray-500)' }}>No hay ciclos académicos creados aún</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-gray-400)', marginTop: '0.25rem' }}>
              Haz clic en <strong>"Nuevo Ciclo"</strong> para configurar tu primer ciclo de grados
            </p>
          </div>
        ) : (
          cycles.map((cycle) => {
            const isExpanded = expandedId === cycle.id;
            const isActive = cycle.active;
            const total = (cycle.cartCycles || []).reduce((s, cc) => s + cc.allocatedQuantity, 0);
            const reserved = (cycle.cartCycles || []).reduce((s, cc) => s + cc.reservedQuantity, 0);
            const available = total - reserved;
            return (
              <div key={cycle.id} className="card card-hover" style={isActive ? { borderLeft: '4px solid var(--color-success-500)' } : {}}>
                <div className="card-header" style={{ marginBottom: isExpanded ? '1rem' : '0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={styles.cycleIconBox}>
                      <GraduationCap size={22} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <h3 className="card-title" style={{ margin: 0 }}>{cycle.name}</h3>
                        {isActive && <span className="badge badge-aprobada">CICLO ACTIVO</span>}
                        <span className="badge badge-parcial">{cycle.type}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.35rem', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--color-gray-500)' }}>
                        <span>🎓 Grados: <strong style={{ color: 'var(--color-gray-800)' }}>{cycle.gradeRange}</strong></span>
                        <span>📅 {cycle.year}</span>
                        <span>🛒 {(cycle.cartCycles || []).length} carros</span>
                        <span>💻 <strong style={{ color: 'var(--color-gray-900)' }}>{available}</strong> disponibles / {total} asignados</span>
                      </div>
                      {cycle.description && (
                        <p style={{ fontSize: '0.78rem', color: 'var(--color-gray-400)', marginTop: '0.25rem', fontStyle: 'italic' }}>
                          {cycle.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                    <button
                      onClick={() => handleToggleActive(cycle.id)}
                      className={`btn btn-sm ${isActive ? 'btn-secondary' : 'btn-primary'}`}
                      disabled={togglingId === cycle.id}
                      title={isActive ? 'Desactivar ciclo' : 'Activar ciclo'}
                      style={{ minWidth: '100px' }}
                    >
                      {togglingId === cycle.id ? '...' : isActive ? (
                        <><PowerOff size={14} /> Desactivar</>
                      ) : (
                        <><Power size={14} /> Activar</>
                      )}
                    </button>
                    <button onClick={() => openCycleModal(cycle)} className="btn btn-secondary btn-sm" title="Editar ciclo">
                      <Edit2 size={14} /> Editar
                    </button>
                    <button onClick={() => setExpandedId(isExpanded ? null : cycle.id)} className="btn btn-secondary btn-sm">
                      {isExpanded ? <ChevronRight size={14} style={{ transform: 'rotate(90deg)' }} /> : <ChevronRight size={14} />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div style={styles.assignSection}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-gray-700)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Layers size={16} /> Disponibilidad real de Carros en este Ciclo
                    </h4>
                    {cycle.cartCycles && cycle.cartCycles.length > 0 ? (
                      <div className="table-container">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Carro de Chromebooks</th>
                              <th>Ubicación</th>
                              <th>Asignados al ciclo</th>
                              <th>Reservados</th>
                              <th>Disponibles</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cycle.cartCycles.map((cc) => (
                              <tr key={cc.id}>
                                <td style={{ fontWeight: 600 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Monitor size={14} color="var(--color-primary)" />
                                    {cc.cart?.name || 'N/A'}
                                  </div>
                                </td>
                                <td style={{ color: 'var(--color-gray-500)' }}>{cc.cart?.location || '—'}</td>
                                <td>{cc.allocatedQuantity}</td>
                                <td>{cc.reservedQuantity}</td>
                                <td style={{ fontWeight: 700, color: cc.availableQuantity <= 0 ? 'var(--color-red-600)' : 'var(--color-success-700)' }}>
                                  {cc.availableQuantity} libres
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.85rem', color: 'var(--color-gray-400)', padding: '1rem', textAlign: 'center', backgroundColor: 'var(--color-gray-50)', borderRadius: 'var(--radius-md)' }}>
                        No hay carros asignados a este ciclo. Edita el ciclo para agregar asignaciones.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── Cycle Create/Edit Modal ── */}
      {showCycleModal && (
        <div className="modal-overlay" onClick={(e) => e.target.classList.contains('modal-overlay') && !saving && setShowCycleModal(false)}>
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                {editingCycle ? 'Editar Ciclo Académico' : 'Nuevo Ciclo Académico'}
              </h3>
              <button onClick={() => !saving && setShowCycleModal(false)} style={styles.closeBtn} disabled={saving}>✕</button>
            </div>
            <form onSubmit={handleSaveCycle}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label">Nombre del Ciclo</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="Ej: Ciclo Conceptual 2026"
                    value={cycleName}
                    onChange={(e) => setCycleName(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Tipo de Ciclo</label>
                    <select className="form-control" value={cycleType} onChange={(e) => setCycleType(e.target.value)}>
                      {CYCLE_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Año Académico</label>
                    <input type="number" className="form-control" required value={cycleYear} onChange={(e) => setCycleYear(e.target.value)} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Rango de Grados</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="Ej: Transición a 2°, 3° a 5°, 6° a 8°"
                    value={gradeRange}
                    onChange={(e) => setGradeRange(e.target.value)}
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', marginTop: '0.35rem' }}>
                    Define qué grados escolares pertenecen a este ciclo
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">Descripción (opcional)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Breve descripción del ciclo..."
                    value={cycleDescription}
                    onChange={(e) => setCycleDescription(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="checkbox" id="cycle-active" checked={cycleActive} onChange={(e) => setCycleActive(e.target.checked)} />
                  <label htmlFor="cycle-active" style={{ fontSize: '0.875rem', color: 'var(--color-gray-700)', cursor: 'pointer' }}>
                    Activar este ciclo inmediatamente (los demás ciclos activos se desactivarán automáticamente)
                  </label>
                </div>

                {/* Cart allocation section */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <label className="form-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Layers size={15} /> Asignar Chromebooks por Carro
                    </label>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', fontWeight: 600 }}>
                      <span style={{ padding: '0.3rem 0.7rem', backgroundColor: 'var(--color-primary-50)', color: 'var(--color-primary-700)', borderRadius: 'var(--radius-full)' }}>
                        🛒 {totals.cartCount} carritos
                      </span>
                      <span style={{ padding: '0.3rem 0.7rem', backgroundColor: 'var(--color-success-50)', color: 'var(--color-success-700)', borderRadius: 'var(--radius-full)' }}>
                        💻 {totals.chromebookCount} Chromebooks
                      </span>
                    </div>
                  </div>

                  <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 90px', padding: '0.65rem 1rem', backgroundColor: 'var(--color-gray-50)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-gray-600)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                      <div>Carro de Chromebooks</div>
                      <div>Ubicación / Capacidad total</div>
                      <div style={{ textAlign: 'right' }}>Asignar</div>
                    </div>
                    {carts.length === 0 ? (
                      <div style={{ padding: '1.5rem 1rem', textAlign: 'center', color: 'var(--color-gray-500)', fontSize: '0.85rem' }}>
                        No hay carros disponibles. Crea primero los carros desde el administrador.
                      </div>
                    ) : (
                      carts.map((c) => (
                        <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 90px', padding: '0.65rem 1rem', alignItems: 'center', borderTop: '1px solid var(--color-border)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Monitor size={14} color="var(--color-primary)" />
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{c.name}</div>
                              {c.description && <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>{c.description}</div>}
                            </div>
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--color-gray-500)' }}>
                            {c.location || 'Ubicación no definida'}
                            <div style={{ fontWeight: 600, color: 'var(--color-gray-700)' }}>Capacidad: {c.totalChromebooks || 0} equipos</div>
                          </div>
                          <div>
                            <input
                              type="number"
                              min="0"
                              max={c.totalChromebooks || 999}
                              value={cartAllocations[c.id] ?? 0}
                              onChange={(e) => updateAllocation(c.id, e.target.value)}
                              style={{ width: '100%', padding: '0.35rem 0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', textAlign: 'right', fontSize: '0.875rem', fontWeight: 600 }}
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', marginTop: '0.5rem' }}>
                    ✎ Define cuántos Chromebooks de cada carro estarán disponibles para préstamo durante este ciclo. Si dejas 0, ese carro no aparecerá a los docentes.
                  </p>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => !saving && setShowCycleModal(false)} className="btn btn-secondary" disabled={saving}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : editingCycle ? 'Actualizar Ciclo' : 'Crear Ciclo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  cycleIconBox: {
    width: '44px',
    height: '44px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--color-primary-50)',
    color: 'var(--color-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  assignSection: {
    padding: '1rem',
    backgroundColor: 'var(--color-gray-50)',
    borderRadius: 'var(--radius-md)',
    borderTop: '1px solid var(--color-border)',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1.1rem',
    color: 'var(--color-gray-500)',
    padding: '0.25rem 0.5rem',
  },
};
