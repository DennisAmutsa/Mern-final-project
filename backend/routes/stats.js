const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Patient = require('../models/Patient');
const { authenticateToken } = require('../middleware/auth');
const mongoose = require('mongoose');

// Get comprehensive hospital statistics for SDG 3 reporting
router.get('/sdg3-overview', async (req, res) => {
  try {
    // Patient statistics - using User model with role 'user'
    const totalPatients = await User.countDocuments({ role: 'user' });
    const activePatients = await User.countDocuments({ role: 'user', status: 'Active' });
    const emergencyPatients = await User.countDocuments({ role: 'user', status: 'Emergency' });
    const dischargedPatients = await User.countDocuments({ role: 'user', status: 'Discharged' });
    
    // Doctor statistics - using User model with role 'doctor'
    const totalDoctors = await User.countDocuments({ role: 'doctor' });
    const activeDoctors = await User.countDocuments({ role: 'doctor', isActive: true });
    
    // Appointment statistics
    const totalAppointments = await Appointment.countDocuments();
    const todayAppointments = await Appointment.countDocuments({
      appointmentDate: {
        $gte: new Date().setHours(0, 0, 0, 0),
        $lt: new Date().setHours(23, 59, 59, 999)
      }
    });
    const completedAppointments = await Appointment.countDocuments({ status: 'Completed' });
    const emergencyAppointments = await Appointment.countDocuments({ type: 'Emergency' });
    
    // Department statistics - using User model
    const departmentStats = await User.aggregate([
      { $match: { role: 'user' } },
      {
        $group: {
          _id: '$department',
          patientCount: { $sum: 1 }
        }
      }
    ]);
    
    // Gender distribution - using User model
    const genderStats = await User.aggregate([
      { $match: { role: 'user' } },
      {
        $group: {
          _id: '$gender',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Age group distribution - using User model
    const ageStats = await User.aggregate([
      { $match: { role: 'user' } },
      {
        $addFields: {
          age: {
            $floor: {
              $divide: [
                { $subtract: [new Date(), '$dateOfBirth'] },
                365 * 24 * 60 * 60 * 1000
              ]
            }
          }
        }
      },
      {
        $group: {
          _id: {
            $cond: {
              if: { $lt: ['$age', 18] },
              then: '0-17',
              else: {
                $cond: {
                  if: { $lt: ['$age', 30] },
                  then: '18-29',
                  else: {
                    $cond: {
                      if: { $lt: ['$age', 50] },
                      then: '30-49',
                      else: {
                        $cond: {
                          if: { $lt: ['$age', 65] },
                          then: '50-64',
                          else: '65+'
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Monthly trends
    const monthlyStats = await Appointment.aggregate([
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
    
    // SDG 3 Impact Metrics
    const sdg3Metrics = {
      healthcareAccess: {
        totalPatientsServed: totalPatients,
        activePatients: activePatients,
        emergencyCasesHandled: emergencyPatients,
        appointmentCompletionRate: totalAppointments > 0 ? ((completedAppointments / totalAppointments) * 100).toFixed(2) : 0
      },
      healthcareQuality: {
        totalMedicalStaff: totalDoctors,
        activeMedicalStaff: activeDoctors,
        emergencyResponse: emergencyAppointments,
        patientSatisfaction: '85%' // Mock data
      },
      healthcareCoverage: {
        departmentsCovered: departmentStats.length,
        genderEquity: genderStats,
        ageGroupCoverage: ageStats,
        geographicCoverage: 'Local Community' // Mock data
      }
    };
    
    res.json({
      overview: {
        totalPatients,
        activePatients,
        emergencyPatients,
        dischargedPatients,
        totalDoctors,
        activeDoctors,
        totalAppointments,
        todayAppointments,
        completedAppointments,
        emergencyAppointments
      },
      departmentStats,
      genderStats,
      ageStats,
      monthlyStats,
      sdg3Metrics
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get real-time dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Today's statistics
    const todayPatients = await User.countDocuments({
      role: 'user',
      admissionDate: { $gte: today, $lt: tomorrow }
    });
    
    const todayAppointments = await Appointment.countDocuments({
      appointmentDate: { $gte: today, $lt: tomorrow }
    });
    
    const todayEmergency = await Appointment.countDocuments({
      type: 'Emergency',
      appointmentDate: { $gte: today, $lt: tomorrow }
    });
    
    // Current active cases
    const activePatients = await User.countDocuments({ role: 'user', status: 'Active' });
    const emergencyCases = await User.countDocuments({ role: 'user', status: 'Emergency' });
    
    // Staff availability
    const availableDoctors = await User.countDocuments({ role: 'doctor', isActive: true });
    const onLeaveDoctors = await User.countDocuments({ role: 'doctor', isActive: false });
    
    // Recent activities
    const recentAppointments = await Appointment.find()
      .populate('patient', 'firstName lastName patientId')
      .populate('doctor', 'firstName lastName email department')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
    
    const recentPatients = await User.find({ role: 'user' })
      .populate('assignedDoctor', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Calculate percentage changes (comparing with previous month)
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const lastMonthPatients = await User.countDocuments({
      admissionDate: { $gte: lastMonth }
    });
    const currentMonthPatients = await User.countDocuments({
      admissionDate: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
    });
    
    const lastMonthDoctors = await Doctor.countDocuments({
      createdAt: { $gte: lastMonth }
    });
    const currentMonthDoctors = await Doctor.countDocuments({
      createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
    });
    
    const lastMonthAppointments = await Appointment.countDocuments({
      appointmentDate: { $gte: lastMonth }
    });
    const currentMonthAppointments = await Appointment.countDocuments({
      appointmentDate: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
    });
    
    const lastMonthEmergency = await User.countDocuments({
      status: 'Emergency',
      admissionDate: { $gte: lastMonth }
    });
    const currentMonthEmergency = await User.countDocuments({
      status: 'Emergency',
      admissionDate: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
    });
    
    // Calculate percentage changes
    const patientChange = lastMonthPatients > 0 ? 
      `${((currentMonthPatients - lastMonthPatients) / lastMonthPatients * 100).toFixed(1)}%` : '0%';
    const doctorChange = lastMonthDoctors > 0 ? 
      `${((currentMonthDoctors - lastMonthDoctors) / lastMonthDoctors * 100).toFixed(1)}%` : '0%';
    const appointmentChange = lastMonthAppointments > 0 ? 
      `${((currentMonthAppointments - lastMonthAppointments) / lastMonthAppointments * 100).toFixed(1)}%` : '0%';
    const emergencyChange = lastMonthEmergency > 0 ? 
      `${((currentMonthEmergency - lastMonthEmergency) / lastMonthEmergency * 100).toFixed(1)}%` : '0%';

    res.json({
      overview: {
        totalPatients: await User.countDocuments(),
        totalStaff: await User.countDocuments({ role: { $nin: ['user', 'patient'] } }),
        activeDoctors: await User.countDocuments({ role: 'doctor', isActive: true }),
        todayAppointments,
        emergencyPatients: await User.countDocuments({ status: 'Emergency' }),
        patientChange: patientChange.startsWith('-') ? patientChange : `+${patientChange}`,
        doctorChange: doctorChange.startsWith('-') ? doctorChange : `+${doctorChange}`,
        appointmentChange: appointmentChange.startsWith('-') ? appointmentChange : `+${appointmentChange}`,
        emergencyChange: emergencyChange.startsWith('-') ? emergencyChange : `+${emergencyChange}`
      },
      recent: {
        appointments: recentAppointments,
        patients: recentPatients
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get department performance statistics
router.get('/department-performance', async (req, res) => {
  try {
    const departmentStats = await Patient.aggregate([
      {
        $group: {
          _id: '$department',
          patientCount: { $sum: 1 },
          activePatients: {
            $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] }
          },
          emergencyPatients: {
            $sum: { $cond: [{ $eq: ['$status', 'Emergency'] }, 1, 0] }
          }
        }
      }
    ]);
    
    // Get appointment statistics by department
    const appointmentStats = await Appointment.aggregate([
      {
        $group: {
          _id: '$department',
          totalAppointments: { $sum: 1 },
          completedAppointments: {
            $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
          },
          emergencyAppointments: {
            $sum: { $cond: [{ $eq: ['$type', 'Emergency'] }, 1, 0] }
          }
        }
      }
    ]);
    
    // Combine statistics
    const performanceStats = departmentStats.map(dept => {
      const appointmentData = appointmentStats.find(apt => apt._id === dept._id) || {
        totalAppointments: 0,
        completedAppointments: 0,
        emergencyAppointments: 0
      };
      
      return {
        department: dept._id,
        patientCount: dept.patientCount,
        activePatients: dept.activePatients,
        emergencyPatients: dept.emergencyPatients,
        totalAppointments: appointmentData.totalAppointments,
        completedAppointments: appointmentData.completedAppointments,
        emergencyAppointments: appointmentData.emergencyAppointments,
        completionRate: appointmentData.totalAppointments > 0 
          ? ((appointmentData.completedAppointments / appointmentData.totalAppointments) * 100).toFixed(2)
          : 0
      };
    });
    
    res.json(performanceStats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get trend analysis
router.get('/trends', async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    
    let groupBy = {};
    if (period === 'monthly') {
      groupBy = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' }
      };
    } else if (period === 'weekly') {
      groupBy = {
        year: { $year: '$createdAt' },
        week: { $week: '$createdAt' }
      };
    } else if (period === 'daily') {
      groupBy = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        day: { $dayOfMonth: '$createdAt' }
      };
    }
    
    // Patient trends
    const patientTrends = await Patient.aggregate([
      {
        $group: {
          _id: groupBy,
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1, '_id.week': -1 } },
      { $limit: 12 }
    ]);
    
    // Appointment trends
    const appointmentTrends = await Appointment.aggregate([
      {
        $group: {
          _id: groupBy,
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1, '_id.week': -1 } },
      { $limit: 12 }
    ]);
    
    res.json({
      patientTrends,
      appointmentTrends,
      period
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user dashboard statistics
router.get('/user-dashboard', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get user's appointments
    const totalAppointments = await Appointment.countDocuments({ 
      patient: userId
    });
    
    const upcomingAppointments = await Appointment.countDocuments({
      patient: userId,
      appointmentDate: { $gte: new Date() },
      status: { $in: ['Scheduled', 'Confirmed'] }
    });
    
    const completedAppointments = await Appointment.countDocuments({
      patient: userId,
      status: 'Completed'
    });
    
    // Mock pending tasks for users
    const pendingTasks = Math.floor(Math.random() * 5) + 1; // Random number 1-5
    
    res.json({
      overview: {
        totalAppointments,
        upcomingAppointments,
        completedAppointments,
        pendingTasks
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user-specific audit logs
router.get('/audit-logs/user', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get audit logs related to the user
    const AuditLog = require('../models/AuditLog');
    const userLogs = await AuditLog.find({
      $or: [
        { userId: userId },
        { 'details.userId': userId },
        { description: { $regex: req.user.email, $options: 'i' } }
      ]
    })
    .sort({ timestamp: -1 })
    .limit(10)
    .lean();
    
    res.json(userLogs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user notifications
router.get('/notifications/user', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Mock notifications for users
    const notifications = [
      {
        id: 1,
        title: 'Appointment Reminder',
        message: 'You have an upcoming appointment tomorrow at 10:00 AM',
        type: 'info',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      },
      {
        id: 2,
        title: 'Profile Updated',
        message: 'Your profile information has been successfully updated',
        type: 'success',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
      },
      {
        id: 3,
        title: 'System Maintenance',
        message: 'Scheduled maintenance will occur tonight at 2:00 AM',
        type: 'warning',
        timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000) // 2 days ago
      }
    ];
    
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get doctor dashboard statistics
router.get('/doctor-dashboard', authenticateToken, async (req, res) => {
  try {
    let doctorId = req.user._id;
    if (typeof doctorId === 'string') {
      try {
        doctorId = mongoose.Types.ObjectId(doctorId);
      } catch (e) {
        console.error('Invalid doctorId for ObjectId:', doctorId, e);
        return res.status(400).json({ error: 'Invalid doctor ID' });
      }
    }
    console.log('Doctor Dashboard doctorId:', doctorId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // All appointments for this doctor
    const allAppointments = await Appointment.find({ doctor: doctorId })
      .populate('patient', 'firstName lastName')
      .sort({ appointmentDate: -1, appointmentTime: 1 })
      .lean();
    console.log('Found appointments:', allAppointments.length);

    // Group appointments by status
    const appointmentsByStatus = {
      Scheduled: [],
      Completed: [],
      Cancelled: [],
      InProgress: [],
      Emergency: []
    };
    allAppointments.forEach(app => {
      if (app.status === 'Scheduled') appointmentsByStatus.Scheduled.push(app);
      else if (app.status === 'Completed') appointmentsByStatus.Completed.push(app);
      else if (app.status === 'Cancelled') appointmentsByStatus.Cancelled.push(app);
      else if (app.status === 'In Progress') appointmentsByStatus.InProgress.push(app);
      if (app.type === 'Emergency') appointmentsByStatus.Emergency.push(app);
    });

    // Today's appointments for this doctor
    const todayAppointments = allAppointments.filter(app => {
      const date = new Date(app.appointmentDate);
      return date >= today && date < tomorrow;
    });

    // Overview stats
    const totalPatients = await Patient.countDocuments({ assignedDoctor: doctorId });
    const todayPatients = await Patient.countDocuments({ assignedDoctor: doctorId, admissionDate: { $gte: today, $lt: tomorrow } });
    const pendingAppointments = allAppointments.filter(app => app.status === 'Scheduled').length;
    const completedToday = todayAppointments.filter(app => app.status === 'Completed').length;
    const emergencyCases = allAppointments.filter(app => app.type === 'Emergency').length;

    res.json({
      overview: {
        todayPatients,
        pendingAppointments,
        completedToday,
        emergencyCases,
        totalAppointments: allAppointments.length
      },
      todayAppointments,
      allAppointments,
      appointmentsByStatus,
      recentNotes: [] // Placeholder for future notes feature
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get receptionist dashboard statistics
router.get('/receptionist-dashboard', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    console.log('Stats calculation - Today start:', today.toISOString());
    console.log('Stats calculation - Tomorrow start:', tomorrow.toISOString());
    
    // Today's appointments
    const todayAppointments = await Appointment.countDocuments({
      appointmentDate: { $gte: today, $lt: tomorrow }
    });
    
    // New patient registrations today - include both 'user' and 'patient' roles
    const newRegistrations = await User.countDocuments({
      role: { $in: ['user', 'patient'] },
      createdAt: { $gte: today, $lt: tomorrow }
    });
    
    // Alternative: Use UTC date calculation to avoid timezone issues
    const utcToday = new Date();
    utcToday.setUTCHours(0, 0, 0, 0);
    const utcTomorrow = new Date(utcToday);
    utcTomorrow.setUTCDate(utcTomorrow.getUTCDate() + 1);
    
    const newRegistrationsUTC = await User.countDocuments({
      role: { $in: ['user', 'patient'] },
      createdAt: { $gte: utcToday, $lt: utcTomorrow }
    });
    
    console.log('UTC Today start:', utcToday.toISOString());
    console.log('UTC Tomorrow start:', utcTomorrow.toISOString());
    console.log('New registrations (local time):', newRegistrations);
    console.log('New registrations (UTC time):', newRegistrationsUTC);
    
    // Use the UTC count if it's different (more accurate)
    const finalNewRegistrations = newRegistrationsUTC > newRegistrations ? newRegistrationsUTC : newRegistrations;
    
    // Debug: Let's also check all users created today to see what we're getting
    const allTodayUsers = await User.find({
      role: { $in: ['user', 'patient'] },
      createdAt: { $gte: today, $lt: tomorrow }
    }).select('firstName lastName role createdAt').lean();
    
    console.log('All today users:', allTodayUsers.map(u => ({
      name: `${u.firstName} ${u.lastName}`,
      role: u.role,
      createdAt: u.createdAt
    })));
    
    // Pending calls - count patients who need follow-up calls
    const pendingCalls = await User.countDocuments({
      role: { $in: ['user', 'patient'] },
      isActive: true,
      lastFollowUpCall: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } // No follow-up call in last 24 hours
    });
    
    // Documents pending - count patients with incomplete documentation
    const documentsPending = await User.countDocuments({
      role: { $in: ['user', 'patient'] },
      $or: [
        { 'insurance.provider': { $exists: false } },
        { 'insurance.policyNumber': { $exists: false } },
        { 'emergencyContact.name': { $exists: false } },
        { 'emergencyContact.phone': { $exists: false } }
      ]
    });
    
    // Calculate changes from yesterday
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const dayBeforeYesterday = new Date(yesterday);
    dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 1);
    
    const yesterdayAppointments = await Appointment.countDocuments({
      appointmentDate: { $gte: yesterday, $lt: today }
    });
    
    const yesterdayRegistrations = await User.countDocuments({
      role: { $in: ['user', 'patient'] },
      createdAt: { $gte: yesterday, $lt: today }
    });
    
    const appointmentChange = yesterdayAppointments > 0 ? 
      `${((todayAppointments - yesterdayAppointments) / yesterdayAppointments * 100).toFixed(1)}%` : '0%';
    
    const registrationChange = yesterdayRegistrations > 0 ? 
      `${((finalNewRegistrations - yesterdayRegistrations) / yesterdayRegistrations * 100).toFixed(1)}%` : '0%';
    
    // Calculate call changes from yesterday
    const yesterdayPendingCalls = await User.countDocuments({
      role: { $in: ['user', 'patient'] },
      isActive: true,
      lastFollowUpCall: { $lt: new Date(Date.now() - 48 * 60 * 60 * 1000) } // No follow-up call in last 48 hours
    });
    
    const callChange = yesterdayPendingCalls > 0 ? 
      `${((pendingCalls - yesterdayPendingCalls) / yesterdayPendingCalls * 100).toFixed(1)}%` : '0%';
    
    // Calculate document changes from yesterday
    const yesterdayDocumentsPending = await User.countDocuments({
      role: { $in: ['user', 'patient'] },
      $or: [
        { 'insurance.provider': { $exists: false } },
        { 'insurance.policyNumber': { $exists: false } },
        { 'emergencyContact.name': { $exists: false } },
        { 'emergencyContact.phone': { $exists: false } }
      ],
      createdAt: { $lt: today }
    });
    
    const documentChange = yesterdayDocumentsPending > 0 ? 
      `${((documentsPending - yesterdayDocumentsPending) / yesterdayDocumentsPending * 100).toFixed(1)}%` : '0%';
    
    // Today's appointments with details
    const todayAppointmentsList = await Appointment.find({
      appointmentDate: { $gte: today, $lt: tomorrow }
    })
    .populate('patient', 'firstName lastName patientId')
    .populate('doctor', 'firstName lastName')
    .sort({ appointmentTime: 1 })
    .lean();
    
    // Recent patient registrations
    const recentRegistrations = await User.find({ role: { $in: ['user', 'patient'] } })
    .populate('assignedDoctor', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();
    
    // Format appointments for display
    const formattedAppointments = todayAppointmentsList.map(apt => {
      // Convert appointmentTime string (e.g., "14:30") to readable format
      let timeDisplay = 'Time not set';
      if (apt.appointmentTime) {
        try {
          const [hours, minutes] = apt.appointmentTime.split(':');
          const hour = parseInt(hours);
          const ampm = hour >= 12 ? 'PM' : 'AM';
          const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
          timeDisplay = `${displayHour}:${minutes} ${ampm}`;
        } catch (error) {
          timeDisplay = apt.appointmentTime; // Fallback to original string
        }
      }
      
      return {
        patientName: `${apt.patient?.firstName || 'Unknown'} ${apt.patient?.lastName || ''}`,
        doctorName: `${apt.doctor?.firstName || 'Dr.'} ${apt.doctor?.lastName || 'Unknown'}`,
        time: timeDisplay,
        status: apt.status || 'Unknown'
      };
    });
    
    // Format registrations for display
    const formattedRegistrations = recentRegistrations.map(reg => {
      // Format registration time
      let timeDisplay = 'Time not set';
      if (reg.createdAt) {
        try {
          const date = new Date(reg.createdAt);
          timeDisplay = date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          });
        } catch (error) {
          timeDisplay = 'Time not set';
        }
      }
      
      return {
        patientName: `${reg.firstName || 'Unknown'} ${reg.lastName || ''}`,
        patientId: reg._id ? reg._id.toString().slice(-6) : 'N/A',
        department: reg.department || 'General',
        time: timeDisplay
      };
    });

    res.json({
      overview: {
        todayAppointments,
        newRegistrations: finalNewRegistrations,
        pendingCalls,
        documentsPending,
        appointmentChange: appointmentChange.startsWith('-') ? appointmentChange : `+${appointmentChange}`,
        registrationChange: registrationChange.startsWith('-') ? registrationChange : `+${registrationChange}`,
        callChange,
        documentChange
      },
      todayAppointments: formattedAppointments,
      recentRegistrations: formattedRegistrations
    });
  } catch (error) {
    console.error('Error fetching receptionist dashboard stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get nurse dashboard statistics
router.get('/nurse-dashboard', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Patients under care
    const patientsUnderCare = await User.countDocuments({ role: 'user', isActive: true });
    
    // Medications due - count patients with active medications
    const medicationsDue = await User.countDocuments({
      role: 'user',
      isActive: true,
      'currentMedications.0': { $exists: true }
    });
    
    // Vitals checked today
    const vitalsChecked = await User.countDocuments({
      role: 'user',
      lastVitalCheck: { $gte: today, $lt: tomorrow }
    });
    
    // Emergency alerts
    const emergencyAlerts = await User.countDocuments({ role: 'user', status: 'Emergency' });
    
    // Calculate changes from yesterday
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const yesterdayPatients = await User.countDocuments({ 
      role: 'user',
      isActive: true,
      createdAt: { $gte: yesterday, $lt: today }
    });
    
    const yesterdayVitals = await User.countDocuments({
      role: 'user',
      lastVitalCheck: { $gte: yesterday, $lt: today }
    });
    
    const yesterdayEmergency = await User.countDocuments({ 
      role: 'user',
      status: 'Emergency',
      createdAt: { $gte: yesterday, $lt: today }
    });
    
    const patientChange = yesterdayPatients > 0 ? 
      `${((patientsUnderCare - yesterdayPatients) / yesterdayPatients * 100).toFixed(1)}%` : '0%';
    
    const vitalChange = yesterdayVitals > 0 ? 
      `${((vitalsChecked - yesterdayVitals) / yesterdayVitals * 100).toFixed(1)}%` : '0%';
    
    const emergencyChange = yesterdayEmergency > 0 ? 
      `${((emergencyAlerts - yesterdayEmergency) / yesterdayEmergency * 100).toFixed(1)}%` : '0%';
    
    // Calculate medication changes from yesterday
    const yesterdayMedications = await User.countDocuments({
      role: 'user',
      isActive: true,
      'currentMedications.0': { $exists: true },
      createdAt: { $lt: today }
    });
    
    const medicationChange = yesterdayMedications > 0 ? 
      `${((medicationsDue - yesterdayMedications) / yesterdayMedications * 100).toFixed(1)}%` : '0%';

    res.json({
      overview: {
        patientsUnderCare,
        medicationsDue,
        vitalsChecked,
        emergencyAlerts,
        patientChange: patientChange.startsWith('-') ? patientChange : `+${patientChange}`,
        medicationChange,
        vitalChange: vitalChange.startsWith('-') ? vitalChange : `+${vitalChange}`,
        emergencyChange: emergencyChange.startsWith('-') ? emergencyChange : `+${emergencyChange}`
      }
    });
  } catch (error) {
    console.error('Error fetching nurse dashboard stats:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 