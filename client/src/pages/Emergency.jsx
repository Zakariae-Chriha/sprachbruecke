import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Mic, MicOff, Volume2, PhoneCall, MapPin, Loader2, RefreshCw } from 'lucide-react';
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
    addressLabel: 'عنوانك',
    addressPlaceholder: 'مثال: Hauptstraße 5, Berlin',
    micHint: 'اضغط وقل عنوانك',
    listening: '🎤 قل عنوانك الآن...',
    police: 'شرطة',
    fire: 'إطفاء / إسعاف',
    phraseLabel: 'الجملة الألمانية — اعرضها للشرطة أو اضغط 🔊',
    aiCallLabel: '🤖 مساعد ذكي يتصل بدلاً عنك',
    aiCallNote: 'الذكاء الاصطناعي سيتحدث الألمانية',
    warning: 'هذه الخدمة لحالات الطوارئ الحقيقية فقط.',
    noAddress: 'أدخل عنوانك أولاً',
    calling: 'جارٍ الاتصال...',
    called: 'تم إرسال الاتصال!',
    direct: 'اتصال مباشر',
    locating: '📍 جارٍ تحديد موقعك...',
    locationFound: '✅ تم تحديد موقعك تلقائياً',
    locationError: 'تعذّر تحديد الموقع — أدخله يدوياً',
    locationBtn: '📍 تحديد موقعي تلقائياً',
    locationRetry: 'إعادة المحاولة',
    coords: 'الإحداثيات',
    manualEdit: 'يمكنك تعديل العنوان',
  },
  de: {
    title: 'Notruf',
    subtitle: 'Bei Gefahr — sofort anrufen',
    addressLabel: 'Ihre Adresse',
    addressPlaceholder: 'z.B. Hauptstraße 5, Berlin',
    micHint: 'Drücken und Adresse sprechen',
    listening: '🎤 Adresse sprechen...',
    police: 'Polizei',
    fire: 'Feuerwehr / Rettung',
    phraseLabel: 'Deutschen Satz zeigen oder 🔊 vorlesen',
    aiCallLabel: '🤖 KI ruft für Sie an',
    aiCallNote: 'KI spricht Deutsch für Sie',
    warning: 'Nur für echte Notfälle nutzen.',
    noAddress: 'Bitte zuerst Adresse eingeben',
    calling: 'Wird verbunden...',
    called: 'Anruf gesendet!',
    direct: 'Direkt anrufen',
    locating: '📍 Standort wird ermittelt...',
    locationFound: '✅ Standort automatisch erkannt',
    locationError: 'Standort nicht verfügbar — bitte manuell eingeben',
    locationBtn: '📍 Standort automatisch erkennen',
    locationRetry: 'Erneut versuchen',
    coords: 'Koordinaten',
    manualEdit: 'Adresse kann bearbeitet werden',
  },
  en: {
    title: 'Emergency',
    subtitle: 'In danger — call immediately',
    addressLabel: 'Your address',
    addressPlaceholder: 'e.g. Hauptstraße 5, Berlin',
    micHint: 'Press and speak your address',
    listening: '🎤 Say your address...',
    police: 'Police',
    fire: 'Fire / Ambulance',
    phraseLabel: 'Show German phrase or press 🔊',
    aiCallLabel: '🤖 AI calls on your behalf',
    aiCallNote: 'AI will speak German for you',
    warning: 'Only for real emergencies.',
    noAddress: 'Enter your address first',
    calling: 'Calling...',
    called: 'Call sent!',
    direct: 'Direct call',
    locating: '📍 Detecting your location...',
    locationFound: '✅ Location detected automatically',
    locationError: 'Location unavailable — please enter manually',
    locationBtn: '📍 Detect my location',
    locationRetry: 'Retry',
    coords: 'Coordinates',
    manualEdit: 'You can edit the address',
  },
  tr: {
    title: 'Acil Durum',
    subtitle: 'Tehlikede — hemen arayın',
    addressLabel: 'Adresiniz',
    addressPlaceholder: 'örn. Hauptstraße 5, Berlin',
    micHint: 'Basın ve adresinizi söyleyin',
    listening: '🎤 Adresinizi söyleyin...',
    police: 'Polis',
    fire: 'İtfaiye / Ambulans',
    phraseLabel: 'Almanca cümleyi göster veya 🔊',
    aiCallLabel: '🤖 Yapay zeka sizin için arar',
    aiCallNote: 'Yapay zeka Almanca konuşur',
    warning: 'Yalnızca gerçek acil durumlar için.',
    noAddress: 'Önce adresinizi girin',
    calling: 'Bağlanıyor...',
    called: 'Arama gönderildi!',
    direct: 'Doğrudan ara',
    locating: '📍 Konumunuz belirleniyor...',
    locationFound: '✅ Konum otomatik tespit edildi',
    locationError: 'Konum alınamadı — lütfen manuel girin',
    locationBtn: '📍 Konumumu otomatik al',
    locationRetry: 'Tekrar dene',
    coords: 'Koordinatlar',
    manualEdit: 'Adresi düzenleyebilirsiniz',
  },
  ru: {
    title: 'Экстренный вызов',
    subtitle: 'В опасности — звоните немедленно',
    addressLabel: 'Ваш адрес',
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
    locating: '📍 Определение местоположения...',
    locationFound: '✅ Местоположение определено автоматически',
    locationError: 'Местоположение недоступно — введите вручную',
    locationBtn: '📍 Определить моё местоположение',
    locationRetry: 'Повторить',
    coords: 'Координаты',
    manualEdit: 'Адрес можно изменить',
  },
  uk: {
    title: 'Екстрений виклик',
    subtitle: 'У небезпеці — телефонуйте негайно',
    addressLabel: 'Ваша адреса',
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
    locating: '📍 Визначення місцезнаходження...',
    locationFound: '✅ Місцезнаходження визначено автоматично',
    locationError: 'Місцезнаходження недоступне — введіть вручну',
    locationBtn: '📍 Визначити моє місцезнаходження',
    locationRetry: 'Повторити',
    coords: 'Координати',
    manualEdit: 'Адресу можна змінити',
  },
  fr: {
    title: 'Urgence',
    subtitle: 'En danger — appelez immédiatement',
    addressLabel: 'Votre adresse',
    addressPlaceholder: 'ex. Hauptstraße 5, Berlin',
    micHint: 'Appuyez et dites votre adresse',
    listening: '🎤 Dites votre adresse...',
    police: 'Police',
    fire: 'Pompiers / SAMU',
    phraseLabel: "Phrase allemande — afficher ou 🔊",
    aiCallLabel: "🤖 L'IA appelle à votre place",
    aiCallNote: "L'IA parle allemand pour vous",
    warning: 'Uniquement pour les vraies urgences.',
    noAddress: "Entrez d'abord votre adresse",
    calling: 'Connexion...',
    called: 'Appel envoyé!',
    direct: 'Appel direct',
    locating: '📍 Localisation en cours...',
    locationFound: '✅ Position détectée automatiquement',
    locationError: 'Position indisponible — saisir manuellement',
    locationBtn: '📍 Détecter ma position',
    locationRetry: 'Réessayer',
    coords: 'Coordonnées',
    manualEdit: "L'adresse peut être modifiée",
  },
  fa: {
    title: 'اورژانس',
    subtitle: 'در خطر هستید — فوری تماس بگیرید',
    addressLabel: 'آدرس شما',
    addressPlaceholder: 'مثال: Hauptstraße 5, Berlin',
    micHint: 'فشار دهید و آدرس بگویید',
    listening: '🎤 آدرس خود را بگویید...',
    police: 'پلیس',
    fire: 'آتش‌نشانی / اورژانس',
    phraseLabel: 'جمله آلمانی — نمایش یا 🔊',
    aiCallLabel: '🤖 هوش مصنوعی به جای شما زنگ می‌زند',
    aiCallNote: 'هوش مصنوعی آلمانی صحبت می‌کند',
    warning: 'فقط برای موارد اورژانسی واقعی.',
    noAddress: 'ابتدا آدرس خود را وارد کنید',
    calling: 'در حال اتصال...',
    called: 'تماس ارسال شد!',
    direct: 'تماس مستقیم',
    locating: '📍 در حال تشخیص موقعیت...',
    locationFound: '✅ موقعیت به صورت خودکار تشخیص داده شد',
    locationError: 'موقعیت در دسترس نیست — لطفاً دستی وارد کنید',
    locationBtn: '📍 موقعیت من را تشخیص بده',
    locationRetry: 'تلاش مجدد',
    coords: 'مختصات',
    manualEdit: 'می‌توانید آدرس را ویرایش کنید',
  },
};

