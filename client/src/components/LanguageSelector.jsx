import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

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

export default function LanguageSelector({ compact = false }) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const handleChange = (code) => {
    i18n.changeLanguage(code);
    setOpen(false);
  };

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const current = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[2];

  if (compact) {
    return (
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl hover:bg-indigo-50 transition-all text-slate-600 hover:text-indigo-600"
        >
          <Globe size={16} />
          <span className="text-sm font-medium">{current.flag} {current.label}</span>
        </button>

        {open && (
          <div className="absolute right-0 top-10 z-50 bg-white rounded-2xl shadow-xl border border-indigo-100 p-2 w-48"
            style={{ animation: 'fadeIn 0.15s ease' }}>
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleChange(lang.code)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  i18n.language === lang.code
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
                }`}
              >
                <span className="text-lg">{lang.flag}</span>
                <span>{lang.label}</span>
                {i18n.language === lang.code && <span className="ml-auto text-indigo-400">✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 justify-center p-2">
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          onClick={() => handleChange(lang.code)}
          className={`px-3 py-2 rounded-xl text-sm font-medium transition-all border ${
            i18n.language === lang.code
              ? 'text-indigo-600 border-indigo-200 scale-105 shadow-md'
              : 'text-slate-500 border-slate-200 hover:border-indigo-200 hover:text-indigo-500'
          }`}
          style={{ background: i18n.language === lang.code ? 'rgba(99,102,241,0.12)' : 'white' }}
        >
          {lang.flag} {lang.label}
        </button>
      ))}
    </div>
  );
}
