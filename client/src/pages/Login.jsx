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
      await login(form.email.trim(), form.password);
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Anmeldung fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="card w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🌉</div>
          <h1 className="text-xl font-bold text-slate-800">Anmelden</h1>
          <p className="text-sm text-slate-500 mt-1">SprachBrücke Konto</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
              placeholder="••••••"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
            />
          </div>

          <button type="submit" className="btn btn-blue w-full mt-2" disabled={loading}>
            {loading ? 'Wird angemeldet…' : 'Anmelden'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-4">
          Noch kein Konto?{' '}
          <Link to="/register" className="text-blue-600 font-medium hover:underline">
            Registrieren
          </Link>
        </p>
      </div>
    </div>
  );
}
