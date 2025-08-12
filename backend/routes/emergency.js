const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');

// Enhanced GET / route with filtering
router.get('/', async (req, res) => {
  try {
    const { status, severity, doctor, patient } = req.query;
    let appointmentQuery = { type: 'Emergency' };

    if (doctor) appointmentQuery.doctor = doctor;
    if (severity) appointmentQuery.priority = severity;

    // Find all emergency appointments
    const emergencyAppointments = await Appointment.find(appointmentQuery)
      .populate('doctor', 'firstName lastName email')
      .populate('patient', 'firstName lastName email role')
      .sort({ createdAt: -1 })
      .lean();

    // Process results to include both patient records and user records
    const results = [];
    for (const apt of emergencyAppointments) {
      if (apt.patient) {
        // If patient is a user (has role field), create a patient-like object
        if (apt.patient.role) {
          const patientData = {
            _id: apt.patient._id,
            firstName: apt.patient.firstName,
            lastName: apt.patient.lastName,
            patientId: apt.patient.username || apt.patient._id,
            contactInfo: {
              email: apt.patient.email,
              phone: apt.patient.contactInfo?.phone || '000-000-0000'
            },
            status: 'Emergency',
            department: 'Emergency'
          };
          results.push({ patient: patientData, appointment: apt });
        } else {
          // If patient is a Patient record, use as is
          results.push({ patient: apt.patient, appointment: apt });
        }
      }
    }

    // Filter by patient if specified
    if (patient) {
      const filtered = results.filter(r => r.patient._id.toString() === patient);
      res.json(filtered);
    } else {
    res.json(results);
    }
  } catch (error) {
    console.error('Error fetching emergencies:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create emergency case
router.post('/', async (req, res) => {
  try {
    const { patientId, emergencyType, severity, symptoms, assignedDoctor } = req.body;
    
    console.log('🔍 Emergency creation request:', { patientId, emergencyType, severity, symptoms, assignedDoctor });
    
    // First try to find a patient record
    let patient = await Patient.findById(patientId);
    console.log('🔍 Found existing patient:', patient ? 'Yes' : 'No');
    
         // If no patient record, try to find a user with role 'user'
     if (!patient) {
       console.log('🔍 Looking for user with ID:', patientId);
       const user = await User.findById(patientId);
       console.log('🔍 Found user:', user ? `${user.firstName} ${user.lastName} (${user.role})` : 'No user found');
       
               if (!user || (user.role !== 'user' && user.role !== 'patient')) {
          console.log('❌ User not found or not a patient user (role:', user?.role, ')');
          return res.status(404).json({ error: 'Patient not found' });
        }
      
      // Create a patient record from the user data
      patient = new Patient({
        patientId: user.username || `P${Date.now().toString().slice(-6)}`,
        firstName: user.firstName,
        lastName: user.lastName,
        dateOfBirth: user.dateOfBirth || new Date('1990-01-01'),
        gender: user.gender || 'Other',
        bloodType: user.bloodType || 'O+',
                 contactInfo: {
           phone: user.contactInfo?.phone || '000-000-0000', // Provide default phone if missing
           email: user.email,
           address: user.contactInfo?.address || {}
         },
        emergencyContact: user.emergencyContact || {},
        insurance: user.insurance || {},
        status: 'Emergency',
        department: 'Emergency',
        assignedDoctor: user.assignedDoctor
      });
      
      await patient.save();
      console.log('✅ Created new patient record from user:', patient.patientId);
    } else {
      // Update existing patient status to emergency
      patient = await Patient.findByIdAndUpdate(
      patientId,
      { 
        status: 'Emergency',
        department: 'Emergency'
      },
      { new: true }
    );
    }
    
    // Create emergency appointment
    const emergencyAppointment = new Appointment({
       patient: patientId, // Use the original user ID, not the patient record ID
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
    console.log('✅ Created emergency appointment for patient:', patient._id);
    
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
    console.error('❌ Error creating emergency:', error);
    console.error('❌ Error stack:', error.stack);
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
    
    const resolvedToday = await Appointment.countDocuments({
      type: 'Emergency',
      status: 'Completed',
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
      resolvedToday,
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
    
    console.log('🔍 Updating emergency status for ID:', req.params.id, 'Status:', status);
    
    // Validate status
    const validAppointmentStatuses = ['Scheduled', 'Confirmed', 'In Progress', 'Completed', 'Cancelled', 'No Show'];
    if (!validAppointmentStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }
    
    // First try to find the emergency appointment directly
    const latestApt = await Appointment.findOne({ 
      $or: [
        { patient: req.params.id, type: 'Emergency' },
        { _id: req.params.id, type: 'Emergency' }
      ]
    }).sort({ createdAt: -1 });
    
    if (!latestApt) {
      console.log('❌ Emergency appointment not found for ID:', req.params.id);
      return res.status(404).json({ error: 'Emergency case not found' });
    }
    
    console.log('✅ Found emergency appointment:', latestApt._id);
    
    // Find the patient/user
    let patient = await Patient.findById(latestApt.patient);
    let user = null;
    
    if (!patient) {
      // If no patient record, try to find the user
      user = await User.findById(latestApt.patient);
      if (!user) {
        console.log('❌ Neither patient nor user found for ID:', latestApt.patient);
        return res.status(404).json({ error: 'Patient not found' });
      }
      console.log('✅ Found user:', user.firstName, user.lastName);
    } else {
      console.log('✅ Found patient:', patient.firstName, patient.lastName);
    }
    
    // Update appointment status
    latestApt.status = status;
    if (outcome) latestApt.outcome = outcome;
    await latestApt.save();
    
    console.log('✅ Updated appointment status to:', status);
    
    // Update patient/user status based on appointment status
    let patientStatus = 'Active';
    if (status === 'Completed') {
      patientStatus = 'Discharged';
    } else if (status === 'Cancelled') {
      patientStatus = 'Inactive';
    } else if (status === 'In Progress') {
      patientStatus = 'Emergency';
    }
    
    // Update patient or user status
    if (patient) {
      patient.status = patientStatus;
      await patient.save();
      console.log('✅ Updated patient status to:', patientStatus);
    } else if (user) {
      // For users, we might want to update a different field or create a patient record
      console.log('✅ User status update not implemented yet');
    }
    
    // Emit real-time update
    if (global.io) {
      const patientName = patient ? `${patient.firstName} ${patient.lastName}` : `${user.firstName} ${user.lastName}`;
      global.io.to('emergency').emit('emergency-update', {
        patientName: patientName,
        status: status,
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      message: 'Emergency case status updated successfully',
      appointment: latestApt,
      patient: patient ? patient.toObject() : user.toObject()
    });
  } catch (error) {
    console.error('Error updating emergency status:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router; 