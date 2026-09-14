import React, { useEffect, useState } from 'react';
import ApiClient from '../../services/api';
import toast, { Toaster } from 'react-hot-toast';
import { Laptop, Plus, Edit2, Trash2 } from 'lucide-react';

export const CartsManagementPage = () => {
  const [carts, setCarts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCart, setEditingCart] = useState(null);

  // Form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [totalChromebooks, setTotalChromebooks] = useState(30);
  const [location, setLocation] = useState('');

  useEffect(() => {
    fetchCarts();
  }, []);

  const fetchCarts = async () => {
    try {
      const res = await ApiClient.get('/carts');
      if (res.data) setCarts(res.data);
    } catch (e) {
      toast.error('Error cargando carros de Chromebooks');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (cart = null) => {
    if (cart) {
      setEditingCart(cart);
      setName(cart.name);
      setDescription(cart.description || '');
      setTotalChromebooks(cart.totalChromebooks);
      setLocation(cart.location || '');
    } else {
      setEditingCart(null);
      setName('');
      setDescription('');
      setTotalChromebooks(30);
      setLocation('');
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { name, description, totalChromebooks: parseInt(totalChromebooks, 10), location };
      if (editingCart) {
        await ApiClient.put(`/carts/${editingCart.id}`, payload);
        toast.success('Carro actualizado exitosamente');
      } else {
        await ApiClient.post('/carts', payload);
        toast.success('Carro de Chromebooks creado exitosamente');
      }
      setShowModal(false);
      fetchCarts();
    } catch (err) {
      toast.error(err.message || 'Error al guardar el carro');
    }
  };

  return (
    <div>
      <Toaster position="top-right" />
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestión de Carros y Kits de Chromebooks</h1>
          <p className="page-subtitle">Configura los carros móviles de equipos y su capacidad física total</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn-primary">
          <Plus size={18} />
          Nuevo Carro / Kit
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {loading ? (
          <p>Cargando carros...</p>
        ) : (
          carts.map((c) => (
            <div key={c.id} className="card card-hover">
              <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ padding: '0.5rem', backgroundColor: 'var(--color-red-50)', borderRadius: '8px', color: 'var(--color-primary)' }}>
                    <Laptop size={24} />
                  </div>
                  <div>
                    <h3 className="card-title">{c.name}</h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>{c.location || 'Sin ubicación fijada'}</p>
                  </div>
                </div>
                <button onClick={() => handleOpenModal(c)} className="btn btn-secondary btn-sm" title="Editar">
                  <Edit2 size={14} />
                </button>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--color-gray-600)', marginBottom: '1rem' }}>
                {c.description || 'Sin descripción'}
              </p>

              <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-gray-50)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-gray-600)', fontWeight: 500 }}>Capacidad Total</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-gray-900)' }}>{c.totalChromebooks} Chromebooks</span>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{editingCart ? 'Editar Carro' : 'Nuevo Carro / Kit'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nombre del Carro / Kit</label>
                  <input type="text" className="form-control" required placeholder="Ej: Carro A - Primaria" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Descripción</label>
                  <textarea className="form-control" rows="2" placeholder="Ej: Carro móvil Dell 3100" value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Cantidad Total de Chromebooks</label>
                  <input type="number" min="1" className="form-control" required value={totalChromebooks} onChange={(e) => setTotalChromebooks(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Ubicación Física</label>
                  <input type="text" className="form-control" placeholder="Ej: Edificio Primaria - Lab 1" value={location} onChange={(e) => setLocation(e.target.value)} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
