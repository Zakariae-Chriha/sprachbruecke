import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Siren } from 'lucide-react';
import Bridge3D from '../components/Bridge3D';

const LANGUAGES = [
  { code: 'ar', flag: '🇸🇦', label: 'العربية' },
  { code: 'de', flag: '🇩🇪', label: 'Deutsch' },
  { code: 'en', flag: '🇬🇧', label: 'English' },
  { code: 'tr', flag: '🇹🇷', label: 'Türkçe' },
  { code: 'ru', flag: '🇷🇺', label: 'Русский' },
  { code: 'uk', flag: '🇺🇦', label: 'Українська' },
  { code: 'fr', flag: '🇫🇷', label: 'Français' },
  { code: 'fa', flag: '🇮🇷', label: 'فارسی' },
];

const FEATURES = [
  {
    path: '/chat',
    emoji: '💬',
    bg: '#EFF6FF',
    color: '#2563EB',
    key: 'chat',
    delay: 'stagger-1',
  },
  {
    path: '/documents',
    emoji: '📄',
    bg: '#ECFDF5',
    color: '#059669',
    key: 'documents',
    delay: 'stagger-2',
  },
  {
    path: '/autocall',
    emoji: '🤖',
    bg: '#F5F3FF',
    color: '#7C3AED',
    key: 'autocall',
    delay: 'stagger-3',
  },
  {
    path: '/calls',
    emoji: '📞',
    bg: '#FFFBEB',
    color: '#D97706',
    key: 'calls',
    delay: 'stagger-4',
  },
  {
    path: '/letters',
    emoji: '✉️',
    bg: '#FDF4FF',
    color: '#9333EA',
    key: 'letters',
    delay: 'stagger-5',
  },
  {
    path: '/emergency',
    emoji: '🆘',
    bg: '#FEF2F2',
    color: '#DC2626',
    key: 'emergency',
    delay: 'stagger-6',
    isEmergency: true,
  },
];

export default function Home() {
  const { t, i18n } = useTranslation();

  const FEATURE_LABELS = {
    chat:      { title: t('home.features.chat.title'),      desc: t('home.features.chat.desc') },
    documents: { title: t('home.features.documents.title'), desc: t('home.features.documents.desc') },
    autocall:  { title: t('nav.autocall'),  desc: 'KI ruft an · spricht Deutsch · Zusammenfassung' },
    calls:     { title: t('home.features.calls.title'),     desc: t('home.features.calls.desc') },
    letters:   { title: t('home.features.letters.title'),   desc: t('home.features.letters.desc') },
    emergency: { title: 'SOS · Notruf',                     desc: '110 Polizei · 112 Feuerwehr' },
  };

  return (
    <div>
      {/* ── Hero ── */}
      <div className="fade-in text-center pt-2 pb-6">
        <div className="flex justify-center mb-2">
          <Bridge3D size={380} />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          {t('home.welcome')}
        </h1>
        <p className="text-slate-500 text-sm leading-relaxed max-w-sm mx-auto">
          {t('home.subtitle')}
        </p>
      </div>

      {/* ── Language Selector ── */}
      <div className="stagger-1 mb-6">
        <p className="section-label text-center mb-3">{t('language.select')}</p>
        <div className="flex gap-2 overflow-x-auto pb-1 px-1 scrollbar-hide" style={{ scrollSnapType: 'x mandatory' }}>
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              onClick={() => i18n.changeLanguage(lang.code)}
              className={`lang-chip flex-shrink-0 ${i18n.language === lang.code ? 'active' : ''}`}
              style={{ scrollSnapAlign: 'start' }}
            >
              <span className="text-xl">{lang.flag}</span>
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Feature Grid ── */}
      <div className="stagger-2">
        <p className="section-label mb-3">Was brauchst du?</p>
        <div className="grid grid-cols-2 gap-3">
          {FEATURES.map(({ path, emoji, bg, color, key, delay, isEmergency }) => {
            const { title, desc } = FEATURE_LABELS[key];
            return (
              <Link
                key={path}
                to={path}
                className={`feature-card ${delay}`}
                style={{
                  border: isEmergency ? '1.5px solid #FECACA' : '1px solid #E8EDF5',
                }}
              >
                {/* Icon */}
                <div className="feature-icon-wrap" style={{ background: bg }}>
                  <span role="img" aria-label={key}>{emoji}</span>
                </div>

                {/* Text */}
                <div className="flex-1">
                  <p className="font-bold text-slate-800 text-sm leading-tight mb-1"
                    style={{ color: isEmergency ? color : undefined }}>
                    {title}
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{desc}</p>
                </div>

                {/* Arrow */}
                <div className="flex justify-end">
                  <ChevronRight size={16} style={{ color }} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Quick SOS strip ── */}
      <Link
        to="/emergency"
        className="stagger-6 mt-4 flex items-center justify-between gap-4 p-4 rounded-2xl"
        style={{ background: '#FEF2F2', border: '1.5px solid #FECACA' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl" style={{ background: '#FEE2E2' }}>
            🆘
          </div>
          <div>
            <p className="font-bold text-red-700 text-sm">Notfall · Emergency · طوارئ</p>
            <p className="text-xs text-red-400">110 Polizei · 112 Feuerwehr · GPS-Standort</p>
          </div>
        </div>
        <Siren size={22} className="text-red-500 flex-shrink-0" />
      </Link>

      {/* ── Footer ── */}
      <p className="text-center text-xs text-slate-400 mt-6 pb-2">
        🔒 Kostenlos · 8 Sprachen · KI-Assistent
      </p>
    </div>
  );
}
