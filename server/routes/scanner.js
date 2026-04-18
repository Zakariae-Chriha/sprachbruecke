const express = require('express');
const router = express.Router();
const OpenAI = require('openai');

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

// POST /api/scanner/analyze — send base64 image, get explanation
router.post('/analyze', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', userLanguage = 'Arabic' } = req.body;
    if (!imageBase64) return res.status(400).json({ message: 'Kein Bild' });

    const response = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${imageBase64}` },
            },
            {
              type: 'text',
              text: `Du bist SprachBrücke, ein Assistent für Migranten in Deutschland.

Analysiere dieses Bild (es ist wahrscheinlich ein Brief, Dokument oder Formular).

Antworte auf ${userLanguage} mit:
1. **Was ist das?** (Art des Dokuments)
2. **Was steht drin?** (Hauptinhalt einfach erklärt)
3. **Was muss ich tun?** (Konkrete nächste Schritte)
4. **Wichtige Daten/Fristen** (Falls vorhanden)
5. **Aufgaben** (Liste mit Checkboxen was erledigt werden muss)

Sei klar und einfach. Erkläre Behördenbegriffe verständlich.`,
            },
          ],
        },
      ],
      max_tokens: 1500,
    });

    res.json({ result: response.choices[0].message.content });
  } catch (err) {
    console.error('Scanner-Fehler:', err.message);
    res.status(500).json({ message: 'Analyse fehlgeschlagen', error: err.message });
  }
});

module.exports = router;
