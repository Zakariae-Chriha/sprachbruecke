import { useState } from 'react';
import api from '../api';
import toast from 'react-hot-toast';

export default function UpgradeModal({ onClose, used, limit, resetDate }) {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const r = await api.post('/api/stripe/create-checkout');
      window.location.href = r.data.url;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Stripe Fehler');
      setLoading(false);
    }
  };

  const resetStr = resetDate
    ? new Date(resetDate).toLocaleDateString('de-DE', { day: '2-digit', month: 'long' })
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.6)' }}>
      <div className="card w-full max-w-sm animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="text-center mb-5">
          <div className="text-4xl mb-2">🚀</div>
          <h2 className="text-lg font-bold text-slate-800">Limit erreicht</h2>
          <p className="text-sm text-slate-500 mt-1">
            Du hast <strong>{used} von {limit}</strong> kostenlosen Anrufen genutzt.
          </p>
          {resetStr && (
            <p className="text-xs text-slate-400 mt-1">
              Nächste kostenlose Anrufe am <strong>{resetStr}</strong>
            </p>
          )}
        </div>

        {/* Plans */}
        <div className="flex flex-col gap-3 mb-5">
          {/* Free */}
          <div className="rounded-xl p-3 border border-slate-200 bg-slate-50">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold text-slate-700 text-sm">Kostenlos</p>
                <p className="text-xs text-slate-400">3 KI-Anrufe / Monat</p>
              </div>
              <span className="text-sm font-bold text-slate-500">0 €</span>
            </div>
          </div>

          {/* Premium */}
          <div className="rounded-xl p-3 border-2 border-blue-500 bg-blue-50">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold text-blue-700 text-sm">Premium ⭐</p>
                <p className="text-xs text-blue-500">Unbegrenzte KI-Anrufe</p>
                <p className="text-xs text-blue-400">Jederzeit kündbar</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-blue-700">4 €</span>
                <p className="text-xs text-blue-400">/Monat</p>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="btn btn-blue w-full mb-2"
        >
          {loading ? 'Weiterleitung…' : '⭐ Jetzt upgraden — 4 €/Monat'}
        </button>
        <button onClick={onClose} className="btn btn-ghost w-full text-slate-500 text-sm">
          Abbrechen
        </button>
      </div>
    </div>
  );
}
