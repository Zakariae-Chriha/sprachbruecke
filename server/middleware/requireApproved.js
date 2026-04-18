const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Nicht angemeldet.', code: 'NOT_LOGGED_IN' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const user = await User.findById(decoded.userId).select('isApproved role');
    if (!user) return res.status(401).json({ message: 'Benutzer nicht gefunden.', code: 'NOT_FOUND' });
    if (!user.isApproved && user.role !== 'admin') {
      return res.status(403).json({ message: 'Kein Zugriff. Warte auf Genehmigung.', code: 'NOT_APPROVED' });
    }
    req.userId = decoded.userId;
    req.userRole = user.role;
    next();
  } catch {
    res.status(401).json({ message: 'Token ungültig.', code: 'INVALID_TOKEN' });
  }
};
