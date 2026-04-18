const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(401).json({ message: 'Benutzer nicht gefunden', code: 'NOT_FOUND' });

    // Reset monthly counter if reset date has passed
    const now = new Date();
    if (now >= user.callsResetDate) {
      user.callsThisMonth = 0;
      const nextReset = new Date();
      nextReset.setMonth(nextReset.getMonth() + 1);
      nextReset.setDate(1);
      nextReset.setHours(0, 0, 0, 0);
      user.callsResetDate = nextReset;
      await user.save();
    }

    // Admin always allowed
    if (user.role === 'admin') { req.callUser = user; return next(); }

    // Active subscriber always allowed
    if (user.subscriptionStatus === 'active') { req.callUser = user; return next(); }

    // Free tier: check limit
    const limit = user.freeCallsLimit ?? 3;
    if (user.callsThisMonth >= limit) {
      return res.status(402).json({
        message: 'Monatliches Limit erreicht',
        code: 'LIMIT_REACHED',
        used: user.callsThisMonth,
        limit,
        resetDate: user.callsResetDate,
      });
    }

    req.callUser = user;
    next();
  } catch (err) {
    res.status(500).json({ message: 'Serverfehler', error: err.message });
  }
};
