const mongoose = require('mongoose');

const BillSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  services: [{
    name: { type: String, required: true },
    cost: { type: Number, required: true }
  }],
  amount: { type: Number, required: true },
  status: { type: String, enum: ['unpaid', 'paid', 'overdue', 'cancelled'], default: 'unpaid' },
  issuedDate: { type: Date, default: Date.now },
  dueDate: { type: Date },
  paidDate: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Bill', BillSchema); 