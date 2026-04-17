const express = require('express');
const router = express.Router();

// POST /api/emergency/call
// Twilio calls 110 or 112 on behalf of the user, speaking German
router.post('/call', async (req, res) => {
  try {
    const { type, address } = req.body;

    if (!address) return res.status(400).json({ message: 'Adresse erforderlich' });
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      return res.status(503).json({ message: 'Twilio nicht konfiguriert.' });
    }

    const ngrokUrl = process.env.NGROK_URL;
    if (!ngrokUrl) return res.status(503).json({ message: 'NGROK_URL nicht konfiguriert.' });

    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    // German emergency numbers
    const emergencyNumber = type === 'police' ? '+49110' : '+49112';

    const call = await client.calls.create({
      to: emergencyNumber,
      from: process.env.TWILIO_PHONE_NUMBER,
      url: `${ngrokUrl}/api/emergency/twiml?address=${encodeURIComponent(address)}&type=${type}`,
    });

    console.log(`🆘 Notruf: ${call.sid} → ${emergencyNumber} | ${address}`);
    res.json({ success: true, callSid: call.sid });
  } catch (err) {
    console.error('Notruf Fehler:', err.message);
    res.status(500).json({ message: 'Anruffehler', error: err.message });
  }
});

// GET /api/emergency/twiml
// TwiML spoken to emergency services in German
router.get('/twiml', (req, res) => {
  const address = req.query.address || 'unbekannte Adresse';
  const type = req.query.type || 'fire';
  const service = type === 'police' ? 'Polizei' : 'Feuerwehr und Rettungsdienst';

  const { VoiceResponse } = require('twilio').twiml;
  const twiml = new VoiceResponse();

  twiml.say({ voice: 'Polly.Vicki', language: 'de-DE' },
    `NOTRUF! Diese Person spricht kein Deutsch. Sofort ${service} benötigt!`);
  twiml.pause({ length: 1 });
  twiml.say({ voice: 'Polly.Vicki', language: 'de-DE' },
    `Die Adresse lautet: ${address}.`);
  twiml.pause({ length: 1 });
  twiml.say({ voice: 'Polly.Vicki', language: 'de-DE' },
    `Ich wiederhole die Adresse: ${address}. Bitte sofort Hilfe schicken!`);
  twiml.pause({ length: 2 });
  twiml.say({ voice: 'Polly.Vicki', language: 'de-DE' },
    `Nochmals: ${address}. Danke.`);
  twiml.hangup();

  res.type('text/xml');
  res.send(twiml.toString());
});

module.exports = router;
