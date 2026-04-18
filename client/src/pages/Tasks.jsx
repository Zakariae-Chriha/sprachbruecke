import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, CheckSquare, Square, ClipboardList } from 'lucide-react';
import toast from 'react-hot-toast';

function loadTasks() {
  try { return JSON.parse(localStorage.getItem('sb_tasks') || '[]'); } catch { return []; }
}
function saveTasks(tasks) {
  localStorage.setItem('sb_tasks', JSON.stringify(tasks));
}

export default function Tasks() {
  const { i18n } = useTranslation();
  const [tasks, setTasks] = useState(loadTasks);
  const [newText, setNewText] = useState('');
  const isRTL = i18n.language === 'ar' || i18n.language === 'fa';

  useEffect(() => { saveTasks(tasks); }, [tasks]);

  const addTask = () => {
    const text = newText.trim();
    if (!text) return;
    setTasks(prev => [{
      id: `t_${Date.now()}`,
      text,
      done: false,
      createdAt: new Date().toISOString(),
      source: 'manual',
    }, ...prev]);
    setNewText('');
  };

  const toggle = (id) => setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const remove = (id) => { setTasks(prev => prev.filter(t => t.id !== id)); toast.success('Gelöscht'); };
  const clearDone = () => setTasks(prev => prev.filter(t => !t.done));

  const pending = tasks.filter(t => !t.done);
  const done = tasks.filter(t => t.done);

  return (
    <div className="fade-in max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shadow"
            style={{ background: 'linear-gradient(135deg, #059669, #2563EB)' }}>
            📋
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-lg">Meine Aufgaben</h1>
            <p className="text-xs text-slate-400">{pending.length} offen · {done.length} erledigt</p>
          </div>
        </div>
        {done.length > 0 && (
          <button onClick={clearDone}
            className="text-xs text-slate-400 hover:text-red-500 transition-all px-3 py-1.5 rounded-xl hover:bg-red-50 border border-transparent hover:border-red-100">
            Erledigte löschen
          </button>
        )}
      </div>

      {/* Add task */}
      <div className="flex gap-2 mb-6"
        style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
        <input
          value={newText}
          onChange={e => setNewText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTask()}
          placeholder="Neue Aufgabe hinzufügen..."
          className="flex-1 bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          style={{ direction: isRTL ? 'rtl' : 'ltr', textAlign: isRTL ? 'right' : 'left' }}
        />
        <button
          onClick={addTask}
          disabled={!newText.trim()}
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow transition-all disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Empty state */}
      {tasks.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <div className="text-5xl mb-3">📋</div>
          <p className="font-semibold text-slate-600 mb-1">Keine Aufgaben</p>
          <p className="text-sm">Füge Aufgaben hinzu oder scanne einen Brief</p>
        </div>
      )}

      {/* Pending tasks */}
      {pending.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">Offen</p>
          <div className="space-y-2">
            {pending.map(task => (
              <TaskItem key={task.id} task={task} onToggle={toggle} onRemove={remove} isRTL={isRTL} />
            ))}
          </div>
        </div>
      )}

      {/* Done tasks */}
      {done.length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">Erledigt</p>
          <div className="space-y-2 opacity-60">
            {done.map(task => (
              <TaskItem key={task.id} task={task} onToggle={toggle} onRemove={remove} isRTL={isRTL} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TaskItem({ task, onToggle, onRemove, isRTL }) {
  return (
    <div
      className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 border border-slate-100 shadow-sm transition-all hover:shadow"
      style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}
    >
      <button onClick={() => onToggle(task.id)} className="flex-shrink-0 transition-transform hover:scale-110">
        {task.done
          ? <CheckSquare size={22} className="text-green-500" />
          : <Square size={22} className="text-slate-300" />}
      </button>
      <p
        className={`flex-1 text-sm leading-relaxed ${task.done ? 'line-through text-slate-400' : 'text-slate-700'}`}
        style={{ textAlign: isRTL ? 'right' : 'left' }}
      >
        {task.text}
      </p>
      {task.source === 'scanner' && (
        <span className="text-xs bg-blue-50 text-blue-500 px-2 py-0.5 rounded-full flex-shrink-0">📸</span>
      )}
      <button onClick={() => onRemove(task.id)}
        className="flex-shrink-0 text-slate-300 hover:text-red-400 transition-all">
        <Trash2 size={15} />
      </button>
    </div>
  );
}
