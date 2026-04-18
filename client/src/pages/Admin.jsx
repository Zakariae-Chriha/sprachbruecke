import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import toast from 'react-hot-toast';

const STATUS_BADGE = {
  initiated:  { label: 'Gestartet',  color: '#2563EB', bg: '#EFF6FF' },
  completed:  { label: 'Abgeschlossen', color: '#059669', bg: '#ECFDF5' },
  failed:     { label: 'Fehlgeschlagen', color: '#DC2626', bg: '#FEF2F2' },
  'no-answer':{ label: 'Keine Antwort', color: '#D97706', bg: '#FFFBEB' },
  busy:       { label: 'Besetzt',    color: '#7C3AED', bg: '#F5F3FF' },
};

export default function Admin() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [calls, setCalls] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (user.role !== 'admin') { navigate('/'); return; }
    fetchAll();
  }, [user]);

  const fetchAll = async () => {
    try {
      const [usersRes, callsRes, statsRes] = await Promise.all([
        api.get('/api/admin/users'),
        api.get('/api/admin/calls'),
        api.get('/api/admin/stats'),
      ]);
      setUsers(usersRes.data);
      setCalls(callsRes.data);
      setStats(statsRes.data);
    } catch {
      toast.error('Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  };

  const approve = async (id) => {
    try {
      const r = await api.patch(`/api/admin/users/${id}/approve`);
      setUsers(u => u.map(x => x._id === id ? r.data : x));
      toast.success('Benutzer genehmigt ✅');
    } catch { toast.error('Fehler'); }
  };

  const revoke = async (id) => {
    try {
      const r = await api.patch(`/api/admin/users/${id}/revoke`);
      setUsers(u => u.map(x => x._id === id ? r.data : x));
      toast.success('Zugriff gesperrt 🚫');
    } catch { toast.error('Fehler'); }
  };

  const deleteUser = async (id, name) => {
    if (!confirm(`Benutzer "${name}" wirklich löschen?`)) return;
    try {
      await api.delete(`/api/admin/users/${id}`);
      setUsers(u => u.filter(x => x._id !== id));
      toast.success('Benutzer gelöscht');
    } catch { toast.error('Fehler'); }
  };

  const pending  = users.filter(u => !u.isApproved);
  const approved = users.filter(u => u.isApproved);

  if (loading) return (
    <div className="flex justify-center items-center min-h-[50vh] text-slate-400">Lädt…</div>
  );

  return (
    <div>
      {/* Header */}
      <div className="card mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Admin-Panel 🔐</h1>
          <p className="text-xs text-slate-500">{user?.email}</p>
        </div>
        <button onClick={logout} className="btn btn-ghost text-sm text-slate-500">Abmelden</button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="card text-center">
          <div className="text-2xl font-bold text-amber-600">{pending.length}</div>
          <div className="text-xs text-slate-500">Warten</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">{approved.length}</div>
          <div className="text-xs text-slate-500">Genehmigt</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-600">{stats?.totalCalls ?? 0}</div>
          <div className="text-xs text-slate-500">Anrufe gesamt</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-red-600">{stats?.emergencyCalls ?? 0}</div>
          <div className="text-xs text-slate-500">Notrufe</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {[
          { key: 'users', label: `👥 Benutzer (${users.length})` },
          { key: 'calls', label: `📞 Anrufe (${calls.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === t.key
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-500 border border-slate-200'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── USERS TAB ── */}
      {tab === 'users' && (
        <div className="flex flex-col gap-3">
          {pending.length > 0 && (
            <>
              <p className="section-label">⏳ Warten auf Genehmigung</p>
              {pending.map(u => (
                <div key={u._id} className="card flex items-center gap-3"
                  style={{ border: '1.5px solid #FDE68A' }}>
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center font-bold text-amber-700 flex-shrink-0">
                    {u.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{u.name}</p>
                    <p className="text-xs text-slate-400 truncate">{u.email}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(u.createdAt).toLocaleDateString('de-DE')} · {u.callsThisMonth ?? 0}/{u.freeCallsLimit ?? 3} Anrufe
                    </p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => approve(u._id)} className="btn btn-blue text-xs px-2 py-1.5">✅</button>
                    <button onClick={() => deleteUser(u._id, u.name)} className="btn btn-ghost text-xs px-2 py-1.5 text-red-500">🗑</button>
                  </div>
                </div>
              ))}
            </>
          )}

          {approved.length > 0 && (
            <>
              <p className="section-label mt-2">✅ Genehmigt</p>
              {approved.map(u => (
                <div key={u._id} className="card flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center font-bold text-green-700 flex-shrink-0">
                    {u.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{u.name}</p>
                    <p className="text-xs text-slate-400 truncate">{u.email}</p>
                    <p className="text-xs text-slate-400">
                      {u.callsThisMonth ?? 0}/{u.freeCallsLimit ?? 3} Anrufe
                      {u.subscriptionStatus === 'active' && <span className="text-yellow-500 ml-1">⭐ Premium</span>}
                    </p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => revoke(u._id)} className="btn btn-ghost text-xs px-2 py-1.5 text-red-600">🚫</button>
                    <button onClick={() => deleteUser(u._id, u.name)} className="btn btn-ghost text-xs px-2 py-1.5 text-slate-400">🗑</button>
                  </div>
                </div>
              ))}
            </>
          )}

          {users.length === 0 && (
            <div className="card text-center text-slate-400 py-8">Noch keine Benutzer.</div>
          )}
        </div>
      )}

      {/* ── CALLS TAB ── */}
      {tab === 'calls' && (
        <div className="flex flex-col gap-2">
          {calls.length === 0 && (
            <div className="card text-center text-slate-400 py-8">Noch keine Anrufe.</div>
          )}
          {calls.map(c => {
            const badge = STATUS_BADGE[c.status] || STATUS_BADGE.initiated;
            return (
              <div key={c._id} className="card">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{c.type === 'emergency' ? '🆘' : '🤖'}</span>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{c.userName}</p>
                      <p className="text-xs text-slate-400">{c.userEmail}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ color: badge.color, background: badge.bg }}>
                    {badge.label}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500">{c.purpose || c.emergencyType}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(c.createdAt).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })}
                    </p>
                  </div>
                  {c.targetNumber && (
                    <p className="text-xs font-mono text-slate-400">{c.targetNumber}</p>
                  )}
                </div>
                {c.summary && (
                  <p className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100 line-clamp-2">
                    {c.summary}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
