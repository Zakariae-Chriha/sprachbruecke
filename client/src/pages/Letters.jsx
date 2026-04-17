import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from '../api';
import toast from 'react-hot-toast';
import { Mail, Loader2, Copy, Download, CheckCircle } from 'lucide-react';

const LANGUAGE_NAMES = {
  ar: 'Arabisch', de: 'Deutsch', en: 'Englisch', tr: 'Türkisch',
  ru: 'Russisch', uk: 'Ukrainisch', fr: 'Französisch', fa: 'Persisch',
};

const QUICK_RECIPIENTS = [
  { name: 'Ausländerbehörde', icon: '🏛️' },
  { name: 'Jobcenter', icon: '💼' },
  { name: 'Finanzamt', icon: '📊' },
  { name: 'Krankenhaus', icon: '🏥' },
  { name: 'Schule', icon: '🏫' },
  { name: 'Vermieter', icon: '🏠' },
];

export default function Letters() {
  const { t, i18n } = useTranslation();
  const [situation, setSituation] = useState('');
  const [letterType, setLetterType] = useState('general');
  const [recipient, setRecipient] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('german');
  const [copiedGerman, setCopiedGerman] = useState(false);
  const [copiedTranslation, setCopiedTranslation] = useState(false);

  const generateLetter = async () => {
    if (!situation.trim()) {
      toast.error('Bitte beschreibe was du schreiben möchtest');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await axios.post('/api/translate/generate-letter', {
        situation,
        letterType,
        userLanguage: LANGUAGE_NAMES[i18n.language] || 'Arabisch',
        recipientInfo: recipient || 'zuständige Behörde',
      });
      setResult(res.data);
    } catch (err) {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'german') { setCopiedGerman(true); setTimeout(() => setCopiedGerman(false), 2000); }
    else { setCopiedTranslation(true); setTimeout(() => setCopiedTranslation(false), 2000); }
    toast.success(t('common.copied'));
  };

  const downloadLetter = () => {
    const text = result.germanLetter || result.fullText;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brief_${letterType}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const LETTER_TYPES = ['general', 'appointment', 'complaint', 'request', 'appeal'];

  return (
    <div className="fade-in">
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
          <Mail size={28} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-blue-900 mb-2">{t('letters.title')}</h1>
        <p className="text-gray-500">{t('letters.subtitle')}</p>
      </div>

      {!result && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-purple-100">
          {/* Brief-Typ */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('letters.letterType')}</label>
            <div className="flex flex-wrap gap-2">
              {LETTER_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setLetterType(type)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    letterType === type
                      ? 'bg-purple-700 text-white'
                      : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                  }`}
                >
                  {t(`letters.types.${type}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Empfänger Schnellauswahl */}
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-2 font-medium">Schnellauswahl Empfänger:</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_RECIPIENTS.map((r) => (
                <button
                  key={r.name}
                  onClick={() => setRecipient(r.name)}
                  className={`px-3 py-2 rounded-xl text-sm transition-all ${
                    recipient === r.name
                      ? 'bg-purple-600 text-white'
                      : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                  }`}
                >
                  {r.icon} {r.name}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('letters.recipient')}</label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder={t('letters.recipientPlaceholder')}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('letters.situation')}</label>
            <textarea
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
              placeholder={t('letters.situationPlaceholder')}
              rows={5}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
            />
          </div>

          <button
            onClick={generateLetter}
            disabled={loading || !situation.trim()}
            className="w-full flex items-center justify-center gap-3 bg-purple-700 hover:bg-purple-800 disabled:bg-gray-300 text-white font-semibold py-4 rounded-xl shadow-md transition-all"
          >
            {loading ? (
              <><Loader2 size={20} className="animate-spin" /> {t('letters.generating')}</>
            ) : (
              <><Mail size={20} /> {t('letters.generate')}</>
            )}
          </button>
        </div>
      )}

      {result && (
        <div className="fade-in">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-purple-700 font-medium">
              <CheckCircle size={20} />
              <span>Brief erstellt!</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={downloadLetter}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
              >
                <Download size={14} />
                {t('letters.download')}
              </button>
              <button
                onClick={() => { setResult(null); setSituation(''); setRecipient(''); }}
                className="px-3 py-2 text-sm bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg transition-all"
              >
                {t('common.back')}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('german')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'german' ? 'bg-purple-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              🇩🇪 {t('letters.german')}
            </button>
            {result.translation && (
              <button
                onClick={() => setActiveTab('translation')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'translation' ? 'bg-purple-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                🌍 {t('letters.translation')}
              </button>
            )}
          </div>

          {activeTab === 'german' && (
            <div className="fade-in">
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => copyText(result.germanLetter || result.fullText, 'german')}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  <Copy size={14} />
                  {copiedGerman ? t('common.copied') : t('common.copy')}
                </button>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-purple-100 whitespace-pre-wrap text-gray-700 leading-relaxed text-sm font-mono">
                {result.germanLetter || result.fullText}
              </div>
            </div>
          )}

          {activeTab === 'translation' && result.translation && (
            <div className="fade-in">
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => copyText(result.translation, 'translation')}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  <Copy size={14} />
                  {copiedTranslation ? t('common.copied') : t('common.copy')}
                </button>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-purple-100 whitespace-pre-wrap text-gray-700 leading-relaxed text-sm">
                {result.translation}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
