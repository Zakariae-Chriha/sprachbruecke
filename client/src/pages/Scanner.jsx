import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, Upload, Loader2, CheckSquare, RotateCcw, ClipboardList } from 'lucide-react';
import axios from '../api';
import toast from 'react-hot-toast';

const LANGUAGE_NAMES = {
  ar: 'Arabisch', de: 'Deutsch', en: 'Englisch', tr: 'Türkisch',
  ru: 'Russisch', uk: 'Ukrainisch', fr: 'Französisch', fa: 'Persisch',
};

function extractTasks(text) {
  const lines = text.split('\n');
  const tasks = [];
  lines.forEach(line => {
    const clean = line.replace(/^[-*•✓☐☑]\s*/, '').replace(/^\d+\.\s*/, '').trim();
    if (
      clean.length > 10 &&
      clean.length < 200 &&
      (line.match(/^[-*•☐\d]/) || line.toLowerCase().includes('muss') || line.toLowerCase().includes('soll'))
    ) {
      tasks.push(clean);
    }
  });
  return tasks.slice(0, 8);
}

export default function Scanner() {
  const { i18n } = useTranslation();
  const [preview, setPreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [mimeType, setMimeType] = useState('image/jpeg');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef(null);
  const cameraRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    const mime = file.type || 'image/jpeg';
    setMimeType(mime);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      setPreview(dataUrl);
      const base64 = dataUrl.split(',')[1];
      setImageBase64(base64);
      setResult('');
    };
    reader.readAsDataURL(file);
  };

  const analyze = async () => {
    if (!imageBase64) return;
    setLoading(true);
    try {
      const lang = LANGUAGE_NAMES[i18n.language] || 'Arabisch';
      const res = await axios.post('/api/scanner/analyze', {
        imageBase64,
        mimeType,
        userLanguage: lang,
      });
      setResult(res.data.result);
    } catch (err) {
      toast.error('Analyse fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  const saveTasksToStorage = () => {
    const tasks = extractTasks(result);
    if (tasks.length === 0) { toast.error('Keine Aufgaben gefunden'); return; }
    const existing = JSON.parse(localStorage.getItem('sb_tasks') || '[]');
    const newTasks = tasks.map(text => ({
      id: `t_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      text,
      done: false,
      createdAt: new Date().toISOString(),
      source: 'scanner',
    }));
    localStorage.setItem('sb_tasks', JSON.stringify([...existing, ...newTasks]));
    toast.success(`${tasks.length} Aufgaben gespeichert!`);
  };

  const reset = () => {
    setPreview(null);
    setImageBase64(null);
    setResult('');
  };

  const isRTL = i18n.language === 'ar' || i18n.language === 'fa';

  return (
    <div className="fade-in max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shadow"
          style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
          📸
        </div>
        <div>
          <h1 className="font-bold text-slate-800 text-lg">Brief-Scanner</h1>
          <p className="text-xs text-slate-400">Foto eines Briefes → KI erklärt alles</p>
        </div>
      </div>

      {/* Upload area */}
      {!preview ? (
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-blue-200 rounded-2xl p-10 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all mb-4"
        >
          <div className="text-5xl mb-3">📄</div>
          <p className="font-semibold text-slate-700 mb-1">Brief-Foto hochladen</p>
          <p className="text-sm text-slate-400 mb-4">oder Kamera benutzen</p>
          <div className="flex justify-center gap-3">
            <button
              onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white shadow"
              style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}
            >
              <Upload size={15} /> Datei wählen
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); cameraRef.current?.click(); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-blue-200 text-blue-600 bg-white hover:bg-blue-50 transition-all"
            >
              <Camera size={15} /> Kamera
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={e => handleFile(e.target.files[0])} />
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
            onChange={e => handleFile(e.target.files[0])} />
        </div>
      ) : (
        <div className="mb-4">
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow mb-3">
            <img src={preview} alt="Vorschau" className="w-full object-contain max-h-64" />
            <button
              onClick={reset}
              className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow flex items-center justify-center text-slate-500 hover:text-red-500 transition-all"
            >
              <RotateCcw size={15} />
            </button>
          </div>

          {!result && (
            <button
              onClick={analyze}
              disabled={loading}
              className="w-full py-3 rounded-2xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2"
              style={{ background: loading ? '#94A3B8' : 'linear-gradient(135deg, #2563EB, #7C3AED)' }}
            >
              {loading ? <><Loader2 size={18} className="animate-spin" /> Analysiere...</> : '🔍 Brief analysieren'}
            </button>
          )}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="fade-in">
          <div
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow mb-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap"
            style={{ direction: isRTL ? 'rtl' : 'ltr', textAlign: isRTL ? 'right' : 'left' }}
          >
            {result}
          </div>

          <div className="flex gap-2">
            <button
              onClick={saveTasksToStorage}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-white shadow"
              style={{ background: 'linear-gradient(135deg, #059669, #2563EB)' }}
            >
              <ClipboardList size={16} /> Aufgaben speichern
            </button>
            <button
              onClick={reset}
              className="px-4 py-3 rounded-2xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-all font-semibold"
            >
              Neu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
