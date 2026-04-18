import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email.trim(), form.password);
      if (user.role === 'admin') navigate('/admin', { replace: true });
      else navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'E-Mail oder Passwort falsch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div style={{
        background: 'white',
        borderRadius: '24px',
        boxShadow: '0 8px 40px rgba(37,99,235,0.13)',
        padding: '40px 32px',
        width: '100%',
        maxWidth: '400px',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '18px',
            background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '28px', margin: '0 auto 14px',
            boxShadow: '0 8px 20px rgba(37,99,235,0.3)',
          }}>🌉</div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0F172A', margin: '0 0 4px' }}>
            Willkommen zurück
          </h1>
          <p style={{ fontSize: '14px', color: '#94A3B8', margin: 0 }}>
            Melde dich bei SprachBrücke an
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
              E-MAIL
            </label>
            <input
              type="email"
              className="input"
              style={{ width: '100%' }}
              placeholder="name@email.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
              autoFocus
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
              PASSWORT
            </label>
            <input
              type="password"
              className="input"
              style={{ width: '100%' }}
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-blue"
            style={{ width: '100%', fontSize: '15px', padding: '14px' }}
            disabled={loading}
          >
            {loading ? 'Wird angemeldet…' : 'Anmelden →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '13px', color: '#94A3B8', marginTop: '20px' }}>
          Noch kein Konto?{' '}
          <Link to="/register" style={{ color: '#2563EB', fontWeight: '600', textDecoration: 'none' }}>
            Registrieren
          </Link>
        </p>
      </div>
    </div>
  );
}
