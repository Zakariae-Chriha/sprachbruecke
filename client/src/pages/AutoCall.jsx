import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import axios from '../api';
import toast from 'react-hot-toast';
import { Phone, PhoneCall, PhoneOff, Loader2, CheckCircle, User, Hash, Target, Building2, Copy } from 'lucide-react';

const LANGUAGE_NAMES = {
  ar: 'Arabisch', de: 'Deutsch', en: 'Englisch', tr: 'Türkisch',
  ru: 'Russisch', uk: 'Ukrainisch', fr: 'Französisch', fa: 'Persisch',
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
  const pollRef = useRef(null);

  const labels = {
    title: { ar: 'الاتصال الذكي التلقائي', de: 'KI-Assistent ruft an', en: 'AI Auto Call', tr: 'Yapay Zeka Arama', ru: 'ИИ звонит', uk: 'ШІ дзвінок', fr: 'Appel IA auto', fa: 'تماس هوش مصنوعی' },
    subtitle: { ar: 'الذكاء الاصطناعي يتصل بدلاً منك، يتحدث الألمانية ويحجز موعدك', de: 'Die KI ruft an, spricht Deutsch und bucht deinen Termin', en: 'AI calls for you, speaks German, books your appointment', tr: 'Yapay zeka senin için arar, Almanca konuşur', ru: 'ИИ звонит за вас, говорит по-немецки', uk: 'ШІ дзвонить за вас, говорить по-німецьки', fr: 'L\'IA appelle pour vous, parle allemand', fa: 'هوش مصنوعی به جای شما زنگ می‌زند' },
    phone: { ar: 'رقم الهاتف', de: 'Telefonnummer', en: 'Phone number', tr: 'Telefon numarası', ru: 'Номер телефона', uk: 'Номер телефону', fr: 'Numéro de tél.', fa: 'شماره تلفن' },
    name: { ar: 'اسمك', de: 'Dein Name', en: 'Your name', tr: 'Adın', ru: 'Твоё имя', uk: 'Твоє ім\'я', fr: 'Ton prénom', fa: 'نام شما' },
    caseNum: { ar: 'رقم الملف / الكنزيشن', de: 'Aktenzeichen / Kennnummer', en: 'Case number / ID', tr: 'Dosya numarası', ru: 'Номер дела', uk: 'Номер справи', fr: 'Numéro de dossier', fa: 'شماره پرونده' },
    org: { ar: 'اسم الدائرة / المؤسسة', de: 'Name der Behörde', en: 'Organization name', tr: 'Kurum adı', ru: 'Название ведомства', uk: 'Назва органу', fr: 'Nom de l\'organisme', fa: 'نام سازمان' },
    purposeLabel: { ar: 'هدف الاتصال', de: 'Zweck des Anrufs', en: 'Call purpose', tr: 'Arama amacı', ru: 'Цель звонка', uk: 'Мета дзвінка', fr: 'But de l\'appel', fa: 'هدف تماس' },
    startCall: { ar: 'ابدأ الاتصال التلقائي', de: 'KI-Anruf starten', en: 'Start AI Call', tr: 'Yapay zeka aramasını başlat', ru: 'Начать ИИ звонок', uk: 'Почати ШІ дзвінок', fr: 'Lancer l\'appel IA', fa: 'شروع تماس هوش مصنوعی' },
    summary: { ar: 'ملخص المكالمة', de: 'Gesprächszusammenfassung', en: 'Call summary', tr: 'Görüşme özeti', ru: 'Итоги разговора', uk: 'Підсумок розмови', fr: 'Résumé de l\'appel', fa: 'خلاصه مکالمه' },
    calling: { ar: 'جاري الاتصال...', de: 'Ruft an...', en: 'Calling...', tr: 'Arıyor...', ru: 'Звонит...', uk: 'Дзвонить...', fr: 'En train d\'appeler...', fa: 'در حال تماس...' },
    history: { ar: 'محادثة المكالمة', de: 'Gesprächsverlauf', en: 'Call conversation', tr: 'Görüşme geçmişi', ru: 'Ход разговора', uk: 'Хід розмови', fr: 'Déroulement de l\'appel', fa: 'مکالمه تماس' },
  };

  const t = (key) => labels[key]?.[lang] || labels[key]?.['de'] || key;

  const startCall = async () => {
    if (!phoneNumber.trim()) { toast.error('Telefonnummer erforderlich'); return; }
    if (!userName.trim()) { toast.error('Name erforderlich'); return; }

    setLoading(true);
    try {
      const res = await axios.post('/api/autocall/start', {
        phoneNumber, userName, caseNumber, purpose,
        organizationName: organization || 'die Behörde',
        userLanguage: LANGUAGE_NAMES[lang] || 'Arabisch',
      });
      setCallSid(res.data.callSid);
      setCallStatus('calling');
      toast.success('📞 Anruf wird gestartet!');
      startPolling(res.data.callSid);
    } catch (err) {
      const msg = err.response?.data?.message || 'Fehler beim Starten';
      toast.error(msg);
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
        }
      } catch (e) {}
    }, 3000);
  };

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const resetCall = () => {
    setCallSid(null); setCallData(null); setCallStatus('idle');
    if (pollRef.current) clearInterval(pollRef.current);
  };

  const copySummary = () => {
    if (callData?.summary) {
      navigator.clipboard.writeText(callData.summary);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
      toast.success('Kopiert!');
    }
  };

  const statusColor = { idle: 'gray', calling: 'yellow', 'in-progress': 'green', completed: 'blue', failed: 'red' };

  return (
    <div className="fade-in max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <PhoneCall size={32} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-blue-900 mb-2">{t('title')}</h1>
        <p className="text-gray-500 text-sm leading-relaxed max-w-md mx-auto">{t('subtitle')}</p>
      </div>

      {/* Status Badge */}
      {callStatus !== 'idle' && (
        <div className={`mb-6 flex items-center justify-center gap-3 p-4 rounded-2xl ${
          callStatus === 'calling' ? 'bg-yellow-50 border border-yellow-200' :
          callStatus === 'in-progress' ? 'bg-green-50 border border-green-200' :
          callStatus === 'completed' ? 'bg-blue-50 border border-blue-200' :
          'bg-red-50 border border-red-200'
        }`}>
          {(callStatus === 'calling' || callStatus === 'in-progress') && (
            <Loader2 size={20} className="animate-spin text-green-600" />
          )}
          {callStatus === 'completed' && <CheckCircle size={20} className="text-blue-600" />}
          {callStatus === 'failed' && <PhoneOff size={20} className="text-red-600" />}
          <span className="font-semibold text-gray-700">
            {CALL_STATUS_LABELS[callStatus]?.[lang] || CALL_STATUS_LABELS[callStatus]?.['de']}
          </span>
          {callStatus === 'in-progress' && (
            <span className="flex gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full typing-dot" />
              <span className="w-2 h-2 bg-green-500 rounded-full typing-dot" />
              <span className="w-2 h-2 bg-green-500 rounded-full typing-dot" />
            </span>
          )}
        </div>
      )}

      {/* Formular */}
      {!callSid && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-green-100 space-y-4">

          {/* Zweck */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('purposeLabel')}</label>
            <div className="grid grid-cols-2 gap-2">
              {PURPOSES.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setPurpose(p.key)}
                  className={`flex items-center gap-2 px-3 py-3 rounded-xl text-sm font-medium transition-all text-left ${
                    purpose === p.key ? 'bg-teal-700 text-white' : 'bg-teal-50 text-teal-800 hover:bg-teal-100'
                  }`}
                >
                  <span>{p.icon}</span>
                  <span>{p.label[lang] || p.label['de']}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Telefonnummer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Phone size={14} className="inline mr-1" />{t('phone')} *
            </label>
            <input type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)}
              placeholder="+49 30 123456789"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <User size={14} className="inline mr-1" />{t('name')} *
            </label>
            <input type="text" value={userName} onChange={e => setUserName(e.target.value)}
              placeholder="z.B. Ahmed Al-Rahman"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          {/* Aktenzeichen */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Hash size={14} className="inline mr-1" />{t('caseNum')}
            </label>
            <input type="text" value={caseNumber} onChange={e => setCaseNumber(e.target.value)}
              placeholder="z.B. 2024-12345"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          {/* Behörde */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Building2 size={14} className="inline mr-1" />{t('org')}
            </label>
            <input type="text" value={organization} onChange={e => setOrganization(e.target.value)}
              placeholder="z.B. Ausländerbehörde Berlin"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          <button
            onClick={startCall}
            disabled={loading || !phoneNumber.trim() || !userName.trim()}
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-green-600 to-teal-700 hover:from-green-700 hover:to-teal-800 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold py-4 rounded-xl shadow-md transition-all text-lg"
          >
            {loading ? <Loader2 size={22} className="animate-spin" /> : <PhoneCall size={22} />}
            {loading ? t('calling') : t('startCall')}
          </button>

          {/* Info Box */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <p className="font-semibold mb-1">⚠️ Voraussetzungen:</p>
            <ul className="space-y-1 text-xs">
              <li>✅ Twilio Account + Nummer (twilio.com — kostenloser Trial)</li>
              <li>✅ ngrok gestartet + URL in .env eingetragen</li>
              <li>ℹ️ Die KI spricht automatisch Deutsch</li>
            </ul>
          </div>
        </div>
      )}

      {/* Laufender Anruf */}
      {callSid && callData && (
        <div className="space-y-4 fade-in">
          {/* Gesprächsverlauf */}
          {callData.history && callData.history.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-green-100">
              <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                <Phone size={16} className="text-green-600" /> {t('history')}
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {callData.history.map((msg, i) => (
                  <div key={i} className={`flex gap-2 ${msg.role === 'assistant' ? '' : 'flex-row-reverse'}`}>
                    <div className={`text-xs px-3 py-2 rounded-xl max-w-[85%] ${
                      msg.role === 'assistant'
                        ? 'bg-teal-50 text-teal-800 border border-teal-100'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      <span className="font-semibold text-xs block mb-1">
                        {msg.role === 'assistant' ? '🤖 KI-Assistent' : '🏛️ Behörde'}
                      </span>
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Zusammenfassung */}
          {callData.summary && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-blue-100 fade-in">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-blue-800 flex items-center gap-2">
                  <CheckCircle size={18} className="text-blue-600" /> {t('summary')}
                </h3>
                <button onClick={copySummary}
                  className="flex items-center gap-1 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg">
                  <Copy size={12} />
                  {copied ? 'Kopiert!' : 'Kopieren'}
                </button>
              </div>
              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-blue-50 rounded-xl p-4">
                {callData.summary}
              </div>
            </div>
          )}

          {/* Neuer Anruf */}
          {['completed', 'failed', 'no-answer'].includes(callStatus) && (
            <button onClick={resetCall}
              className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all">
              🔄 Neuen Anruf starten
            </button>
          )}
        </div>
      )}
    </div>
  );
}
