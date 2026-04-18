import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthWall({ children }) {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="flex justify-center items-center min-h-[40vh] text-slate-400">Lädt…</div>
  );

  if (!user) return (
    <div className="card text-center py-8">
      <div className="text-4xl mb-3">🔒</div>
      <h2 className="text-lg font-bold text-slate-800 mb-2">Anmeldung erforderlich</h2>
      <p className="text-sm text-slate-500 mb-5">
        Du musst angemeldet und genehmigt sein, um diese Funktion zu nutzen.
      </p>
      <div className="flex flex-col gap-2 max-w-xs mx-auto">
        <Link to="/login" className="btn btn-blue w-full">Anmelden</Link>
        <Link to="/register" className="btn btn-ghost w-full">Neues Konto erstellen</Link>
      </div>
    </div>
  );

  if (!user.isApproved && user.role !== 'admin') return (
    <div className="card text-center py-8">
      <div className="text-4xl mb-3">⏳</div>
      <h2 className="text-lg font-bold text-slate-800 mb-2">Warte auf Genehmigung</h2>
      <p className="text-sm text-slate-500 mb-2">
        Hallo <strong>{user.name}</strong>! Dein Konto ist registriert.
      </p>
      <p className="text-sm text-slate-500 mb-5">
        Der Admin muss dich noch freischalten, bevor du Anrufe tätigen kannst.
      </p>
      <Link to="/" className="btn btn-blue">Zur Startseite</Link>
    </div>
  );

  return children;
}
