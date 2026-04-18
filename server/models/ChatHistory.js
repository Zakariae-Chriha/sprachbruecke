const mongoose = require('mongoose');

const chatHistorySchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  language: { type: String, default: 'English' },
  messages: [
    {
      role: { type: String, enum: ['user', 'assistant'] },
      content: String,
      timestamp: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

chatHistorySchema.index({ sessionId: 1 });
chatHistorySchema.index({ createdAt: -1 });

module.exports = mongoose.model('ChatHistory', chatHistorySchema);
