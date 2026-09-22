import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ApiClient from '../../services/api';
import toast, { Toaster } from 'react-hot-toast';
import { UserPlus, Mail, Lock, User, Briefcase } from 'lucide-react';

export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'DOCENTE',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      const res = await ApiClient.post('/auth/register', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });

      if (res.success) {
        toast.success('¡Usuario registrado exitosamente! Ahora puedes iniciar sesión.', {
          duration: 5000,
          style: {
            padding: '1rem 1.25rem',
            fontWeight: 600,
            fontSize: '0.95rem',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            border: '1px solid var(--color-success-200)',
            backgroundColor: 'var(--color-success-50)',
            color: 'var(--color-success-800)',
          },
        });
        setTimeout(() => navigate('/login'), 2200);
      } else {
        toast.error(res.message || 'No se pudo completar el registro');
      }
    } catch (err) {
      toast.error(err.message || 'Error al registrar el usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg">
      <Toaster position="top-right" />

      <div className="auth-card" style={{ maxWidth: '480px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '60px',
            height: '60px',
            backgroundColor: 'var(--color-red-50)',
            borderRadius: 'var(--radius-full)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
          }}>
            <UserPlus size={28} color="var(--color-primary)" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-gray-900)', marginBottom: '0.5rem' }}>
            Crear una cuenta
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-gray-500)', lineHeight: 1.5 }}>
            Regístrate como docente o estudiante para solicitar Chromebooks
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Nombre y Apellido - stacked on small screens */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <User size={14} /> Nombres
            </label>
            <input
              type="text"
              name="firstName"
              className="form-control"
              placeholder="Juan Carlos"
              value={formData.firstName}
              onChange={handleChange}
              required
              minLength={2}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <User size={14} /> Apellidos
            </label>
            <input
              type="text"
              name="lastName"
              className="form-control"
              placeholder="Pérez Gómez"
              value={formData.lastName}
              onChange={handleChange}
              required
              minLength={2}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Mail size={14} /> Correo Electrónico
            </label>
            <input
              type="email"
              name="email"
              className="form-control"
              placeholder="correo@ejemplo.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Briefcase size={14} /> Tipo de Cuenta
            </label>
            <select
              name="role"
              className="form-control"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="DOCENTE">Soy Docente</option>
              <option value="ESTUDIANTE">Soy Estudiante</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Lock size={14} /> Contraseña
            </label>
            <input
              type="password"
              name="password"
              className="form-control"
              placeholder="Mínimo 6 caracteres"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Lock size={14} /> Confirmar Contraseña
            </label>
            <input
              type="password"
              name="confirmPassword"
              className="form-control"
              placeholder="Repite tu contraseña"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '0.5rem', justifyContent: 'center' }}
            disabled={loading}
          >
            {loading ? 'Registrando...' : 'Registrarme'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--color-gray-600)' }}>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: '600', textDecoration: 'none' }}>
            Inicia Sesión aquí
          </Link>
        </div>
      </div>
    </div>
  );
};
