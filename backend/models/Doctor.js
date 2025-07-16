const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  doctorId: {
    type: String,
    required: true,
    unique: true,
    default: () => 'D' + Date.now().toString().slice(-6)
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  specialization: {
    type: String,
    required: true,
    enum: ['Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'General Medicine', 'Surgery', 'Emergency Medicine', 'Psychiatry', 'Dermatology', 'Oncology']
  },
  department: {
    type: String,
    required: true,
    enum: ['Emergency', 'Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'General Medicine', 'Surgery', 'ICU', 'Psychiatry', 'Dermatology', 'Oncology']
  },
  contactInfo: {
    phone: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    }
  },
  licenseNumber: {
    type: String,
    required: true,
    unique: true
  },
  education: [{
    degree: String,
    institution: String,
    year: Number
  }],
  experience: {
    type: Number,
    required: true,
    min: 0
  },
  availability: {
    monday: { start: String, end: String, available: { type: Boolean, default: true } },
    tuesday: { start: String, end: String, available: { type: Boolean, default: true } },
    wednesday: { start: String, end: String, available: { type: Boolean, default: true } },
    thursday: { start: String, end: String, available: { type: Boolean, default: true } },
    friday: { start: String, end: String, available: { type: Boolean, default: true } },
    saturday: { start: String, end: String, available: { type: Boolean, default: false } },
    sunday: { start: String, end: String, available: { type: Boolean, default: false } }
  },
  status: {
    type: String,
    enum: ['Active', 'On Leave', 'Inactive', 'Emergency'],
    default: 'Active'
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
  salary: {
    type: Number,
    required: true
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
  certifications: [String],
  languages: [String],
  maxPatientsPerDay: {
    type: Number,
    default: 20
  }
}, {
  timestamps: true
});

// Virtual for full name
doctorSchema.virtual('fullName').get(function() {
  return `Dr. ${this.firstName} ${this.lastName}`;
});

// Virtual for experience in years
doctorSchema.virtual('experienceYears').get(function() {
  if (!this.joinDate) return this.experience;
  const today = new Date();
  const joinDate = new Date(this.joinDate);
  const years = today.getFullYear() - joinDate.getFullYear();
  const monthDiff = today.getMonth() - joinDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < joinDate.getDate())) {
    return years - 1;
  }
  return years;
});

// Index for better query performance
doctorSchema.index({ doctorId: 1 });
doctorSchema.index({ lastName: 1, firstName: 1 });
doctorSchema.index({ specialization: 1 });
doctorSchema.index({ department: 1 });
doctorSchema.index({ status: 1 });

module.exports = mongoose.model('Doctor', doctorSchema); 