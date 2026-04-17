import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, MessageCircle, FileText, Phone, Mail, PhoneCall, Siren } from 'lucide-react';
import LanguageSelector from './LanguageSelector';

const NAV_ITEMS = [
  { path: '/', icon: Home, key: 'home' },
  { path: '/chat', icon: MessageCircle, key: 'chat' },
  { path: '/documents', icon: FileText, key: 'documents' },
  { path: '/calls', icon: Phone, key: 'calls' },
  { path: '/letters', icon: Mail, key: 'letters' },
  { path: '/autocall', icon: PhoneCall, key: 'autocall' },
];

export default function Navbar() {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50"
        style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(99,102,241,0.1)', boxShadow: '0 4px 20px rgba(99,102,241,0.08)' }}>
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between px-6 py-3">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-md group-hover:scale-110 transition-transform"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              🤖
            </div>
            <span className="font-bold text-xl gradient-text">{t('appName')}</span>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-1">
            {NAV_ITEMS.map(({ path, icon: Icon, key }) => {
              const isActive = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                    isActive ? 'nav-active-item' : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50'
                  }`}
                >
                  <Icon size={15} />
                  <span>{t(`nav.${key}`)}</span>
                </Link>
              );
            })}
          </div>

          <Link
            to="/emergency"
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
              location.pathname === '/emergency'
                ? 'bg-red-600 text-white'
                : 'bg-red-100 text-red-700 hover:bg-red-200'
            }`}
          >
            <Siren size={15} />
            <span>SOS</span>
          </Link>
          <LanguageSelector compact />
        </div>
      </nav>

      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center justify-between"
        style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(99,102,241,0.1)', boxShadow: '0 2px 10px rgba(99,102,241,0.08)' }}>
        <Link to="/" className="font-bold text-lg flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            🤖
          </div>
          <span className="gradient-text">{t('appName')}</span>
        </Link>
        <LanguageSelector compact />
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50"
        style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(99,102,241,0.1)', boxShadow: '0 -4px 20px rgba(99,102,241,0.08)' }}>
        <div className="flex justify-around items-center py-2 px-2">
          {NAV_ITEMS.map(({ path, icon: Icon, key }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center gap-1 px-2 py-1 rounded-xl transition-all ${
                  isActive ? 'text-indigo-600' : 'text-slate-400'
                }`}
              >
                <Icon size={20} style={isActive ? { filter: 'drop-shadow(0 0 6px rgba(99,102,241,0.5))' } : {}} />
                <span className="text-xs font-medium">{t(`nav.${key}`)}</span>
              </Link>
            );
          })}
          {/* SOS emergency button — always red */}
          <Link
            to="/emergency"
            className={`flex flex-col items-center gap-1 px-2 py-1 rounded-xl transition-all ${
              location.pathname === '/emergency' ? 'text-red-700' : 'text-red-500'
            }`}
          >
            <Siren size={20} />
            <span className="text-xs font-bold">SOS</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
