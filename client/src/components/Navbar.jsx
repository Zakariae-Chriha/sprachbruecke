import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Home, MessageCircle, FileText, Phone,
  Mail, PhoneCall, Siren, Globe,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

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

const NAV = [
  { path: '/',          icon: Home,          key: 'home' },
  { path: '/chat',      icon: MessageCircle, key: 'chat' },
  { path: '/documents', icon: FileText,      key: 'documents' },
  { path: '/autocall',  icon: PhoneCall,     key: 'autocall' },
  { path: '/calls',     icon: Phone,         key: 'calls' },
];

function LangPopup() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[2];

  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-semibold transition-all"
        style={{ background: open ? '#EFF6FF' : 'white', borderColor: open ? '#93C5FD' : '#E8EDF5', color: open ? '#2563EB' : '#475569' }}
      >
        <Globe size={15} />
        <span>{current.flag} {current.label}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-48 rounded-2xl shadow-xl border border-slate-100 overflow-hidden fade-in-fast"
          style={{ background: 'white' }}>
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              onClick={() => { i18n.changeLanguage(lang.code); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all text-left"
              style={{
                background: i18n.language === lang.code ? '#EFF6FF' : 'transparent',
                color: i18n.language === lang.code ? '#2563EB' : '#475569',
              }}
            >
              <span className="text-lg">{lang.flag}</span>
              <span>{lang.label}</span>
              {i18n.language === lang.code && <span className="ml-auto text-blue-400">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <>
      {/* ── Desktop top bar ── */}
      <nav className="hidden md:flex navbar-top">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 select-none">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl shadow-sm"
              style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
              🌉
            </div>
            <span className="font-bold text-lg gradient-text">SprachBrücke</span>
          </Link>

          {/* Links */}
          <div className="flex items-center gap-1">
            {NAV.map(({ path, icon: Icon, key }) => (
              <Link
                key={path}
                to={path}
                className={`nav-link-desktop ${location.pathname === path ? 'active' : ''}`}
              >
                <Icon size={16} />
                {t(`nav.${key}`)}
              </Link>
            ))}
            <Link to="/letters" className={`nav-link-desktop ${location.pathname === '/letters' ? 'active' : ''}`}>
              <Mail size={16} />{t('nav.letters')}
            </Link>
            <Link to="/emergency" className="nav-link-desktop nav-link-sos ml-1">
              <Siren size={16} /> SOS
            </Link>
          </div>

          <LangPopup />
        </div>
      </nav>

      {/* ── Mobile top bar ── */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 fixed top-0 left-0 right-0 z-50"
        style={{ background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #E8EDF5' }}>
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base"
            style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
            🌉
          </div>
          <span className="font-bold text-base gradient-text">SprachBrücke</span>
        </Link>
        <LangPopup />
      </div>

      {/* ── Mobile bottom bar ── */}
      <nav className="md:hidden navbar-bottom">
        {NAV.map(({ path, icon: Icon, key }) => (
          <Link
            key={path}
            to={path}
            className={`nav-item ${location.pathname === path ? 'active' : ''}`}
          >
            <Icon size={22} />
            <span>{t(`nav.${key}`)}</span>
          </Link>
        ))}
        <Link to="/emergency" className="nav-item-sos">
          <Siren size={22} />
          <span>SOS</span>
        </Link>
      </nav>
    </>
  );
}
