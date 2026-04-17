const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const auth = require('../middleware/auth');
const ChatHistory = require('../models/ChatHistory');

// Groq - kostenlose AI API (console.groq.com)
const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

const SYSTEM_PROMPT = `Du bist ein intelligenter persönlicher Assistent namens "SprachBrücke".
Du hilfst Menschen, die die lokale Sprache nicht beherrschen,
bei Behördengängen, Arztbesuchen, Briefen und Telefonaten.

DEINE AUFGABEN:
1. Nutzer beschreibt sein Problem (auf seiner Muttersprache)
2. Du analysierst das Problem und erkennst:
   - Was wird benötigt? (Termin, Brief, Anruf, Erklärung)
   - Welche Behörde/Institution ist zuständig?
   - Welche Dokumente werden gebraucht?
3. Du gibst eine klare LÖSUNG:
   - Option A: Brief/E-Mail schreiben (auf Deutsch + Übersetzung)
   - Option B: Telefonskript für Anruf vorbereiten
   - Option C: Dokument hochladen → erklären → zusammenfassen
4. Du sprichst den Nutzer in SEINER Sprache an
5. Du erklärst JEDEN Schritt einfach und verständlich

WICHTIGE BEHÖRDEN IN DEUTSCHLAND:
- Ausländerbehörde: Aufenthaltstitel, Visa
- Jobcenter/Agentur für Arbeit: Arbeitslosengeld, Bürgergeld
- Finanzamt: Steuern
- Krankenhaus/Arzt: Gesundheit
- Standesamt: Geburt, Heirat
- Einwohnermeldeamt: Anmeldung
- Kindergarten/Schule: Kinder

TONALITÄT: Freundlich, geduldig, professionell, einfache Sprache.

Erkenne automatisch die Sprache des Nutzers und antworte IMMER in seiner Sprache.`;

// POST /api/chat/message
router.post('/message', async (req, res) => {
  try {
    const { messages, userLanguage } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ message: 'Nachrichten erforderlich' });
    }

    const response = await openai.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
      max_tokens: 1500,
      temperature: 0.7,
    });

    const assistantMessage = response.choices[0].message.content;

    // Save to database
    try {
      const sessionId = req.headers['x-session-id'] || 'anonymous';
      await ChatHistory.findOneAndUpdate(
        { sessionId },
        {
          $set: { language: userLanguage, updatedAt: new Date() },
          $push: {
            messages: {
              $each: [
                ...messages.slice(-1).map((m) => ({ role: m.role, content: m.content })),
                { role: 'assistant', content: assistantMessage },
              ],
            },
          },
        },
        { upsert: true, new: true }
      );
    } catch (dbErr) {
      console.error('DB save error:', dbErr.message);
    }

    res.json({ message: assistantMessage, tokens: response.usage });
  } catch (err) {
    console.error('Chat Fehler:', err.message);
    res.status(500).json({ message: 'Chat-Fehler', error: err.message });
  }
});

// POST /api/chat/analyze-situation
router.post('/analyze-situation', async (req, res) => {
  try {
    const { situation, language } = req.body;

    const prompt = `Analysiere folgende Situation und antworte auf ${language || 'Arabisch'}:

Situation: ${situation}

Gib eine strukturierte Antwort mit:
1. Was das Problem ist
2. Welche Behörde/Institution zuständig ist
3. Welche Dokumente benötigt werden
4. Welche Schritte unternommen werden müssen
5. Ob ein Brief, Anruf oder persönlicher Besuch empfohlen wird

Antworte klar, einfach und freundlich.`;

    const response = await openai.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1000,
    });

    res.json({ analysis: response.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ message: 'Analysefehler', error: err.message });
  }
});

module.exports = router;
