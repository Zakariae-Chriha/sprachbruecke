import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import axios from '../api';
import toast from 'react-hot-toast';
import { Phone, PhoneCall, PhoneOff, Loader2, CheckCircle, User, Hash, Building2, Copy, Mic, MicOff, Volume2 } from 'lucide-react';

const LANGUAGE_NAMES = {
  ar: 'Arabic', de: 'German', en: 'English', tr: 'Turkish',
  ru: 'Russian', uk: 'Ukrainian', fr: 'French', fa: 'Persian',
};

const SPEECH_LANG = {
  ar: 'ar-SA', de: 'de-DE', en: 'en-US', tr: 'tr-TR',
  ru: 'ru-RU', uk: 'uk-UA', fr: 'fr-FR', fa: 'fa-IR',
};

const PURPOSES = [
  { key: 'Terminvereinbarung', icon: '📅', label: { ar: 'حجز موعد', de: 'Termin buchen', en: 'Book appointment', tr: 'Randevu al', ru: 'Записаться', uk: 'Записатися', fr: 'Prendre RDV', fa: 'رزرو وقت' }},
  { key: 'Statusabfrage', icon: '📋', label: { ar: 'استعلام عن الحالة', de: 'Status abfragen', en: 'Status inquiry', tr: 'Durum sorgula', ru: 'Узнать статус', uk: 'Дізнатися статус', fr: 'Demander statut', fa: 'پرسش وضعیت' }},
  { key: 'Information', icon: '❓', label: { ar: 'طلب معلومات', de: 'Information anfragen', en: 'Request info', tr: 'Bilgi al', ru: 'Запросить информацию', uk: 'Запитати інформацію', fr: 'Demander info', fa: 'درخواست اطلاعات' }},
  { key: 'Beschwerde', icon: '⚠️', label: { ar: 'استفسار عن أمر', de: 'Angelegenheit klären', en: 'Clarify matter', tr: 'Mesele çöz', ru: 'Выяснить вопрос', uk: 'З\'ясувати питання', fr: 'Clarifier affaire', fa: 'روشن کردن موضوع' }},
];

const CALL_STATUS_LABELS = {
  idle: { ar: 'جاهز', de: 'Bereit', en: 'Ready' },
  calling: { ar: 'جاري الاتصال...', de: 'Wählt...', en: 'Calling...' },
  'in-progress': { ar: 'المكالمة جارية', de: 'Gespräch läuft', en: 'In progress' },
  completed: { ar: 'انتهت المكالمة', de: 'Gespräch beendet', en: 'Call ended' },
  failed: { ar: 'فشل الاتصال', de: 'Anruf fehlgeschlagen', en: 'Call failed' },
};

// Voice questions per language
const VOICE_QUESTIONS = {
  ar: ['ما اسمك الكامل؟', 'ما هو رقم هاتف الجهة التي تريد الاتصال بها؟', 'ما هو هدف الاتصال؟ قل: حجز موعد، استعلام، معلومات، أو استفسار', 'ما اسم الجهة أو المؤسسة؟', 'هل لديك رقم ملف؟ إن لم يكن لديك قل لا'],
  de: ['Wie ist Ihr vollständiger Name?', 'Was ist die Telefonnummer der Behörde?', 'Was ist der Zweck? Sagen Sie: Termin, Status, Information oder Beschwerde', 'Wie heißt die Behörde?', 'Haben Sie eine Aktennummer? Falls nicht, sagen Sie nein'],
  en: ['What is your full name?', 'What is the phone number to call?', 'What is the purpose? Say: appointment, status, information, or inquiry', 'What is the organization name?', 'Do you have a case number? If not, say no'],
  fr: ['Quel est votre nom complet?', 'Quel est le numéro de téléphone à appeler?', 'Quel est le but? Dites: rendez-vous, statut, information ou réclamation', 'Quel est le nom de l\'organisme?', 'Avez-vous un numéro de dossier? Sinon dites non'],
  tr: ['Tam adınız nedir?', 'Aramak istediğiniz telefon numarası nedir?', 'Amaç nedir? Randevu, durum, bilgi veya şikayet deyin', 'Kurum adı nedir?', 'Dosya numaranız var mı? Yoksa hayır deyin'],
  ru: ['Как ваше полное имя?', 'Какой номер телефона для звонка?', 'Какова цель? Скажите: запись, статус, информация или жалоба', 'Как называется организация?', 'Есть ли у вас номер дела? Если нет, скажите нет'],
  uk: ['Яке ваше повне ім\'я?', 'Який номер телефону для дзвінка?', 'Яка мета? Скажіть: запис, статус, інформація або скарга', 'Як називається організація?', 'Чи є у вас номер справи? Якщо ні, скажіть ні'],
  fa: ['نام کامل شما چیست؟', 'شماره تلفن برای تماس چیست؟', 'هدف چیست؟ بگویید: وقت، وضعیت، اطلاعات یا شکایت', 'نام سازمان چیست؟', 'آیا شماره پرونده دارید؟ اگر نه، بگویید نه'],
};

