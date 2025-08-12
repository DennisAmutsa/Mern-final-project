const mongoose = require('mongoose');

const vitalsSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bloodPressure: {
    systolic: {
      type: Number,
      required: true
    },
    diastolic: {
      type: Number,
      required: true
    }
  },
  heartRate: {
    type: Number,
    required: true
  },
  temperature: {
    type: Number,
    required: true
  },
  respiratoryRate: {
    type: Number,
    default: null
  },
  oxygenSaturation: {
    type: Number,
    default: null
  },
  status: {
    type: String,
    enum: ['Normal', 'Warning', 'Critical'],
    default: 'Normal'
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recordedAt: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Calculate status based on vital signs
vitalsSchema.pre('save', function(next) {
  const bp = this.bloodPressure;
  const hr = this.heartRate;
  const temp = this.temperature;
  
  let status = 'Normal';
  
  // Blood pressure criteria
  if (bp.systolic > 160 || bp.systolic < 90 || bp.diastolic > 100 || bp.diastolic < 60) {
    status = 'Critical';
  } else if (bp.systolic > 140 || bp.systolic < 100 || bp.diastolic > 90 || bp.diastolic < 70) {
    status = 'Warning';
  }
  
  // Heart rate criteria
  if (hr > 120 || hr < 50) {
    status = 'Critical';
  } else if (hr > 100 || hr < 60) {
    status = status === 'Normal' ? 'Warning' : status;
  }
  
  // Temperature criteria
  if (temp > 39 || temp < 35) {
    status = 'Critical';
  } else if (temp > 38 || temp < 36) {
    status = status === 'Normal' ? 'Warning' : status;
  }
  
  this.status = status;
  next();
});

module.exports = mongoose.model('Vitals', vitalsSchema);
