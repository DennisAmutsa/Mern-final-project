const mongoose = require('mongoose');

const medicalReportSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'Consultation Report',
      'Lab Results Report',
      'Diagnostic Report',
      'Surgery Report',
      'Discharge Summary',
      'Progress Note',
      'Radiology Report',
      'Pathology Report'
    ]
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  findings: {
    type: String,
    default: ''
  },
  recommendations: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    default: 'Draft',
    enum: ['Draft', 'Completed', 'Reviewed', 'Archived']
  },
  attachments: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better query performance
medicalReportSchema.index({ doctor: 1, createdAt: -1 });
medicalReportSchema.index({ patient: 1, createdAt: -1 });
medicalReportSchema.index({ status: 1 });

module.exports = mongoose.model('MedicalReport', medicalReportSchema);
