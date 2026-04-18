const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const requireApproved = require('../middleware/requireApproved');
const checkCallLimit = require('../middleware/checkCallLimit');
const CallLog = require('../models/CallLog');

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

const activeCalls = {};

// ============================
// SSML helper — slow speech + phone number repetition
// Twilio Polly: wrap entire message in <speak>, use <prosody rate="slow">
// ============================
function toSSML(text) {
  // Escape XML special characters first
  const safe = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Detect phone numbers: sequences with 6+ digits (spaces/dashes allowed)
  const phoneRegex = /(\+?[\d][\d\s\-]{4,}[\d])/g;
  const withPhones = safe.replace(phoneRegex, (match) => {
    const digitCount = (match.match(/\d/g) || []).length;
    if (digitCount < 5) return match;
    const n = match.trim();
    return (
      `<break time="300ms"/>` +
      `<say-as interpret-as="telephone">${n}</say-as>` +
      `<break time="500ms"/>` +
      `Ich wiederhole: ` +
      `<say-as interpret-as="telephone">${n}</say-as>` +
      `<break time="300ms"/>`
    );
  });

  // Wrap everything in slow prosody
  return `<speak><prosody rate="85%">${withPhones}</prosody></speak>`;
}

// Extract phone numbers from text for logging
function extractPhones(text) {
  return (text.match(/(\+?[\d][\d\s\-]{4,}[\d])/g) || [])
    .filter(m => (m.match(/\d/g) || []).length >= 5);
}

