const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');

// Enhanced GET / route with filtering
router.get('/', async (req, res) => {
  try {
    const { status, severity, doctor, patient } = req.query;
    let patientQuery = {};
    let appointmentQuery = { type: 'Emergency' };

    if (status) patientQuery.status = status;
    if (patient) patientQuery._id = patient;

    // Find patients matching criteria
    const patients = await Patient.find(patientQuery)
      .populate('assignedDoctor', 'firstName lastName specialization')
      .sort({ createdAt: -1 })
      .lean();

    // For each patient, find their latest emergency appointment and filter by doctor/severity if needed
    const results = [];
    for (const p of patients) {
      let aptQuery = { ...appointmentQuery, patient: p._id };
      if (doctor) aptQuery.doctor = doctor;
      if (severity) aptQuery.priority = severity;
      const latestApt = await Appointment.findOne(aptQuery)
        .sort({ createdAt: -1 })
        .populate('doctor', 'firstName lastName email');
      if (latestApt) {
        results.push({ patient: p, appointment: latestApt });
      }
    }
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create emergency case
router.post('/', async (req, res) => {
  try {
    const { patientId, emergencyType, severity, symptoms, assignedDoctor } = req.body;
    
    // Update patient status to emergency
    const patient = await Patient.findByIdAndUpdate(
      patientId,
      { 
        status: 'Emergency',
        department: 'Emergency'
      },
      { new: true }
    );
    
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    // Create emergency appointment
    const emergencyAppointment = new Appointment({
      patient: patientId,
      doctor: assignedDoctor,
      appointmentDate: new Date(),
      appointmentTime: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      type: 'Emergency',
      status: 'In Progress',
      priority: severity === 'Critical' ? 'Emergency' : 'High',
      reason: emergencyType,
      symptoms: symptoms,
      department: 'Emergency'
    });
    
    await emergencyAppointment.save();
    
    // Emit real-time update to all connected clients
    if (global.io) {
      global.io.to('emergency').emit('new-emergency', {
        patientName: `${patient.firstName} ${patient.lastName}`,
        condition: emergencyType,
        severity: severity,
        timestamp: new Date().toISOString()
      });
      
      global.io.to('dashboard').emit('dashboard-update', {
        type: 'emergency',
        count: await Patient.countDocuments({ status: 'Emergency' })
      });
    }
    
    res.status(201).json({
      message: 'Emergency case created successfully',
      patient,
      appointment: emergencyAppointment
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get emergency statistics
router.get('/stats', async (req, res) => {
  try {
    const totalEmergency = await Patient.countDocuments({ status: 'Emergency' });
    const todayEmergency = await Appointment.countDocuments({
      type: 'Emergency',
      appointmentDate: {
        $gte: new Date().setHours(0, 0, 0, 0),
        $lt: new Date().setHours(23, 59, 59, 999)
      }
    });
    
    const emergencyTypes = await Appointment.aggregate([
      { $match: { type: 'Emergency' } },
      {
        $group: {
          _id: '$reason',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const severityStats = await Appointment.aggregate([
      { $match: { type: 'Emergency' } },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);
    // Add available staff (active doctors from users collection)
    const User = require('../models/User');
    const availableStaff = await User.countDocuments({ role: 'doctor', isActive: true });
    res.json({
      totalEmergency,
      todayEmergency,
      emergencyTypes,
      severityStats,
      availableStaff
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update emergency case status and sync appointment
router.put('/:id/status', async (req, res) => {
  try {
    const { status, outcome } = req.body;
    
    // Validate status
    const validAppointmentStatuses = ['Scheduled', 'Confirmed', 'In Progress', 'Completed', 'Cancelled', 'No Show'];
    if (!validAppointmentStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }
    
    // Find the patient
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ error: 'Emergency case not found' });
    }
    
    // Update latest emergency appointment for this patient
    const latestApt = await Appointment.findOne({ patient: req.params.id, type: 'Emergency' }).sort({ createdAt: -1 });
    if (!latestApt) {
      return res.status(404).json({ error: 'Emergency appointment not found' });
    }
    
    // Update appointment status
    latestApt.status = status;
    if (outcome) latestApt.outcome = outcome;
    await latestApt.save();
    
    // Update patient status based on appointment status
    let patientStatus = 'Active';
    if (status === 'Completed') {
      patientStatus = 'Discharged';
    } else if (status === 'Cancelled') {
      patientStatus = 'Inactive';
    } else if (status === 'In Progress') {
      patientStatus = 'Emergency';
    }
    
    // Update patient status
    patient.status = patientStatus;
    await patient.save();
    
    // Emit real-time update
    if (global.io) {
      global.io.to('emergency').emit('emergency-update', {
        patientName: `${patient.firstName} ${patient.lastName}`,
        status: status,
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      message: 'Emergency case status updated successfully',
      patient: { ...patient.toObject(), appointment: latestApt }
    });
  } catch (error) {
    console.error('Error updating emergency status:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router; 