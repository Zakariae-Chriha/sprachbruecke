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
    if (form.password.length < 6) {
      toast.error('Passwort muss mindestens 6 Zeichen haben');
      return;
    }
    setLoading(true);
    try {
      const user = await register(form.name.trim(), form.email.trim(), form.password, form.language);
      if (user.role === 'admin') {
        toast.success('Willkommen Admin!');
        navigate('/admin');
      } else {
        toast.success('Registrierung erfolgreich! Warte auf Genehmigung.');
        navigate('/pending');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registrierung fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="card w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🌉</div>
          <h1 className="text-xl font-bold text-slate-800">Registrieren</h1>
          <p className="text-sm text-slate-500 mt-1">Neues SprachBrücke Konto</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="section-label mb-1 block">Name</label>
            <input
              type="text"
              className="input w-full"
              placeholder="Dein Name"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="section-label mb-1 block">E-Mail</label>
            <input
              type="email"
              className="input w-full"
              placeholder="name@email.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="section-label mb-1 block">Passwort</label>
            <input
              type="password"
              className="input w-full"
              placeholder="Mindestens 6 Zeichen"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="section-label mb-1 block">Sprache</label>
            <select
              className="input w-full"
              value={form.language}
              onChange={e => setForm(f => ({ ...f, language: e.target.value }))}
            >
              {LANGUAGES.map(l => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn btn-blue w-full mt-2" disabled={loading}>
            {loading ? 'Wird registriert…' : 'Konto erstellen'}
          </button>
        </form>

        <div className="mt-4 p-3 rounded-xl text-xs text-amber-700 bg-amber-50 border border-amber-200">
          Nach der Registrierung musst du auf die Genehmigung des Admins warten, bevor du Anrufe tätigen kannst.
        </div>

        <p className="text-center text-sm text-slate-500 mt-4">
          Bereits registriert?{' '}
          <Link to="/login" className="text-blue-600 font-medium hover:underline">
            Anmelden
          </Link>
        </p>
      </div>
    </div>
  );
}
