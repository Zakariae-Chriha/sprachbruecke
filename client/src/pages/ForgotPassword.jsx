import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/auth/forgot-password', { email: email.trim() });
      setSent(true);
    } catch {
      toast.error('Fehler beim Senden');
    } finally {
      setLoading(false);
    }
  };

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
          }}>🔑</div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0F172A', margin: '0 0 4px' }}>
            Passwort vergessen
          </h1>
          <p style={{ fontSize: '14px', color: '#94A3B8', margin: 0 }}>
            Wir senden dir einen Reset-Link
          </p>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📧</div>
            <p style={{ fontSize: '15px', color: '#059669', fontWeight: '700', marginBottom: '8px' }}>
              Email gesendet!
            </p>
            <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '24px', lineHeight: '1.6' }}>
              Falls <strong>{email}</strong> registriert ist, erhältst du einen Reset-Link. Bitte prüfe auch deinen Spam-Ordner.
            </p>
            <Link to="/login" style={{
              display: 'block', textAlign: 'center', padding: '13px',
              background: '#2563EB', color: 'white', borderRadius: '14px',
              fontWeight: '700', textDecoration: 'none', fontSize: '15px',
            }}>Zurück zum Login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
                E-MAIL
              </label>
              <input
                type="email"
                className="input"
                style={{ width: '100%' }}
                placeholder="name@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <button type="submit" className="btn btn-blue" style={{ width: '100%', fontSize: '15px', padding: '14px' }} disabled={loading}>
              {loading ? 'Wird gesendet…' : 'Reset-Link senden →'}
            </button>
          </form>
        )}

        <p style={{ textAlign: 'center', fontSize: '13px', color: '#94A3B8', marginTop: '20px' }}>
          <Link to="/login" style={{ color: '#2563EB', fontWeight: '600', textDecoration: 'none' }}>← Zurück zum Login</Link>
        </p>
      </div>
    </div>
  );
}
