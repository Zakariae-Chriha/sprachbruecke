import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Mic, MicOff, Volume2, PhoneCall, MapPin, Loader2, RefreshCw, User } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from '../api';
import AuthWall from '../components/AuthWall';
import UpgradeModal from '../components/UpgradeModal';
import { useCallLimit } from '../hooks/useCallLimit';

const SPEECH_LANG = {
  ar: 'ar-SA', de: 'de-DE', en: 'en-US', tr: 'tr-TR',
  ru: 'ru-RU', uk: 'uk-UA', fr: 'fr-FR', fa: 'fa-IR',
};

const T = {
  ar: {
    title: 'طوارئ',
    subtitle: 'في حالة الخطر — اتصل فوراً',
    nameLabel: 'اسمك الكامل',
    namePlaceholder: 'مثال: محمد علي',
    nameMic: 'اضغط وقل اسمك',
    addressLabel: 'عنوانك',
    addressPlaceholder: 'مثال: Hauptstraße 5, Berlin',
    addrMic: 'اضغط وقل عنوانك',
    listening: '🎤 تحدث الآن...',
    police: 'شرطة',
    fire: 'إطفاء / إسعاف',
    phraseLabel: 'اعرض هذه الجملة للشرطة أو اضغط 🔊',
    aiCallLabel: '🤖 مساعد ذكي يتصل بدلاً عنك',
    aiCallNote: 'سيقدّم اسمك ويشرح وضعك بالألمانية',
    warning: 'هذه الخدمة لحالات الطوارئ الحقيقية فقط.',
    noAddress: 'أدخل عنوانك أولاً',
    noName: 'أدخل اسمك أولاً',
    calling: 'جارٍ الاتصال...',
    called: 'تم إرسال الاتصال!',
    direct: 'اتصال مباشر',
    locating: 'جارٍ تحديد موقعك...',
    locationFound: '✅ تم تحديد الموقع تلقائياً',
    locationError: 'تعذّر تحديد الموقع',
    locationRetry: 'إعادة المحاولة',
    manualEdit: 'يمكنك تعديل العنوان يدوياً',
    coords: 'GPS',
  },
  de: {
    title: 'Notruf',
    subtitle: 'Bei Gefahr — sofort anrufen',
    nameLabel: 'Ihr vollständiger Name',
    namePlaceholder: 'z.B. Mohammed Ali',
    nameMic: 'Drücken und Namen sprechen',
    addressLabel: 'Ihre Adresse',
    addressPlaceholder: 'z.B. Hauptstraße 5, 10115 Berlin',
    addrMic: 'Drücken und Adresse sprechen',
    listening: '🎤 Sprechen...',
    police: 'Polizei',
    fire: 'Feuerwehr / Rettung',
    phraseLabel: 'Deutschen Satz zeigen oder 🔊',
    aiCallLabel: '🤖 KI ruft für Sie an',
    aiCallNote: 'KI stellt Ihren Namen vor und erklärt die Situation',
    warning: 'Nur für echte Notfälle.',
    noAddress: 'Bitte Adresse eingeben',
    noName: 'Bitte Namen eingeben',
    calling: 'Verbinde...',
    called: 'Anruf gesendet!',
    direct: 'Direkt anrufen',
    locating: 'Standort wird ermittelt...',
    locationFound: '✅ Standort erkannt',
    locationError: 'Standort nicht verfügbar',
    locationRetry: 'Erneut versuchen',
    manualEdit: 'Adresse kann bearbeitet werden',
    coords: 'GPS',
  },
  en: {
    title: 'Emergency',
    subtitle: 'In danger — call immediately',
    nameLabel: 'Your full name',
    namePlaceholder: 'e.g. Mohammed Ali',
    nameMic: 'Press and say your name',
    addressLabel: 'Your address',
    addressPlaceholder: 'e.g. Hauptstraße 5, 10115 Berlin',
    addrMic: 'Press and say your address',
    listening: '🎤 Speaking...',
    police: 'Police',
    fire: 'Fire / Ambulance',
    phraseLabel: 'Show this phrase or press 🔊',
    aiCallLabel: '🤖 AI calls on your behalf',
    aiCallNote: 'AI introduces your name and explains the situation',
    warning: 'Only for real emergencies.',
    noAddress: 'Enter your address first',
    noName: 'Enter your name first',
    calling: 'Calling...',
    called: 'Call sent!',
    direct: 'Direct call',
    locating: 'Detecting location...',
    locationFound: '✅ Location detected',
    locationError: 'Location unavailable',
    locationRetry: 'Retry',
    manualEdit: 'You can edit the address',
    coords: 'GPS',
  },
  tr: {
    title: 'Acil Durum', subtitle: 'Tehlikede — hemen arayın',
    nameLabel: 'Tam adınız', namePlaceholder: 'örn. Mehmet Yılmaz',
    nameMic: 'Basın ve adınızı söyleyin',
    addressLabel: 'Adresiniz', addressPlaceholder: 'örn. Hauptstraße 5, Berlin',
    addrMic: 'Basın ve adresinizi söyleyin',
    listening: '🎤 Konuşun...', police: 'Polis', fire: 'İtfaiye / Ambulans',
    phraseLabel: 'Almanca cümleyi göster veya 🔊',
    aiCallLabel: '🤖 Yapay zeka sizin için arar',
    aiCallNote: 'Adınızı tanıtır ve durumu açıklar',
    warning: 'Yalnızca gerçek acil durumlar.', noAddress: 'Adres girin', noName: 'İsim girin',
    calling: 'Bağlanıyor...', called: 'Arama gönderildi!', direct: 'Doğrudan ara',
    locating: 'Konum belirleniyor...', locationFound: '✅ Konum tespit edildi',
    locationError: 'Konum alınamadı', locationRetry: 'Tekrar dene',
    manualEdit: 'Adresi düzenleyebilirsiniz', coords: 'GPS',
  },
  ru: {
    title: 'Экстренный вызов', subtitle: 'В опасности — звоните немедленно',
    nameLabel: 'Ваше полное имя', namePlaceholder: 'напр. Мухаммед Али',
    nameMic: 'Нажмите и назовите имя',
    addressLabel: 'Ваш адрес', addressPlaceholder: 'напр. Hauptstraße 5, Berlin',
    addrMic: 'Нажмите и назовите адрес',
    listening: '🎤 Говорите...', police: 'Полиция', fire: 'Пожарные / Скорая',
    phraseLabel: 'Немецкая фраза — показать или 🔊',
    aiCallLabel: '🤖 ИИ звонит за вас',
    aiCallNote: 'ИИ назовёт ваше имя и объяснит ситуацию',
    warning: 'Только для настоящих ЧС.', noAddress: 'Введите адрес', noName: 'Введите имя',
    calling: 'Соединение...', called: 'Вызов отправлен!', direct: 'Прямой вызов',
    locating: 'Определение местоположения...', locationFound: '✅ Местоположение определено',
    locationError: 'Местоположение недоступно', locationRetry: 'Повторить',
    manualEdit: 'Адрес можно изменить', coords: 'GPS',
  },
  uk: {
    title: 'Екстрений виклик', subtitle: 'У небезпеці — телефонуйте негайно',
    nameLabel: 'Ваше повне ім\'я', namePlaceholder: 'напр. Мохаммед Алі',
    nameMic: 'Натисніть і назвіть ім\'я',
    addressLabel: 'Ваша адреса', addressPlaceholder: 'напр. Hauptstraße 5, Berlin',
    addrMic: 'Натисніть і назвіть адресу',
    listening: '🎤 Говоріть...', police: 'Поліція', fire: 'Пожежні / Швидка',
    phraseLabel: 'Нім. фраза — показати або 🔊',
    aiCallLabel: '🤖 ШІ телефонує замість вас',
    aiCallNote: 'ШІ назве ваше ім\'я і пояснить ситуацію',
    warning: 'Лише для справжніх НС.', noAddress: 'Введіть адресу', noName: 'Введіть ім\'я',
    calling: "З'єднання...", called: 'Виклик надіслано!', direct: 'Прямий виклик',
    locating: 'Визначення місця...', locationFound: '✅ Місце визначено',
    locationError: 'Місце недоступне', locationRetry: 'Повторити',
    manualEdit: 'Адресу можна змінити', coords: 'GPS',
  },
  fr: {
    title: 'Urgence', subtitle: 'En danger — appelez immédiatement',
    nameLabel: 'Votre nom complet', namePlaceholder: 'ex. Mohammed Ali',
    nameMic: 'Appuyez et dites votre nom',
    addressLabel: 'Votre adresse', addressPlaceholder: 'ex. Hauptstraße 5, Berlin',
    addrMic: 'Appuyez et dites votre adresse',
    listening: '🎤 Parlez...', police: 'Police', fire: 'Pompiers / SAMU',
    phraseLabel: "Phrase allemande — afficher ou 🔊",
    aiCallLabel: "🤖 L'IA appelle à votre place",
    aiCallNote: "L'IA présente votre nom et explique la situation",
    warning: 'Uniquement pour les vraies urgences.', noAddress: 'Entrez votre adresse', noName: 'Entrez votre nom',
    calling: 'Connexion...', called: 'Appel envoyé!', direct: 'Appel direct',
    locating: 'Localisation...', locationFound: '✅ Position détectée',
    locationError: 'Position indisponible', locationRetry: 'Réessayer',
    manualEdit: "L'adresse peut être modifiée", coords: 'GPS',
  },
  fa: {
    title: 'اورژانس', subtitle: 'در خطر هستید — فوری تماس بگیرید',
    nameLabel: 'نام کامل شما', namePlaceholder: 'مثال: محمد علی',
    nameMic: 'فشار دهید و نام خود را بگویید',
    addressLabel: 'آدرس شما', addressPlaceholder: 'مثال: Hauptstraße 5, Berlin',
    addrMic: 'فشار دهید و آدرس بگویید',
    listening: '🎤 صحبت کنید...', police: 'پلیس', fire: 'آتش‌نشانی / اورژانس',
    phraseLabel: 'جمله آلمانی — نمایش یا 🔊',
    aiCallLabel: '🤖 هوش مصنوعی به جای شما زنگ می‌زند',
    aiCallNote: 'نام شما را معرفی می‌کند و وضعیت را توضیح می‌دهد',
    warning: 'فقط برای موارد اورژانسی واقعی.', noAddress: 'آدرس وارد کنید', noName: 'نام وارد کنید',
    calling: 'در حال اتصال...', called: 'تماس ارسال شد!', direct: 'تماس مستقیم',
    locating: 'تشخیص موقعیت...', locationFound: '✅ موقعیت تشخیص داده شد',
    locationError: 'موقعیت در دسترس نیست', locationRetry: 'تلاش مجدد',
    manualEdit: 'می‌توانید آدرس را ویرایش کنید', coords: 'GPS',
  },
};

