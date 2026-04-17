require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
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

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('dev'));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Statische Uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/translate', require('./routes/translate'));
app.use('/api/calls', require('./routes/calls'));
app.use('/api/autocall', require('./routes/autocall'));

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

mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sprachbruecke')
  .then(() => {
    console.log('✅ MongoDB verbunden');
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
