import React, { useEffect, useState } from 'react';
import ApiClient from '../../services/api';
import toast, { Toaster } from 'react-hot-toast';
import { UserPlus, UserCheck, UserX, Shield } from 'lucide-react';

export const AdminsManagementPage = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('ADMIN');

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const res = await ApiClient.get('/users?limit=100');
      if (res.data) {
        // filter ADMIN and SUPERADMIN
        const filtered = (res.data || []).filter((u) => ['ADMIN', 'SUPERADMIN'].includes(u.role));
        setAdmins(filtered);
      }
    } catch (e) {
      toast.error('Error cargando lista de administradores');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    try {
      await ApiClient.post('/users', { email, password, firstName, lastName, role });
      toast.success('Administrador creado exitosamente');
      setShowModal(false);
      setEmail('');
      setPassword('');
      setFirstName('');
      setLastName('');
      fetchAdmins();
    } catch (err) {
      toast.error(err.message || 'Error al crear administrador');
    }
  };

  const handleToggleActive = async (id, currentActive) => {
    try {
      await ApiClient.patch(`/users/${id}/toggle-active`, {});
      toast.success(`Usuario ${currentActive ? 'desactivado' : 'activado'} exitosamente`);
      fetchAdmins();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <Toaster position="top-right" />
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestión de Administradores</h1>
          <p className="page-subtitle">Administra cuentas con privilegios de gestión en el sistema</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <UserPlus size={18} />
          Nuevo Administrador
        </button>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Nombre Completo</th>
              <th>Correo Electrónico</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ textAlign: 'center' }}>Cargando...</td></tr>
            ) : admins.map((a) => (
              <tr key={a.id}>
                <td style={{ fontWeight: 600 }}>{a.firstName} {a.lastName}</td>
                <td>{a.email}</td>
                <td>
                  <span className="badge badge-parcial">{a.role}</span>
                </td>
                <td>
                  {a.active ? (
                    <span className="badge badge-aprobada">ACTIVO</span>
                  ) : (
                    <span className="badge badge-rechazada">INACTIVO</span>
                  )}
                </td>
                <td>
                  <button
                    onClick={() => handleToggleActive(a.id, a.active)}
                    className={a.active ? "btn btn-danger btn-sm" : "btn btn-secondary btn-sm"}
                  >
                    {a.active ? <UserX size={14} /> : <UserCheck size={14} />}
                    {a.active ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Crear Admin */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Crear Nuevo Administrador</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleCreateAdmin}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nombres</label>
                  <input type="text" className="form-control" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Apellidos</label>
                  <input type="text" className="form-control" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Correo Institucional</label>
                  <input type="email" className="form-control" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Contraseña</label>
                  <input type="password" className="form-control" required value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Rol</label>
                  <select className="form-control" value={role} onChange={(e) => setRole(e.target.value)}>
                    <option value="ADMIN">ADMINISTRADOR</option>
                    <option value="SUPERADMIN">SUPERADMINISTRADOR</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar Administrador</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
