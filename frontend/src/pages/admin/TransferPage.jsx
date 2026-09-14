import React, { useEffect, useState } from 'react';
import ApiClient from '../../services/api';
import toast from 'react-hot-toast';
import { ArrowRightLeft, Laptop, ArrowRight, AlertCircle } from 'lucide-react';

export const TransferPage = () => {
  const [carts, setCarts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [sourceCartId, setSourceCartId] = useState('');
  const [destCartId, setDestCartId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [transferring, setTransferring] = useState(false);

  useEffect(() => {
    fetchCarts();
  }, []);

  const fetchCarts = async () => {
    try {
      const res = await ApiClient.get('/carts');
      if (res.data) {
        setCarts(res.data);
        if (res.data.length >= 2) {
          setSourceCartId(res.data[0].id);
          setDestCartId(res.data[1].id);
        }
      }
    } catch (e) {
      toast.error('Error cargando carros');
    } finally {
      setLoading(false);
    }
  };

  const sourceCart = carts.find((c) => c.id === sourceCartId);
  const destCart = carts.find((c) => c.id === destCartId);

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (sourceCartId === destCartId) {
      toast.error('El carro de origen y destino no pueden ser iguales');
      return;
    }
    setTransferring(true);
    try {
      await ApiClient.post('/carts/transfer', {
        sourceCartId,
        destinationCartId: destCartId,
        quantity: parseInt(quantity, 10),
      });
      toast.success(`${quantity} Chromebook(s) transferidos exitosamente`);
      setQuantity(1);
      fetchCarts();
    } catch (err) {
      toast.error(err.message || 'Error en la transferencia');
    } finally {
      setTransferring(false);
    }
  };

  if (loading) return <p style={{ padding: '2rem', color: 'var(--color-gray-400)' }}>Cargando...</p>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Transferencia de Chromebooks</h1>
          <p className="page-subtitle">Mueve equipos entre carros para balancear el inventario</p>
        </div>
      </div>

      {carts.length < 2 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <AlertCircle size={40} color="var(--color-gray-300)" style={{ marginBottom: '1rem' }} />
          <p style={{ color: 'var(--color-gray-500)' }}>Necesitas al menos 2 carros para realizar transferencias</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '2rem', alignItems: 'start' }}>

          {/* Source Cart */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Carro de Origen</h3>
            </div>
            <div className="form-group">
              <label className="form-label">Seleccionar Carro</label>
              <select
                className="form-control"
                value={sourceCartId}
                onChange={(e) => setSourceCartId(e.target.value)}
              >
                {carts.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            {sourceCart && (
              <div style={styles.cartInfo}>
                <div style={styles.cartIcon}>
                  <Laptop size={24} />
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '1.25rem' }}>{sourceCart.totalChromebooks}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-gray-500)' }}>Chromebooks totales</p>
                </div>
              </div>
            )}
          </div>

          {/* Arrow + Quantity */}
          <div style={styles.transferCenter}>
            <div style={styles.arrowCircle}>
              <ArrowRight size={24} color="var(--color-white)" />
            </div>
            <div className="form-group" style={{ marginBottom: 0, width: '100%' }}>
              <label className="form-label" style={{ textAlign: 'center' }}>Cantidad</label>
              <input
                type="number"
                min="1"
                max={sourceCart?.totalChromebooks || 100}
                className="form-control"
                style={{ textAlign: 'center', fontWeight: 700, fontSize: '1.1rem' }}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <button
              onClick={handleTransfer}
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={transferring || sourceCartId === destCartId}
            >
              <ArrowRightLeft size={18} />
              {transferring ? 'Transfiriendo...' : 'Transferir'}
            </button>
          </div>

          {/* Destination Cart */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Carro de Destino</h3>
            </div>
            <div className="form-group">
              <label className="form-label">Seleccionar Carro</label>
              <select
                className="form-control"
                value={destCartId}
                onChange={(e) => setDestCartId(e.target.value)}
              >
                {carts.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            {destCart && (
              <div style={styles.cartInfo}>
                <div style={{ ...styles.cartIcon, backgroundColor: 'var(--color-gray-100)', color: 'var(--color-gray-700)' }}>
                  <Laptop size={24} />
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '1.25rem' }}>{destCart.totalChromebooks}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-gray-500)' }}>Chromebooks totales</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Current Inventory Overview */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <div className="card-header">
          <h3 className="card-title">Inventario Actual de Carros</h3>
        </div>
        <div className="table-container" style={{ border: 'none' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Carro</th>
                <th>Ubicación</th>
                <th>Total Chromebooks</th>
                <th>Descripción</th>
              </tr>
            </thead>
            <tbody>
              {carts.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td>{c.location || '—'}</td>
                  <td style={{ fontWeight: 700 }}>{c.totalChromebooks}</td>
                  <td style={{ color: 'var(--color-gray-500)' }}>{c.description || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const styles = {
  cartInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem',
    backgroundColor: 'var(--color-gray-50)',
    borderRadius: 'var(--radius-md)',
  },
  cartIcon: {
    width: '48px',
    height: '48px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--color-red-50)',
    color: 'var(--color-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transferCenter: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1.25rem',
    paddingTop: '4rem',
    maxWidth: '160px',
  },
  arrowCircle: {
    width: '48px',
    height: '48px',
    borderRadius: 'var(--radius-full)',
    backgroundColor: 'var(--color-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
  },
};
