import { Link } from 'react-router-dom';

export default function UpgradeCancel() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="card w-full max-w-sm text-center">
        <div className="text-5xl mb-4">↩️</div>
        <h1 className="text-xl font-bold text-slate-800 mb-2">Abonnement abgebrochen</h1>
        <p className="text-sm text-slate-500 mb-6">
          Kein Problem — du kannst jederzeit upgraden wenn du mehr Anrufe brauchst.
        </p>
        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-sm mb-6">
          Du hast noch <strong>3 kostenlose Anrufe</strong> pro Monat.
        </div>
        <div className="flex flex-col gap-2">
          <Link to="/autocall" className="btn btn-blue w-full">Zurück zum KI-Anruf</Link>
          <Link to="/" className="btn btn-ghost w-full text-slate-500">Zur Startseite</Link>
        </div>
      </div>
    </div>
  );
}
