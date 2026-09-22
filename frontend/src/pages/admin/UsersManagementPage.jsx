import React, { useEffect, useState } from 'react';
import ApiClient from '../../services/api';
import toast from 'react-hot-toast';
import { UserPlus, UserCheck, UserX, Search, X } from 'lucide-react';

const ROLE_OPTIONS = [
  { value: '', label: 'Todos los roles' },
  { value: 'DOCENTE', label: 'Docentes' },
  { value: 'ESTUDIANTE', label: 'Estudiantes' },
  { value: 'ADMIN', label: 'Administradores' },
];

export const UsersManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Create user modal
  const [showModal, setShowModal] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('DOCENTE');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await ApiClient.get('/users?limit=200');
      if (res.data) setUsers(res.data);
    } catch (e) {
      toast.error('Error cargando usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await ApiClient.post('/users', { firstName, lastName, email, password, role });
      toast.success('Usuario creado exitosamente');
      setShowModal(false);
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      setRole('DOCENTE');
      fetchUsers();
    } catch (err) {
      toast.error(err.message || 'Error al crear usuario');
    }
  };

  const handleToggleActive = async (id, currentActive) => {
    try {
      await ApiClient.patch(`/users/${id}/toggle-active`, {});
      toast.success(`Usuario ${currentActive ? 'desactivado' : 'activado'}`);
      fetchUsers();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter ? u.role === roleFilter : true;
    const matchesSearch = searchQuery
      ? `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesRole && matchesSearch;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestión de Usuarios</h1>
          <p className="page-subtitle">Administra docentes, estudiantes y sus cuentas en el sistema</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <UserPlus size={18} />
          Nuevo Usuario
        </button>
      </div>

      {/* Filters */}
      <div style={styles.filterBar}>
        <div style={styles.searchBox}>
          <Search size={16} color="var(--color-gray-400)" style={{ position: 'absolute', left: '0.75rem' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Buscar por nombre o correo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.25rem' }}
          />
        </div>
        <select
          className="form-control"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{ maxWidth: '200px' }}
        >
          {ROLE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Users Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-container" style={{ border: 'none' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Nombre Completo</th>
                <th>Correo Electrónico</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Fecha de Registro</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--color-gray-400)' }}>Cargando usuarios...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--color-gray-400)' }}>No se encontraron usuarios</td></tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600 }}>{u.firstName} {u.lastName}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`badge ${u.role === 'ADMIN' || u.role === 'SUPERADMIN' ? 'badge-parcial' : 'badge-pendiente'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      {u.active ? (
                        <span className="badge badge-aprobada">ACTIVO</span>
                      ) : (
                        <span className="badge badge-rechazada">INACTIVO</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--color-gray-500)' }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggleActive(u.id, u.active)}
                        className={u.active ? 'btn btn-danger btn-sm' : 'btn btn-secondary btn-sm'}
                      >
                        {u.active ? <UserX size={14} /> : <UserCheck size={14} />}
                        {u.active ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Crear Nuevo Usuario</h3>
              <button onClick={() => setShowModal(false)} style={styles.closeBtn}><X size={16} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Nombres</label>
                    <input type="text" className="form-control" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Apellidos</label>
                    <input type="text" className="form-control" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Correo Institucional</label>
                  <input type="email" className="form-control" required placeholder="usuario@sanboni.edu.co" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Contraseña</label>
                  <input type="password" className="form-control" required value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Rol</label>
                  <select className="form-control" value={role} onChange={(e) => setRole(e.target.value)}>
                    <option value="DOCENTE">DOCENTE</option>
                    <option value="ESTUDIANTE">ESTUDIANTE</option>
                    <option value="ADMIN">ADMINISTRADOR</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancelar</button>
                <button type="submit" className="btn btn-primary">Crear Usuario</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  filterBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1.5rem',
  },
  searchBox: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    maxWidth: '360px',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1.1rem',
    color: 'var(--color-gray-500)',
  },
};
