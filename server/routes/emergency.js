const express = require('express');
const router = express.Router();

// POST /api/emergency/call
router.post('/call', async (req, res) => {
  try {
    const { type, name, address, coords } = req.body;

    if (!address) return res.status(400).json({ message: 'Adresse erforderlich' });
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      return res.status(503).json({ message: 'Twilio nicht konfiguriert.' });
    }

    const ngrokUrl = process.env.NGROK_URL;
    if (!ngrokUrl) return res.status(503).json({ message: 'NGROK_URL nicht konfiguriert.' });

    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const emergencyNumber = type === 'police' ? '+49110' : '+49112';

    const params = new URLSearchParams({
      address,
      type: type || 'fire',
      name: name || '',
      lat: coords?.lat || '',
      lon: coords?.lon || '',
    });

    const call = await client.calls.create({
      to: emergencyNumber,
      from: process.env.TWILIO_PHONE_NUMBER,
      url: `${ngrokUrl}/api/emergency/twiml?${params.toString()}`,
    });

    console.log(`🆘 Notruf: ${call.sid} → ${emergencyNumber} | ${name} | ${address}`);
    res.json({ success: true, callSid: call.sid });
  } catch (err) {
    console.error('Notruf Fehler:', err.message);
    res.status(500).json({ message: 'Anruffehler', error: err.message });
  }
});

// GET /api/emergency/twiml
// The AI introduces itself clearly and repeats the address
router.get('/twiml', (req, res) => {
  const address = req.query.address || 'unbekannte Adresse';
  const type    = req.query.type    || 'fire';
  const name    = req.query.name    || '';
  const lat     = req.query.lat     || '';
  const lon     = req.query.lon     || '';

  const service   = type === 'police' ? 'Polizei' : 'Feuerwehr und Rettungsdienst';
  const nameIntro = name ? `Mein Name ist ${name}.` : '';
  const gpsInfo   = lat && lon ? ` GPS-Koordinaten: ${parseFloat(lat).toFixed(5)}, ${parseFloat(lon).toFixed(5)}.` : '';

  const { VoiceResponse } = require('twilio').twiml;
  const twiml = new VoiceResponse();

  // Clear introduction — pause between sentences so the operator can understand
  twiml.say({ voice: 'Polly.Vicki', language: 'de-DE' },
    `Guten Tag! NOTRUF!`);
  twiml.pause({ length: 1 });

  twiml.say({ voice: 'Polly.Vicki', language: 'de-DE' },
    `${nameIntro} Ich spreche kein Deutsch. Ich brauche sofort ${service}!`);
  twiml.pause({ length: 1 });

  twiml.say({ voice: 'Polly.Vicki', language: 'de-DE' },
    `Meine Adresse lautet: ${address}.${gpsInfo}`);
  twiml.pause({ length: 1 });

  twiml.say({ voice: 'Polly.Vicki', language: 'de-DE' },
    `Ich wiederhole: ${nameIntro} Adresse: ${address}. Bitte sofort kommen!`);
  twiml.pause({ length: 2 });

  twiml.say({ voice: 'Polly.Vicki', language: 'de-DE' },
    `Nochmals die Adresse: ${address}. Vielen Dank.`);
  twiml.hangup();

  res.type('text/xml');
  res.send(twiml.toString());
});

module.exports = router;
