const mongoose = require('mongoose');

const labOrderSchema = new mongoose.Schema({
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
  labTechnician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  tests: [{
    testType: {
      type: String,
      required: true,
      enum: [
        'Blood Test',
        'Urine Test',
        'X-Ray',
        'CT Scan',
        'MRI',
        'Ultrasound',
        'ECG',
        'Biopsy',
        'Culture Test',
        'Allergy Test',
        'Pregnancy Test',
        'Drug Test',
        'Genetic Test',
        'Microbiology Test',
        'Chemistry Test',
        'Hematology Test'
      ]
    },
    testName: {
      type: String,
      required: true
    },
    priority: {
      type: String,
      enum: ['Routine', 'Urgent', 'Emergency'],
      default: 'Routine'
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Completed', 'Failed', 'Cancelled'],
      default: 'Pending'
    },
    requestedDate: {
      type: Date,
      default: Date.now
    },
    completedDate: Date,
    results: {
      values: [{
        parameter: String,
        value: String,
        unit: String,
        normalRange: String,
        isAbnormal: {
          type: Boolean,
          default: false
        }
      }],
      findings: String,
      observations: String,
      attachments: [String]
    },
    notes: String
  }],
  orderStatus: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  priority: {
    type: String,
    enum: ['Routine', 'Urgent', 'Emergency'],
    default: 'Routine'
  },
  requestedDate: {
    type: Date,
    default: Date.now
  },
  dueDate: Date,
  completedDate: Date,
  notes: String,
  instructions: String,
  sampleCollectionDate: Date,
  sampleStatus: {
    type: String,
    enum: ['Not Collected', 'Collected', 'Processing', 'Completed'],
    default: 'Not Collected'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
labOrderSchema.index({ patient: 1, requestedDate: -1 });
labOrderSchema.index({ doctor: 1, requestedDate: -1 });
labOrderSchema.index({ labTechnician: 1, orderStatus: 1 });
labOrderSchema.index({ orderStatus: 1, priority: 1 });
labOrderSchema.index({ 'tests.status': 1 });

module.exports = mongoose.model('LabOrder', labOrderSchema);
