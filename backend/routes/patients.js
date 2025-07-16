const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');

// Get medical records for a patient - MUST BE FIRST
router.get('/records', async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.json([]);
    }
    
    // First try to find a patient record
    let patient = await Patient.findOne({ 'contactInfo.email': email });
    
    if (patient) {
      // Return medical history as records
      const records = patient.medicalHistory.map((record, index) => ({
        id: index + 1,
        type: record.condition || 'Medical Record',
        date: record.date,
        doctor: record.doctor,
        description: record.diagnosis || record.treatment
      }));
      
      return res.json(records);
    }
    
    // If no patient record, return empty array for users
    res.json([]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get prescriptions for a patient - MUST BE SECOND
router.get('/prescriptions', async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.json([]);
    }
    
    // First try to find a patient record
    let patient = await Patient.findOne({ 'contactInfo.email': email });
    
    if (patient) {
      // Return current medications as prescriptions
      const prescriptions = patient.currentMedications.map((med, index) => ({
        id: index + 1,
        medication: med.name,
        dosage: med.dosage,
        frequency: med.frequency,
        prescribedBy: med.prescribedBy,
        prescribedDate: med.prescribedDate,
        remainingDays: 30 // Mock remaining days
      }));
      
      return res.json(prescriptions);
    }
    
    // If no patient record, return empty array for users
    res.json([]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get patient data by user ID (for patient dashboard) - MUST BE THIRD
router.get('/user/:userId', async (req, res) => {
  try {
    // First try to find a patient record
    let patient = await Patient.findOne({ 
      $or: [
        { patientId: req.params.userId },
        { 'contactInfo.email': req.params.userId }
      ]
    }).populate('assignedDoctor', 'firstName lastName specialization');
    
    if (patient) {
      return res.json(patient);
    }
    
    // If no patient record, try to find a user
    const User = require('../models/User');
    const user = await User.findOne({ 
      $or: [
        { username: req.params.userId },
        { email: req.params.userId }
      ]
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Return user data as patient data
    const patientData = {
      _id: user._id,
      patientId: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      contactInfo: {
        email: user.email,
        phone: user.contactInfo?.phone || ''
      },
      status: 'Active',
      department: user.department || 'General Medicine',
      assignedDoctor: null
    };
    
    res.json(patientData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all patients with pagination and search
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, department, assignedDoctor } = req.query;
    const skip = (page - 1) * limit;
    
    let query = {};
    
    // Search functionality
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { patientId: { $regex: search, $options: 'i' } },
        { 'contactInfo.phone': { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by status
    if (status) {
      query.status = status;
    }
    
    // Filter by department
    if (department) {
      query.department = department;
    }

    // Filter by assignedDoctor
    if (assignedDoctor) {
      query.assignedDoctor = assignedDoctor;
    }
    
    const patients = await Patient.find(query)
      .populate('assignedDoctor', 'firstName lastName specialization')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    const total = await Patient.countDocuments(query);
    
    res.json({
      patients,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalPatients: total,
        hasNext: skip + patients.length < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// Get single patient by ID
router.get('/:id', async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate('assignedDoctor', 'firstName lastName specialization department')
      .lean();
    
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new patient
router.post('/', async (req, res) => {
  try {
    const patient = new Patient(req.body);
    await patient.save();
    
    const populatedPatient = await Patient.findById(patient._id)
      .populate('assignedDoctor', 'firstName lastName specialization');
    
    res.status(201).json({
      message: 'Patient created successfully',
      patient: populatedPatient
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update patient
router.put('/:id', async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('assignedDoctor', 'firstName lastName specialization');
    
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    res.json({
      message: 'Patient updated successfully',
      patient
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Assign a doctor to a patient
router.put('/:id/assign-doctor', async (req, res) => {
  try {
    const { doctorId } = req.body;
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { assignedDoctor: doctorId },
      { new: true }
    ).populate('assignedDoctor', 'firstName lastName email');
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json({ message: 'Doctor assigned successfully', patient });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete patient
router.delete('/:id', async (req, res) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);
    
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get patient statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const totalPatients = await Patient.countDocuments();
    const activePatients = await Patient.countDocuments({ status: 'Active' });
    const emergencyPatients = await Patient.countDocuments({ status: 'Emergency' });
    const dischargedPatients = await Patient.countDocuments({ status: 'Discharged' });
    
    const departmentStats = await Patient.aggregate([
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const genderStats = await Patient.aggregate([
      {
        $group: {
          _id: '$gender',
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      totalPatients,
      activePatients,
      emergencyPatients,
      dischargedPatients,
      departmentStats,
      genderStats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get patients by department
router.get('/department/:department', async (req, res) => {
  try {
    const patients = await Patient.find({ department: req.params.department })
      .populate('assignedDoctor', 'firstName lastName specialization')
      .sort({ createdAt: -1 })
      .lean();
    
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get emergency patients
router.get('/emergency/active', async (req, res) => {
  try {
    const emergencyPatients = await Patient.find({ status: 'Emergency' })
      .populate('assignedDoctor', 'firstName lastName specialization')
      .sort({ createdAt: -1 })
      .lean();
    
    res.json(emergencyPatients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 