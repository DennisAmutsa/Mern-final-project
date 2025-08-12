const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const mongoose = require('mongoose');

// Get users by roles (e.g., /api/users?roles=user,patient)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { roles, assignedDoctor } = req.query;
    console.log('🔍 Users GET request - roles:', roles, 'assignedDoctor:', assignedDoctor);
    let query = {};
    if (roles) {
      const rolesArray = roles.split(',').map(r => r.trim());
      query.role = { $in: rolesArray };
      console.log('📋 Query roles:', rolesArray);
    }
    if (assignedDoctor) {
      // Match both ObjectId and string for robustness
      try {
        query.assignedDoctor = { $in: [assignedDoctor, mongoose.Types.ObjectId(assignedDoctor)] };
      } catch (e) {
        query.assignedDoctor = assignedDoctor;
      }
    }
    const users = await User.find(query)
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .populate('assignedDoctor', 'firstName lastName email department specialization');
    console.log('📊 Found users:', users.length);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user profile by email
router.get('/profile', async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ error: 'Email parameter is required' });
    }

    const user = await User.findOne({ email }).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update user profile by ID
router.put('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;

    // Debug logs for troubleshooting
    console.log('Incoming userId:', userId);
    console.log('Update data:', updateData);

    // Remove sensitive fields that shouldn't be updated via this endpoint
    delete updateData.password;
    delete updateData.role;
    delete updateData.permissions;
    delete updateData.isActive;

    // Map phone to contactInfo.phone if present
    if (updateData.phone) {
      updateData.contactInfo = updateData.contactInfo || {};
      updateData.contactInfo.phone = updateData.phone;
      delete updateData.phone;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      console.log('User not found for update:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('Updated user:', user); // Debug log
    res.json({ user });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// Assign a doctor to a user (patient)
router.put('/:id/assign-doctor', async (req, res) => {
  try {
    const { doctorId } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { assignedDoctor: doctorId },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'Doctor assigned successfully', user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get patients assigned to a specific doctor
router.get('/assigned-patients/:doctorId', async (req, res) => {
  try {
    const patients = await User.find({ assignedDoctor: req.params.doctorId, role: { $in: ['user', 'patient'] } })
      .select('-password')
      .populate('assignedDoctor', 'firstName lastName email');
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Doctor updates status of assigned patient
router.put('/update-status/:patientId', async (req, res) => {
  try {
    const { status } = req.body;
    const patient = await User.findById(req.params.patientId);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    patient.status = status;
    await patient.save();
    res.json({ message: 'Status updated', patient });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router; 