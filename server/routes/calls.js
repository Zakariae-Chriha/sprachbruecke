const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const requireAuth = require('../middleware/auth');
const CallLog = require('../models/CallLog');

const openai = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

// POST /api/calls/prepare-script - Telefonskript vorbereiten
router.post('/prepare-script', async (req, res) => {
  try {
    const { situation, targetOrganization, userLanguage = 'Arabisch', userInfo } = req.body;

    const prompt = `Du bist SprachBrücke. Erstelle ein detailliertes Telefonskript für folgenden Anruf:

Situation: ${situation}
Ziel-Organisation: ${targetOrganization || 'Behörde'}
Nutzer-Informationen: ${userInfo || 'nicht angegeben'}

Das Skript soll enthalten:
1. **Wie man den Anruf beginnt** (Begrüßung auf Deutsch)
2. **Was man sagt** (Schritt für Schritt auf Deutsch)
3. **Mögliche Fragen der Behörde** + Antworten auf Deutsch
4. **Wichtige Wörter/Phrasen** die man kennen muss
5. **Wie man den Anruf beendet**

FORMAT DER AUSGABE:
- Zuerst vollständiges Skript auf DEUTSCH (zum Vorlesen)
- Danach ERKLÄRUNG jedes Schritts auf ${userLanguage}
- Dann GLOSSAR: wichtige deutsche Begriffe mit Übersetzung auf ${userLanguage}

Sei praktisch und hilfreich. Die Person soll das Skript direkt vorlesen können.`;

    const response = await openai.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
    });

    res.json({
      script: response.choices[0].message.content,
      targetOrganization,
      situation,
    });
  } catch (err) {
    console.error('Anruf-Fehler:', err.message);
    res.status(500).json({ message: 'Fehler beim Erstellen des Skripts', error: err.message });
  }
});

// POST /api/calls/find-number - Telefonnummer einer Behörde finden
router.post('/find-number', async (req, res) => {
  try {
    const { organization, city, userLanguage = 'Arabisch' } = req.body;

    const prompt = `Finde die Telefonnummer und Kontaktinformationen für folgende Institution:

Institution: ${organization}
Stadt: ${city || 'Deutschland (allgemein)'}

Gib folgende Informationen auf ${userLanguage}:
1. Offizielle Telefonnummer(n)
2. Öffnungszeiten
3. Website
4. Adresse (falls bekannt)
5. Tipps für den Anruf

WICHTIG: Gib nur bekannte, verlässliche Informationen. Falls du dir nicht sicher bist, sage es.`;

    const response = await openai.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800,
    });

    res.json({ contactInfo: response.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ message: 'Fehler', error: err.message });
  }
});

// POST /api/calls/twilio-call - Automatischen Anruf starten (optional)
router.post('/twilio-call', async (req, res) => {
  try {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      return res.status(503).json({ message: 'Twilio nicht konfiguriert' });
    }

    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    const { toNumber, message } = req.body;

    const call = await client.calls.create({
      twiml: `<Response><Say language="de-DE">${message}</Say></Response>`,
      to: toNumber,
      from: process.env.TWILIO_PHONE_NUMBER,
    });

    res.json({ success: true, callSid: call.sid });
  } catch (err) {
    res.status(500).json({ message: 'Anruffehler', error: err.message });
  }
});

// GET /api/calls/history — current user's call history
router.get('/history', requireAuth, async (req, res) => {
  try {
    const logs = await CallLog.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Serverfehler', error: err.message });
  }
});

module.exports = router;
