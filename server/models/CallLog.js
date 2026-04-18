const mongoose = require('mongoose');

const callLogSchema = new mongoose.Schema({
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName:     { type: String },
  userEmail:    { type: String },
  type:         { type: String, enum: ['autocall', 'emergency'], required: true },
  purpose:      { type: String },          // Terminvereinbarung, Statusabfrage, …
  targetNumber: { type: String },          // phone dialled (masked in frontend)
  emergencyType:{ type: String },          // 'police' | 'fire' (only for emergency)
  status:       { type: String, default: 'initiated' }, // initiated | completed | failed | no-answer | busy
  summary:      { type: String },
  callSid:      { type: String },
  createdAt:    { type: Date, default: Date.now },
});

callLogSchema.index({ userId: 1, createdAt: -1 });
callLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('CallLog', callLogSchema);
