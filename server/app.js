require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const httpServer = createServer(app);

// Socket.io für Live Chat
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Rate limiters
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Zu viele Anfragen. Bitte warte 15 Minuten.' },
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: { message: 'KI-Limit erreicht. Bitte warte 1 Minute.' },
});

const callLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { message: 'Anruf-Limit erreicht. Maximal 10 Anrufe pro Stunde.' },
});

// Middleware
app.use(compression());
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('dev'));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use('/api/', generalLimiter);

// Stripe webhook needs raw body — registered BEFORE express.json()
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }), require('./routes/stripe'));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Statische Uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/chat', aiLimiter, require('./routes/chat'));
app.use('/api/documents', aiLimiter, require('./routes/documents'));
app.use('/api/translate', aiLimiter, require('./routes/translate'));
app.use('/api/calls', require('./routes/calls'));
app.use('/api/autocall', callLimiter, require('./routes/autocall'));
app.use('/api/emergency', callLimiter, require('./routes/emergency'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/stripe', require('./routes/stripe'));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'SprachBrücke Server läuft', timestamp: new Date().toISOString() });
});

// Socket.io Events
io.on('connection', (socket) => {
  console.log('Neuer Client verbunden:', socket.id);

  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on('send_message', (data) => {
    socket.to(data.room).emit('receive_message', data);
  });

  socket.on('disconnect', () => {
    console.log('Client getrennt:', socket.id);
  });
});

// MongoDB verbinden und Server starten
const PORT = process.env.PORT || 5000;

async function ensureAdminExists() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) return;

  const User = require('./models/User');
  const bcrypt = require('bcryptjs');

  const existing = await User.findOne({ email: adminEmail.toLowerCase() });
  if (existing) {
    // Make sure existing account has admin role
    if (existing.role !== 'admin') {
      await existing.updateOne({ role: 'admin', isApproved: true });
      console.log('✅ Admin-Rolle aktualisiert');
    }
    return;
  }

  const hashed = await bcrypt.hash(adminPassword, 10);
  await User.create({
    name: 'Admin',
    email: adminEmail.toLowerCase(),
    password: hashed,
    language: 'de',
    role: 'admin',
    isApproved: true,
  });
  console.log(`✅ Admin-Konto erstellt: ${adminEmail}`);
}

mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sprachbruecke')
  .then(async () => {
    console.log('✅ MongoDB verbunden');
    await ensureAdminExists();
    httpServer.listen(PORT, () => {
      console.log(`🚀 SprachBrücke Server läuft auf Port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB Fehler:', err.message);
    console.log('⚠️  Server startet ohne Datenbankverbindung...');
    httpServer.listen(PORT, () => {
      console.log(`🚀 SprachBrücke Server läuft auf Port ${PORT} (ohne DB)`);
    });
  });

module.exports = { app, io };
