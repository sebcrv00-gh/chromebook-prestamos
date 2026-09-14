import React, { useState, useEffect } from 'react';
import ApiClient from '../../services/api';
import toast from 'react-hot-toast';
import { Users, Search, Filter, UserPlus, Shield, GraduationCap, BookOpen } from 'lucide-react';

export const AllUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (roleFilter) params.append('role', roleFilter);
      if (search) params.append('search', search);
      const res = await ApiClient.get(`/users?${params.toString()}`);
      setUsers(res.data || []);
    } catch (err) {
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const toggleActive = async (userId) => {
    try {
      await ApiClient.patch(`/users/${userId}/toggle-active`);
      toast.success('Estado del usuario actualizado');
      fetchUsers();
    } catch (err) {
      toast.error(err.message || 'Error al cambiar estado');
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'SUPERADMIN': return <Shield size={14} color="var(--color-red-700)" />;
      case 'ADMIN': return <Shield size={14} color="var(--color-red-500)" />;
      case 'DOCENTE': return <BookOpen size={14} color="#2563EB" />;
      case 'ESTUDIANTE': return <GraduationCap size={14} color="#059669" />;
      default: return null;
    }
  };

  const getRoleBadgeStyle = (role) => {
    const base = { padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-full)', fontSize: '0.7rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' };
    switch (role) {
      case 'SUPERADMIN': return { ...base, backgroundColor: '#FEE2E2', color: '#991B1B' };
      case 'ADMIN': return { ...base, backgroundColor: '#FEF2F2', color: '#B91C1C' };
      case 'DOCENTE': return { ...base, backgroundColor: '#DBEAFE', color: '#1E40AF' };
      case 'ESTUDIANTE': return { ...base, backgroundColor: '#D1FAE5', color: '#065F46' };
      default: return base;
    }
  };

  return (
    <div className="container animate-fade-in-up">
      <div className="page-header">
        <div>
          <h1 className="page-title">Todos los Usuarios</h1>
          <p className="page-subtitle">Panel completo de gestión de usuarios del sistema</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="card animate-fade-in-up delay-1" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <form onSubmit={handleSearch} style={{ flex: 1, minWidth: '200px', display: 'flex', gap: '0.5rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gray-400)' }} />
            <input
              className="form-control"
              placeholder="Buscar por nombre o correo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.25rem' }}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
            <Search size={16} /> Buscar
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} color="var(--color-gray-500)" />
          <select className="form-control" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={{ width: 'auto', minWidth: '160px' }}>
            <option value="">Todos los Roles</option>
            <option value="SUPERADMIN">Superadministrador</option>
            <option value="ADMIN">Administrador</option>
            <option value="DOCENTE">Docente</option>
            <option value="ESTUDIANTE">Estudiante</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {['SUPERADMIN', 'ADMIN', 'DOCENTE', 'ESTUDIANTE'].map((role) => {
          const count = users.filter((u) => u.role === role).length;
          return (
            <div key={role} className="card animate-fade-in-up delay-2" style={{ padding: '1rem', textAlign: 'center' }}>
              <div style={getRoleBadgeStyle(role)}>{getRoleIcon(role)} {role}</div>
              <p style={{ fontSize: '1.5rem', fontWeight: '800', marginTop: '0.5rem', color: 'var(--color-gray-900)' }}>{count}</p>
            </div>
          );
        })}
      </div>

      {/* Users Table */}
      <div className="card animate-fade-in-up delay-3" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-gray-500)' }}>Cargando usuarios...</div>
        ) : users.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-gray-500)' }}>No se encontraron usuarios</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Registrado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600 }}>{u.firstName} {u.lastName}</td>
                    <td>{u.email}</td>
                    <td>
                      <span style={getRoleBadgeStyle(u.role)}>
                        {getRoleIcon(u.role)} {u.role}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${u.active ? 'badge-aprobada' : 'badge-rechazada'}`}>
                        {u.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--color-gray-500)' }}>
                      {new Date(u.createdAt).toLocaleDateString('es-CO')}
                    </td>
                    <td>
                      <button
                        className={`btn ${u.active ? 'btn-outline' : 'btn-primary'}`}
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                        onClick={() => toggleActive(u.id)}
                      >
                        {u.active ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
