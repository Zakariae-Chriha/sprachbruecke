import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Mic, MicOff, Volume2, PhoneCall } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from '../api';

const SPEECH_LANG = {
  ar: 'ar-SA', de: 'de-DE', en: 'en-US', tr: 'tr-TR',
  ru: 'ru-RU', uk: 'uk-UA', fr: 'fr-FR', fa: 'fa-IR',
};

const T = {
  ar: {
    title: 'طوارئ',
    subtitle: 'في حالة الخطر — اتصل فوراً',
    addressLabel: 'عنوانك (رقم المبنى، الشارع، المدينة)',
    addressPlaceholder: 'مثال: Hauptstraße 5, Berlin',
    micHint: 'اضغط وقل عنوانك',
    listening: '🎤 قل عنوانك الآن...',
    police: 'شرطة',
    fire: 'إطفاء / إسعاف',
    phraseLabel: 'الجملة الألمانية — اعرضها أو اضغط 🔊',
    aiCallLabel: '🤖 مساعد ذكي يتصل بدلاً عنك',
    aiCallNote: 'الذكاء الاصطناعي سيتحدث الألمانية',
    warning: 'هذه الخدمة لحالات الطوارئ الحقيقية فقط.',
    noAddress: 'أدخل عنوانك أولاً',
    calling: 'جارٍ الاتصال...',
    called: 'تم إرسال الاتصال!',
    direct: 'اتصال مباشر',
  },
  de: {
    title: 'Notruf',
    subtitle: 'Bei Gefahr — sofort anrufen',
    addressLabel: 'Ihre Adresse (Hausnr., Straße, Stadt)',
    addressPlaceholder: 'z.B. Hauptstraße 5, Berlin',
    micHint: 'Drücken und Adresse sprechen',
    listening: '🎤 Adresse sprechen...',
    police: 'Polizei',
    fire: 'Feuerwehr / Rettung',
    phraseLabel: 'Deutscher Notruf-Satz — zeigen oder 🔊',
    aiCallLabel: '🤖 KI ruft für Sie an',
    aiCallNote: 'KI spricht Deutsch für Sie',
    warning: 'Nur für echte Notfälle nutzen.',
    noAddress: 'Bitte zuerst Adresse eingeben',
    calling: 'Wird verbunden...',
    called: 'Anruf gesendet!',
    direct: 'Direkt anrufen',
  },
  en: {
    title: 'Emergency',
    subtitle: 'In danger — call immediately',
    addressLabel: 'Your address (building no., street, city)',
    addressPlaceholder: 'e.g. Hauptstraße 5, Berlin',
    micHint: 'Press and speak your address',
    listening: '🎤 Say your address...',
    police: 'Police',
    fire: 'Fire / Ambulance',
    phraseLabel: 'German emergency phrase — show or 🔊',
    aiCallLabel: '🤖 AI calls on your behalf',
    aiCallNote: 'AI will speak German for you',
    warning: 'Only for real emergencies.',
    noAddress: 'Enter your address first',
    calling: 'Calling...',
    called: 'Call sent!',
    direct: 'Direct call',
  },
  tr: {
    title: 'Acil Durum',
    subtitle: 'Tehlikede — hemen arayın',
    addressLabel: 'Adresiniz (bina no., sokak, şehir)',
    addressPlaceholder: 'örn. Hauptstraße 5, Berlin',
    micHint: 'Basın ve adresinizi söyleyin',
    listening: '🎤 Adresinizi söyleyin...',
    police: 'Polis',
    fire: 'İtfaiye / Ambulans',
    phraseLabel: 'Almanca acil cümle — göster veya 🔊',
    aiCallLabel: '🤖 Yapay zeka sizin için arar',
    aiCallNote: 'Yapay zeka Almanca konuşur',
    warning: 'Yalnızca gerçek acil durumlar için.',
    noAddress: 'Önce adresinizi girin',
    calling: 'Bağlanıyor...',
    called: 'Arama gönderildi!',
    direct: 'Doğrudan ara',
  },
  ru: {
    title: 'Экстренный вызов',
    subtitle: 'В опасности — звоните немедленно',
    addressLabel: 'Ваш адрес (№ дома, улица, город)',
    addressPlaceholder: 'напр. Hauptstraße 5, Berlin',
    micHint: 'Нажмите и назовите адрес',
    listening: '🎤 Назовите адрес...',
    police: 'Полиция',
    fire: 'Пожарные / Скорая',
    phraseLabel: 'Немецкая фраза — показать или 🔊',
    aiCallLabel: '🤖 ИИ звонит за вас',
    aiCallNote: 'ИИ говорит по-немецки',
    warning: 'Только для настоящих чрезвычайных ситуаций.',
    noAddress: 'Сначала введите адрес',
    calling: 'Соединение...',
    called: 'Вызов отправлен!',
    direct: 'Прямой вызов',
  },
  uk: {
    title: 'Екстрений виклик',
    subtitle: 'У небезпеці — телефонуйте негайно',
    addressLabel: 'Ваша адреса (№ будинку, вулиця, місто)',
    addressPlaceholder: 'напр. Hauptstraße 5, Berlin',
    micHint: 'Натисніть і назвіть адресу',
    listening: '🎤 Назвіть адресу...',
    police: 'Поліція',
    fire: 'Пожежні / Швидка',
    phraseLabel: 'Нім. фраза — показати або 🔊',
    aiCallLabel: '🤖 ШІ телефонує замість вас',
    aiCallNote: 'ШІ говорить німецькою',
    warning: 'Лише для справжніх надзвичайних ситуацій.',
    noAddress: 'Спочатку введіть адресу',
    calling: "З'єднання...",
    called: 'Виклик надіслано!',
    direct: 'Прямий виклик',
  },
  fr: {
    title: 'Urgence',
    subtitle: 'En danger — appelez immédiatement',
    addressLabel: 'Votre adresse (n° bâtiment, rue, ville)',
    addressPlaceholder: 'ex. Hauptstraße 5, Berlin',
    micHint: 'Appuyez et dites votre adresse',
    listening: '🎤 Dites votre adresse...',
    police: 'Police',
    fire: 'Pompiers / SAMU',
    phraseLabel: "Phrase d'urgence allemande — afficher ou 🔊",
    aiCallLabel: "🤖 L'IA appelle à votre place",
    aiCallNote: "L'IA parle allemand pour vous",
    warning: 'Uniquement pour les vraies urgences.',
    noAddress: "Entrez d'abord votre adresse",
    calling: 'Connexion...',
    called: 'Appel envoyé!',
    direct: 'Appel direct',
  },
  fa: {
    title: 'اورژانس',
    subtitle: 'در خطر هستید — فوری تماس بگیرید',
    addressLabel: 'آدرس شما (شماره ساختمان، خیابان، شهر)',
    addressPlaceholder: 'مثال: Hauptstraße 5, Berlin',
    micHint: 'فشار دهید و آدرس بگویید',
    listening: '🎤 آدرس خود را بگویید...',
    police: 'پلیس',
    fire: 'آتش‌نشانی / اورژانس',
    phraseLabel: 'جمله اورژانسی آلمانی — نمایش یا 🔊',
    aiCallLabel: '🤖 هوش مصنوعی به جای شما زنگ می‌زند',
    aiCallNote: 'هوش مصنوعی آلمانی صحبت می‌کند',
    warning: 'فقط برای موارد اورژانسی واقعی.',
    noAddress: 'ابتدا آدرس خود را وارد کنید',
    calling: 'در حال اتصال...',
    called: 'تماس ارسال شد!',
    direct: 'تماس مستقیم',
  },
};

