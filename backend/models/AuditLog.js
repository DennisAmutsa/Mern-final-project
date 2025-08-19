const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: { type: String, required: true }, // email or username
  action: { type: String, required: true },
  description: { type: String },
  ipAddress: { type: String },
  userAgent: { type: String },
  status: { type: String, enum: ['SUCCESS', 'FAILED', 'WARNING', 'BLOCKED'], default: 'SUCCESS' },
  details: { type: mongoose.Schema.Types.Mixed }
}, {
  timestamps: true // This will add createdAt and updatedAt fields
});

module.exports = mongoose.model('AuditLog', auditLogSchema); 