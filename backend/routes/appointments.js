const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const { authenticateToken } = require('../middleware/auth');

// Place this route FIRST!
router.get('/available-slots', async (req, res) => {
  try {
    const allSlots = [];
    let hour = 9, minute = 0;
    while (hour < 17) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      allSlots.push(timeString);
      minute += 30;
      if (minute === 60) { hour++; minute = 0; }
    }
    res.json(allSlots);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all appointments with pagination and filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, date, doctor, patient, status, type } = req.query;
    const skip = (page - 1) * limit;
    
    let query = {};
    
    // Role-based filtering
    const userRole = req.user.role;
    
    // If user is admin, nurse, or receptionist, they can see all appointments
    // If user is doctor, only show their appointments
    // If user is patient, only show their appointments
    if (userRole === 'doctor') {
      query.doctor = req.user._id;
    } else if (userRole === 'user' || userRole === 'patient') {
      query.patient = req.user._id;
    }
    // For admin, nurse, receptionist - no additional filtering needed (see all)
    
    // Filter by date
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.appointmentDate = { $gte: startDate, $lt: endDate };
    }
    
    // Additional doctor filter (for admin/nurse/receptionist to filter by specific doctor)
    if (doctor && (userRole === 'admin' || userRole === 'nurse' || userRole === 'receptionist')) {
      query.doctor = doctor;
    } else if (doctor && userRole === 'doctor') {
      // If doctor is filtering by another doctor, ignore it (they can only see their own)
      // This prevents doctors from seeing other doctors' appointments
    }
    
    // Additional patient filter (for admin/nurse/receptionist to filter by specific patient)
    if (patient && (userRole === 'admin' || userRole === 'nurse' || userRole === 'receptionist')) {
      query.patient = patient;
    }
    
    // Filter by status
    if (status) {
      query.status = status;
    }
    
    // Filter by type
    if (type) {
      query.type = type;
    }
    
    // Apply pagination for all roles
    let appointmentsQuery = Appointment.find(query)
      .populate('patient', 'firstName lastName patientId email')
      .populate('doctor', 'firstName lastName specialization email')
      .sort({ appointmentDate: 1, appointmentTime: 1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    let totalQuery = Appointment.countDocuments(query);
    
    const [appointments, total] = await Promise.all([
      appointmentsQuery.lean(),
      totalQuery
    ]);
    
    // Return paginated results for all roles
    res.json({
      appointments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalAppointments: total,
        hasNext: skip + appointments.length < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: error.message });
  }
});

