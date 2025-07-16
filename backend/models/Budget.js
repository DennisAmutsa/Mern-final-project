const mongoose = require('mongoose');

const BudgetSchema = new mongoose.Schema({
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  year: { type: Number, required: true },
  allocated: { type: Number, required: true },
  spent: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'closed'], default: 'pending' },
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Budget', BudgetSchema); 