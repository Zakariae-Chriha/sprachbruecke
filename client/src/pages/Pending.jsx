import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Pending() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="card w-full max-w-sm text-center">
        <div className="text-5xl mb-4">⏳</div>
        <h1 className="text-xl font-bold text-slate-800 mb-2">Warte auf Genehmigung</h1>
        <p className="text-sm text-slate-500 mb-4">
          Hallo <strong>{user?.name}</strong>, dein Konto wurde erstellt.<br />
          Der Admin muss dich noch freischalten, bevor du Anrufe tätigen kannst.
        </p>
        <div className="p-3 rounded-xl text-sm text-blue-700 bg-blue-50 border border-blue-200 mb-6">
          Sobald du genehmigt wirst, kannst du den KI-Anruf und den Notruf-Anruf nutzen.
        </div>
        <div className="flex flex-col gap-2">
          <Link to="/" className="btn btn-blue w-full">Zur Startseite</Link>
          <button onClick={logout} className="btn btn-ghost w-full text-slate-500">Abmelden</button>
        </div>
      </div>
    </div>
  );
}