// ============================
// TEST: GET /api/autocall/test-twiml
// Simple TwiML to verify pipeline
// ============================
router.get('/test-twiml', (req, res) => {
  res.type('text/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Vicki" language="de-DE">Hallo! Das ist ein Test. Die Verbindung funktioniert.</Say>
  <Hangup/>
</Response>`);
});

// ============================
// POST /api/autocall/start
// ============================
router.post('/start', requireApproved, checkCallLimit, async (req, res) => {
  try {
    const { phoneNumber, userName, caseNumber, purpose, userLanguage, organizationName } = req.body;

    if (!phoneNumber) return res.status(400).json({ message: 'Telefonnummer erforderlich' });
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      return res.status(503).json({ message: 'Twilio nicht konfiguriert.' });
    }

    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const ngrokUrl = process.env.SERVER_URL || process.env.NGROK_URL;

    if (!ngrokUrl) {
      return res.status(503).json({ message: 'SERVER_URL nicht konfiguriert.' });
    }

    // Generate a temporary ID before we have callSid
    const tempId = `temp_${Date.now()}`;

    const callContext = {
      userName: userName || 'der Anrufer',
      caseNumber: caseNumber || '',
      purpose: purpose || 'Terminvereinbarung',
      userLanguage: userLanguage || 'Arabisch',
      organizationName: organizationName || 'die Behörde',
      history: [],
      status: 'calling',
      summary: null,
      startTime: new Date().toISOString(),
    };

    // Store temporarily - will be re-keyed by real callSid once Twilio responds
    activeCalls[tempId] = callContext;

    const call = await client.calls.create({
      to: phoneNumber,
      from: process.env.TWILIO_PHONE_NUMBER,
      url: `${ngrokUrl}/api/autocall/webhook/voice`,
      statusCallback: `${ngrokUrl}/api/autocall/webhook/status`,
      statusCallbackMethod: 'POST',
      statusCallbackEvent: ['completed', 'failed', 'no-answer', 'busy'],
    });

    // Re-key by real callSid
    delete activeCalls[tempId];
    callContext.callSid = call.sid;
    activeCalls[call.sid] = callContext;

    console.log(`📞 Anruf gestartet: ${call.sid} → ${phoneNumber}`);
    console.log(`📋 Kontext: ${JSON.stringify({ userName: callContext.userName, purpose: callContext.purpose, organizationName: callContext.organizationName })}`);

    // Increment monthly call counter for non-admins
    if (req.callUser && req.callUser.role !== 'admin') {
      await req.callUser.updateOne({ $inc: { callsThisMonth: 1 } });
    }

    // Log call to database
    CallLog.create({
      userId:       req.userId,
      userName:     callContext.userName,
      userEmail:    req.callUser?.email,
      type:         'autocall',
      purpose:      callContext.purpose,
      targetNumber: phoneNumber.replace(/\d(?=\d{4})/g, '*'), // mask number
      status:       'initiated',
      callSid:      call.sid,
    }).catch(() => {});

    const callUser = req.callUser;
    res.json({
      success: true,
      callSid: call.sid,
      status: 'calling',
      callsUsed: (callUser?.callsThisMonth ?? 0) + 1,
      callsLimit: callUser?.freeCallsLimit ?? 3,
      isPremium: callUser?.subscriptionStatus === 'active',
    });
  } catch (err) {
    console.error('AutoCall Fehler:', err.message);
    res.status(500).json({ message: 'Anruffehler', error: err.message });
  }
});

// ============================
// POST /api/autocall/webhook/voice
// Twilio calls this when call connects — AI speaks German
// ============================
router.post('/webhook/voice', async (req, res) => {
  console.log('📞 Voice webhook aufgerufen');
  console.log('Body:', JSON.stringify(req.body));

  const { VoiceResponse } = require('twilio').twiml;
  const twiml = new VoiceResponse();

  try {
    const callSid = req.body.CallSid;
    console.log(`📞 CallSid: ${callSid}`);

    const callData = activeCalls[callSid];
    console.log(`📋 Call Data gefunden: ${!!callData}`);
    console.log(`📋 Alle aktiven Calls: ${JSON.stringify(Object.keys(activeCalls))}`);

    const userName = callData?.userName || 'der Anrufer';
    const caseNumber = callData?.caseNumber || '';
    const purpose = callData?.purpose || 'Terminvereinbarung';
    const organizationName = callData?.organizationName || 'die Behörde';
    const userLanguage = callData?.userLanguage || 'Arabisch';

    const purposeMap = {
      'Terminvereinbarung': 'einen Termin zu vereinbaren',
      'Statusabfrage': 'nach dem Status meines Antrags zu fragen',
      'Information': 'eine Information zu erhalten',
      'Beschwerde': 'eine Angelegenheit zu klären',
    };
    const purposeText = purposeMap[purpose] || purpose;
    const caseRef = caseNumber ? `, mein Aktenzeichen ist ${caseNumber}` : '';

    const intro = `Guten Tag! Mein Name ist ${userName}${caseRef}. Ich rufe an, um ${purposeText}. Können Sie mir bitte helfen?`;

    console.log(`🗣️ Intro: "${intro}"`);

    if (callData) {
      callData.history.push({ role: 'assistant', content: intro });
      callData.status = 'in-progress';
    }

    const ngrokUrl = process.env.SERVER_URL || process.env.NGROK_URL;

    // Speak the greeting slowly
    twiml.say({ voice: 'Polly.Vicki', language: 'de-DE' }, toSSML(intro));

    // Wait for response
    const gather = twiml.gather({
      input: 'speech',
      language: 'de-DE',
      action: `${ngrokUrl}/api/autocall/webhook/respond?sid=${callSid}`,
      method: 'POST',
      timeout: 15,
      speechTimeout: 'auto',
    });
    gather.say({ voice: 'Polly.Vicki', language: 'de-DE' },
      '<speak><prosody rate="slow">Ich höre zu, bitte sprechen Sie.</prosody></speak>');

    // No response fallback
    twiml.say({ voice: 'Polly.Vicki', language: 'de-DE' },
      '<speak><prosody rate="slow">Ich habe leider keine Antwort erhalten. Auf Wiederhören.</prosody></speak>');
    twiml.hangup();

  } catch (err) {
    console.error('Voice webhook Fehler:', err);
    twiml.say({ voice: 'Polly.Vicki', language: 'de-DE' },
      'Entschuldigung, technischer Fehler. Auf Wiederhören.');
    twiml.hangup();
  }

  const twimlStr = twiml.toString();
  console.log(`📤 TwiML Response: ${twimlStr}`);

  res.type('text/xml');
  res.send(twimlStr);
});

// ============================
// POST /api/autocall/webhook/respond
// AI processes speech and responds in German
// ============================
router.post('/webhook/respond', async (req, res) => {
  console.log('📞 Respond webhook aufgerufen');
  console.log('Query:', JSON.stringify(req.query));
  console.log('Body keys:', Object.keys(req.body));

  const { VoiceResponse } = require('twilio').twiml;
  const twiml = new VoiceResponse();

  try {
    const callSid = req.query.sid;
    const speechResult = req.body.SpeechResult || '';
    const callData = activeCalls[callSid];

    console.log(`📞 CallSid: ${callSid}`);
    console.log(`🗣️ Behörde sagt: "${speechResult}"`);

    const userName = callData?.userName || 'der Anrufer';
    const caseNumber = callData?.caseNumber || '';
    const purpose = callData?.purpose || 'Terminvereinbarung';
    const organizationName = callData?.organizationName || 'die Behörde';

    if (callData) {
      callData.history.push({ role: 'user', content: speechResult });
    }

    // AI generates German response
    const systemPrompt = `Du bist ein KI-Telefonassistent. Du führst ein Telefonat auf DEUTSCH für eine Person, die kein Deutsch spricht.

Du rufst an für: ${userName}
Zweck: ${purpose}
Aktenzeichen: ${caseNumber || 'nicht angegeben'}
Bei: ${organizationName}

PFLICHTREGELN — halte dich IMMER daran:
1. Sprich NUR auf DEUTSCH, langsam und deutlich.
2. Maximal 3 kurze Sätze pro Antwort.
3. TELEFONNUMMERN: Wenn die Person eine Telefonnummer nennt, wiederhole sie sofort zweimal langsam Ziffer für Ziffer und frage: "Habe ich die Nummer richtig: [Nummer]? Ist das korrekt?"
4. TERMINE & DATUM: Wenn Datum oder Uhrzeit genannt wird, bestätige sofort: "Ich notiere: [Wochentag], den [Datum] um [Uhrzeit] Uhr. Ist das korrekt?"
5. AKTENZEICHEN / WICHTIGE NUMMERN: Immer zweimal wiederholen und bestätigen.
6. Falls die Person fragt ob du verstanden hast: Wiederhole die wichtigsten Infos kurz.
7. Falls du fertig bist oder verabschiedet wirst: Sage genau "ANRUF_BEENDEN".
8. Bleib beim Thema: ${purpose}.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(callData?.history || []).slice(-10),
      { role: 'user', content: `Die Person am Telefon hat gesagt: "${speechResult}". Antworte kurz und höflich auf Deutsch. Wenn eine Telefonnummer, ein Datum oder eine wichtige Nummer genannt wurde, wiederhole sie sofort zur Bestätigung.` }
    ];

    const response = await openai.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      max_tokens: 150,
      temperature: 0.2,
    });

    const aiResponse = response.choices[0].message.content.trim();
    const shouldHangup = aiResponse.includes('ANRUF_BEENDEN') ||
      aiResponse.toLowerCase().includes('auf wiederhören') ||
      aiResponse.toLowerCase().includes('tschüss');

    const cleanResponse = aiResponse.replace('ANRUF_BEENDEN', '').trim();

    // Log detected phone numbers
    const phones = extractPhones(cleanResponse);
    if (phones.length > 0) console.log(`📱 Telefonnummern erkannt: ${phones.join(', ')}`);
    console.log(`🤖 KI antwortet: "${cleanResponse}"`);

    if (callData) {
      callData.history.push({ role: 'assistant', content: cleanResponse });
    }

    // Use SSML for slow speech + automatic phone number repetition
    twiml.say({ voice: 'Polly.Vicki', language: 'de-DE' }, toSSML(cleanResponse));

    if (shouldHangup) {
      twiml.say({ voice: 'Polly.Vicki', language: 'de-DE' },
        '<speak><prosody rate="slow">Vielen Dank für Ihre Hilfe. Auf Wiederhören!</prosody></speak>');
      twiml.hangup();
      if (callData) setTimeout(() => generateSummary(callSid), 2000);
    } else {
      const ngrokUrl = process.env.SERVER_URL || process.env.NGROK_URL;
      const gather = twiml.gather({
        input: 'speech',
        language: 'de-DE',
        action: `${ngrokUrl}/api/autocall/webhook/respond?sid=${callSid}`,
        method: 'POST',
        timeout: 15,
        speechTimeout: 'auto',
      });
      gather.say({ voice: 'Polly.Vicki', language: 'de-DE' },
        '<speak><prosody rate="slow">Bitte sprechen Sie.</prosody></speak>');

      twiml.say({ voice: 'Polly.Vicki', language: 'de-DE' },
        '<speak><prosody rate="slow">Vielen Dank. Auf Wiederhören.</prosody></speak>');
      twiml.hangup();
      if (callData) setTimeout(() => generateSummary(callSid), 2000);
    }

  } catch (err) {
    console.error('Respond webhook Fehler:', err);
    twiml.say({ voice: 'Polly.Vicki', language: 'de-DE' },
      'Entschuldigung. Auf Wiederhören.');
    twiml.hangup();
  }

  const twimlStr = twiml.toString();
  console.log(`📤 TwiML Response: ${twimlStr}`);

  res.type('text/xml');
  res.send(twimlStr);
});

