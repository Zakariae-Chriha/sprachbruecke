const express = require('express');
const router = express.Router();
const axios = require('axios');
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

// Sprachcodes für DeepL
const DEEPL_LANG_MAP = {
  de: 'DE', en: 'EN', fr: 'FR', es: 'ES', it: 'IT',
  pt: 'PT', nl: 'NL', pl: 'PL', ru: 'RU', tr: 'TR',
  uk: 'UK', cs: 'CS', ro: 'RO', hu: 'HU', bg: 'BG',
};

// POST /api/translate/text - Text übersetzen via DeepL
router.post('/text', async (req, res) => {
  try {
    const { text, targetLang = 'DE', sourceLang } = req.body;

    if (!text) return res.status(400).json({ message: 'Text erforderlich' });

    // DeepL API versuchen
    if (process.env.DEEPL_API_KEY) {
      const deeplResponse = await axios.post(
        'https://api-free.deepl.com/v2/translate',
        new URLSearchParams({
          auth_key: process.env.DEEPL_API_KEY,
          text,
          target_lang: DEEPL_LANG_MAP[targetLang.toLowerCase()] || targetLang.toUpperCase(),
          ...(sourceLang && { source_lang: DEEPL_LANG_MAP[sourceLang.toLowerCase()] || sourceLang.toUpperCase() }),
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      return res.json({
        translatedText: deeplResponse.data.translations[0].detected_source_language
          ? deeplResponse.data.translations[0].text
          : deeplResponse.data.translations[0].text,
        detectedLang: deeplResponse.data.translations[0].detected_source_language,
        provider: 'DeepL',
      });
    }

    // Fallback: OpenAI
    const langNames = {
      de: 'Deutsch', en: 'Englisch', ar: 'Arabisch', tr: 'Türkisch',
      ru: 'Russisch', uk: 'Ukrainisch', fr: 'Französisch', fa: 'Persisch',
    };

    const response = await openai.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'user',
          content: `Übersetze folgenden Text ins ${langNames[targetLang.toLowerCase()] || targetLang}. Gib NUR die Übersetzung zurück, ohne Erklärungen:\n\n${text}`,
        },
      ],
      max_tokens: 1000,
    });

    res.json({ translatedText: response.choices[0].message.content, provider: 'OpenAI' });
  } catch (err) {
    console.error('Übersetzungsfehler:', err.message);
    res.status(500).json({ message: 'Übersetzungsfehler', error: err.message });
  }
});

// POST /api/translate/generate-letter - Brief auf Deutsch generieren
router.post('/generate-letter', async (req, res) => {
  try {
    const { situation, letterType, userLanguage = 'Arabisch', recipientInfo } = req.body;

    const prompt = `Generiere einen professionellen deutschen ${letterType || 'Brief'} für folgende Situation:

Situation (beschrieben auf ${userLanguage}): ${situation}
Empfänger: ${recipientInfo || 'zuständige Behörde'}

ANFORDERUNGEN:
- Formeller, höflicher Ton
- Klare Struktur: Betreff, Anrede, Hauptteil, Schluss
- Korrekte deutsche Grammatik
- Professionelles Format

Generiere den Brief auf DEUTSCH.
Danach füge eine VOLLSTÄNDIGE ÜBERSETZUNG auf ${userLanguage} hinzu.

Format:
=== BRIEF AUF DEUTSCH ===
[Brief hier]

=== ÜBERSETZUNG AUF ${userLanguage.toUpperCase()} ===
[Übersetzung hier]`;

    const response = await openai.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
    });

    const fullText = response.choices[0].message.content;
    const parts = fullText.split(/===.*===/);

    res.json({
      fullText,
      germanLetter: parts[1]?.trim() || fullText,
      translation: parts[2]?.trim() || '',
    });
  } catch (err) {
    res.status(500).json({ message: 'Brief-Generierungsfehler', error: err.message });
  }
});

module.exports = router;
