const mongoose = require('mongoose');

const patientNoteSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  note: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['nursing_note', 'doctor_note', 'general_note', 'shift_handover'],
    default: 'general_note'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  shift: {
    type: String,
    enum: ['Morning', 'Afternoon', 'Night'],
    default: 'Morning'
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String
  }],
  attachments: [{
    filename: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('PatientNote', patientNoteSchema);