// ============================
// POST /api/autocall/webhook/status
// ============================
router.post('/webhook/status', async (req, res) => {
  const { CallSid, CallStatus } = req.body;
  console.log(`📞 Anruf Status: ${CallStatus} (${CallSid})`);
  if (activeCalls[CallSid]) {
    activeCalls[CallSid].status = CallStatus;
    if (['completed', 'failed', 'no-answer', 'busy'].includes(CallStatus)) {
      if (!activeCalls[CallSid].summary) {
        await generateSummary(CallSid);
      }
      // Update log status + summary
      CallLog.findOneAndUpdate(
        { callSid: CallSid },
        { status: CallStatus, summary: activeCalls[CallSid]?.summary || '' },
      ).catch(() => {});
    }
  }
  res.sendStatus(200);
});

// ============================
// GET /api/autocall/status/:callSid
// ============================
router.get('/status/:callSid', (req, res) => {
  const callData = activeCalls[req.params.callSid];
  if (!callData) return res.status(404).json({ message: 'Anruf nicht gefunden' });
  res.json(callData);
});

// ============================
// Generate summary
// ============================
async function generateSummary(callSid) {
  const callData = activeCalls[callSid];
  if (!callData || callData.summary) return;

  try {
    const lang = callData.userLanguage || 'Arabic';
    const conversation = callData.history
      .map(m => `${m.role === 'assistant' ? 'KI-Assistent (Deutsch)' : 'Behörde'}: ${m.content}`)
      .join('\n');

    if (!conversation.trim()) {
      callData.summary = lang === 'Arabisch'
        ? 'لم يتم تسجيل أي محادثة. ربما لم يُرد أحد على الهاتف.'
        : 'Kein Gespräch aufgezeichnet. Möglicherweise wurde nicht abgenommen.';
      return;
    }

    const response = await openai.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{
        role: 'user',
        content: `Hier ist ein Telefonanruf-Transkript:

${conversation}

Erstelle eine klare Zusammenfassung auf ${lang}:
1. Was wurde vereinbart? (Termin, Datum, Uhrzeit falls vorhanden)
2. Was wurde besprochen?
3. Nächste Schritte
4. War der Anruf erfolgreich?

Antworte vollständig auf ${lang}.`,
      }],
      max_tokens: 500,
    });

    callData.summary = response.choices[0].message.content;
    callData.status = 'completed';
    console.log('✅ Zusammenfassung erstellt');
  } catch (err) {
    callData.summary = 'Zusammenfassung konnte nicht erstellt werden.';
    console.error('Summary Fehler:', err.message);
  }
}

module.exports = router;