function buildGermanPhrase(name, address, type) {
  const service = type === 'police' ? 'Polizei' : 'Feuerwehr und Rettungsdienst';
  const nameStr = name ? `Mein Name ist ${name}. ` : '';
  return `NOTRUF! ${nameStr}Ich spreche kein Deutsch und brauche sofort ${service}! Meine Adresse ist: ${address}. Bitte sofort kommen! Ich wiederhole: ${address}.`;
}

async function reverseGeocode(lat, lon) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1&accept-language=de`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('failed');
  const data = await res.json();
  const a = data.address || {};
  const street = a.road && a.house_number ? `${a.road} ${a.house_number}` : (a.road || '');
  const city = a.postcode
    ? `${a.postcode} ${a.city || a.town || a.village || a.county || ''}`
    : (a.city || a.town || a.village || a.county || '');
  const parts = [street, city].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : data.display_name;
}

export default function Emergency() {
  const { i18n } = useTranslation();
  const lang = T[i18n.language] ? i18n.language : 'en';
  const txt = T[lang];
  const speechLang = SPEECH_LANG[lang] || 'en-US';
  const { status: callLimitStatus, showUpgrade, setShowUpgrade, handleLimitReached } = useCallLimit();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState(null);
  const [listeningFor, setListeningFor] = useState(null); // 'name' | 'address' | null
  const [calling, setCalling] = useState(null);
  const [phraseType, setPhraseType] = useState('police');
  const [pinModal, setPinModal] = useState(null); // 'police' | 'fire' | null
  const [pinValue, setPinValue] = useState('');
  const [pinError, setPinError] = useState(false);
  const recognitionRef = useRef(null);

  const speak = useCallback((text, voiceLang) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = voiceLang || speechLang;
    utter.rate = 0.85;
    window.speechSynthesis.speak(utter);
  }, [speechLang]);

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) { setLocationStatus('error'); return; }
    setLocating(true);
    setLocationStatus(null);
    navigator.geolocation.getCurrentPosition(
      async ({ coords: c }) => {
        setCoords({ lat: c.latitude, lon: c.longitude });
        try {
          const readable = await reverseGeocode(c.latitude, c.longitude);
          setAddress(readable);
          setLocationStatus('found');
        } catch {
          setAddress(`${c.latitude.toFixed(5)}, ${c.longitude.toFixed(5)}`);
          setLocationStatus('found');
        }
        setLocating(false);
      },
      (err) => {
        console.warn('GPS:', err.message);
        setLocationStatus('error');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => { detectLocation(); }, [detectLocation]);

  const startListening = (field) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast.error('Mikrofon nicht verfügbar'); return; }
    recognitionRef.current?.stop();
    const r = new SR();
    r.lang = speechLang;
    r.continuous = false;
    r.interimResults = false;
    r.onstart = () => setListeningFor(field);
    r.onend = () => setListeningFor(null);
    r.onerror = () => { setListeningFor(null); toast.error('Mikrofon-Fehler'); };
    r.onresult = (e) => {
      const val = e.results[0][0].transcript;
      if (field === 'name') setName(val);
      else { setAddress(val); setCoords(null); setLocationStatus(null); }
    };
    r.start();
    recognitionRef.current = r;
  };

  const stopListening = () => { recognitionRef.current?.stop(); setListeningFor(null); };

  const openPinModal = (type) => {
    if (!name.trim()) { toast.error(txt.noName); return; }
    if (!address.trim()) { toast.error(txt.noAddress); return; }
    setPinValue('');
    setPinError(false);
    setPinModal(type);
  };

  const callEmergency = async (type, pin) => {
    setCalling(type);
    setPinModal(null);
    try {
      await axios.post('/api/emergency/call', {
        type, name, address, pin,
        coords: coords ? { lat: coords.lat, lon: coords.lon } : null,
      });
      toast.success(txt.called);
    } catch (err) {
      if (err.response?.status === 402) {
        handleLimitReached(err.response.data);
      } else if (err.response?.status === 403) {
        toast.error('❌ Falscher PIN');
      } else {
        toast.error('Verbindungsfehler');
      }
    } finally {
      setCalling(null);
    }
  };

  const confirmPin = () => {
    if (!pinValue.trim()) { setPinError(true); return; }
    callEmergency(pinModal, pinValue.trim());
  };

  const germanPhrase = (name.trim() || address.trim())
    ? buildGermanPhrase(name, address || '...', phraseType)
    : '';

  const MicButton = ({ field, className = '' }) => (
    <button
      onClick={listeningFor === field ? stopListening : () => startListening(field)}
      className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
        listeningFor === field
          ? 'bg-red-500 text-white animate-pulse'
          : 'bg-red-100 hover:bg-red-200 text-red-700'
      } ${className}`}
    >
      {listeningFor === field ? <MicOff size={18} /> : <Mic size={18} />}
    </button>
  );

  return (
    <>
    {showUpgrade && (
      <UpgradeModal
        onClose={() => setShowUpgrade(false)}
        used={callLimitStatus?.callsThisMonth ?? 3}
        limit={callLimitStatus?.freeCallsLimit ?? 3}
        resetDate={callLimitStatus?.callsResetDate}
      />
    )}
    <div className="fade-in max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-5">
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

      {/* Direct call buttons */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <a href="tel:110"
          className="flex flex-col items-center gap-2 bg-blue-700 hover:bg-blue-800 active:scale-95 text-white py-5 rounded-2xl shadow-lg transition-all text-center">
          <span className="text-4xl">🚔</span>
          <span className="font-bold text-xl">110</span>
          <span className="text-sm font-medium">{txt.police}</span>
          <span className="text-xs opacity-75">{txt.direct}</span>
        </a>
        <a href="tel:112"
          className="flex flex-col items-center gap-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white py-5 rounded-2xl shadow-lg transition-all text-center">
          <span className="text-4xl">🚒</span>
          <span className="font-bold text-xl">112</span>
          <span className="text-sm font-medium">{txt.fire}</span>
          <span className="text-xs opacity-75">{txt.direct}</span>
        </a>
      </div>

      {/* Name + Address form */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-red-100 mb-4 space-y-4">

        {/* Name field */}
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
            <User size={15} className="text-red-500" /> {txt.nameLabel}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={txt.namePlaceholder}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            <MicButton field="name" />
          </div>
          {listeningFor === 'name' && (
            <p className="text-xs text-red-500 text-center mt-1 animate-pulse">{txt.listening}</p>
          )}
        </div>

        {/* Address field */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <MapPin size={15} className="text-red-500" /> {txt.addressLabel}
            </label>
            {/* Location status */}
            {locating ? (
              <span className="flex items-center gap-1 text-xs text-blue-500">
                <Loader2 size={12} className="animate-spin" /> {txt.locating}
              </span>
            ) : locationStatus === 'found' ? (
              <button onClick={detectLocation} className="flex items-center gap-1 text-xs text-green-600">
                {txt.locationFound} <RefreshCw size={11} />
              </button>
            ) : locationStatus === 'error' ? (
              <button onClick={detectLocation} className="text-xs text-orange-500 underline">
                📍 {txt.locationRetry}
              </button>
            ) : (
              <button onClick={detectLocation} className="text-xs text-blue-500 underline">
                📍 GPS
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={address}
              onChange={(e) => { setAddress(e.target.value); setCoords(null); setLocationStatus(null); }}
              placeholder={txt.addressPlaceholder}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            <MicButton field="address" />
          </div>
          {listeningFor === 'address' && (
            <p className="text-xs text-red-500 text-center mt-1 animate-pulse">{txt.listening}</p>
          )}
          {coords && (
            <p className="text-xs text-gray-400 mt-1">
              📡 {txt.coords}: {coords.lat.toFixed(5)}, {coords.lon.toFixed(5)} ·{' '}
              <a href={`https://maps.google.com/?q=${coords.lat},${coords.lon}`}
                target="_blank" rel="noreferrer" className="underline">Maps</a>
            </p>
          )}
        </div>
      </div>

      {/* German phrase */}
      {germanPhrase && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4 fade-in">
          <div className="flex items-center justify-between mb-2">
            <div className="flex gap-2">
              <button onClick={() => setPhraseType('police')}
                className={`text-xs px-2 py-1 rounded-lg transition-all ${phraseType === 'police' ? 'bg-blue-700 text-white' : 'bg-gray-200 text-gray-600'}`}>
                🚔 110
              </button>
              <button onClick={() => setPhraseType('fire')}
                className={`text-xs px-2 py-1 rounded-lg transition-all ${phraseType === 'fire' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                🚒 112
              </button>
            </div>
            <button
              onClick={() => speak(germanPhrase, 'de-DE')}
              className="flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg transition-all"
            >
              <Volume2 size={13} /> 🔊
            </button>
          </div>
          <p className="text-gray-800 text-sm leading-relaxed font-medium">{germanPhrase}</p>
          <p className="text-xs text-gray-400 mt-2">{txt.phraseLabel}</p>
        </div>
      )}

      {/* AI auto-call */}
      {name.trim() && address.trim() && (
        <AuthWall>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-red-100 fade-in">
            <p className="text-sm font-semibold text-gray-700 mb-1 text-center">{txt.aiCallLabel}</p>
            <p className="text-xs text-gray-400 text-center mb-4">{txt.aiCallNote}</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => openPinModal('police')}
                disabled={!!calling}
                className="flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 disabled:bg-gray-300 text-white py-3 rounded-xl font-semibold text-sm transition-all"
              >
                {calling === 'police' ? <Loader2 size={16} className="animate-spin" /> : <PhoneCall size={16} />}
                {calling === 'police' ? txt.calling : '🚔 110'}
              </button>
              <button
                onClick={() => openPinModal('fire')}
                disabled={!!calling}
                className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white py-3 rounded-xl font-semibold text-sm transition-all"
              >
                {calling === 'fire' ? <Loader2 size={16} className="animate-spin" /> : <PhoneCall size={16} />}
                {calling === 'fire' ? txt.calling : '🚒 112'}
              </button>
            </div>
          </div>
        </AuthWall>
      )}
    </div>

    {/* ── PIN Modal ── */}
    {pinModal && (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
      }}>
        <div style={{
          background: 'white', borderRadius: '24px', padding: '32px 28px',
          width: '100%', maxWidth: '340px', textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔐</div>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1E293B', margin: '0 0 6px' }}>
            PIN eingeben
          </h2>
          <p style={{ fontSize: '13px', color: '#94A3B8', margin: '0 0 20px' }}>
            {pinModal === 'police' ? '🚔 Polizei 110' : '🚒 Feuerwehr 112'}
          </p>
          <input
            type="password"
            inputMode="numeric"
            autoFocus
            value={pinValue}
            onChange={e => { setPinValue(e.target.value); setPinError(false); }}
            onKeyDown={e => e.key === 'Enter' && confirmPin()}
            placeholder="••••"
            style={{
              width: '100%', fontSize: '24px', letterSpacing: '0.3em', textAlign: 'center',
              padding: '14px', borderRadius: '14px', border: pinError ? '2px solid #EF4444' : '2px solid #E2E8F0',
              outline: 'none', marginBottom: '8px', background: '#F8FAFC',
            }}
          />
          {pinError && (
            <p style={{ fontSize: '12px', color: '#EF4444', margin: '0 0 12px' }}>PIN darf nicht leer sein</p>
          )}
          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button onClick={() => setPinModal(null)} style={{
              flex: 1, padding: '13px', borderRadius: '12px', border: '2px solid #E2E8F0',
              background: 'white', color: '#64748B', fontWeight: '700', fontSize: '14px', cursor: 'pointer',
            }}>Abbrechen</button>
            <button onClick={confirmPin} style={{
              flex: 1, padding: '13px', borderRadius: '12px', border: 'none',
              background: pinModal === 'police' ? '#1D4ED8' : '#DC2626',
              color: 'white', fontWeight: '700', fontSize: '14px', cursor: 'pointer',
            }}>
              {pinModal === 'police' ? '🚔 Anrufen' : '🚒 Anrufen'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
