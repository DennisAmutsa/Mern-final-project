const mongoose = require('mongoose');

const labEquipmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  equipmentType: {
    type: String,
    required: true,
    enum: [
      'Microscope',
      'Centrifuge',
      'Incubator',
      'Autoclave',
      'Spectrophotometer',
      'PCR Machine',
      'Microplate Reader',
      'pH Meter',
      'Balance',
      'Refrigerator',
      'Freezer',
      'X-Ray Machine',
      'CT Scanner',
      'MRI Machine',
      'Ultrasound Machine',
      'ECG Machine',
      'Other'
    ]
  },
  model: String,
  serialNumber: String,
  location: String,
  status: {
    type: String,
    enum: ['Operational', 'Maintenance', 'Out of Service', 'Retired'],
    default: 'Operational'
  },
  lastCalibration: Date,
  nextCalibration: Date,
  calibrationFrequency: {
    type: Number, // in days
    default: 365
  },
  lastMaintenance: Date,
  nextMaintenance: Date,
  maintenanceFrequency: {
    type: Number, // in days
    default: 90
  },
  assignedTechnician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: String,
  purchaseDate: Date,
  warrantyExpiry: Date,
  manufacturer: String,
  supplier: String
}, {
  timestamps: true
});

// Indexes
labEquipmentSchema.index({ status: 1, nextCalibration: 1 });
labEquipmentSchema.index({ status: 1, nextMaintenance: 1 });
labEquipmentSchema.index({ assignedTechnician: 1 });

module.exports = mongoose.model('LabEquipment', labEquipmentSchema);
