const express = require('express');
const router = express.Router();
const Vitals = require('../models/Vitals');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// Get all vitals for a patient
router.get('/patient/:patientId', auth, async (req, res) => {
  try {
    const vitals = await Vitals.find({ patient: req.params.patientId })
      .populate('patient', 'firstName lastName')
      .populate('recordedBy', 'firstName lastName')
      .sort({ recordedAt: -1 });
    
    res.json(vitals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get latest vitals for all patients
router.get('/latest', auth, async (req, res) => {
  try {
    const vitals = await Vitals.aggregate([
      {
        $sort: { recordedAt: -1 }
      },
      {
        $group: {
          _id: '$patient',
          latestVitals: { $first: '$$ROOT' }
        }
      },
      {
        $replaceRoot: { newRoot: '$latestVitals' }
      }
    ]);

    await Vitals.populate(vitals, [
      { path: 'patient', select: 'firstName lastName' },
      { path: 'recordedBy', select: 'firstName lastName' }
    ]);

    res.json(vitals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new vitals
router.post('/', auth, async (req, res) => {
  try {
    const { patientId, bloodPressure, heartRate, temperature, respiratoryRate, oxygenSaturation, notes } = req.body;
    
    // Parse blood pressure string (e.g., "120/80") into object
    let parsedBloodPressure = bloodPressure;
    if (typeof bloodPressure === 'string' && bloodPressure.includes('/')) {
      const [systolic, diastolic] = bloodPressure.split('/').map(num => parseInt(num.trim()));
      if (!isNaN(systolic) && !isNaN(diastolic)) {
        parsedBloodPressure = { systolic, diastolic };
      } else {
        return res.status(400).json({ error: 'Invalid blood pressure format. Use format like "120/80"' });
      }
    } else if (typeof bloodPressure === 'string') {
      return res.status(400).json({ error: 'Blood pressure must be in format "systolic/diastolic" (e.g., "120/80")' });
    }
    
    // Validate required fields
    if (!patientId || !parsedBloodPressure || !heartRate || !temperature) {
      return res.status(400).json({ error: 'Patient, blood pressure, heart rate, and temperature are required' });
    }
    
    const vitals = new Vitals({
      patient: patientId,
      bloodPressure: parsedBloodPressure,
      heartRate: parseInt(heartRate),
      temperature: parseFloat(temperature),
      respiratoryRate: respiratoryRate ? parseInt(respiratoryRate) : null,
      oxygenSaturation: oxygenSaturation ? parseInt(oxygenSaturation) : null,
      notes,
      recordedBy: req.user.id
    });
    
    await vitals.save();
    
    // Update patient's lastVitalCheck
    await User.findByIdAndUpdate(patientId, {
      lastVitalCheck: new Date()
    });
    
    await vitals.populate([
      { path: 'patient', select: 'firstName lastName' },
      { path: 'recordedBy', select: 'firstName lastName' }
    ]);
    
    res.status(201).json(vitals);
  } catch (error) {
    console.error('Error saving vitals:', error);
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: `Validation error: ${validationErrors.join(', ')}` });
    }
    res.status(400).json({ error: error.message });
  }
});

// Get critical vitals
router.get('/critical', auth, async (req, res) => {
  try {
    const criticalVitals = await Vitals.find({ status: 'Critical' })
      .populate('patient', 'firstName lastName')
      .populate('recordedBy', 'firstName lastName')
      .sort({ recordedAt: -1 });
    
    res.json(criticalVitals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
