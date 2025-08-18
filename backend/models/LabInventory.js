const mongoose = require('mongoose');

const labInventorySchema = new mongoose.Schema({
  itemName: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Reagents',
      'Consumables',
      'Glassware',
      'Safety Equipment',
      'Test Kits',
      'Media',
      'Antibodies',
      'Enzymes',
      'Standards',
      'Other'
    ]
  },
  description: String,
  unit: {
    type: String,
    required: true,
    enum: ['ml', 'mg', 'g', 'pieces', 'boxes', 'bottles', 'tubes', 'plates', 'kits']
  },
  currentStock: {
    type: Number,
    required: true,
    default: 0
  },
  minimumStock: {
    type: Number,
    required: true,
    default: 10
  },
  maximumStock: {
    type: Number,
    required: true,
    default: 100
  },
  supplier: String,
  catalogNumber: String,
  cost: {
    type: Number,
    default: 0
  },
  expiryDate: Date,
  location: String,
  status: {
    type: String,
    enum: ['Available', 'Low Stock', 'Out of Stock', 'Expired'],
    default: 'Available'
  },
  lastRestocked: Date,
  assignedTechnician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: String
}, {
  timestamps: true
});

// Indexes
labInventorySchema.index({ status: 1, currentStock: 1 });
labInventorySchema.index({ category: 1, status: 1 });
labInventorySchema.index({ expiryDate: 1 });

module.exports = mongoose.model('LabInventory', labInventorySchema);
