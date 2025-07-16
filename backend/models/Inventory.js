const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  itemId: { type: String, required: true, unique: true },
  barcode: { type: String, required: true, unique: true },
  batchNumber: { type: String, required: true },
  manufacturer: { type: String, required: true },
  description: { type: String },
  name: { type: String, required: true },
  category: { type: String },
  quantity: { type: Number, default: 0, min: 0 },
  unit: { type: String },
  minStock: { type: Number, default: 0, min: 0 },
  maxStock: { type: Number, min: 0 },
  supplier: { type: String },
  expiryDate: { type: Date },
  cost: { type: Number, default: 0, min: 0 },
  location: { type: String },
  status: { type: String, default: 'Available' }
}, { timestamps: true });

module.exports = mongoose.model('Inventory', inventorySchema); 