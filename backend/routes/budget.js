const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');
const Department = require('../models/Department');
const { auth } = require('../middleware/auth');
const admin = require('../middleware/admin');

function financeOrAdmin(req, res, next) {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'finance')) {
    return next();
  }
  return res.status(403).json({ error: 'Forbidden: Finance/Admins only' });
}

// Get all budgets
router.get('/', auth, async (req, res) => {
  try {
    const budgets = await Budget.find().populate('department', 'name').populate('createdBy', 'firstName lastName role');
    res.json(budgets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single budget
router.get('/:id', auth, async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id).populate('department', 'name').populate('createdBy', 'firstName lastName role');
    if (!budget) return res.status(404).json({ error: 'Budget not found' });
    res.json(budget);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create budget
router.post('/', auth, financeOrAdmin, async (req, res) => {
  try {
    const { department, year, allocated, spent, status, notes } = req.body;
    const budget = new Budget({
      department,
      year,
      allocated,
      spent,
      status,
      notes,
      createdBy: req.user._id
    });
    await budget.save();
    res.status(201).json(budget);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update budget
router.put('/:id', auth, financeOrAdmin, async (req, res) => {
  try {
    const budget = await Budget.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!budget) return res.status(404).json({ error: 'Budget not found' });
    res.json(budget);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete budget
router.delete('/:id', auth, financeOrAdmin, async (req, res) => {
  try {
    const budget = await Budget.findByIdAndDelete(req.params.id);
    if (!budget) return res.status(404).json({ error: 'Budget not found' });
    res.json({ message: 'Budget deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 