function buildGermanPhrase(address, coords) {
  const coordStr = coords ? ` (GPS: ${coords.lat.toFixed(5)}, ${coords.lon.toFixed(5)})` : '';
  return `NOTRUF! Ich spreche kein Deutsch. Ich brauche sofort Hilfe! Die Adresse ist: ${address}${coordStr}. Bitte kommen Sie sofort! Ich wiederhole: ${address}.`;
}

// Reverse geocoding via OpenStreetMap Nominatim — free, no API key
async function reverseGeocode(lat, lon) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'de' } });
  if (!res.ok) throw new Error('Geocoding fehlgeschlagen');
  const data = await res.json();

  // Build a human-readable German address
  const a = data.address || {};
  const parts = [
    a.road && a.house_number ? `${a.road} ${a.house_number}` : a.road,
    a.postcode && (a.city || a.town || a.village)
      ? `${a.postcode} ${a.city || a.town || a.village}`
      : a.city || a.town || a.village || a.county,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(', ') : data.display_name;
}

export default function Emergency() {
  const { i18n } = useTranslation();
  const lang = T[i18n.language] ? i18n.language : 'en';
  const txt = T[lang];
  const speechLang = SPEECH_LANG[lang] || 'en-US';

  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState(null); // 'found' | 'error' | null
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

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      return;
    }
    setLocating(true);
    setLocationStatus(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        setCoords({ lat, lon });
        try {
          const readable = await reverseGeocode(lat, lon);
          setAddress(readable);
          setLocationStatus('found');
        } catch {
          // Fallback: show raw coordinates if geocoding fails
          setAddress(`${lat.toFixed(5)}, ${lon.toFixed(5)}`);
          setLocationStatus('found');
        }
        setLocating(false);
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        setLocationStatus('error');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  // Auto-detect on mount
  useEffect(() => {
    detectLocation();
  }, [detectLocation]);

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
    r.onresult = (e) => {
      setAddress(e.results[0][0].transcript);
      setLocationStatus(null);
      setCoords(null);
    };
    r.start();
    recognitionRef.current = r;
  };

  const stopListening = () => { recognitionRef.current?.stop(); setListening(false); };

  const callEmergency = async (type) => {
    if (!address.trim()) { toast.error(txt.noAddress); return; }
    setCalling(type);
    try {
      await axios.post('/api/emergency/call', {
        type,
        address,
        coords: coords ? { lat: coords.lat, lon: coords.lon } : null,
      });
      toast.success(txt.called);
    } catch {
      toast.error('Verbindungsfehler');
    } finally {
      setCalling(null);
    }
  };

  const germanPhrase = address.trim() ? buildGermanPhrase(address, coords) : '';

  return (
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

      {/* Direct call buttons — primary action */}
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

      {/* Location + Address */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-red-100 mb-4">
        {/* Location status bar */}
        <div className="flex items-center gap-2 mb-3">
          {locating ? (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <Loader2 size={16} className="animate-spin" />
              <span>{txt.locating}</span>
            </div>
          ) : locationStatus === 'found' ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                <MapPin size={16} />
                <span>{txt.locationFound}</span>
              </div>
              <button
                onClick={detectLocation}
                className="p-1 text-gray-400 hover:text-blue-600 transition-all"
                title={txt.locationRetry}
              >
                <RefreshCw size={14} />
              </button>
            </div>
          ) : locationStatus === 'error' ? (
            <div className="flex items-center justify-between w-full">
              <span className="text-sm text-orange-600">{txt.locationError}</span>
              <button
                onClick={detectLocation}
                className="text-xs text-blue-600 underline"
              >
                {txt.locationRetry}
              </button>
            </div>
          ) : (
            <button
              onClick={detectLocation}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              <MapPin size={16} />
              {txt.locationBtn}
            </button>
          )}
        </div>

        <label className="block text-sm font-semibold text-gray-700 mb-2">{txt.addressLabel}</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={address}
            onChange={(e) => { setAddress(e.target.value); setLocationStatus(null); setCoords(null); }}
            placeholder={txt.addressPlaceholder}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
          />
          <button
            onClick={listening ? stopListening : listenForAddress}
            className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
              listening ? 'bg-red-500 text-white animate-pulse' : 'bg-red-100 hover:bg-red-200 text-red-700'
            }`}
            title={txt.micHint}
          >
            {listening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
        </div>

        {listening && (
          <p className="text-sm text-red-500 text-center mt-2 animate-pulse">{txt.listening}</p>
        )}

        {/* Show GPS coordinates as extra precision info */}
        {coords && (
          <p className="text-xs text-gray-400 mt-2">
            📡 {txt.coords}: {coords.lat.toFixed(5)}, {coords.lon.toFixed(5)}
            {' · '}
            <a
              href={`https://maps.google.com/?q=${coords.lat},${coords.lon}`}
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-blue-600"
            >
              Google Maps
            </a>
          </p>
        )}

        {locationStatus === 'found' && (
          <p className="text-xs text-gray-400 mt-1">✏️ {txt.manualEdit}</p>
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

      {/* AI auto-call */}
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
              {calling === 'police'
                ? <Loader2 size={16} className="animate-spin" />
                : <PhoneCall size={16} />}
              {calling === 'police' ? txt.calling : '🚔 110'}
            </button>
            <button
              onClick={() => callEmergency('fire')}
              disabled={!!calling}
              className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white py-3 rounded-xl font-semibold text-sm transition-all"
            >
              {calling === 'fire'
                ? <Loader2 size={16} className="animate-spin" />
                : <PhoneCall size={16} />}
              {calling === 'fire' ? txt.calling : '🚒 112'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