function buildGermanPhrase(address, type) {
  const service = type === 'police' ? 'Polizei' : 'Feuerwehr und Rettungsdienst';
  return `NOTRUF! Ich spreche kein Deutsch. Ich brauche sofort ${service}! Die Adresse ist: ${address}. Bitte kommen Sie sofort! Ich wiederhole: ${address}.`;
}

export default function Emergency() {
  const { i18n } = useTranslation();
  const lang = T[i18n.language] ? i18n.language : 'en';
  const txt = T[lang];
  const speechLang = SPEECH_LANG[lang] || 'en-US';

  const [address, setAddress] = useState('');
  const [listening, setListening] = useState(false);
  const [calling, setCalling] = useState(null);
  const recognitionRef = useRef(null);

  const speak = useCallback((text, voiceLang) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = voiceLang || speechLang;
    utter.rate = 0.85;
    window.speechSynthesis.speak(utter);
  }, [speechLang]);

  const listenForAddress = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast.error('Mikrofon nicht verfügbar'); return; }
    const r = new SR();
    r.lang = speechLang;
    r.continuous = false;
    r.interimResults = false;
    r.onstart = () => setListening(true);
    r.onend = () => setListening(false);
    r.onerror = () => { setListening(false); toast.error('Mikrofon-Fehler'); };
    r.onresult = (e) => setAddress(e.results[0][0].transcript);
    r.start();
    recognitionRef.current = r;
  };

  const stopListening = () => { recognitionRef.current?.stop(); setListening(false); };

  const callEmergency = async (type) => {
    if (!address.trim()) { toast.error(txt.noAddress); return; }
    setCalling(type);
    try {
      await axios.post('/api/emergency/call', { type, address });
      toast.success(txt.called);
    } catch {
      toast.error('Verbindungsfehler');
    } finally {
      setCalling(null);
    }
  };

  const germanPhrase = address.trim()
    ? buildGermanPhrase(address, 'police')
    : '';

  return (
    <div className="fade-in max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-xl animate-pulse">
          <span className="text-4xl">🆘</span>
        </div>
        <h1 className="text-3xl font-bold text-red-700 mb-1">{txt.title}</h1>
        <p className="text-gray-500 text-sm">{txt.subtitle}</p>
      </div>

      {/* Warning */}
      <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 mb-5 text-xs text-amber-800 text-center font-medium">
        ⚠️ {txt.warning}
      </div>

      {/* Direct call buttons — always visible, most important */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <a
          href="tel:110"
          className="flex flex-col items-center gap-2 bg-blue-700 hover:bg-blue-800 active:scale-95 text-white py-5 rounded-2xl shadow-lg transition-all text-center"
        >
          <span className="text-4xl">🚔</span>
          <span className="font-bold text-xl">110</span>
          <span className="text-sm font-medium">{txt.police}</span>
          <span className="text-xs opacity-75">{txt.direct}</span>
        </a>
        <a
          href="tel:112"
          className="flex flex-col items-center gap-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white py-5 rounded-2xl shadow-lg transition-all text-center"
        >
          <span className="text-4xl">🚒</span>
          <span className="font-bold text-xl">112</span>
          <span className="text-sm font-medium">{txt.fire}</span>
          <span className="text-xs opacity-75">{txt.direct}</span>
        </a>
      </div>

      {/* Address input */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-red-100 mb-4">
        <label className="block text-sm font-semibold text-gray-700 mb-3">{txt.addressLabel}</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={txt.addressPlaceholder}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
          />
          <button
            onClick={listening ? stopListening : listenForAddress}
            className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
              listening
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-red-100 hover:bg-red-200 text-red-700'
            }`}
            title={txt.micHint}
          >
            {listening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
        </div>
        {listening && (
          <p className="text-sm text-red-500 text-center mt-2 animate-pulse">{txt.listening}</p>
        )}
      </div>

      {/* German emergency phrase */}
      {germanPhrase && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4 fade-in">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">{txt.phraseLabel}</p>
            <button
              onClick={() => speak(germanPhrase, 'de-DE')}
              className="flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg transition-all"
            >
              <Volume2 size={14} /> 🔊
            </button>
          </div>
          <p className="text-gray-800 text-sm leading-relaxed font-medium">{germanPhrase}</p>
        </div>
      )}

      {/* AI auto-call (when address is given) */}
      {address.trim() && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-red-100 fade-in">
          <p className="text-sm font-semibold text-gray-700 mb-1 text-center">{txt.aiCallLabel}</p>
          <p className="text-xs text-gray-400 text-center mb-4">{txt.aiCallNote}</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => callEmergency('police')}
              disabled={!!calling}
              className="flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 disabled:bg-gray-300 text-white py-3 rounded-xl font-semibold text-sm transition-all"
            >
              {calling === 'police' ? (
                <span className="animate-spin inline-block">⏳</span>
              ) : (
                <PhoneCall size={16} />
              )}
              {calling === 'police' ? txt.calling : `🚔 110`}
            </button>
            <button
              onClick={() => callEmergency('fire')}
              disabled={!!calling}
              className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white py-3 rounded-xl font-semibold text-sm transition-all"
            >
              {calling === 'fire' ? (
                <span className="animate-spin inline-block">⏳</span>
              ) : (
                <PhoneCall size={16} />
              )}
              {calling === 'fire' ? txt.calling : `🚒 112`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
