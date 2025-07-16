const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: { type: String, required: true }, // email or username
  action: { type: String, required: true },
  description: { type: String },
  ipAddress: { type: String },
  userAgent: { type: String },
  timestamp: { type: Date, default: Date.now },
  status: { type: String, enum: ['SUCCESS', 'FAILED', 'WARNING'], default: 'SUCCESS' },
  details: { type: mongoose.Schema.Types.Mixed }
});

module.exports = mongoose.model('AuditLog', auditLogSchema); 