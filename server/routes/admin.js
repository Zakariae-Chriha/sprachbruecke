const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const requireAdmin = require('../middleware/requireAdmin');
const User = require('../models/User');
const CallLog = require('../models/CallLog');
const { sendApprovalEmail } = require('../utils/mailer');

// GET /api/admin/users — list all non-admin users
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const users = await User.find({ role: 'user' })
      .select('-password -chatHistory -documents')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Serverfehler', error: err.message });
  }
});

// PATCH /api/admin/users/:id/approve
router.patch('/users/:id/approve', requireAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    ).select('-password -chatHistory -documents');
    if (!user) return res.status(404).json({ message: 'Benutzer nicht gefunden' });
    console.log(`✅ Benutzer genehmigt: ${user.email}`);
    sendApprovalEmail(user.email, user.name, user.language).catch(err =>
      console.error('Email-Fehler:', err.message)
    );
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Serverfehler', error: err.message });
  }
});

// PATCH /api/admin/users/:id/revoke
router.patch('/users/:id/revoke', requireAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isApproved: false },
      { new: true }
    ).select('-password -chatHistory -documents');
    if (!user) return res.status(404).json({ message: 'Benutzer nicht gefunden' });
    console.log(`🚫 Zugriff gesperrt: ${user.email}`);
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Serverfehler', error: err.message });
  }
});

// POST /api/admin/users/:id/reset-link — generate password reset link for user
router.post('/users/:id/reset-link', requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Benutzer nicht gefunden' });
    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 24 * 60 * 60 * 1000; // 24h
    await user.save();
    const clientUrl = process.env.CLIENT_URL || 'https://sprachbruecke-psi.vercel.app';
    const resetUrl = `${clientUrl}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;
    res.json({ resetUrl, email: user.email, name: user.name });
  } catch (err) {
    res.status(500).json({ message: 'Serverfehler', error: err.message });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', requireAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Benutzer gelöscht' });
  } catch (err) {
    res.status(500).json({ message: 'Serverfehler', error: err.message });
  }
});

// GET /api/admin/calls — all call logs (newest first)
router.get('/calls', requireAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const logs = await CallLog.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Serverfehler', error: err.message });
  }
});

// GET /api/admin/stats — quick stats for admin dashboard
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const [totalUsers, pendingUsers, totalCalls, emergencyCalls] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'user', isApproved: false }),
      CallLog.countDocuments(),
      CallLog.countDocuments({ type: 'emergency' }),
    ]);
    res.json({ totalUsers, pendingUsers, totalCalls, emergencyCalls });
  } catch (err) {
    res.status(500).json({ message: 'Serverfehler', error: err.message });
  }
});

module.exports = router;