export default function AutoCall() {
  const { i18n } = useTranslation();
  const lang = i18n.language;

  const [phoneNumber, setPhoneNumber] = useState('');
  const [userName, setUserName] = useState('');
  const [caseNumber, setCaseNumber] = useState('');
  const [organization, setOrganization] = useState('');
  const [purpose, setPurpose] = useState('Terminvereinbarung');
  const [callSid, setCallSid] = useState(null);
  const [callStatus, setCallStatus] = useState('idle');
  const [callData, setCallData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Voice setup state
  const [voiceMode, setVoiceMode] = useState(false);
  const [voiceStep, setVoiceStep] = useState(0);
  const [listening, setListening] = useState(false);
  const [voiceQuestion, setVoiceQuestion] = useState('');
  const pollRef = useRef(null);
  const recognitionRef = useRef(null);

  const labels = {
    title: { ar: 'الاتصال الذكي التلقائي', de: 'KI-Assistent ruft an', en: 'AI Auto Call', fr: 'Appel IA auto', tr: 'Yapay Zeka Arama', ru: 'ИИ звонит', uk: 'ШІ дзвінок', fa: 'تماس هوش مصنوعی' },
    subtitle: { ar: 'الذكاء الاصطناعي يتصل بدلاً منك ويتحدث الألمانية', de: 'Die KI ruft an und spricht Deutsch', en: 'AI calls for you and speaks German', fr: 'L\'IA appelle pour vous en allemand', tr: 'Yapay zeka Almanca arar', ru: 'ИИ звонит по-немецки', uk: 'ШІ дзвонить по-німецьки', fa: 'هوش مصنوعی به آلمانی زنگ می‌زند' },
    startCall: { ar: 'ابدأ الاتصال', de: 'Anruf starten', en: 'Start Call', fr: 'Lancer l\'appel', tr: 'Aramayı başlat', ru: 'Начать звонок', uk: 'Почати дзвінок', fa: 'شروع تماس' },
    voiceSetup: { ar: 'إعداد بالصوت', de: 'Sprachassistent', en: 'Voice Setup', fr: 'Config vocale', tr: 'Sesli kurulum', ru: 'Голосовая настройка', uk: 'Голосове налаштування', fa: 'تنظیم صوتی' },
    summary: { ar: 'ملخص المكالمة', de: 'Gesprächszusammenfassung', en: 'Call summary', fr: 'Résumé', tr: 'Görüşme özeti', ru: 'Итоги разговора', uk: 'Підсумок', fa: 'خلاصه مکالمه' },
    calling: { ar: 'جاري الاتصال...', de: 'Ruft an...', en: 'Calling...', fr: 'En train d\'appeler...', tr: 'Arıyor...', ru: 'Звонит...', uk: 'Дзвонить...', fa: 'در حال تماس...' },
  };

  const tr = (key) => labels[key]?.[lang] || labels[key]?.['en'] || key;

  const speak = useCallback((text, onEnd) => {
    if (!window.speechSynthesis) { onEnd?.(); return; }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = SPEECH_LANG[lang] || 'en-US';
    utter.rate = 0.85;
    utter.onend = () => onEnd?.();
    window.speechSynthesis.speak(utter);
  }, [lang]);

  const listenForAnswer = useCallback((onResult) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { toast.error('Spracherkennung nicht verfügbar'); return; }
    const rec = new SpeechRecognition();
    rec.lang = SPEECH_LANG[lang] || 'en-US';
    rec.continuous = false;
    rec.interimResults = false;
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = () => { setListening(false); toast.error('Mikrofon-Fehler'); };
    rec.onresult = (e) => onResult(e.results[0][0].transcript);
    rec.start();
    recognitionRef.current = rec;
  }, [lang]);

  const purposeFromSpeech = (text) => {
    const t = text.toLowerCase();
    if (t.includes('termin') || t.includes('appointment') || t.includes('موعد') || t.includes('randevu') || t.includes('запис') || t.includes('وقت') || t.includes('rdv')) return 'Terminvereinbarung';
    if (t.includes('status') || t.includes('حالة') || t.includes('durum') || t.includes('статус') || t.includes('وضعیت')) return 'Statusabfrage';
    if (t.includes('info') || t.includes('معلومات') || t.includes('bilgi') || t.includes('اطلاعات')) return 'Information';
    return 'Beschwerde';
  };

  const askQuestion = useCallback((step) => {
    const questions = VOICE_QUESTIONS[lang] || VOICE_QUESTIONS['en'];
    const q = questions[step];
    setVoiceQuestion(q);
    speak(q, () => {
      listenForAnswer((answer) => {
        if (step === 0) setUserName(answer);
        else if (step === 1) setPhoneNumber(answer.replace(/\s/g, ''));
        else if (step === 2) setPurpose(purposeFromSpeech(answer));
        else if (step === 3) setOrganization(answer);
        else if (step === 4) {
          const lower = answer.toLowerCase();
          if (!lower.includes('no') && !lower.includes('nein') && !lower.includes('لا') && !lower.includes('hayır') && !lower.includes('нет') && !lower.includes('نه')) {
            setCaseNumber(answer);
          }
        }

        if (step < 4) {
          setVoiceStep(step + 1);
          setTimeout(() => askQuestion(step + 1), 500);
        } else {
          // All done — confirm and call
          const confirmText = VOICE_QUESTIONS[lang]
            ? (lang === 'ar' ? 'شكراً! سأبدأ الاتصال الآن.' : lang === 'de' ? 'Danke! Ich starte jetzt den Anruf.' : 'Thank you! Starting the call now.')
            : 'Starting the call now.';
          speak(confirmText, () => {
            setVoiceMode(false);
            setVoiceStep(0);
          });
        }
      });
    });
  }, [lang, speak, listenForAnswer]);

  const startVoiceSetup = () => {
    setVoiceMode(true);
    setVoiceStep(0);
    setUserName(''); setPhoneNumber(''); setCaseNumber(''); setOrganization('');
    setTimeout(() => askQuestion(0), 300);
  };

  const startCall = async () => {
    if (!phoneNumber.trim()) { toast.error('Telefonnummer erforderlich'); return; }
    if (!userName.trim()) { toast.error('Name erforderlich'); return; }
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
      toast.error(err.response?.data?.message || 'Fehler beim Starten');
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
          if (res.data.summary) {
            setTimeout(() => speak(res.data.summary), 1000);
          }
        }
      } catch (e) {}
    }, 3000);
  };

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const resetCall = () => {
    window.speechSynthesis?.cancel();
    setCallSid(null); setCallData(null); setCallStatus('idle');
    if (pollRef.current) clearInterval(pollRef.current);
  };

  return (
    <div className="fade-in max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <PhoneCall size={32} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-blue-900 mb-2">{tr('title')}</h1>
        <p className="text-gray-500 text-sm">{tr('subtitle')}</p>
      </div>

      {/* Status Badge */}
      {callStatus !== 'idle' && (
        <div className={`mb-6 flex items-center justify-center gap-3 p-4 rounded-2xl ${
          callStatus === 'calling' ? 'bg-yellow-50 border border-yellow-200' :
          callStatus === 'in-progress' ? 'bg-green-50 border border-green-200' :
          callStatus === 'completed' ? 'bg-blue-50 border border-blue-200' :
          'bg-red-50 border border-red-200'
        }`}>
          {(callStatus === 'calling' || callStatus === 'in-progress') && <Loader2 size={20} className="animate-spin text-green-600" />}
          {callStatus === 'completed' && <CheckCircle size={20} className="text-blue-600" />}
          {callStatus === 'failed' && <PhoneOff size={20} className="text-red-600" />}
          <span className="font-semibold text-gray-700">
            {CALL_STATUS_LABELS[callStatus]?.[lang] || CALL_STATUS_LABELS[callStatus]?.['en']}
          </span>
        </div>
      )}

      {/* Voice Mode */}
      {voiceMode && (
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-teal-200 text-center mb-4 fade-in">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${listening ? 'bg-red-100 animate-pulse' : 'bg-teal-50'}`}>
            {listening ? <MicOff size={36} className="text-red-500" /> : <Volume2 size={36} className="text-teal-600 animate-pulse" />}
          </div>
          <p className="text-lg font-semibold text-gray-800 mb-2">{voiceQuestion}</p>
          <p className="text-sm text-gray-400">{listening ? '🎤 Ich höre...' : '🔊 Bitte warten...'}</p>
          <div className="mt-4 flex justify-center gap-2">
            {[0,1,2,3,4].map(i => (
              <div key={i} className={`w-3 h-3 rounded-full ${i < voiceStep ? 'bg-teal-500' : i === voiceStep ? 'bg-teal-300 animate-pulse' : 'bg-gray-200'}`} />
            ))}
          </div>
          <button onClick={() => { setVoiceMode(false); window.speechSynthesis?.cancel(); }} className="mt-4 text-xs text-gray-400 underline">Abbrechen</button>
        </div>
      )}

      {/* Form */}
      {!callSid && !voiceMode && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-green-100 space-y-4">

          {/* Voice Setup Button */}
          <button
            onClick={startVoiceSetup}
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-teal-500 to-teal-700 text-white font-bold py-4 rounded-xl shadow-md transition-all text-base hover:from-teal-600 hover:to-teal-800"
          >
            <Mic size={22} />
            {tr('voiceSetup')} 🎤
          </button>

          <div className="flex items-center gap-2 text-gray-300 text-xs">
            <div className="flex-1 h-px bg-gray-200" />
            <span>oder manuell ausfüllen</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Purpose */}
          <div className="grid grid-cols-2 gap-2">
            {PURPOSES.map((p) => (
              <button key={p.key} onClick={() => setPurpose(p.key)}
                className={`flex items-center gap-2 px-3 py-3 rounded-xl text-sm font-medium transition-all text-left ${
                  purpose === p.key ? 'bg-teal-700 text-white' : 'bg-teal-50 text-teal-800 hover:bg-teal-100'
                }`}>
                <span>{p.icon}</span><span>{p.label[lang] || p.label['en']}</span>
              </button>
            ))}
          </div>

          <input type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)}
            placeholder="📞 +49 30 123456789"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />

          <input type="text" value={userName} onChange={e => setUserName(e.target.value)}
            placeholder={`👤 ${labels.title?.ar ? 'اسمك / Your name' : 'Ihr Name'}`}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />

          <input type="text" value={caseNumber} onChange={e => setCaseNumber(e.target.value)}
            placeholder="# Aktenzeichen (optional)"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />

          <input type="text" value={organization} onChange={e => setOrganization(e.target.value)}
            placeholder="🏛️ Ausländerbehörde / Jobcenter..."
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />

          <button onClick={startCall} disabled={loading || !phoneNumber.trim() || !userName.trim()}
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-green-600 to-teal-700 hover:from-green-700 hover:to-teal-800 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold py-4 rounded-xl shadow-md transition-all text-lg">
            {loading ? <Loader2 size={22} className="animate-spin" /> : <PhoneCall size={22} />}
            {loading ? tr('calling') : tr('startCall')}
          </button>
        </div>
      )}

      {/* Show filled form after voice setup */}
      {!callSid && !voiceMode && (phoneNumber || userName) && (
        <div className="mt-2 text-xs text-gray-400 text-center">
          ✅ Formular ausgefüllt — bereit zum Anrufen
        </div>
      )}

      {/* Call in progress */}
      {callSid && callData && (
        <div className="space-y-4 fade-in">
          {callData.history?.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-green-100">
              <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                <Phone size={16} className="text-green-600" /> Gesprächsverlauf
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {callData.history.map((msg, i) => (
                  <div key={i} className={`flex gap-2 ${msg.role === 'assistant' ? '' : 'flex-row-reverse'}`}>
                    <div className={`text-xs px-3 py-2 rounded-xl max-w-[85%] ${msg.role === 'assistant' ? 'bg-teal-50 text-teal-800 border border-teal-100' : 'bg-gray-100 text-gray-700'}`}>
                      <span className="font-semibold text-xs block mb-1">{msg.role === 'assistant' ? '🤖 KI' : '🏛️ Behörde'}</span>
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {callData.summary && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-blue-100 fade-in">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-blue-800 flex items-center gap-2">
                  <CheckCircle size={18} className="text-blue-600" /> {tr('summary')}
                </h3>
                <div className="flex gap-2">
                  <button onClick={() => speak(callData.summary)} className="p-2 bg-blue-50 rounded-lg text-blue-600 hover:bg-blue-100" title="Vorlesen">
                    <Volume2 size={14} />
                  </button>
                  <button onClick={() => { navigator.clipboard.writeText(callData.summary); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                    className="flex items-center gap-1 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg">
                    <Copy size={12} />{copied ? 'Kopiert!' : 'Kopieren'}
                  </button>
                </div>
              </div>
              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-blue-50 rounded-xl p-4">
                {callData.summary}
              </div>
            </div>
          )}

          {['completed', 'failed', 'no-answer'].includes(callStatus) && (
            <button onClick={resetCall} className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all">
              🔄 Neuen Anruf starten
            </button>
          )}
        </div>
      )}
    </div>
  );
}
