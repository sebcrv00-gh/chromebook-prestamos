import React, { useEffect, useMemo, useState } from 'react';
import ApiClient from '../../services/api';
import toast from 'react-hot-toast';
import {
  GraduationCap,
  Plus,
  Edit2,
  ChevronRight,
  Layers,
  Monitor,
  Power,
  PowerOff,
  Calendar,
  ShoppingCart,
  Info,
  X,
  Trash2,
  Tag,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

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

  // Cycle Modal State
  const [showCycleModal, setShowCycleModal] = useState(false);
  const [editingCycle, setEditingCycle] = useState(null);
  const [cycleName, setCycleName] = useState('');
  const [cycleType, setCycleType] = useState('CONCEPTUAL');
  const [cycleYear, setCycleYear] = useState(new Date().getFullYear());
  const [gradeRange, setGradeRange] = useState('');
  const [cycleDescription, setCycleDescription] = useState('');
  const [cycleActive, setCycleActive] = useState(false);

  // Assigned carts inside cycle modal: [{ cartId, allocatedQuantity, customName }]
  const [modalAssignedCarts, setModalAssignedCarts] = useState([]);
  const [selectedCartToAdd, setSelectedCartToAdd] = useState('');

  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  // Quick Cart Modal State (for assigning/editing a cart directly in expanded cycle view)
  const [cartModalState, setCartModalState] = useState({
    isOpen: false,
    mode: 'ASSIGN', // 'ASSIGN' | 'EDIT'
    cycle: null,
    cartCycleId: null,
    cartId: '',
    customName: '',
    allocatedQuantity: 30,
    saving: false,
  });

  // Delete Cart Confirmation Modal
  const [deleteConfirmState, setDeleteConfirmState] = useState({
    isOpen: false,
    cycle: null,
    cartCycle: null,
    deleting: false,
  });

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

  const modalTotals = useMemo(() => {
    const validCarts = modalAssignedCarts.filter((c) => Number(c.allocatedQuantity) > 0);
    const cartCount = validCarts.length;
    const chromebookCount = validCarts.reduce((sum, c) => sum + (Number(c.allocatedQuantity) || 0), 0);
    return { cartCount, chromebookCount };
  }, [modalAssignedCarts]);

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

      const assigned = (cycle.cartCycles || []).map((cc) => ({
        cartId: cc.cartId,
        customName: cc.customName || '',
        allocatedQuantity: cc.allocatedQuantity || 0,
      }));
      setModalAssignedCarts(assigned);
    } else {
      setEditingCycle(null);
      setCycleName('');
      setCycleType('CONCEPTUAL');
      setCycleYear(new Date().getFullYear());
      setGradeRange(CYCLE_TYPES[1].defaultGrades);
      setCycleDescription('');
      setCycleActive(false);
      setModalAssignedCarts([]);
    }
    setSelectedCartToAdd('');
    setShowCycleModal(true);
  };

  const handleAddCartToModal = (cartId) => {
    if (!cartId) return;
    const existing = modalAssignedCarts.find((c) => c.cartId === cartId);
    if (existing) {
      toast.error('Este carro ya está en la lista del ciclo');
      return;
    }
    const cartInfo = carts.find((c) => c.id === cartId);
    setModalAssignedCarts((prev) => [
      ...prev,
      {
        cartId,
        customName: '',
        allocatedQuantity: cartInfo?.totalChromebooks || 30,
      },
    ]);
    setSelectedCartToAdd('');
  };

  const handleRemoveCartFromModal = (cartId) => {
    setModalAssignedCarts((prev) => prev.filter((c) => c.cartId !== cartId));
  };

  const handleUpdateModalCart = (cartId, field, value) => {
    setModalAssignedCarts((prev) =>
      prev.map((c) => {
        if (c.cartId !== cartId) return c;
        if (field === 'allocatedQuantity') {
          const num = Math.max(0, parseInt(value, 10) || 0);
          return { ...c, allocatedQuantity: num };
        }
        return { ...c, [field]: value };
      })
    );
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

      const cartCycles = modalAssignedCarts
        .filter((c) => Number(c.allocatedQuantity) > 0)
        .map((c) => ({
          cartId: c.cartId,
          allocatedQuantity: Number(c.allocatedQuantity),
          customName: c.customName?.trim() || null,
        }));

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

  // ── Quick Cart Assignment/Edit Handlers ──
  const openAssignCartModal = (cycle) => {
    const assignedIds = new Set((cycle.cartCycles || []).map((cc) => cc.cartId));
    const available = carts.filter((c) => !assignedIds.has(c.id));

    if (available.length === 0) {
      toast.error('Todos los carros existentes ya están asignados a este ciclo');
      return;
    }

    const firstCart = available[0];
    setCartModalState({
      isOpen: true,
      mode: 'ASSIGN',
      cycle,
      cartCycleId: null,
      cartId: firstCart.id,
      customName: '',
      allocatedQuantity: firstCart.totalChromebooks || 30,
      saving: false,
    });
  };

  const openEditCartModal = (cycle, cc) => {
    setCartModalState({
      isOpen: true,
      mode: 'EDIT',
      cycle,
      cartCycleId: cc.id,
      cartId: cc.cartId,
      customName: cc.customName || '',
      allocatedQuantity: cc.allocatedQuantity || 0,
      saving: false,
    });
  };

  const handleSaveQuickCart = async (e) => {
    e.preventDefault();
    const { mode, cycle, cartCycleId, cartId, customName, allocatedQuantity } = cartModalState;

    if (Number(allocatedQuantity) <= 0) {
      toast.error('La cantidad asignada debe ser mayor a 0');
      return;
    }

    setCartModalState((prev) => ({ ...prev, saving: true }));
    try {
      if (mode === 'ASSIGN') {
        await ApiClient.post(`/cycles/${cycle.id}/carts`, {
          cartId,
          allocatedQuantity: Number(allocatedQuantity),
          customName: customName.trim() || null,
        });
        toast.success('Carro asignado al ciclo exitosamente');
      } else {
        await ApiClient.patch(`/cycles/${cycle.id}/carts/${cartCycleId}`, {
          allocatedQuantity: Number(allocatedQuantity),
          customName: customName.trim() || null,
        });
        toast.success('Carro actualizado exitosamente para este ciclo');
      }
      setCartModalState((prev) => ({ ...prev, isOpen: false }));
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Error al procesar carro en el ciclo');
    } finally {
      setCartModalState((prev) => ({ ...prev, saving: false }));
    }
  };

  const openDeleteConfirmModal = (cycle, cartCycle) => {
    setDeleteConfirmState({
      isOpen: true,
      cycle,
      cartCycle,
      deleting: false,
    });
  };

  const handleConfirmDeleteCart = async () => {
    const { cycle, cartCycle } = deleteConfirmState;
    if (!cycle || !cartCycle) return;

    setDeleteConfirmState((prev) => ({ ...prev, deleting: true }));
    try {
      await ApiClient.delete(`/cycles/${cycle.id}/carts/${cartCycle.id}`);
      toast.success('Carro eliminado del ciclo correctamente');
      setDeleteConfirmState({ isOpen: false, cycle: null, cartCycle: null, deleting: false });
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Error al eliminar carro del ciclo');
      setDeleteConfirmState((prev) => ({ ...prev, deleting: false }));
    }
  };

  // Carts available to add in the full cycle modal
  const modalAvailableCarts = useMemo(() => {
    const assignedIds = new Set(modalAssignedCarts.map((c) => c.cartId));
    return carts.filter((c) => !assignedIds.has(c.id));
  }, [carts, modalAssignedCarts]);

  return (
    <div className="container animate-fade-in-up">
      <div className="page-header">
        <div>
          <h1 className="page-title">Ciclos Académicos y Carros</h1>
          <p className="page-subtitle">Gestiona los ciclos por rango de grados y asigna o personaliza Chromebooks por carro</p>
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
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <GraduationCap size={13} /> Grados: <strong style={{ color: 'var(--color-gray-800)' }}>{cycle.gradeRange}</strong>
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Calendar size={13} /> {cycle.year}
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <ShoppingCart size={13} /> {(cycle.cartCycles || []).length} carros
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Monitor size={13} /> <strong style={{ color: 'var(--color-gray-900)' }}>{available}</strong> disponibles / {total} asignados
                        </span>
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
                    <button onClick={() => openCycleModal(cycle)} className="btn btn-secondary btn-sm" title="Editar ciclo completo">
                      <Edit2 size={14} /> Editar Ciclo
                    </button>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : cycle.id)}
                      className="btn btn-secondary btn-sm"
                      title={isExpanded ? 'Ocultar carros' : 'Ver y gestionar carros'}
                    >
                      {isExpanded ? <ChevronRight size={14} style={{ transform: 'rotate(90deg)' }} /> : <ChevronRight size={14} />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div style={styles.assignSection}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-gray-700)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                        <Layers size={16} /> Carros asignados en este Ciclo
                      </h4>
                      <button
                        onClick={() => openAssignCartModal(cycle)}
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                      >
                        <Plus size={14} /> Asignar Carro al Ciclo
                      </button>
                    </div>

                    {cycle.cartCycles && cycle.cartCycles.length > 0 ? (
                      <div className="table-container">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Nombre en este Ciclo</th>
                              <th>Carro Físico / Ubicación</th>
                              <th>Asignados</th>
                              <th>Reservados</th>
                              <th>Disponibles</th>
                              <th style={{ textAlign: 'right' }}>Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cycle.cartCycles.map((cc) => {
                              const displayName = cc.customName || cc.cart?.name || 'N/A';
                              const hasCustomName = Boolean(cc.customName);
                              return (
                                <tr key={cc.id}>
                                  <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                      <Monitor size={15} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                                      <div>
                                        <div style={{ fontWeight: 600, color: 'var(--color-gray-900)' }}>
                                          {displayName}
                                        </div>
                                        {hasCustomName && (
                                          <div style={{ fontSize: '0.72rem', color: 'var(--color-gray-400)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <Tag size={10} /> Original: {cc.cart?.originalName || cc.cart?.name}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                  <td style={{ color: 'var(--color-gray-500)', fontSize: '0.85rem' }}>
                                    {cc.cart?.location || 'Sin ubicación fijada'}
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)' }}>
                                      Capacidad total: {cc.cart?.totalChromebooks || 0} equipos
                                    </div>
                                  </td>
                                  <td style={{ fontWeight: 600 }}>{cc.allocatedQuantity}</td>
                                  <td style={{ color: 'var(--color-gray-600)' }}>{cc.reservedQuantity}</td>
                                  <td style={{ fontWeight: 700, color: cc.availableQuantity <= 0 ? 'var(--color-red-600)' : 'var(--color-success-700)' }}>
                                    {cc.availableQuantity} libres
                                  </td>
                                  <td style={{ textAlign: 'right' }}>
                                    <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                                      <button
                                        onClick={() => openEditCartModal(cycle, cc)}
                                        className="btn btn-secondary btn-sm"
                                        title="Editar nombre y cantidad en este ciclo"
                                        style={{ padding: '0.3rem 0.5rem' }}
                                      >
                                        <Edit2 size={13} />
                                      </button>
                                      <button
                                        onClick={() => openDeleteConfirmModal(cycle, cc)}
                                        className="btn btn-secondary btn-sm"
                                        title="Eliminar carro de este ciclo"
                                        style={{ padding: '0.3rem 0.5rem', color: 'var(--color-red-600)', borderColor: 'var(--color-red-200)' }}
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-gray-500)', padding: '1.5rem', textAlign: 'center', backgroundColor: 'var(--color-white)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--color-border)' }}>
                        <p style={{ margin: 0, fontWeight: 500 }}>No hay carros asignados a este ciclo todavía.</p>
                        <p style={{ margin: '0.35rem 0 0.75rem 0', fontSize: '0.78rem', color: 'var(--color-gray-400)' }}>
                          Asigna carros para que los docentes puedan reservar Chromebooks durante este ciclo.
                        </p>
                        <button
                          onClick={() => openAssignCartModal(cycle)}
                          className="btn btn-primary btn-sm"
                        >
                          <Plus size={14} /> Asignar Primer Carro
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── Cycle Create/Edit Full Modal ── */}
      {showCycleModal && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target.classList.contains('modal-overlay') && !saving && setShowCycleModal(false)}
        >
          <div
            className="modal-content animate-fade-in-up"
            style={{
              maxWidth: '780px',
              width: '95%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 'var(--radius-xl)',
              overflow: 'hidden',
            }}
          >
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--color-gray-900)' }}>
                  {editingCycle ? 'Editar Ciclo Académico' : 'Nuevo Ciclo Académico'}
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--color-gray-500)', margin: '0.15rem 0 0 0' }}>
                  {editingCycle
                    ? 'Modifica las características del ciclo y administra los carros asignados'
                    : 'Crea un ciclo por grados y asigna los carros correspondientes'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => !saving && setShowCycleModal(false)}
                style={styles.closeBtn}
                disabled={saving}
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleSaveCycle}
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                minHeight: 0,
                overflow: 'hidden',
              }}
            >
              <div
                className="modal-body"
                style={{
                  padding: '1.5rem',
                  overflowY: 'auto',
                  flex: '1 1 auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem',
                }}
              >
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

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
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

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem 1rem', backgroundColor: 'var(--color-gray-50)', borderRadius: 'var(--radius-md)' }}>
                  <input
                    type="checkbox"
                    id="cycle-active"
                    checked={cycleActive}
                    onChange={(e) => setCycleActive(e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label htmlFor="cycle-active" style={{ fontSize: '0.85rem', color: 'var(--color-gray-800)', cursor: 'pointer', margin: 0, fontWeight: 500 }}>
                    Activar este ciclo inmediatamente (los demás ciclos activos se desactivarán automáticamente)
                  </label>
                </div>

                {/* ── Cart Allocation & Per-Cycle Naming Section ── */}
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <label className="form-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.95rem', fontWeight: 600 }}>
                        <Layers size={16} /> Carros y Nombres para este Ciclo
                      </label>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', margin: '0.15rem 0 0 0' }}>
                        Personaliza el nombre de cada carro para este ciclo y asigna su stock de Chromebooks
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 600 }}>
                      <span style={{ padding: '0.25rem 0.65rem', backgroundColor: 'var(--color-primary-50)', color: 'var(--color-primary-700)', borderRadius: 'var(--radius-full)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                        <ShoppingCart size={13} /> {modalTotals.cartCount} carros
                      </span>
                      <span style={{ padding: '0.25rem 0.65rem', backgroundColor: 'var(--color-success-50)', color: 'var(--color-success-700)', borderRadius: 'var(--radius-full)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Monitor size={13} /> {modalTotals.chromebookCount} Chromebooks
                      </span>
                    </div>
                  </div>

                  {/* List of assigned carts in this modal */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1rem' }}>
                    {modalAssignedCarts.length === 0 ? (
                      <div style={{ padding: '1.5rem', textAlign: 'center', backgroundColor: 'var(--color-gray-50)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--color-border)' }}>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-gray-500)' }}>
                          No hay carros asignados a este ciclo todavía.
                        </p>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--color-gray-400)' }}>
                          Usa el selector abajo para agregar carros físicos a este ciclo.
                        </p>
                      </div>
                    ) : (
                      modalAssignedCarts.map((item) => {
                        const cartData = carts.find((c) => c.id === item.cartId);
                        const maxCap = cartData?.totalChromebooks || 30;
                        return (
                          <div
                            key={item.cartId}
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'minmax(200px, 1.4fr) minmax(130px, 1.2fr) 95px 40px',
                              alignItems: 'center',
                              gap: '0.75rem',
                              padding: '0.75rem 1rem',
                              backgroundColor: 'var(--color-white)',
                              border: '1px solid var(--color-border)',
                              borderRadius: 'var(--radius-md)',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                            }}
                          >
                            {/* Original Cart Info */}
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.85rem' }}>
                                <Monitor size={14} color="var(--color-primary)" />
                                {cartData?.name || 'Carro'}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--color-gray-400)', marginTop: '0.15rem' }}>
                                {cartData?.location || 'Sin ubicación'} • Cap: {maxCap} equipos
                              </div>
                            </div>

                            {/* Custom Name in this Cycle */}
                            <div>
                              <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--color-gray-500)', marginBottom: '0.2rem', fontWeight: 500 }}>
                                Nombre en este ciclo:
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                placeholder={cartData?.name || 'Nombre para el ciclo...'}
                                value={item.customName}
                                onChange={(e) => handleUpdateModalCart(item.cartId, 'customName', e.target.value)}
                                style={{ fontSize: '0.8rem', padding: '0.35rem 0.5rem' }}
                              />
                            </div>

                            {/* Allocated Quantity */}
                            <div>
                              <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--color-gray-500)', marginBottom: '0.2rem', fontWeight: 500, textAlign: 'right' }}>
                                Asignar:
                              </label>
                              <input
                                type="number"
                                min="1"
                                max={maxCap}
                                value={item.allocatedQuantity}
                                onChange={(e) => handleUpdateModalCart(item.cartId, 'allocatedQuantity', e.target.value)}
                                className="form-control"
                                style={{ textAlign: 'right', fontSize: '0.85rem', fontWeight: 600, padding: '0.35rem 0.5rem' }}
                              />
                            </div>

                            {/* Delete Cart from this cycle */}
                            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '1rem' }}>
                              <button
                                type="button"
                                onClick={() => handleRemoveCartFromModal(item.cartId)}
                                title="Eliminar carro de este ciclo"
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: 'var(--color-red-500)',
                                  padding: '0.35rem',
                                  borderRadius: 'var(--radius-sm)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Add another cart dropdown */}
                  {modalAvailableCarts.length > 0 ? (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <select
                        className="form-control"
                        value={selectedCartToAdd}
                        onChange={(e) => handleAddCartToModal(e.target.value)}
                        style={{ fontSize: '0.85rem', borderColor: 'var(--color-primary-300)', backgroundColor: 'var(--color-primary-50)' }}
                      >
                        <option value="">+ Asignar otro carro a este ciclo...</option>
                        {modalAvailableCarts.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} — {c.location || 'Sin ubicación'} (Cap: {c.totalChromebooks || 30} equipos)
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)', margin: 0, fontStyle: 'italic' }}>
                      Todos los carros físicos existentes en el sistema están asignados a este ciclo.
                    </p>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => !saving && setShowCycleModal(false)} className="btn btn-secondary" disabled={saving}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : editingCycle ? 'Actualizar Ciclo' : 'Crear Ciclo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Quick Assign / Edit Cart Modal (from expanded list) ── */}
      {cartModalState.isOpen && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target.classList.contains('modal-overlay') && !cartModalState.saving && setCartModalState((prev) => ({ ...prev, isOpen: false }))}
        >
          <div className="modal-content animate-fade-in-up" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--color-gray-900)' }}>
                  {cartModalState.mode === 'ASSIGN' ? 'Asignar Carro al Ciclo' : 'Editar Carro en el Ciclo'}
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--color-gray-500)', margin: '0.15rem 0 0 0' }}>
                  {cartModalState.cycle?.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => !cartModalState.saving && setCartModalState((prev) => ({ ...prev, isOpen: false }))}
                style={styles.closeBtn}
                disabled={cartModalState.saving}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveQuickCart}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {cartModalState.mode === 'ASSIGN' ? (
                  <div className="form-group">
                    <label className="form-label">Selecciona el Carro Físico</label>
                    <select
                      className="form-control"
                      required
                      value={cartModalState.cartId}
                      onChange={(e) => {
                        const cid = e.target.value;
                        const cartObj = carts.find((c) => c.id === cid);
                        setCartModalState((prev) => ({
                          ...prev,
                          cartId: cid,
                          allocatedQuantity: cartObj?.totalChromebooks || 30,
                        }));
                      }}
                    >
                      {carts
                        .filter((c) => !(cartModalState.cycle?.cartCycles || []).some((cc) => cc.cartId === c.id))
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} — {c.location || 'Sin ubicación'} (Cap: {c.totalChromebooks} equipos)
                          </option>
                        ))}
                    </select>
                  </div>
                ) : (
                  <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--color-gray-50)', borderRadius: 'var(--radius-md)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>Carro original de hardware:</span>
                    <div style={{ fontWeight: 600, color: 'var(--color-gray-800)', marginTop: '0.15rem' }}>
                      {carts.find((c) => c.id === cartModalState.cartId)?.name || 'Carro'}
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">
                    Nombre en este ciclo <span style={{ fontWeight: 400, color: 'var(--color-gray-500)', fontSize: '0.75rem' }}>(Opcional)</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej: Carro Transición, Carro 1° y 2°, etc."
                    value={cartModalState.customName}
                    onChange={(e) => setCartModalState((prev) => ({ ...prev, customName: e.target.value }))}
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', marginTop: '0.25rem' }}>
                    Si se deja vacío, mantendrá el nombre original del carro.
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">Chromebooks Asignados a este Ciclo</label>
                  <input
                    type="number"
                    min="1"
                    max={carts.find((c) => c.id === cartModalState.cartId)?.totalChromebooks || 999}
                    required
                    className="form-control"
                    value={cartModalState.allocatedQuantity}
                    onChange={(e) => setCartModalState((prev) => ({ ...prev, allocatedQuantity: e.target.value }))}
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', marginTop: '0.25rem' }}>
                    Capacidad máxima física de este carro: {carts.find((c) => c.id === cartModalState.cartId)?.totalChromebooks || 30} equipos.
                  </p>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => !cartModalState.saving && setCartModalState((prev) => ({ ...prev, isOpen: false }))}
                  className="btn btn-secondary"
                  disabled={cartModalState.saving}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={cartModalState.saving}>
                  {cartModalState.saving ? 'Guardando...' : cartModalState.mode === 'ASSIGN' ? 'Asignar Carro' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Cart Confirmation Modal ── */}
      {deleteConfirmState.isOpen && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target.classList.contains('modal-overlay') && !deleteConfirmState.deleting && setDeleteConfirmState((prev) => ({ ...prev, isOpen: false }))}
        >
          <div className="modal-content animate-fade-in-up" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--color-red-600)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={18} /> Quitar Carro del Ciclo
              </h3>
              <button
                type="button"
                onClick={() => !deleteConfirmState.deleting && setDeleteConfirmState((prev) => ({ ...prev, isOpen: false }))}
                style={styles.closeBtn}
                disabled={deleteConfirmState.deleting}
              >
                <X size={16} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '1.25rem' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-gray-700)', margin: 0, lineHeight: 1.5 }}>
                ¿Estás seguro de que deseas eliminar la asignación del carro{' '}
                <strong>"{deleteConfirmState.cartCycle?.customName || deleteConfirmState.cartCycle?.cart?.name || 'este carro'}"</strong>{' '}
                del ciclo <strong>"{deleteConfirmState.cycle?.name}"</strong>?
              </p>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-gray-500)', marginTop: '0.5rem', margin: 0 }}>
                El carro físico seguirá existiendo en el sistema general, pero ya no estará disponible para préstamos en este ciclo escolar.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                onClick={() => !deleteConfirmState.deleting && setDeleteConfirmState((prev) => ({ ...prev, isOpen: false }))}
                className="btn btn-secondary"
                disabled={deleteConfirmState.deleting}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCart}
                className="btn btn-danger"
                disabled={deleteConfirmState.deleting}
              >
                {deleteConfirmState.deleting ? 'Eliminando...' : 'Sí, Quitar Carro'}
              </button>
            </div>
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
    padding: '1.25rem',
    backgroundColor: 'var(--color-gray-50)',
    borderRadius: 'var(--radius-md)',
    borderTop: '1px solid var(--color-border)',
    marginTop: '0.5rem',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--color-gray-500)',
    padding: '0.25rem 0.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};
