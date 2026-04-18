const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { sendPasswordResetEmail } = require('../utils/mailer');

// POST /api/auth/register
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name ist erforderlich'),
    body('email').isEmail().withMessage('Gültige E-Mail erforderlich'),
    body('password').isLength({ min: 6 }).withMessage('Passwort muss mindestens 6 Zeichen haben'),
    body('language').notEmpty().withMessage('Sprache ist erforderlich'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { name, email, password, language } = req.body;

      let user = await User.findOne({ email });
      if (user) return res.status(400).json({ message: 'E-Mail bereits registriert' });

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
      const isAdmin = adminEmail && email.toLowerCase() === adminEmail;

      user = new User({
        name,
        email,
        password: hashedPassword,
        language,
        role: isAdmin ? 'admin' : 'user',
        isApproved: isAdmin ? true : false,
      });
      await user.save();

      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'fallback_secret', {
        expiresIn: '7d',
      });

      res.status(201).json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          language: user.language,
          role: user.role,
          isApproved: user.isApproved,
        },
      });
    } catch (err) {
      res.status(500).json({ message: 'Serverfehler', error: err.message });
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Gültige E-Mail erforderlich'),
    body('password').notEmpty().withMessage('Passwort erforderlich'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ message: 'Ungültige Anmeldedaten' });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ message: 'Ungültige Anmeldedaten' });

      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'fallback_secret', {
        expiresIn: '7d',
      });

      res.json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          language: user.language,
          role: user.role,
          isApproved: user.isApproved,
        },
      });
    } catch (err) {
      res.status(500).json({ message: 'Serverfehler', error: err.message });
    }
  }
);

// GET /api/auth/me
router.get('/me', require('../middleware/auth'), async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password -chatHistory -documents');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Serverfehler' });
  }
});

// GET or POST /api/auth/init-admin
// Creates or fixes the admin account using env vars — safe to call multiple times
async function initAdmin(req, res) {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    return res.status(400).json({ message: 'ADMIN_EMAIL oder ADMIN_PASSWORD nicht gesetzt.' });
  }

  try {
    const hashed = await bcrypt.hash(adminPassword, 10);
    const user = await User.findOneAndUpdate(
      { email: adminEmail.toLowerCase() },
      { email: adminEmail.toLowerCase(), name: 'Admin', password: hashed, language: 'de', role: 'admin', isApproved: true },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });
    console.log(`✅ Admin-Konto initialisiert: ${adminEmail}`);
    res.json({
      message: 'Admin-Konto erstellt/aktualisiert.',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, isApproved: user.isApproved },
    });
  } catch (err) {
    res.status(500).json({ message: 'Fehler', error: err.message });
  }
}

router.get('/init-admin', initAdmin);
router.post('/init-admin', initAdmin);

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'E-Mail erforderlich' });
  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    // Always respond OK to prevent email enumeration
    if (!user) return res.json({ message: 'Falls die E-Mail existiert, wurde ein Link gesendet.' });

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    const clientUrl = process.env.CLIENT_URL || 'https://sprachbruecke-psi.vercel.app';
    const resetUrl = `${clientUrl}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;

    sendPasswordResetEmail(user.email, user.name, resetUrl).catch(err =>
      console.error('Reset-Email Fehler:', err.message)
    );
    res.json({ message: 'Falls die E-Mail existiert, wurde ein Link gesendet.' });
  } catch (err) {
    res.status(500).json({ message: 'Serverfehler', error: err.message });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  const { email, token, password } = req.body;
  if (!email || !token || !password) return res.status(400).json({ message: 'Fehlende Felder' });
  if (password.length < 6) return res.status(400).json({ message: 'Passwort muss mindestens 6 Zeichen haben' });
  try {
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) return res.status(400).json({ message: 'Link ungültig oder abgelaufen.' });

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Passwort erfolgreich geändert.' });
  } catch (err) {
    res.status(500).json({ message: 'Serverfehler', error: err.message });
  }
});

module.exports = router;
