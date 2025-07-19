const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

// Create new doctor (Admin only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can create doctors' });
    }

    const { firstName, lastName, email, department, specialization, phone, password } = req.body;
    const username = req.body.username || email; // fallback to email if username not provided

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create new doctor user
    const doctor = new User({
      firstName,
      lastName,
      email,
      username,
      password,
      role: 'doctor',
      department,
      specialization,
      phone,
      isActive: true
    });

    await doctor.save();

    // Return doctor data without password
    const doctorData = doctor.toObject();
    delete doctorData.password;
    delete doctorData.resetPasswordToken;
    delete doctorData.resetPasswordExpires;

    res.status(201).json({
      message: 'Doctor created successfully',
      doctor: doctorData
    });
  } catch (error) {
    console.error('Error creating doctor:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all doctors with their schedules
router.get('/', async (req, res) => {
  try {
    console.log('🔍 Doctors GET request received');
    const { roles } = req.query;
    let query = { role: 'doctor' };
    
    if (roles) {
      const roleArray = roles.split(',');
      query.role = { $in: roleArray };
    }
    
    console.log('📋 Query:', query);
    const doctors = await User.find(query)
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .populate('assignedDoctor', 'firstName lastName')
      .lean();
    
    console.log('📊 Found doctors:', doctors.length);
    res.json(doctors);
  } catch (error) {
    console.error('❌ Error fetching doctors:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get doctor schedule by ID
router.get('/:id/schedule', async (req, res) => {
  try {
    const doctor = await User.findById(req.params.id)
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .lean();
    
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    
    res.json({
      doctor: {
        _id: doctor._id,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        department: doctor.department,
        email: doctor.email
      },
      schedule: doctor.schedule || {
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        workingHours: { start: '09:00', end: '17:00' },
        breakTime: { start: '12:00', end: '13:00' },
        appointmentDuration: 30
      },
      leaveDays: doctor.leaveDays || [],
      isOnLeave: doctor.isOnLeave || false
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update doctor information (Admin only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can update doctors' });
    }
    
    const { firstName, lastName, email, department, specialization, phone } = req.body;
    
    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (email) updateData.email = email;
    if (department) updateData.department = department;
    if (specialization) updateData.specialization = specialization;
    if (phone) updateData.contactInfo = { ...updateData.contactInfo, phone };
    
    const doctor = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -resetPasswordToken -resetPasswordExpires');
    
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    
    res.json({
      message: 'Doctor updated successfully',
      doctor
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update doctor schedule (Admin only)
router.put('/:id/schedule', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can update doctor schedules' });
    }
    
    const { schedule, leaveDays, isOnLeave } = req.body;
    
    const updateData = {};
    if (schedule) updateData.schedule = schedule;
    if (leaveDays) updateData.leaveDays = leaveDays;
    if (typeof isOnLeave === 'boolean') updateData.isOnLeave = isOnLeave;
    
    const doctor = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -resetPasswordToken -resetPasswordExpires');
    
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    
    res.json({
      message: 'Doctor schedule updated successfully',
      doctor: {
        _id: doctor._id,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        department: doctor.department,
        schedule: doctor.schedule,
        leaveDays: doctor.leaveDays,
        isOnLeave: doctor.isOnLeave
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get doctor availability for a specific date
router.get('/:id/availability/:date', async (req, res) => {
  try {
    const { id, date } = req.params;
    const targetDate = new Date(date);
    
    const doctor = await User.findById(id).lean();
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    
    // Check if doctor works on this day
    const dayOfWeek = targetDate.toLocaleDateString('en-US', { weekday: 'long' });
    const schedule = doctor.schedule || {
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      workingHours: { start: '09:00', end: '17:00' },
      breakTime: { start: '12:00', end: '13:00' },
      appointmentDuration: 30
    };
    
    const isWorkingDay = schedule.workingDays.includes(dayOfWeek);
    
    // Check if doctor is on leave
    const leaveDays = doctor.leaveDays || [];
    const isOnLeave = leaveDays.some(leave => {
      const leaveDate = new Date(leave.date);
      return leaveDate.toDateString() === targetDate.toDateString() && 
             leave.status === 'Approved';
    });
    
    if (!isWorkingDay || isOnLeave) {
      return res.json({
        available: false,
        reason: !isWorkingDay ? 'Not a working day' : 'On leave'
      });
    }
    
    // Generate time slots
    const timeSlots = [];
    const startTime = schedule.workingHours.start;
    const endTime = schedule.workingHours.end;
    const breakStart = schedule.breakTime.start;
    const breakEnd = schedule.breakTime.end;
    const duration = schedule.appointmentDuration || 30;
    
    let currentTime = new Date(`2000-01-01T${startTime}:00`);
    const endDateTime = new Date(`2000-01-01T${endTime}:00`);
    
    while (currentTime < endDateTime) {
      const timeString = currentTime.toTimeString().slice(0, 5);
      
      // Skip break time
      if (timeString >= breakStart && timeString < breakEnd) {
        currentTime.setMinutes(currentTime.getMinutes() + duration);
        continue;
      }
      
      timeSlots.push(timeString);
      currentTime.setMinutes(currentTime.getMinutes() + duration);
    }
    
    res.json({
      available: true,
      workingHours: schedule.workingHours,
      breakTime: schedule.breakTime,
      appointmentDuration: duration,
      timeSlots
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all doctors availability for a date
router.get('/availability/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const targetDate = new Date(date);
    const dayOfWeek = targetDate.toLocaleDateString('en-US', { weekday: 'long' });
    
    const doctors = await User.find({ role: 'doctor' }).lean();
    
    const availability = await Promise.all(doctors.map(async (doctor) => {
      const schedule = doctor.schedule || {
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        workingHours: { start: '09:00', end: '17:00' },
        breakTime: { start: '12:00', end: '13:00' },
        appointmentDuration: 30
      };
      
      const isWorkingDay = schedule.workingDays.includes(dayOfWeek);
      
      // Check leave
      const leaveDays = doctor.leaveDays || [];
      const isOnLeave = leaveDays.some(leave => {
        const leaveDate = new Date(leave.date);
        return leaveDate.toDateString() === targetDate.toDateString() && 
               leave.status === 'Approved';
      });
      
      return {
        doctorId: doctor._id,
        doctorName: `${doctor.firstName} ${doctor.lastName}`,
        department: doctor.department,
        available: isWorkingDay && !isOnLeave,
        workingHours: schedule.workingHours,
        breakTime: schedule.breakTime,
        appointmentDuration: schedule.appointmentDuration || 30,
        isOnLeave
      };
    }));
    
    res.json(availability);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single doctor by ID
router.get('/:id', async (req, res) => {
  try {
    const doctor = await User.findById(req.params.id)
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .lean();
    
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete doctor (Admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete doctors' });
    }

    const doctor = await User.findById(req.params.id);
    
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    if (doctor.role !== 'doctor') {
      return res.status(400).json({ error: 'User is not a doctor' });
    }

    // Check if doctor has any assigned patients
    const assignedPatients = await User.find({ assignedDoctor: req.params.id });
    if (assignedPatients.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete doctor with assigned patients. Please reassign patients first.' 
      });
    }

    await User.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Doctor deleted successfully' });
  } catch (error) {
    console.error('Error deleting doctor:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 