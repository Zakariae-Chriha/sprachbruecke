import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function UpgradeSuccess() {
  const { user } = useAuth();

  useEffect(() => {
    // Small delay then refresh user status from server
    const t = setTimeout(async () => {
      try { await api.get('/api/stripe/status'); } catch {}
    }, 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="card w-full max-w-sm text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-xl font-bold text-slate-800 mb-2">Willkommen bei Premium!</h1>
        <p className="text-sm text-slate-500 mb-2">
          Hallo <strong>{user?.name || 'Nutzer'}</strong>!
        </p>
        <p className="text-sm text-slate-500 mb-6">
          Dein Abo ist jetzt aktiv. Du kannst unbegrenzt KI-Anrufe tätigen.
        </p>
        <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm mb-6">
          ⭐ Premium — Unbegrenzte Anrufe · 4 €/Monat · Jederzeit kündbar
        </div>
        <div className="flex flex-col gap-2">
          <Link to="/autocall" className="btn btn-blue w-full">🤖 KI-Anruf starten</Link>
          <Link to="/" className="btn btn-ghost w-full text-slate-500">Zur Startseite</Link>
        </div>
      </div>
    </div>
  );
}