// Place this route BEFORE any /:id route!
router.get('/patient', authenticateToken, async (req, res) => {
  try {
    console.log('--- /api/appointments/patient called ---');
    const { patientId, email } = req.query;
    let query = {};

    console.log('Query params:', req.query);

    if (patientId) {
      query.patient = patientId;
      console.log('Using patientId:', patientId);
    } else if (email) {
      try {
        const User = require('../models/User');
        let user = await User.findOne({ email });
        console.log('User found for email:', user);
        if (user && user.role !== 'doctor') {
          query.patient = user._id;
          console.log('Using user._id as patient:', user._id);
        } else {
          console.log('No user found or user is a doctor, returning [].');
          return res.json([]);
        }
      } catch (err) {
        console.error('Error looking up user:', err);
        return res.status(500).json({ error: 'User lookup failed', details: err.message });
      }
    } else {
      console.log('No patientId or email provided, returning [].');
      return res.json([]);
    }

    try {
      const appointments = await Appointment.find(query)
        .populate('patient', 'firstName lastName email')
        .populate('doctor', 'firstName lastName email department specialization')
        .sort({ appointmentDate: 1, appointmentTime: 1 })
        .lean();

      console.log('Appointments found:', appointments);
      res.json(appointments);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      return res.status(500).json({ error: 'Appointment fetch failed', details: err.message });
    }
  } catch (error) {
    console.error('Error in /patient endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single appointment by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'firstName lastName patientId dateOfBirth gender bloodType contactInfo')
      .populate('doctor', 'firstName lastName specialization department contactInfo')
      .lean();
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new appointment
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { doctor, patient, appointmentDate, appointmentTime, duration, userEmail, reason, type, priority, department } = req.body;
    
    let patientId = patient;
    
    // Check if this is a receptionist/admin booking for a patient
    if (patientId) {
      // Receptionist/admin is booking for a specific patient
      const User = require('../models/User');
      const patientUser = await User.findById(patientId);
      if (!patientUser || (patientUser.role !== 'user' && patientUser.role !== 'patient')) {
        return res.status(400).json({ error: 'Invalid patient selected' });
      }
    } else if (userEmail) {
      // Patient is booking their own appointment
      const User = require('../models/User');
        const user = await User.findOne({ email: userEmail });
      if (user && user.role !== 'doctor') {
        patientId = user._id;
        } else {
        return res.status(400).json({ error: 'User not found or is a doctor' });
      }
    } else {
      return res.status(400).json({ error: 'Patient information is required' });
    }
    
    // Check for scheduling conflicts
    const conflictQuery = {
      doctor,
      appointmentDate: new Date(appointmentDate),
      status: { $in: ['Scheduled', 'Confirmed'] }
    };
    
    const existingAppointments = await Appointment.find(conflictQuery);
    
    const appointmentStart = appointmentTime;
    const appointmentEnd = calculateEndTime(appointmentTime, duration || 30);
    
    const hasConflict = existingAppointments.some(existing => {
      const existingEnd = calculateEndTime(existing.appointmentTime, existing.duration);
      return (
        (appointmentStart >= existing.appointmentTime && appointmentStart < existingEnd) ||
        (appointmentEnd > existing.appointmentTime && appointmentEnd <= existingEnd) ||
        (appointmentStart <= existing.appointmentTime && appointmentEnd >= existingEnd)
      );
    });
    
    if (hasConflict) {
      return res.status(400).json({ error: 'Appointment time conflict detected' });
    }
    
    const appointmentData = {
      ...req.body,
      patient: patientId,
      status: 'Scheduled',
      duration: duration || 30,
      reason: reason || 'General consultation',
      type: type || 'Consultation',
      priority: priority || 'Medium',
      department: department || 'General Medicine'
    };
    
    const appointment = new Appointment(appointmentData);
    await appointment.save();
    
    // Debug logs to verify patient linkage
    console.log('Booking appointment:');
    console.log('Logged-in user email:', userEmail);
    console.log('PatientId used for appointment:', patientId);
    console.log('Created appointment.patient:', appointment.patient);
    
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patient', 'firstName lastName patientId')
      .populate('doctor', 'firstName lastName department');
    
    // Emit real-time update to all connected clients
    if (global.io) {
      global.io.to('appointments').emit('new-appointment', {
        patientName: populatedAppointment.patient
          ? `${populatedAppointment.patient.firstName} ${populatedAppointment.patient.lastName}`
          : 'Unknown Patient',
        doctorName: populatedAppointment.doctor
          ? `Dr. ${populatedAppointment.doctor.firstName} ${populatedAppointment.doctor.lastName}`
          : 'Unknown Doctor',
        date: populatedAppointment.appointmentDate,
        time: populatedAppointment.appointmentTime,
        timestamp: new Date().toISOString()
      });
      
      global.io.to('dashboard').emit('dashboard-update', {
        type: 'appointment',
        count: await Appointment.countDocuments({
          appointmentDate: {
            $gte: new Date().setHours(0, 0, 0, 0),
            $lt: new Date().setHours(23, 59, 59, 999)
          }
        })
      });
    }
    
    res.status(201).json({
      message: 'Appointment created successfully',
      appointment: populatedAppointment
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(400).json({ error: error.message });
  }
});

// Update appointment
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('patient', 'firstName lastName patientId')
    .populate('doctor', 'firstName lastName specialization');
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    res.json({
      message: 'Appointment updated successfully',
      appointment
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete appointment
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get appointments for today
router.get('/today/schedule', authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    let query = {
      appointmentDate: { $gte: today, $lt: tomorrow },
      status: { $in: ['Scheduled', 'Confirmed'] }
    };
    
    // Role-based filtering
    const userRole = req.user.role;
    
    if (userRole === 'doctor') {
      query.doctor = req.user._id;
    } else if (userRole === 'user' || userRole === 'patient') {
      query.patient = req.user._id;
    }
    // For admin, nurse, receptionist - no additional filtering needed (see all)
    
    const appointments = await Appointment.find(query)
      .populate('patient', 'firstName lastName patientId email')
      .populate('doctor', 'firstName lastName specialization department email')
      .sort({ appointmentTime: 1 })
      .lean();
    
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get appointments by date range
router.get('/date-range/:startDate/:endDate', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.params;
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setDate(end.getDate() + 1);
    
    let query = {
      appointmentDate: { $gte: start, $lt: end }
    };
    
    // Role-based filtering
    const userRole = req.user.role;
    
    if (userRole === 'doctor') {
      query.doctor = req.user._id;
    } else if (userRole === 'user' || userRole === 'patient') {
      query.patient = req.user._id;
    }
    // For admin, nurse, receptionist - no additional filtering needed (see all)
    
    const appointments = await Appointment.find(query)
      .populate('patient', 'firstName lastName patientId email')
      .populate('doctor', 'firstName lastName specialization email')
      .sort({ appointmentDate: 1, appointmentTime: 1 })
      .lean();
    
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get appointment statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    // Role-based filtering
    const userRole = req.user.role;
    let baseQuery = {};
    
    if (userRole === 'doctor') {
      baseQuery.doctor = req.user._id;
    } else if (userRole === 'user' || userRole === 'patient') {
      baseQuery.patient = req.user._id;
    }
    // For admin, nurse, receptionist - no additional filtering needed (see all)
    
    const totalAppointments = await Appointment.countDocuments(baseQuery);
    const todayAppointments = await Appointment.countDocuments({
      ...baseQuery,
      appointmentDate: {
        $gte: new Date().setHours(0, 0, 0, 0),
        $lt: new Date().setHours(23, 59, 59, 999)
      }
    });
    
    const statusStats = await Appointment.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const typeStats = await Appointment.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const monthlyStats = await Appointment.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: {
            year: { $year: '$appointmentDate' },
            month: { $month: '$appointmentDate' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);
    
    res.json({
      totalAppointments,
      todayAppointments,
      statusStats,
      typeStats,
      monthlyStats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update appointment status
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    )
    .populate('patient', 'firstName lastName patientId')
    .populate('doctor', 'firstName lastName specialization');
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    res.json({
      message: 'Appointment status updated successfully',
      appointment
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get available slots for a doctor on a given date
router.get('/available-slots', async (req, res) => {
  try {
    const { doctor, date } = req.query;
    if (!doctor || !date) {
      return res.status(400).json({ error: 'doctor and date are required' });
    }
    // Parse date
    const day = new Date(date);
    day.setHours(0,0,0,0);
    const nextDay = new Date(day);
    nextDay.setDate(day.getDate() + 1);
    // Find booked times
    const appointments = await Appointment.find({
      doctor,
      appointmentDate: { $gte: day, $lt: nextDay }
    }).lean();
    const bookedTimes = appointments.map(a => a.appointmentTime);
    // Generate slots (09:00 to 17:00, every 30 min)
    const slots = [];
    for (let hour = 9; hour < 17; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const h = hour.toString().padStart(2, '0');
        const m = min.toString().padStart(2, '0');
        const time = `${h}:${m}`;
        if (!bookedTimes.includes(time)) {
          slots.push(time);
        }
      }
    }
    res.json(slots);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to calculate end time
function calculateEndTime(startTime, duration) {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + duration;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
}

module.exports = router; 