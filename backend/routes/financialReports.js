const express = require('express');
const router = express.Router();
const FinancialReport = require('../models/FinancialReport');
const { auth } = require('../middleware/auth');
const admin = require('../middleware/admin');

function financeOrAdmin(req, res, next) {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'finance')) {
    return next();
  }
  return res.status(403).json({ error: 'Forbidden: Finance/Admins only' });
}

// Get all reports
router.get('/', auth, async (req, res) => {
  try {
    const reports = await FinancialReport.find().populate('createdBy', 'firstName lastName role');
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single report
router.get('/:id', auth, async (req, res) => {
  try {
    const report = await FinancialReport.findById(req.params.id).populate('createdBy', 'firstName lastName role');
    if (!report) return res.status(404).json({ error: 'Report not found' });
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create report
router.post('/', auth, financeOrAdmin, async (req, res) => {
  try {
    const { type, period, totals, notes } = req.body;
    const report = new FinancialReport({
      type,
      period,
      totals,
      notes,
      createdBy: req.user._id
    });
    await report.save();
    res.status(201).json(report);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update report
router.put('/:id', auth, financeOrAdmin, async (req, res) => {
  try {
    const report = await FinancialReport.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!report) return res.status(404).json({ error: 'Report not found' });
    res.json(report);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete report
router.delete('/:id', auth, financeOrAdmin, async (req, res) => {
  try {
    const report = await FinancialReport.findByIdAndDelete(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found' });
    res.json({ message: 'Report deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 