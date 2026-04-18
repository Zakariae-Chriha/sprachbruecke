import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import axios from '../api';
import toast from 'react-hot-toast';
import {
  PhoneCall, PhoneOff, Loader2, CheckCircle,
  Copy, Mic, MicOff, Volume2, RefreshCw,
} from 'lucide-react';
import AuthWall from '../components/AuthWall';
import UpgradeModal from '../components/UpgradeModal';
import { useCallLimit } from '../hooks/useCallLimit';

const LANGUAGE_NAMES = {
  ar: 'Arabic', de: 'German', en: 'English', tr: 'Turkish',
  ru: 'Russian', uk: 'Ukrainian', fr: 'French', fa: 'Persian',
};
const SPEECH_LANG = {
  ar: 'ar-SA', de: 'de-DE', en: 'en-US', tr: 'tr-TR',
  ru: 'ru-RU', uk: 'uk-UA', fr: 'fr-FR', fa: 'fa-IR',
};

const PURPOSES = [
  { key: 'Terminvereinbarung', icon: '📅', label: { ar: 'حجز موعد', de: 'Termin buchen', en: 'Book appointment', tr: 'Randevu al', ru: 'Записаться', uk: 'Записатися', fr: 'Prendre RDV', fa: 'رزرو وقت' } },
  { key: 'Statusabfrage',      icon: '📋', label: { ar: 'استعلام الحالة', de: 'Status abfragen', en: 'Status inquiry', tr: 'Durum sorgula', ru: 'Узнать статус', uk: 'Дізнатися статус', fr: 'Demander statut', fa: 'پرسش وضعیت' } },
  { key: 'Information',        icon: '❓', label: { ar: 'طلب معلومات', de: 'Information anfragen', en: 'Request info', tr: 'Bilgi al', ru: 'Информация', uk: 'Інформація', fr: 'Demander info', fa: 'درخواست اطلاعات' } },
  { key: 'Beschwerde',         icon: '⚠️', label: { ar: 'استفسار', de: 'Angelegenheit klären', en: 'Clarify matter', tr: 'Mesele çöz', ru: 'Выяснить вопрос', uk: "З'ясувати питання", fr: 'Clarifier affaire', fa: 'روشن کردن موضوع' } },
];

const VOICE_QUESTIONS = {
  ar: ['ما اسمك الكامل؟', 'ما هو رقم هاتف الجهة؟', 'ما هدف الاتصال؟ قل: موعد أو استعلام أو معلومات', 'ما اسم الجهة أو المؤسسة؟', 'هل لديك رقم ملف؟ إن لم يكن قل لا'],
  de: ['Wie ist Ihr vollständiger Name?', 'Wie lautet die Telefonnummer der Behörde?', 'Was ist der Zweck? Sagen Sie: Termin, Status oder Information', 'Wie heißt die Behörde?', 'Haben Sie eine Aktennummer? Falls nicht, sagen Sie nein'],
  en: ['What is your full name?', 'What is the phone number to call?', 'What is the purpose? Say: appointment, status, or information', 'What is the organization name?', 'Do you have a case number? If not, say no'],
  tr: ['Tam adınız nedir?', 'Telefon numarası nedir?', 'Amaç nedir? Randevu, durum veya bilgi deyin', 'Kurum adı nedir?', 'Dosya numaranız var mı? Yoksa hayır deyin'],
  ru: ['Как ваше полное имя?', 'Какой номер телефона?', 'Какова цель? Скажите: запись, статус или информация', 'Как называется организация?', 'Есть ли у вас номер дела? Если нет, скажите нет'],
  uk: ["Яке ваше повне ім'я?", 'Який номер телефону?', 'Яка мета? Скажіть: запис, статус або інформація', 'Як називається організація?', 'Чи є у вас номер справи? Якщо ні, скажіть ні'],
  fr: ['Quel est votre nom complet?', 'Quel est le numéro de téléphone?', 'Quel est le but? Dites: rendez-vous, statut ou information', "Quel est le nom de l'organisme?", 'Avez-vous un numéro de dossier? Sinon dites non'],
  fa: ['نام کامل شما چیست؟', 'شماره تلفن چیست؟', 'هدف چیست؟ بگویید: وقت، وضعیت یا اطلاعات', 'نام سازمان چیست؟', 'آیا شماره پرونده دارید؟ اگر نه، بگویید نه'],
};

