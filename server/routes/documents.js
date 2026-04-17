const express = require('express');
const router = express.Router();
const multer = require('multer');
const DocumentAnalysis = require('../models/DocumentAnalysis');
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
    const analysisPrompt = `You are SprachBrücke. Analyze the following document and explain it ENTIRELY in ${language}. Do NOT use any other language in your response.

DOCUMENT:
${extractedText.substring(0, 3000)}

Your response must be written ONLY in ${language} and include:
1. **What type of document is this?**
2. **Which authority/institution sent it?**
3. **What does it say?** (main content, explained simply)
4. **What does the person need to do?** (deadlines, actions, responses)
5. **How urgent is it?** (immediately, this week, this month)
6. **What documents might be needed?**

IMPORTANT: Write your ENTIRE response in ${language} only. Do not mix languages.`;

    const analysisResponse = await openai.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: analysisPrompt }],
      max_tokens: 1500,
    });

    // Datei nach Analyse löschen (Datenschutz)
    fs.unlinkSync(req.file.path);

    const analysisText = analysisResponse.choices[0].message.content;

    // Save to database
    try {
      await DocumentAnalysis.create({ fileName: req.file.originalname, language, analysis: analysisText });
    } catch (dbErr) {
      console.error('DB save error:', dbErr.message);
    }

    res.json({
      success: true,
      fileName: req.file.originalname,
      analysis: analysisText,
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
