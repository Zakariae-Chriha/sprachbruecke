const express = require('express');
const router = express.Router();
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

const activeCalls = {};

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
router.post('/start', async (req, res) => {
  try {
    const { phoneNumber, userName, caseNumber, purpose, userLanguage, organizationName } = req.body;

    if (!phoneNumber) return res.status(400).json({ message: 'Telefonnummer erforderlich' });
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      return res.status(503).json({ message: 'Twilio nicht konfiguriert.' });
    }

    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const ngrokUrl = process.env.NGROK_URL;

    if (!ngrokUrl) {
      return res.status(503).json({ message: 'NGROK_URL nicht konfiguriert.' });
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

    res.json({ success: true, callSid: call.sid, status: 'calling' });
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

    const ngrokUrl = process.env.NGROK_URL;

    // Speak the greeting
    twiml.say({ voice: 'Polly.Vicki', language: 'de-DE' }, intro);

    // Wait for response
    const gather = twiml.gather({
      input: 'speech',
      language: 'de-DE',
      action: `${ngrokUrl}/api/autocall/webhook/respond?sid=${callSid}`,
      method: 'POST',
      timeout: 12,
      speechTimeout: 'auto',
    });
    gather.say({ voice: 'Polly.Vicki', language: 'de-DE' }, 'Ich höre.');

    // No response fallback
    twiml.say({ voice: 'Polly.Vicki', language: 'de-DE' },
      'Ich habe leider keine Antwort erhalten. Auf Wiederhören.');
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
    const systemPrompt = `Du bist ein KI-Telefonassistent. Du führst ein Telefonat auf DEUTSCH.

Du rufst an für: ${userName}
Zweck: ${purpose}
Aktenzeichen: ${caseNumber || 'nicht angegeben'}
Bei: ${organizationName}

REGELN:
- Sprich IMMER nur auf DEUTSCH
- Sei sehr höflich und professionell
- Sprich kurze, klare Sätze (max 2 Sätze pro Antwort)
- Falls ein Termin angeboten wird: bestätige Datum und Uhrzeit laut
- Falls du fertig bist oder verabschiedet wirst: sage genau "ANRUF_BEENDEN"
- Bleib beim Thema`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(callData?.history || []).slice(-8),
      { role: 'user', content: `Die Person am Telefon hat gesagt: "${speechResult}". Antworte kurz und höflich auf Deutsch.` }
    ];

    const response = await openai.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      max_tokens: 100,
      temperature: 0.3,
    });

    const aiResponse = response.choices[0].message.content.trim();
    const shouldHangup = aiResponse.includes('ANRUF_BEENDEN') ||
      aiResponse.toLowerCase().includes('auf wiederhören') ||
      aiResponse.toLowerCase().includes('tschüss');

    const cleanResponse = aiResponse.replace('ANRUF_BEENDEN', '').trim();
    console.log(`🤖 KI antwortet: "${cleanResponse}"`);

    if (callData) {
      callData.history.push({ role: 'assistant', content: cleanResponse });
    }

    twiml.say({ voice: 'Polly.Vicki', language: 'de-DE' }, cleanResponse);

    if (shouldHangup) {
      twiml.say({ voice: 'Polly.Vicki', language: 'de-DE' },
        'Vielen Dank für Ihre Hilfe. Auf Wiederhören!');
      twiml.hangup();
      if (callData) setTimeout(() => generateSummary(callSid), 2000);
    } else {
      const ngrokUrl = process.env.NGROK_URL;
      const gather = twiml.gather({
        input: 'speech',
        language: 'de-DE',
        action: `${ngrokUrl}/api/autocall/webhook/respond?sid=${callSid}`,
        method: 'POST',
        timeout: 12,
        speechTimeout: 'auto',
      });
      gather.say({ voice: 'Polly.Vicki', language: 'de-DE' }, 'Ja bitte?');

      twiml.say({ voice: 'Polly.Vicki', language: 'de-DE' },
        'Vielen Dank. Auf Wiederhören.');
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
    const lang = callData.userLanguage || 'Arabisch';
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