const MIC_ERRORS = {
  'not-allowed':  { de: 'Mikrofonzugriff verweigert. Bitte erlaube das Mikrofon im Browser.',   en: 'Microphone access denied. Allow mic in browser settings.' },
  'no-speech':    { de: 'Keine Sprache erkannt. Bitte nochmal versuchen.',                       en: 'No speech detected. Please try again.' },
  'network':      { de: 'Netzwerkfehler bei der Spracherkennung.',                              en: 'Network error in speech recognition.' },
  'audio-capture':{ de: 'Kein Mikrofon gefunden.',                                              en: 'No microphone found.' },
  default:        { de: 'Mikrofon-Fehler. Bitte nochmal versuchen.',                            en: 'Microphone error. Please try again.' },
};

function getMicErrorMsg(code, lang) {
  const entry = MIC_ERRORS[code] || MIC_ERRORS.default;
  return entry[lang] || entry['en'];
}

function purposeFromSpeech(text) {
  const t = text.toLowerCase();
  if (t.includes('termin') || t.includes('appoint') || t.includes('موعد') || t.includes('randevu') || t.includes('запис') || t.includes('وقت') || t.includes('rdv')) return 'Terminvereinbarung';
  if (t.includes('status') || t.includes('حالة') || t.includes('durum') || t.includes('статус') || t.includes('وضعیت')) return 'Statusabfrage';
  if (t.includes('info') || t.includes('معلومات') || t.includes('bilgi') || t.includes('aطلاعات')) return 'Information';
  return 'Beschwerde';
}

const DONE_MSG = {
  ar: 'شكراً! سأبدأ الاتصال الآن.', de: 'Danke! Starte jetzt den Anruf.',
  en: 'Thank you! Starting the call now.', fr: 'Merci! Je lance l\'appel.',
  tr: 'Teşekkürler! Arama başlatılıyor.', ru: 'Спасибо! Начинаю звонок.',
  uk: 'Дякую! Починаю дзвінок.', fa: 'ممنون! تماس را شروع می‌کنم.',
};

