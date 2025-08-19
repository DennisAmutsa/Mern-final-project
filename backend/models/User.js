const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
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
  role: {
    type: String,
    enum: ['admin', 'doctor', 'nurse', 'receptionist', 'pharmacist', 'lab_technician', 'it', 'user', 'patient', 'staff', 'pending'],
    default: 'user'
  },
  department: {
    type: String,
    enum: ['Emergency', 'Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'General Medicine', 'Surgery', 'ICU', 'Pharmacy', 'Administration'],
    required: false
  },
  assignedDoctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  employeeId: {
    type: String,
    unique: true,
    sparse: true
  },
  contactInfo: {
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    }
  },
  dateOfBirth: {
    type: Date,
    required: false
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: false
  },
  bloodType: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: false
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
  insurance: {
    provider: String,
    policyNumber: String,
    groupNumber: String,
    expiryDate: Date
  },
  medicalHistory: [{
    condition: String,
    diagnosis: String,
    treatment: String,
    date: {
      type: Date,
      default: Date.now
    },
    doctor: String,
    type: {
      type: String,
      enum: ['Consultation', 'Surgery', 'Test', 'Prescription', 'Follow-up', 'Emergency'],
      default: 'Consultation'
    },
    notes: String,
    status: {
      type: String,
      enum: ['Active', 'Completed', 'Cancelled'],
      default: 'Completed'
    }
  }],
  currentMedications: [{
    name: String,
    dosage: String,
    frequency: String,
    prescribedBy: String,
    prescribedDate: {
      type: Date,
      default: Date.now
    },
    endDate: Date,
    status: {
      type: String,
      enum: ['Active', 'On Hold', 'Completed', 'Discontinued'],
      default: 'Active'
    },
    notes: String,
    lastAdministered: Date,
    lastAdministeredBy: String,
    statusUpdatedAt: Date,
    statusUpdatedBy: String
  }],
  medicationAdministrations: [{
    medicationId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    administeredAt: {
      type: Date,
      required: true
    },
    notes: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['Administered', 'Refused', 'Missed', 'Delayed'],
      required: true
    },
    administeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    administeredByUser: String,
    recordedAt: {
      type: Date,
      default: Date.now
    }
  }],
  adverseReactions: [{
    medicationId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    reaction: {
      type: String,
      required: true
    },
    severity: {
      type: String,
      enum: ['Mild', 'Moderate', 'Severe', 'Life-threatening'],
      required: true
    },
    symptoms: {
      type: String,
      required: true
    },
    actionTaken: String,
    reportedTo: String,
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reportedByUser: String,
    reportedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  // Failed login attempt tracking
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  lastFailedLogin: {
    type: Date
  },
  accountLocked: {
    type: Boolean,
    default: false
  },
  accountLockedAt: {
    type: Date
  },
  accountLockedBy: {
    type: String,
    enum: ['system', 'admin'],
    default: 'system',
    required: false
  },
  lastVitalCheck: {
    type: Date,
    default: null
  },
  lastFollowUpCall: {
    type: Date,
    default: null
  },
  permissions: [{
    type: String,
    enum: [
      'view_patients', 'edit_patients', 'delete_patients',
      'view_doctors', 'edit_doctors', 'delete_doctors',
      'view_appointments', 'edit_appointments', 'delete_appointments',
      'view_emergency', 'edit_emergency',
      'view_inventory', 'edit_inventory', 'delete_inventory',
      'view_stats', 'view_reports',
      'manage_users', 'system_admin', 'view_profile'
    ]
  }],
  profileImage: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Discharged', 'Emergency', 'Under Observation', 'Critical', 'Recovering'],
    default: 'Active'
  },
  // Doctor Schedule fields
  schedule: {
    workingDays: {
      type: [String],
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    },
    workingHours: {
      start: {
        type: String,
        default: '09:00'
      },
      end: {
        type: String,
        default: '17:00'
      }
    },
    breakTime: {
      start: {
        type: String,
        default: '12:00'
      },
      end: {
        type: String,
        default: '13:00'
      }
    },
    appointmentDuration: {
      type: Number,
      default: 30, // minutes
      min: 15,
      max: 120
    }
  },
  leaveDays: [{
    date: {
      type: Date,
      required: true
    },
    reason: {
      type: String,
      enum: ['Vacation', 'Sick Leave', 'Personal', 'Conference', 'Training', 'Other'],
      default: 'Other'
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending'
    },
    notes: String
  }],
  isOnLeave: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for age
userSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to get user permissions
userSchema.methods.hasPermission = function(permission) {
  if (this.role === 'admin') return true;
  return this.permissions.includes(permission);
};

// Method to get user info without password
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.resetPasswordToken;
  delete userObject.resetPasswordExpires;
  return userObject;
};

// Index for better query performance
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ department: 1 });
userSchema.index({ isActive: 1 });

module.exports = mongoose.model('User', userSchema); 