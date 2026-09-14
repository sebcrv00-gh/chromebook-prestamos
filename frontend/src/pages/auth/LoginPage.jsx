import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Laptop2, Lock, Mail, ArrowRight } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`¡Bienvenido/a, ${user.firstName}!`);
      
      if (user.role === 'SUPERADMIN') navigate('/superadmin');
      else if (user.role === 'ADMIN') navigate('/admin');
      else if (user.role === 'DOCENTE') navigate('/docente');
      else if (user.role === 'ESTUDIANTE') navigate('/estudiante');
    } catch (err) {
      toast.error(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="auth-bg">
      <Toaster position="top-right" />
      
      <div className="auth-card" style={{ maxWidth: '440px' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem auto',
            boxShadow: '0 4px 14px rgba(220, 38, 38, 0.3)',
          }}>
            <Laptop2 size={30} color="#FFFFFF" />
          </div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--color-gray-900)', letterSpacing: '0.05em' }}>
            SAN BONIFACIO
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-gray-600)', marginTop: '0.25rem' }}>
            Gestión de Préstamos de Chromebooks
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Mail size={14} /> Correo Electrónico Institucional
            </label>
            <input
              type="email"
              className="form-control"
              placeholder="usuario@sanboni.edu.co"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ textAlign: 'center' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Lock size={14} /> Contraseña
            </label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ textAlign: 'center' }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.25rem', justifyContent: 'center' }}
            disabled={loading}
          >
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Demo Quick Logins */}
        <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px dashed var(--color-border)', textAlign: 'center' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-gray-500)', marginBottom: '0.75rem' }}>
            Acceso Rápido de Prueba (Demo):
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <button onClick={() => handleQuickLogin('superadmin@sanboni.edu.co', 'superadmin123')} style={demoStyle}>Superadmin</button>
            <button onClick={() => handleQuickLogin('admin@sanboni.edu.co', 'Admin123!')} style={demoStyle}>Admin</button>
            <button onClick={() => handleQuickLogin('docente@sanboni.edu.co', 'Docente123!')} style={demoStyle}>Docente</button>
            <button onClick={() => handleQuickLogin('estudiante@sanboni.edu.co', 'Estudiante123!')} style={demoStyle}>Estudiante</button>
          </div>
        </div>

        {/* Register Link */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-gray-600)' }}>
            ¿No tienes cuenta?{' '}
            <button
              onClick={() => navigate('/register')}
              style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              Regístrate aquí
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

const demoStyle = {
  padding: '0.4rem 0.5rem',
  fontSize: '0.75rem',
  fontWeight: '600',
  backgroundColor: 'rgba(249, 250, 251, 0.7)',
  border: '1px solid var(--color-gray-200)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--color-gray-700)',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};
