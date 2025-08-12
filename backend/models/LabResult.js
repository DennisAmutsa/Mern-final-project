const mongoose = require('mongoose');

const labResultSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  testType: {
    type: String,
    required: true
  },
  testName: {
    type: String,
    required: true
  },
  orderedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderedDate: {
    type: Date,
    default: Date.now
  },
  expectedCompletion: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  results: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  completedDate: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    default: ''
  },
  priority: {
    type: String,
    enum: ['Routine', 'Urgent', 'Emergency'],
    default: 'Routine'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('LabResult', labResultSchema);
