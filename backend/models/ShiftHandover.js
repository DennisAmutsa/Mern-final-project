const mongoose = require('mongoose');

const shiftHandoverSchema = new mongoose.Schema({
  shift: {
    type: String,
    required: true,
    enum: ['Morning', 'Afternoon', 'Night']
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  handoverFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  handoverTo: {
    type: String,
    required: true
  },
  patientsUnderCare: {
    type: Number,
    required: true
  },
  criticalPatients: [{
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    patientName: String,
    condition: String,
    specialInstructions: String
  }],
  medicationsDue: [{
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    patientName: String,
    medication: String,
    dosage: String,
    time: String,
    status: {
      type: String,
      enum: ['Pending', 'Given', 'Missed'],
      default: 'Pending'
    }
  }],
  emergencyAlerts: [{
    type: String,
    description: String,
    status: {
      type: String,
      enum: ['Active', 'Resolved'],
      default: 'Active'
    }
  }],
  keyNotes: {
    type: String,
    required: true
  },
  specialInstructions: [{
    category: String,
    instruction: String,
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium'
    }
  }],
  equipmentIssues: [{
    equipment: String,
    issue: String,
    reportedTo: String,
    status: {
      type: String,
      enum: ['Reported', 'In Progress', 'Resolved'],
      default: 'Reported'
    }
  }],
  nextShiftPriorities: [{
    priority: String,
    description: String,
    assignedTo: String
  }],
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: Date,
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for efficient querying
shiftHandoverSchema.index({ date: -1, shift: 1 });
shiftHandoverSchema.index({ handoverFrom: 1, date: -1 });

module.exports = mongoose.model('ShiftHandover', shiftHandoverSchema);
