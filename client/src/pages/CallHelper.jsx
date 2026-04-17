import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from '../api';
import toast from 'react-hot-toast';
import { Phone, Loader2, Copy, CheckCircle, Search } from 'lucide-react';

const LANGUAGE_NAMES = {
  ar: 'Arabic', de: 'German', en: 'English', tr: 'Turkish',
  ru: 'Russian', uk: 'Ukrainian', fr: 'French', fa: 'Persian',
};

const QUICK_ORGS = [
  { de: 'Ausländerbehörde', icon: '🏛️' },
  { de: 'Jobcenter', icon: '💼' },
  { de: 'Krankenhaus', icon: '🏥' },
  { de: 'Finanzamt', icon: '📊' },
  { de: 'Kindergarten / Schule', icon: '🏫' },
  { de: 'Einwohnermeldeamt', icon: '📋' },
];

export default function CallHelper() {
  const { t, i18n } = useTranslation();
  const [situation, setSituation] = useState('');
  const [organization, setOrganization] = useState('');
  const [script, setScript] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateScript = async () => {
    if (!situation.trim()) {
      toast.error('Bitte beschreibe deine Situation');
      return;
    }

    setLoading(true);
    setScript(null);

    try {
      const res = await axios.post('/api/calls/prepare-script', {
        situation,
        targetOrganization: organization || 'Behörde',
        userLanguage: LANGUAGE_NAMES[i18n.language] || 'Arabisch',
      });
      setScript(res.data.script);
    } catch (err) {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const copyScript = () => {
    if (script) {
      navigator.clipboard.writeText(script);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success(t('common.copied'));
    }
  };

  return (
    <div className="fade-in">
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
          <Phone size={28} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-blue-900 mb-2">{t('calls.title')}</h1>
        <p className="text-gray-500">{t('calls.subtitle')}</p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-orange-100 mb-6">
        {/* Schnell-Auswahl Behörden */}
        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-3 font-medium">Schnellauswahl:</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_ORGS.map((org) => (
              <button
                key={org.de}
                onClick={() => setOrganization(org.de)}
                className={`px-3 py-2 rounded-xl text-sm transition-all ${
                  organization === org.de
                    ? 'bg-orange-600 text-white'
                    : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                }`}
              >
                {org.icon} {org.de}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('calls.organization')}
          </label>
          <input
            type="text"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            placeholder={t('calls.orgPlaceholder')}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('calls.situation')}
          </label>
          <textarea
            value={situation}
            onChange={(e) => setSituation(e.target.value)}
            placeholder={t('calls.situationPlaceholder')}
            rows={4}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
          />
        </div>

        <button
          onClick={generateScript}
          disabled={loading || !situation.trim()}
          className="w-full flex items-center justify-center gap-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 text-white font-semibold py-4 rounded-xl shadow-md transition-all"
        >
          {loading ? (
            <><Loader2 size={20} className="animate-spin" /> {t('calls.generating')}</>
          ) : (
            <><Search size={20} /> {t('calls.generate')}</>
          )}
        </button>
      </div>

      {script && (
        <div className="fade-in">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-orange-600 font-medium">
              <CheckCircle size={20} />
              <span>{t('calls.result')}</span>
            </div>
            <button
              onClick={copyScript}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-lg transition-all"
            >
              <Copy size={14} />
              {copied ? t('common.copied') : t('calls.copy')}
            </button>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-orange-100 whitespace-pre-wrap text-gray-700 leading-relaxed text-sm">
            {script}
          </div>
          <button
            onClick={() => { setScript(null); setSituation(''); setOrganization(''); }}
            className="mt-4 text-sm text-gray-500 hover:text-orange-600 underline"
          >
            {t('common.back')}
          </button>
        </div>
      )}
    </div>
  );
}
