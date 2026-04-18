import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import toast from 'react-hot-toast';

const STATUS_BADGE = {
  initiated:   { label: 'Gestartet',       color: '#2563EB', bg: '#EFF6FF' },
  completed:   { label: 'Abgeschlossen',   color: '#059669', bg: '#ECFDF5' },
  failed:      { label: 'Fehlgeschlagen',  color: '#DC2626', bg: '#FEF2F2' },
  'no-answer': { label: 'Keine Antwort',   color: '#D97706', bg: '#FFFBEB' },
  busy:        { label: 'Besetzt',         color: '#7C3AED', bg: '#F5F3FF' },
};

function StatCard({ value, label, color, icon }) {
  return (
    <div className="card" style={{ padding: '20px 16px', textAlign: 'center' }}>
      <div style={{ fontSize: '28px', marginBottom: '4px' }}>{icon}</div>
      <div style={{ fontSize: '26px', fontWeight: '800', color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px', fontWeight: '600' }}>{label}</div>
    </div>
  );
}

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
      toast.success('Benutzer genehmigt');
    } catch { toast.error('Fehler'); }
  };

  const revoke = async (id) => {
    try {
      const r = await api.patch(`/api/admin/users/${id}/revoke`);
      setUsers(u => u.map(x => x._id === id ? r.data : x));
      toast.success('Zugriff gesperrt');
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
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', color: '#94A3B8', fontSize: '15px' }}>
      Lädt…
    </div>
  );

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>

      {/* ── Header ── */}
      <div className="card" style={{
        padding: '20px 24px',
        marginBottom: '16px',
        background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '14px',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px',
          }}>🔐</div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '800', color: 'white', margin: 0 }}>Admin-Panel</h1>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', margin: 0 }}>{user?.email}</p>
          </div>
        </div>
        <button onClick={logout} style={{
          background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
          color: 'white', borderRadius: '12px', padding: '8px 16px',
          fontSize: '13px', fontWeight: '600', cursor: 'pointer',
        }}>Abmelden</button>
      </div>

      {/* ── Stats grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
        <StatCard value={pending.length}          label="Warten"  color="#D97706" icon="⏳" />
        <StatCard value={approved.length}         label="OK"      color="#059669" icon="✅" />
        <StatCard value={stats?.totalCalls ?? 0}  label="Anrufe"  color="#2563EB" icon="📞" />
        <StatCard value={stats?.emergencyCalls ?? 0} label="SOS"  color="#DC2626" icon="🆘" />
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {[
          { key: 'users', label: `👥 Benutzer (${users.length})` },
          { key: 'calls', label: `📞 Anrufe (${calls.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            flex: 1, padding: '12px', borderRadius: '14px',
            fontSize: '14px', fontWeight: '700', cursor: 'pointer', border: 'none', transition: 'all 0.2s',
            background: tab === t.key ? '#2563EB' : 'white',
            color: tab === t.key ? 'white' : '#64748B',
            boxShadow: tab === t.key ? '0 4px 14px rgba(37,99,235,0.3)' : '0 1px 4px rgba(0,0,0,0.07)',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── USERS TAB ── */}
      {tab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

          {pending.length > 0 && (
            <>
              <p style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94A3B8', marginBottom: '4px' }}>
                ⏳ Warten auf Genehmigung
              </p>
              {pending.map(u => (
                <div key={u._id} className="card" style={{
                  padding: '16px', display: 'flex', alignItems: 'center', gap: '12px',
                  borderColor: '#FDE68A', borderWidth: '1.5px',
                  background: '#FFFBEB',
                }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '50%',
                    background: '#FEF3C7', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontWeight: '800', fontSize: '18px', color: '#92400E', flexShrink: 0,
                  }}>
                    {u.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: '700', color: '#1E293B', fontSize: '14px', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</p>
                    <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</p>
                    <p style={{ fontSize: '11px', color: '#94A3B8', margin: 0 }}>
                      {new Date(u.createdAt).toLocaleDateString('de-DE')} · {u.callsThisMonth ?? 0}/{u.freeCallsLimit ?? 3} Anrufe
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button onClick={() => approve(u._id)} style={{
                      background: '#059669', color: 'white', border: 'none', borderRadius: '10px',
                      padding: '8px 14px', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                    }}>Genehmigen</button>
                    <button onClick={() => deleteUser(u._id, u.name)} style={{
                      background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA',
                      borderRadius: '10px', padding: '8px 12px', fontSize: '16px', cursor: 'pointer',
                    }}>🗑</button>
                  </div>
                </div>
              ))}
            </>
          )}

          {approved.length > 0 && (
            <>
              <p style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94A3B8', marginTop: pending.length > 0 ? '8px' : 0, marginBottom: '4px' }}>
                ✅ Genehmigt
              </p>
              {approved.map(u => (
                <div key={u._id} className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '50%',
                    background: '#DCFCE7', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontWeight: '800', fontSize: '18px', color: '#166534', flexShrink: 0,
                  }}>
                    {u.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <p style={{ fontWeight: '700', color: '#1E293B', fontSize: '14px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</p>
                      {u.subscriptionStatus === 'active' && (
                        <span style={{ fontSize: '11px', background: '#FEF3C7', color: '#92400E', borderRadius: '6px', padding: '1px 6px', fontWeight: '700', flexShrink: 0 }}>⭐ Premium</span>
                      )}
                    </div>
                    <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</p>
                    <p style={{ fontSize: '11px', color: '#94A3B8', margin: 0 }}>{u.callsThisMonth ?? 0}/{u.freeCallsLimit ?? 3} Anrufe diesen Monat</p>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button onClick={() => revoke(u._id)} style={{
                      background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA',
                      borderRadius: '10px', padding: '8px 12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                    }}>Sperren</button>
                    <button onClick={() => deleteUser(u._id, u.name)} style={{
                      background: '#F8FAFC', color: '#94A3B8', border: '1px solid #E2E8F0',
                      borderRadius: '10px', padding: '8px 12px', fontSize: '16px', cursor: 'pointer',
                    }}>🗑</button>
                  </div>
                </div>
              ))}
            </>
          )}

          {users.length === 0 && (
            <div className="card" style={{ padding: '48px 24px', textAlign: 'center', color: '#94A3B8', fontSize: '14px' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>👤</div>
              Noch keine Benutzer registriert.
            </div>
          )}
        </div>
      )}

      {/* ── CALLS TAB ── */}
      {tab === 'calls' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {calls.length === 0 && (
            <div className="card" style={{ padding: '48px 24px', textAlign: 'center', color: '#94A3B8', fontSize: '14px' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📞</div>
              Noch keine Anrufe aufgezeichnet.
            </div>
          )}
          {calls.map(c => {
            const badge = STATUS_BADGE[c.status] || STATUS_BADGE.initiated;
            return (
              <div key={c._id} className="card" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
                      background: c.type === 'emergency' ? '#FEF2F2' : '#EFF6FF',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
                    }}>
                      {c.type === 'emergency' ? '🆘' : '🤖'}
                    </div>
                    <div>
                      <p style={{ fontWeight: '700', color: '#1E293B', fontSize: '14px', margin: '0 0 2px' }}>{c.userName}</p>
                      <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>{c.userEmail}</p>
                    </div>
                  </div>
                  <span style={{
                    fontSize: '11px', fontWeight: '700', padding: '4px 10px',
                    borderRadius: '99px', color: badge.color, background: badge.bg, flexShrink: 0,
                  }}>
                    {badge.label}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid #F1F5F9' }}>
                  <div>
                    {(c.purpose || c.emergencyType) && (
                      <p style={{ fontSize: '13px', color: '#475569', margin: '0 0 2px', fontWeight: '500' }}>{c.purpose || c.emergencyType}</p>
                    )}
                    <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>
                      {new Date(c.createdAt).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })}
                    </p>
                  </div>
                  {c.targetNumber && (
                    <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#94A3B8', background: '#F8FAFC', padding: '4px 8px', borderRadius: '8px' }}>
                      {c.targetNumber}
                    </span>
                  )}
                </div>

                {c.summary && (
                  <p style={{ fontSize: '12px', color: '#64748B', margin: '8px 0 0', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {c.summary}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ height: '24px' }} />
    </div>
  );
}
