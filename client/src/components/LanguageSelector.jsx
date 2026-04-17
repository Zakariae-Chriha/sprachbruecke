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

  const handleChange = (code) => {
    i18n.changeLanguage(code);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <Globe size={16} className="text-blue-300" />
        <select
          value={i18n.language}
          onChange={(e) => handleChange(e.target.value)}
          className="bg-transparent text-white text-sm border-none outline-none cursor-pointer"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code} className="text-gray-800 bg-white">
              {lang.flag} {lang.label}
            </option>
          ))}
        </select>
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
