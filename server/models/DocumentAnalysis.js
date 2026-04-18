const mongoose = require('mongoose');

const documentAnalysisSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  language: { type: String, default: 'English' },
  analysis: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

documentAnalysisSchema.index({ createdAt: -1 });

module.exports = mongoose.model('DocumentAnalysis', documentAnalysisSchema);
