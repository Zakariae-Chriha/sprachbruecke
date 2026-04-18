import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const STATUS_BADGE = {
  initiated:   { label: 'Gestartet',       color: '#2563EB', bg: '#EFF6FF' },
  completed:   { label: 'Abgeschlossen',   color: '#059669', bg: '#ECFDF5' },
  failed:      { label: 'Fehlgeschlagen',  color: '#DC2626', bg: '#FEF2F2' },
  'no-answer': { label: 'Keine Antwort',   color: '#D97706', bg: '#FFFBEB' },
  busy:        { label: 'Besetzt',         color: '#7C3AED', bg: '#F5F3FF' },
};

export default function History() {
  const { user } = useAuth();
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (!user) return;
    api.get('/api/calls/history')
      .then(r => setCalls(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return (
    <div className="card text-center py-8">
      <p className="text-slate-500 mb-4">Bitte anmelden um deine Anrufhistorie zu sehen.</p>
      <Link to="/login" className="btn btn-blue">Anmelden</Link>
    </div>
  );

  if (loading) return (
    <div className="flex justify-center items-center min-h-[40vh] text-slate-400">Lädt…</div>
  );

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-800">📋 Meine Anrufe</h1>
        <p className="text-sm text-slate-500 mt-1">{calls.length} Anrufe insgesamt</p>
      </div>

      {calls.length === 0 && (
        <div className="card text-center py-10">
          <div className="text-4xl mb-3">📞</div>
          <p className="text-slate-500 mb-4">Noch keine Anrufe.</p>
          <Link to="/autocall" className="btn btn-blue">KI-Anruf starten</Link>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {calls.map(c => {
          const badge = STATUS_BADGE[c.status] || STATUS_BADGE.initiated;
          const isOpen = expanded === c._id;
          return (
            <div key={c._id} className="card cursor-pointer"
              onClick={() => setExpanded(isOpen ? null : c._id)}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: c.type === 'emergency' ? '#FEE2E2' : '#EFF6FF' }}>
                    {c.type === 'emergency' ? '🆘' : '🤖'}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">
                      {c.type === 'emergency' ? 'Notruf' : 'KI-Anruf'}
                    </p>
                    <p className="text-xs text-slate-400">{c.purpose}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(c.createdAt).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ color: badge.color, background: badge.bg }}>
                  {badge.label}
                </span>
              </div>

              {isOpen && c.summary && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-600 mb-1">Zusammenfassung:</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{c.summary}</p>
                </div>
              )}
              {isOpen && !c.summary && (
                <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100">
                  Keine Zusammenfassung verfügbar.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
