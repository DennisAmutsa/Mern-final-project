const express = require('express');
const router = express.Router();
const Bill = require('../models/Bill');
const Patient = require('../models/Patient');
const { auth } = require('../middleware/auth');
const admin = require('../middleware/admin');

// Middleware: allow only admin or finance roles
function financeOrAdmin(req, res, next) {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'finance')) {
    return next();
  }
  return res.status(403).json({ error: 'Forbidden: Finance/Admins only' });
}

// Get all bills
router.get('/', auth, async (req, res) => {
  try {
    console.log('Billing GET request received from user:', req.user?.email);
    const bills = await Bill.find().populate('patient', 'firstName lastName patientId').populate('createdBy', 'firstName lastName role');
    console.log('Found bills:', bills.length);
    res.json(bills);
  } catch (error) {
    console.error('Error in billing GET route:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single bill
router.get('/:id', auth, async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id).populate('patient', 'firstName lastName patientId').populate('createdBy', 'firstName lastName role');
    if (!bill) return res.status(404).json({ error: 'Bill not found' });
    res.json(bill);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create bill
router.post('/', auth, financeOrAdmin, async (req, res) => {
  try {
    const { patient, services, amount, dueDate, notes } = req.body;
    const bill = new Bill({
      patient,
      services,
      amount,
      dueDate,
      createdBy: req.user._id,
      notes
    });
    await bill.save();
    const populatedBill = await Bill.findById(bill._id).populate('patient', 'firstName lastName patientId').populate('createdBy', 'firstName lastName role');
    res.status(201).json(populatedBill);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update bill
router.put('/:id', auth, financeOrAdmin, async (req, res) => {
  try {
    const bill = await Bill.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!bill) return res.status(404).json({ error: 'Bill not found' });
    res.json(bill);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete bill
router.delete('/:id', auth, financeOrAdmin, async (req, res) => {
  try {
    const bill = await Bill.findByIdAndDelete(req.params.id);
    if (!bill) return res.status(404).json({ error: 'Bill not found' });
    res.json({ message: 'Bill deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 