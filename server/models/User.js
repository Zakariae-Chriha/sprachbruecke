const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name ist erforderlich'],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'E-Mail ist erforderlich'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Passwort ist erforderlich'],
      minlength: 6,
    },
    language: {
      type: String,
      required: true,
      default: 'ar',
      enum: ['ar', 'tr', 'ru', 'uk', 'fr', 'en', 'fa', 'ku', 'vi', 'de'],
    },
    chatHistory: [
      {
        role: { type: String, enum: ['user', 'assistant'] },
        content: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    documents: [
      {
        fileName: String,
        analysis: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
