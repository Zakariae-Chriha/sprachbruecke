import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const LANGUAGES = [
  { code: 'ar', label: '🇸🇦 العربية' },
  { code: 'de', label: '🇩🇪 Deutsch' },
  { code: 'en', label: '🇬🇧 English' },
  { code: 'tr', label: '🇹🇷 Türkçe' },
  { code: 'ru', label: '🇷🇺 Русский' },
  { code: 'uk', label: '🇺🇦 Українська' },
  { code: 'fr', label: '🇫🇷 Français' },
  { code: 'fa', label: '🇮🇷 فارسی' },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', language: 'ar' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error('Passwort muss mindestens 6 Zeichen haben'); return; }
    setLoading(true);
    try {
      const user = await register(form.name.trim(), form.email.trim(), form.password, form.language);
      if (user.role === 'admin') { toast.success('Willkommen Admin!'); navigate('/admin'); }
      else { toast.success('Registrierung erfolgreich! Warte auf Genehmigung.'); navigate('/pending'); }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registrierung fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  const field = (label, children) => (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
        {label}
      </label>
      {children}
    </div>
  );

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-6">
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
          }}>🌉</div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0F172A', margin: '0 0 4px' }}>
            Konto erstellen
          </h1>
          <p style={{ fontSize: '14px', color: '#94A3B8', margin: 0 }}>
            Kostenlos registrieren
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {field('NAME', <input type="text" className="input" style={{ width: '100%' }} placeholder="Dein vollständiger Name"
            value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required autoFocus />)}
          {field('E-MAIL', <input type="email" className="input" style={{ width: '100%' }} placeholder="name@email.com"
            value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />)}
          {field('PASSWORT', <input type="password" className="input" style={{ width: '100%' }} placeholder="Mindestens 6 Zeichen"
            value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />)}
          {field('SPRACHE', (
            <select className="input" style={{ width: '100%' }} value={form.language}
              onChange={e => setForm(f => ({ ...f, language: e.target.value }))}>
              {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
          ))}

          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px', padding: '12px', marginBottom: '20px', fontSize: '12px', color: '#92400E' }}>
            Nach der Registrierung wartest du auf Admin-Genehmigung für KI-Anrufe.
          </div>

          <button type="submit" className="btn btn-blue" style={{ width: '100%', fontSize: '15px', padding: '14px' }} disabled={loading}>
            {loading ? 'Wird registriert…' : 'Konto erstellen →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '13px', color: '#94A3B8', marginTop: '20px' }}>
          Bereits registriert?{' '}
          <Link to="/login" style={{ color: '#2563EB', fontWeight: '600', textDecoration: 'none' }}>Anmelden</Link>
        </p>
      </div>
    </div>
  );
}