export default function AutoCall() {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const speechLang = SPEECH_LANG[lang] || 'en-US';
  const { status: callStatus_, showUpgrade, setShowUpgrade, handleLimitReached } = useCallLimit();

  const [phoneNumber, setPhoneNumber]   = useState('');
  const [userName,    setUserName]      = useState('');
  const [caseNumber,  setCaseNumber]    = useState('');
  const [organization, setOrganization] = useState('');
  const [purpose,     setPurpose]       = useState('Terminvereinbarung');

  const [callSid,     setCallSid]   = useState(null);
  const [callStatus,  setCallStatus] = useState('idle');
  const [callData,    setCallData]   = useState(null);
  const [loading,     setLoading]    = useState(false);
  const [copied,      setCopied]     = useState(false);

  // Voice wizard state
  const [voiceMode,     setVoiceMode]     = useState(false);
  const [voiceStep,     setVoiceStep]     = useState(0);  // 0-4
  const [voiceState,    setVoiceState]    = useState('speaking'); // 'speaking' | 'listening' | 'error'
  const [voiceQuestion, setVoiceQuestion] = useState('');
  const [micError,      setMicError]      = useState('');

  // Refs — avoids stale closures inside callbacks
  const pollRef        = useRef(null);
  const recRef         = useRef(null);
  const voiceModeRef   = useRef(false);
  const stepDataRef    = useRef({ name:'', phone:'', purpose:'Terminvereinbarung', org:'', case:'' });

  // ── Speech synthesis ──
  const speak = useCallback((text, onEnd) => {
    if (!window.speechSynthesis) { onEnd?.(); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang  = speechLang;
    u.rate  = 0.82;
    u.pitch = 1;
    u.onend   = () => onEnd?.();
    u.onerror = () => onEnd?.();
    window.speechSynthesis.speak(u);
  }, [speechLang]);

  // ── Speech recognition ──
  const startListening = useCallback((onResult, onError) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      toast.error('Spracherkennung nicht verfügbar in diesem Browser.');
      onError?.('not-allowed');
      return;
    }
    // Stop any previous session
    recRef.current?.stop();

    const rec = new SR();
    rec.lang            = speechLang;
    rec.continuous      = false;
    rec.interimResults  = false;
    rec.maxAlternatives = 1;

    rec.onstart  = () => setVoiceState('listening');
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      console.log('🎤 Erkannt:', transcript);
      onResult(transcript);
    };
    rec.onerror = (e) => {
      console.warn('🎤 Fehler:', e.error);
      setVoiceState('error');
      onError?.(e.error);
    };
    rec.onend = () => {
      if (voiceModeRef.current) setVoiceState('speaking');
    };

    rec.start();
    recRef.current = rec;
  }, [speechLang]);

  // ── Voice wizard step runner ──
  // Uses refs to avoid stale closures
  const runStep = useCallback((step) => {
    if (!voiceModeRef.current) return;
    const questions = VOICE_QUESTIONS[lang] || VOICE_QUESTIONS['en'];
    if (step >= questions.length) return;

    const q = questions[step];
    setVoiceStep(step);
    setVoiceQuestion(q);
    setVoiceState('speaking');
    setMicError('');

    speak(q, () => {
      if (!voiceModeRef.current) return;
      // Wait a moment so browser fully releases audio output before mic input
      setTimeout(() => {
        setVoiceState('listening');
        startListening(
          (answer) => {
            // Save answer
            if      (step === 0) { stepDataRef.current.name    = answer; setUserName(answer); }
            else if (step === 1) { stepDataRef.current.phone   = answer; setPhoneNumber(answer); }
            else if (step === 2) { const p = purposeFromSpeech(answer); stepDataRef.current.purpose = p; setPurpose(p); }
            else if (step === 3) { stepDataRef.current.org     = answer; setOrganization(answer); }
            else if (step === 4) {
              const lo = answer.toLowerCase();
              const isNo = lo.includes('no') || lo.includes('nein') || lo.includes('لا') || lo.includes('hayır') || lo.includes('нет') || lo.includes('нi') || lo.includes('نه');
              if (!isNo) { stepDataRef.current.case = answer; setCaseNumber(answer); }
            }

            if (step < 4) {
              setTimeout(() => runStep(step + 1), 700);
            } else {
              // All steps done
              const doneMsg = DONE_MSG[lang] || DONE_MSG['en'];
              speak(doneMsg, () => {
                voiceModeRef.current = false;
                setVoiceMode(false);
                setVoiceStep(0);
              });
            }
          },
          (errCode) => {
            const msg = getMicErrorMsg(errCode, lang === 'de' ? 'de' : 'en');
            setMicError(msg);
            setVoiceState('error');
          }
        );
      }, 800);
    });
  }, [lang, speak, startListening]);

  const startVoiceSetup = () => {
    stepDataRef.current = { name:'', phone:'', purpose:'Terminvereinbarung', org:'', case:'' };
    setUserName(''); setPhoneNumber(''); setCaseNumber(''); setOrganization('');
    voiceModeRef.current = true;
    setVoiceMode(true);
    setVoiceStep(0);
    setMicError('');
    setTimeout(() => runStep(0), 400);
  };

  const retryStep = () => {
    setMicError('');
    setTimeout(() => runStep(voiceStep), 300);
  };

  const cancelVoice = () => {
    voiceModeRef.current = false;
    recRef.current?.stop();
    window.speechSynthesis?.cancel();
    setVoiceMode(false);
    setVoiceStep(0);
  };

  // ── Call start ──
  const startCall = async () => {
    if (!phoneNumber.trim()) { toast.error('Telefonnummer erforderlich'); return; }
    if (!userName.trim())    { toast.error('Name erforderlich'); return; }
    setLoading(true);
    try {
      const res = await axios.post('/api/autocall/start', {
        phoneNumber, userName, caseNumber, purpose,
        organizationName: organization || 'die Behörde',
        userLanguage: LANGUAGE_NAMES[lang] || 'English',
      });
      setCallSid(res.data.callSid);
      setCallStatus('calling');
      toast.success('📞 Anruf wird gestartet!');
      startPolling(res.data.callSid);
    } catch (err) {
      if (err.response?.status === 402) {
        handleLimitReached(err.response.data);
      } else {
        toast.error(err.response?.data?.message || 'Fehler beim Starten');
      }
    } finally {
      setLoading(false);
    }
  };

  const startPolling = (sid) => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await axios.get(`/api/autocall/status/${sid}`);
        setCallData(res.data);
        setCallStatus(res.data.status);
        if (['completed', 'failed', 'no-answer', 'busy'].includes(res.data.status)) {
          clearInterval(pollRef.current);
          if (res.data.summary) setTimeout(() => speak(res.data.summary), 1200);
        }
      } catch {}
    }, 3000);
  };

  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current);
    recRef.current?.stop();
  }, []);

  const resetCall = () => {
    window.speechSynthesis?.cancel();
    setCallSid(null); setCallData(null); setCallStatus('idle');
    if (pollRef.current) clearInterval(pollRef.current);
  };

  // ── Labels ──
  const L = {
    title:      { ar: 'الاتصال الذكي التلقائي', de: 'KI-Assistent ruft an',        en: 'AI Auto Call',           fr: 'Appel IA auto',          tr: 'Yapay Zeka Araması',  ru: 'ИИ звонит',          uk: 'ШІ дзвінок',           fa: 'تماس هوش مصنوعی' },
    subtitle:   { ar: 'الذكاء الاصطناعي يتصل ويتحدث الألمانية', de: 'Die KI ruft an und spricht Deutsch', en: 'AI calls and speaks German', fr: "L'IA appelle en allemand", tr: 'YZ Almanca arar',       ru: 'ИИ звонит по-немецки', uk: 'ШІ дзвонить по-нім.', fa: 'هوش مصنوعی آلمانی صحبت می‌کند' },
    voiceBtn:   { ar: 'إعداد بالصوت 🎤', de: 'Sprach-Assistent 🎤',  en: 'Voice Setup 🎤', fr: 'Config vocale 🎤', tr: 'Sesli kurulum 🎤', ru: 'Голос. настройка 🎤', uk: 'Голосове налаш. 🎤', fa: 'تنظیم صوتی 🎤' },
    startCall:  { ar: 'ابدأ الاتصال', de: 'Anruf starten', en: 'Start Call', fr: "Lancer l'appel", tr: 'Aramayı başlat', ru: 'Начать звонок', uk: 'Почати дзвінок', fa: 'شروع تماس' },
    summary:    { ar: 'ملخص المكالمة', de: 'Gesprächszusammenfassung', en: 'Call Summary', fr: 'Résumé', tr: 'Görüşme özeti', ru: 'Итоги', uk: 'Підсумок', fa: 'خلاصه' },
    calling:    { ar: 'جاري الاتصال...', de: 'Verbinde...', en: 'Calling...', fr: 'Appel en cours...', tr: 'Arıyor...', ru: 'Звонит...', uk: 'Дзвонить...', fa: 'در حال تماس...' },
    nameLabel:  { ar: 'اسمك الكامل', de: 'Ihr Name', en: 'Your name', tr: 'Adınız', ru: 'Ваше имя', uk: "Ваше ім'я", fr: 'Votre nom', fa: 'نام شما' },
    phoneLabel: { ar: 'رقم هاتف الجهة', de: 'Telefonnummer der Behörde', en: 'Phone number', tr: 'Telefon numarası', ru: 'Номер телефона', uk: 'Номер телефону', fr: 'Numéro de téléphone', fa: 'شماره تلفن' },
    caseLabel:  { ar: 'رقم الملف (اختياري)', de: 'Aktenzeichen (optional)', en: 'Case number (optional)', tr: 'Dosya no (isteğe bağlı)', ru: 'Номер дела (необяз.)', uk: 'Номер справи (необов.)', fr: 'N° de dossier (optionnel)', fa: 'شماره پرونده (اختیاری)' },
    orgLabel:   { ar: 'اسم الجهة', de: 'Behörde / Organisation', en: 'Organization', tr: 'Kurum adı', ru: 'Организация', uk: 'Організація', fr: 'Organisme', fa: 'نام سازمان' },
  };
  const t = (key) => L[key]?.[lang] || L[key]?.['en'] || key;

  const stepProgress = (n) => `${n + 1} / 5`;

  const STATUS_COLORS = {
    calling:     'bg-amber-50 border-amber-200 text-amber-700',
    'in-progress': 'bg-green-50 border-green-200 text-green-700',
    completed:   'bg-blue-50 border-blue-200 text-blue-700',
    failed:      'bg-red-50 border-red-200 text-red-700',
    'no-answer': 'bg-gray-50 border-gray-200 text-gray-600',
    busy:        'bg-orange-50 border-orange-200 text-orange-700',
  };

  return (
    <AuthWall>
    {showUpgrade && (
      <UpgradeModal
        onClose={() => setShowUpgrade(false)}
        used={callStatus_?.callsThisMonth ?? 3}
        limit={callStatus_?.freeCallsLimit ?? 3}
        resetDate={callStatus_?.callsResetDate}
      />
    )}
    <div className="fade-in">

      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 text-3xl shadow-md"
          style={{ background: 'linear-gradient(135deg, #059669, #0891B2)' }}>
          🤖
        </div>
        <h1 className="text-xl font-bold text-slate-800 mb-1">{t('title')}</h1>
        <p className="text-sm text-slate-500">{t('subtitle')}</p>
        {callStatus_ && !callStatus_.isPremium && (
          <p className="text-xs text-slate-400 mt-1">
            {callStatus_.callsRemaining} von {callStatus_.freeCallsLimit} Anrufen übrig
            {' · '}
            <button onClick={() => setShowUpgrade(true)} className="text-blue-500 hover:underline">
              Upgrade
            </button>
          </p>
        )}
        {callStatus_?.isPremium && (
          <p className="text-xs text-green-600 mt-1">⭐ Premium — Unbegrenzte Anrufe</p>
        )}
      </div>

      {/* Call status badge */}
      {callStatus !== 'idle' && (
        <div className={`mb-4 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border text-sm font-semibold ${STATUS_COLORS[callStatus] || ''}`}>
          {['calling','in-progress'].includes(callStatus) && <Loader2 size={18} className="animate-spin" />}
          {callStatus === 'completed' && <CheckCircle size={18} />}
          {callStatus === 'failed'    && <PhoneOff size={18} />}
          <span>{{
            calling: t('calling'),
            'in-progress': lang === 'de' ? 'Gespräch läuft...' : 'In progress...',
            completed:   lang === 'de' ? 'Gespräch beendet' : 'Call ended',
            failed:      lang === 'de' ? 'Anruf fehlgeschlagen' : 'Call failed',
            'no-answer': lang === 'de' ? 'Keine Antwort' : 'No answer',
            busy:        lang === 'de' ? 'Besetzt' : 'Busy',
          }[callStatus] || callStatus}</span>
        </div>
      )}

      {/* ── VOICE WIZARD ── */}
      {voiceMode && (
        <div className="card p-6 text-center mb-4 fade-in" style={{ borderColor: '#A7F3D0' }}>
          {/* Mic / Speaker icon */}
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 transition-all ${
            voiceState === 'listening' ? 'bg-red-100 animate-pulse' :
            voiceState === 'error'    ? 'bg-orange-100' :
            'bg-emerald-50'
          }`}>
            {voiceState === 'listening'
              ? <MicOff size={36} className="text-red-500" />
              : voiceState === 'error'
              ? <Mic size={36} className="text-orange-400" />
              : <Volume2 size={36} className="text-emerald-600 animate-pulse" />}
          </div>

          {/* Question */}
          <p className="text-base font-semibold text-slate-800 mb-1">{voiceQuestion}</p>
          <p className="text-xs text-slate-400 mb-4">
            {voiceState === 'listening' ? '🎤 Ich höre zu...' :
             voiceState === 'error'     ? '' :
             '🔊 Bitte warten...'}
          </p>

          {/* Error + retry */}
          {voiceState === 'error' && micError && (
            <div className="mb-3 text-sm text-orange-700 bg-orange-50 border border-orange-200 rounded-xl p-3">
              {micError}
              <button onClick={retryStep}
                className="ml-2 inline-flex items-center gap-1 text-xs font-bold text-orange-700 underline">
                <RefreshCw size={12} /> Nochmal
              </button>
            </div>
          )}

          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-4">
            {[0,1,2,3,4].map(i => (
              <div key={i} className={`rounded-full transition-all ${
                i < voiceStep  ? 'w-3 h-3 bg-emerald-500' :
                i === voiceStep ? 'w-4 h-4 bg-emerald-400 animate-pulse' :
                'w-3 h-3 bg-slate-200'
              }`} />
            ))}
          </div>
          <p className="text-xs text-slate-400 mb-3">{stepProgress(voiceStep)}</p>

          <button onClick={cancelVoice} className="text-xs text-slate-400 hover:text-slate-600 underline">
            Abbrechen
          </button>
        </div>
      )}

      {/* ── FORM ── */}
      {!callSid && !voiceMode && (
        <div className="card p-5 space-y-4">

          {/* Voice setup button */}
          <button onClick={startVoiceSetup}
            className="btn w-full py-4 text-base font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #059669, #0891B2)' }}>
            <Mic size={20} /> {t('voiceBtn')}
          </button>

          <div className="flex items-center gap-2 text-slate-300 text-xs">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-slate-400">{lang === 'de' ? 'oder manuell' : 'or manually'}</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          {/* Purpose */}
          <div className="grid grid-cols-2 gap-2">
            {PURPOSES.map(p => (
              <button key={p.key} onClick={() => setPurpose(p.key)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                  purpose === p.key
                    ? 'text-white'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
                style={purpose === p.key ? { background: 'linear-gradient(135deg, #059669, #0891B2)' } : {}}>
                {p.icon} {p.label[lang] || p.label['en']}
              </button>
            ))}
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">👤 {t('nameLabel')}</label>
            <input className="input" value={userName} onChange={e => setUserName(e.target.value)}
              placeholder="Mohammed Ali" />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">📞 {t('phoneLabel')}</label>
            <input className="input" type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)}
              placeholder="+49 30 123456789" />
          </div>

          {/* Organization */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">🏛️ {t('orgLabel')}</label>
            <input className="input" value={organization} onChange={e => setOrganization(e.target.value)}
              placeholder="Ausländerbehörde / Jobcenter..." />
          </div>

          {/* Case number */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1"># {t('caseLabel')}</label>
            <input className="input" value={caseNumber} onChange={e => setCaseNumber(e.target.value)}
              placeholder="Z12345 / B-2024-001..." />
          </div>

          <button onClick={startCall}
            disabled={loading || !phoneNumber.trim() || !userName.trim()}
            className="btn btn-blue w-full py-4 text-base font-bold">
            {loading
              ? <><Loader2 size={20} className="animate-spin" /> {t('calling')}</>
              : <><PhoneCall size={20} /> {t('startCall')}</>}
          </button>
        </div>
      )}

      {/* ── CALL IN PROGRESS / RESULT ── */}
      {callSid && callData && (
        <div className="space-y-4 fade-in">

          {/* Conversation history */}
          {callData.history?.length > 0 && (
            <div className="card p-5">
              <h3 className="text-sm font-bold text-slate-600 mb-3 flex items-center gap-2">
                💬 {lang === 'de' ? 'Gesprächsverlauf' : 'Conversation'}
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {callData.history.map((msg, i) => (
                  <div key={i} className={`text-xs px-3 py-2 rounded-xl max-w-[85%] ${
                    msg.role === 'assistant'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                      : 'bg-slate-100 text-slate-700 ml-auto text-right'
                  }`}>
                    <span className="font-bold block mb-0.5">
                      {msg.role === 'assistant' ? '🤖 KI' : '🏛️ Behörde'}
                    </span>
                    {msg.content}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          {callData.summary && (
            <div className="card p-5 fade-in" style={{ borderColor: '#BFDBFE' }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-700 flex items-center gap-2 text-sm">
                  <CheckCircle size={16} className="text-blue-500" /> {t('summary')}
                </h3>
                <div className="flex gap-2">
                  <button onClick={() => speak(callData.summary)}
                    className="p-2 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-600 transition-all" title="Vorlesen">
                    <Volume2 size={14} />
                  </button>
                  <button onClick={() => { navigator.clipboard.writeText(callData.summary); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 rounded-lg transition-all">
                    <Copy size={12} /> {copied ? '✓' : 'Kopieren'}
                  </button>
                </div>
              </div>
              <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-blue-50 rounded-xl p-4">
                {callData.summary}
              </div>
            </div>
          )}

          {['completed','failed','no-answer','busy'].includes(callStatus) && (
            <button onClick={resetCall}
              className="btn btn-ghost w-full py-3 font-semibold">
              <RefreshCw size={16} />
              {lang === 'de' ? 'Neuen Anruf starten' : 'Start new call'}
            </button>
          )}
        </div>
      )}
    </div>
    </AuthWall>
  );
}
