import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) { toast.error('Mindestens 6 Zeichen'); return; }
    if (password !== confirm) { toast.error('Passwörter stimmen nicht überein'); return; }
    setLoading(true);
    try {
      await api.post('/api/auth/reset-password', { email, token, password });
      toast.success('Passwort geändert! Bitte anmelden.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Link ungültig oder abgelaufen');
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
        <p style={{ color: '#DC2626', fontWeight: '700' }}>Ungültiger Link</p>
        <Link to="/forgot-password" style={{ color: '#2563EB' }}>Neuen Link anfordern</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div style={{
        background: 'white', borderRadius: '24px',
        boxShadow: '0 8px 40px rgba(37,99,235,0.13)',
        padding: '40px 32px', width: '100%', maxWidth: '400px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '18px',
            background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '28px', margin: '0 auto 14px',
            boxShadow: '0 8px 20px rgba(37,99,235,0.3)',
          }}>🔐</div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0F172A', margin: '0 0 4px' }}>
            Neues Passwort
          </h1>
          <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0 }}>{email}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
              NEUES PASSWORT
            </label>
            <input
              type="password"
              className="input"
              style={{ width: '100%' }}
              placeholder="Mindestens 6 Zeichen"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
              PASSWORT BESTÄTIGEN
            </label>
            <input
              type="password"
              className="input"
              style={{ width: '100%' }}
              placeholder="Passwort wiederholen"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-blue" style={{ width: '100%', fontSize: '15px', padding: '14px' }} disabled={loading}>
            {loading ? 'Wird gespeichert…' : 'Passwort speichern →'}
          </button>
        </form>
      </div>
    </div>
  );
}
