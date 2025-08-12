const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const ShiftHandover = require('../models/ShiftHandover');
const User = require('../models/User');

// Get all shift handovers
router.get('/', auth, async (req, res) => {
  try {
    const handovers = await ShiftHandover.find()
      .populate('handoverFrom', 'firstName lastName')
      .populate('completedBy', 'firstName lastName')
      .sort({ date: -1, createdAt: -1 });
    
    res.json(handovers);
  } catch (error) {
    console.error('Error fetching shift handovers:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get shift handover by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const handover = await ShiftHandover.findById(req.params.id)
      .populate('handoverFrom', 'firstName lastName')
      .populate('completedBy', 'firstName lastName');
    
    if (!handover) {
      return res.status(404).json({ message: 'Shift handover not found' });
    }
    
    res.json(handover);
  } catch (error) {
    console.error('Error fetching shift handover:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get today's shift handover
router.get('/today/:shift', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const handover = await ShiftHandover.findOne({
      date: { $gte: today, $lt: tomorrow },
      shift: req.params.shift
    }).populate('handoverFrom', 'firstName lastName');

    res.json(handover);
  } catch (error) {
    console.error('Error fetching today\'s shift handover:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new shift handover
router.post('/', auth, async (req, res) => {
  try {
    const {
      shift,
      handoverTo,
      patientsUnderCare,
      criticalPatients,
      medicationsDue,
      emergencyAlerts,
      keyNotes,
      specialInstructions,
      equipmentIssues,
      nextShiftPriorities
    } = req.body;

    // Check if handover already exists for today and shift
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingHandover = await ShiftHandover.findOne({
      date: { $gte: today, $lt: tomorrow },
      shift: shift
    });

    if (existingHandover) {
      return res.status(400).json({ message: 'Shift handover already exists for this shift today' });
    }

    const handover = new ShiftHandover({
      shift,
      handoverFrom: req.user.id,
      handoverTo,
      patientsUnderCare,
      criticalPatients: criticalPatients || [],
      medicationsDue: medicationsDue || [],
      emergencyAlerts: emergencyAlerts || [],
      keyNotes,
      specialInstructions: specialInstructions || [],
      equipmentIssues: equipmentIssues || [],
      nextShiftPriorities: nextShiftPriorities || []
    });

    await handover.save();
    
    const populatedHandover = await ShiftHandover.findById(handover._id)
      .populate('handoverFrom', 'firstName lastName');

    res.status(201).json(populatedHandover);
  } catch (error) {
    console.error('Error creating shift handover:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update shift handover
router.put('/:id', auth, async (req, res) => {
  try {
    const handover = await ShiftHandover.findById(req.params.id);
    
    if (!handover) {
      return res.status(404).json({ message: 'Shift handover not found' });
    }

    // Only allow updates if not completed
    if (handover.isCompleted) {
      return res.status(400).json({ message: 'Cannot update completed handover' });
    }

    const updatedHandover = await ShiftHandover.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('handoverFrom', 'firstName lastName');

    res.json(updatedHandover);
  } catch (error) {
    console.error('Error updating shift handover:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Complete shift handover
router.patch('/:id/complete', auth, async (req, res) => {
  try {
    console.log('🔄 Completing handover with ID:', req.params.id);
    console.log('👤 User completing handover:', req.user.id);
    
    const handover = await ShiftHandover.findById(req.params.id);
    
    if (!handover) {
      console.log('❌ Handover not found:', req.params.id);
      return res.status(404).json({ message: 'Shift handover not found' });
    }

    if (handover.isCompleted) {
      console.log('❌ Handover already completed:', req.params.id);
      return res.status(400).json({ message: 'Handover already completed' });
    }

    console.log('✅ Updating handover to completed...');
    handover.isCompleted = true;
    handover.completedAt = new Date();
    handover.completedBy = req.user.id;

    await handover.save();
    console.log('✅ Handover saved successfully');
    
    const populatedHandover = await ShiftHandover.findById(handover._id)
      .populate('handoverFrom', 'firstName lastName')
      .populate('completedBy', 'firstName lastName');

    console.log('✅ Sending completed handover response');
    res.json(populatedHandover);
  } catch (error) {
    console.error('❌ Error completing shift handover:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete shift handover
router.delete('/:id', auth, async (req, res) => {
  try {
    const handover = await ShiftHandover.findById(req.params.id);
    
    if (!handover) {
      return res.status(404).json({ message: 'Shift handover not found' });
    }

    if (handover.isCompleted) {
      return res.status(400).json({ message: 'Cannot delete completed handover' });
    }

    await ShiftHandover.findByIdAndDelete(req.params.id);
    res.json({ message: 'Shift handover deleted successfully' });
  } catch (error) {
    console.error('Error deleting shift handover:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
