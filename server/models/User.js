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
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    // Freemium call tracking
    callsThisMonth: { type: Number, default: 0 },
    callsResetDate: { type: Date, default: () => {
      const d = new Date(); d.setMonth(d.getMonth() + 1); d.setDate(1); d.setHours(0,0,0,0); return d;
    }},
    freeCallsLimit: { type: Number, default: 3 },
    // Stripe subscription
    subscriptionStatus: {
      type: String,
      enum: ['free', 'active', 'cancelled', 'past_due'],
      default: 'free',
    },
    stripeCustomerId: { type: String },
    stripeSubscriptionId: { type: String },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
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
