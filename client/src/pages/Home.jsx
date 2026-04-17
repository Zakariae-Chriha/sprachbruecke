import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MessageCircle, FileText, Phone, Mail, ChevronRight, Globe2, PhoneCall, Sparkles } from 'lucide-react';
import LanguageSelector from '../components/LanguageSelector';

// 3D Animated Robot Component
function Robot3D() {
  return (
    <div className="robot-container select-none">
      {/* Head */}
      <div className="robot-head" style={{ margin: '0 auto', width: 90, height: 80, background: 'linear-gradient(145deg, #ffffff, #ddd6fe)', borderRadius: 20, position: 'relative', boxShadow: '6px 6px 15px rgba(99,102,241,0.2), -3px -3px 10px rgba(255,255,255,0.9)', border: '2px solid rgba(255,255,255,0.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        {/* Antenna */}
        <div style={{ width: 6, height: 20, background: 'linear-gradient(to top, #6366f1, #c4b5fd)', borderRadius: 3, position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)' }}>
          <div style={{ width: 14, height: 14, background: 'radial-gradient(circle, #f59e0b, #f97316)', borderRadius: '50%', position: 'absolute', top: -8, left: -4, boxShadow: '0 0 12px rgba(245,158,11,0.9)', animation: 'antennaGlow 1.5s ease-in-out infinite' }} />
        </div>
        {/* Eyes */}
        <div style={{ display: 'flex', gap: 14, marginTop: 10 }}>
          {[0, 1].map(i => (
            <div key={i} className="robot-eye" style={{ width: 18, height: 18, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 0 12px rgba(99,102,241,0.7)', position: 'relative' }}>
              <div style={{ width: 6, height: 6, background: 'white', borderRadius: '50%', position: 'absolute', top: 3, right: 3 }} />
            </div>
          ))}
        </div>
        {/* Mouth */}
        <div className="robot-mouth" style={{ width: 32, height: 10, background: 'linear-gradient(135deg, #6366f1, #a78bfa)', borderRadius: 5, boxShadow: '0 2px 8px rgba(99,102,241,0.4)' }} />
      </div>

      {/* Body */}
      <div style={{ width: 110, height: 110, background: 'linear-gradient(145deg, #ffffff, #e0e7ff)', borderRadius: 24, margin: '4px auto 0', position: 'relative', boxShadow: '8px 8px 20px rgba(99,102,241,0.2), -4px -4px 12px rgba(255,255,255,0.8)', border: '2px solid rgba(255,255,255,0.8)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        {/* Arms */}
        <div className="robot-arm-left" style={{ width: 18, height: 45, background: 'linear-gradient(145deg, #e0e7ff, #c7d2fe)', borderRadius: 9, position: 'absolute', top: 15, left: -20, boxShadow: '3px 3px 8px rgba(99,102,241,0.2)' }} />
        <div className="robot-arm-right" style={{ width: 18, height: 45, background: 'linear-gradient(145deg, #e0e7ff, #c7d2fe)', borderRadius: 9, position: 'absolute', top: 15, right: -20, boxShadow: '3px 3px 8px rgba(99,102,241,0.2)' }} />
        {/* Chest panel */}
        <div style={{ width: 60, height: 35, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 4px 12px rgba(99,102,241,0.4)' }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: i === 1 ? '#fbbf24' : 'white', boxShadow: i === 1 ? '0 0 8px rgba(251,191,36,0.8)' : '0 0 4px rgba(255,255,255,0.5)', animation: `antennaGlow ${1 + i * 0.4}s ease-in-out infinite` }} />
          ))}
        </div>
        {/* Belt */}
        <div style={{ width: 70, height: 6, background: 'linear-gradient(90deg, #a78bfa, #6366f1)', borderRadius: 3 }} />
      </div>

      {/* Legs */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 20, paddingTop: 4 }}>
        {[0, 1].map(i => (
          <div key={i} style={{ width: 20, height: 28, background: 'linear-gradient(145deg, #c7d2fe, #a5b4fc)', borderRadius: 8, boxShadow: '2px 4px 8px rgba(99,102,241,0.2)' }} />
        ))}
      </div>

      {/* Shadow */}
      <div className="robot-shadow" />
    </div>
  );
}

const FEATURE_CARDS = [
  {
    path: '/chat',
    icon: MessageCircle,
    iconBg: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
    shadow: 'rgba(59,130,246,0.3)',
    cardBorder: 'rgba(59,130,246,0.15)',
    key: 'chat',
    delay: 'stagger-1',
  },
  {
    path: '/documents',
    icon: FileText,
    iconBg: 'linear-gradient(135deg, #10b981, #059669)',
    shadow: 'rgba(16,185,129,0.3)',
    cardBorder: 'rgba(16,185,129,0.15)',
    key: 'documents',
    delay: 'stagger-2',
  },
  {
    path: '/calls',
    icon: Phone,
    iconBg: 'linear-gradient(135deg, #f59e0b, #f97316)',
    shadow: 'rgba(245,158,11,0.3)',
    cardBorder: 'rgba(245,158,11,0.15)',
    key: 'calls',
    delay: 'stagger-3',
  },
  {
    path: '/letters',
    icon: Mail,
    iconBg: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
    shadow: 'rgba(139,92,246,0.3)',
    cardBorder: 'rgba(139,92,246,0.15)',
    key: 'letters',
    delay: 'stagger-4',
  },
];

export default function Home() {
  const { t } = useTranslation();

  return (
    <div className="fade-in">
      {/* Hero Section */}
      <div className="text-center mb-10 pt-2">
        {/* Robot */}
        <div className="mb-6 flex justify-center">
          <Robot3D />
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full border"
          style={{ background: 'rgba(99,102,241,0.08)', borderColor: 'rgba(99,102,241,0.2)' }}>
          <Sparkles size={14} className="text-indigo-500" />
          <span className="text-sm text-indigo-600 font-medium">KI-Assistent · 8 Sprachen · Kostenlos</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold mb-3 text-slate-800">
          {t('home.welcome')} <span className="gradient-text">🌉</span>
        </h1>

        <p className="text-slate-500 text-base max-w-xl mx-auto leading-relaxed mb-4">
          {t('home.subtitle')}
        </p>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)' }}>
          <Globe2 size={14} className="text-cyan-600" />
          <span className="text-cyan-700 text-sm font-medium">{t('home.languages')}</span>
        </div>
      </div>

      {/* Language Selector */}
      <div className="glass-card p-5 mb-6">
        <h2 className="text-center text-slate-400 font-medium mb-3 text-xs uppercase tracking-widest">
          {t('language.select')}
        </h2>
        <LanguageSelector />
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {FEATURE_CARDS.map(({ path, icon: Icon, iconBg, shadow, cardBorder, key, delay }) => (
          <Link
            key={path}
            to={path}
            className={`card-3d block rounded-2xl p-5 group ${delay}`}
            style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(20px)', border: `1px solid ${cardBorder}`, boxShadow: `0 4px 20px rgba(0,0,0,0.05)` }}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="feature-icon mb-4" style={{ background: iconBg, boxShadow: `0 8px 20px ${shadow}` }}>
                  <Icon size={26} className="text-white" />
                </div>
                <h3 className="font-bold text-slate-800 text-base mb-1 group-hover:text-indigo-600 transition-colors">
                  {t(`home.features.${key}.title`)}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  {t(`home.features.${key}.desc`)}
                </p>
              </div>
              <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all mt-1 flex-shrink-0" />
            </div>
          </Link>
        ))}
      </div>

      {/* AI Autocall Banner */}
      <div className="rounded-2xl p-5 mb-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 10px 30px rgba(99,102,241,0.35)' }}>
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20"
          style={{ background: 'white', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full opacity-10"
          style={{ background: 'white', transform: 'translate(-30%, 30%)' }} />

        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 text-2xl">
              🤖
            </div>
            <div>
              <h3 className="font-bold text-white text-base">{t('nav.autocall')}</h3>
              <p className="text-indigo-200 text-xs">KI ruft an · Spricht Deutsch · Zusammenfassung auf deiner Sprache</p>
            </div>
          </div>
          <Link
            to="/autocall"
            className="bg-white text-indigo-600 font-bold px-4 py-2 rounded-xl text-sm flex-shrink-0 hover:bg-indigo-50 transition-all shadow-md"
          >
            Starten →
          </Link>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
        <Link to="/chat" className="btn-primary justify-center">
          <MessageCircle size={18} />
          {t('home.startChat')}
        </Link>
        <Link to="/documents" className="btn-secondary justify-center">
          <FileText size={18} />
          {t('home.uploadDoc')}
        </Link>
      </div>

      {/* Footer Info */}
      <div className="glass-card p-4 text-center">
        <p className="text-slate-400 text-xs">
          🔒 Daten nicht gespeichert &nbsp;·&nbsp; 100% Kostenlos &nbsp;·&nbsp; Powered by Llama 3.3 AI
        </p>
      </div>
    </div>
  );
}
