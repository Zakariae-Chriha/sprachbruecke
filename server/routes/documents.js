const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

// Multer Konfiguration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Nur PDF, JPG und PNG Dateien erlaubt'), false);
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

// POST /api/documents/upload - Dokument hochladen und analysieren
router.post('/upload', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Keine Datei hochgeladen' });

    const { language = 'Arabisch' } = req.body;
    let extractedText = '';

    // Text aus PDF extrahieren
    if (req.file.mimetype === 'application/pdf') {
      const dataBuffer = fs.readFileSync(req.file.path);
      const pdfData = await pdfParse(dataBuffer);
      extractedText = pdfData.text;
    } else {
      // Für Bilder: OCR via OpenAI Vision
      const imageBuffer = fs.readFileSync(req.file.path);
      const base64Image = imageBuffer.toString('base64');

      const visionResponse = await openai.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: `data:${req.file.mimetype};base64,${base64Image}` },
              },
              { type: 'text', text: 'Extrahiere den gesamten Text aus diesem Bild.' },
            ],
          },
        ],
        max_tokens: 2000,
      });
      extractedText = visionResponse.choices[0].message.content;
    }

    // Dokument mit KI analysieren
    const analysisPrompt = `Du bist SprachBrücke. Analysiere folgendes deutsches Behördendokument und erkläre es auf ${language}:

DOKUMENT:
${extractedText.substring(0, 3000)}

Deine Antwort soll enthalten:
1. **Was ist das für ein Dokument?** (Art/Typ)
2. **Von welcher Behörde?**
3. **Was steht drin?** (Hauptinhalt, einfach erklärt)
4. **Was muss die Person tun?** (Fristen, Aktionen, Antworten)
5. **Wie dringend ist es?** (sofort, diese Woche, diesen Monat)
6. **Welche Dokumente werden eventuell gebraucht?**

Antworte vollständig auf ${language}. Benutze einfache, klare Sprache.`;

    const analysisResponse = await openai.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: analysisPrompt }],
      max_tokens: 1500,
    });

    // Datei nach Analyse löschen (Datenschutz)
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      fileName: req.file.originalname,
      analysis: analysisResponse.choices[0].message.content,
      extractedText: extractedText.substring(0, 500) + (extractedText.length > 500 ? '...' : ''),
    });
  } catch (err) {
    console.error('Dokument Fehler:', err.message);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: 'Dokumentverarbeitungsfehler', error: err.message });
  }
});

// POST /api/documents/explain-text - Text direkt erklären (ohne Datei)
router.post('/explain-text', async (req, res) => {
  try {
    const { text, language = 'Arabisch' } = req.body;

    if (!text) return res.status(400).json({ message: 'Text erforderlich' });

    const response = await openai.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'user',
          content: `Erkläre folgenden deutschen Text auf ${language} in einfacher Sprache:\n\n${text}`,
        },
      ],
      max_tokens: 1000,
    });

    res.json({ explanation: response.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ message: 'Fehler', error: err.message });
  }
});

module.exports = router;
