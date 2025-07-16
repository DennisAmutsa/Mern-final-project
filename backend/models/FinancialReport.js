const mongoose = require('mongoose');

const FinancialReportSchema = new mongoose.Schema({
  type: { type: String, enum: ['annual', 'quarterly', 'monthly', 'custom'], required: true },
  period: { type: String, required: true },
  totals: { type: Object, required: true },
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('FinancialReport', FinancialReportSchema); 