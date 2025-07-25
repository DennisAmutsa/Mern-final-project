const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticateToken, requireRole } = require('../middleware/auth');
const logAudit = require('../utils/auditLogger');

const router = express.Router();

// Top-level debug log
console.log('Auth routes loaded');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '24h' });
};

// Register new user
router.post('/register', [
  body('username').isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required')
], async (req, res) => {
  try {
    console.log('🔍 Registration request received:', { username: req.body.username, email: req.body.email, role: req.body.role });
    
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, firstName, lastName, employeeId, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    // Only set employeeId for staff roles
    let userData = {
      username,
      email,
      password,
      firstName,
      lastName,
      role: role || 'user',
      isActive: true,
      permissions: ['view_profile', 'view_appointments']
    };
    const staffRoles = ['admin', 'doctor', 'nurse', 'receptionist', 'pharmacist'];
    if (staffRoles.includes(userData.role) && employeeId) {
      userData.employeeId = employeeId;
    }

    const user = new User(userData);

    await user.save();
    console.log('✅ User registered successfully:', { id: user._id, email: user.email, role: user.role });
    await logAudit({ req, action: 'USER_REGISTER', description: `User ${user.email} registered`, status: 'SUCCESS' });

    res.status(201).json({
      message: 'Registration successful! You can now login.',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    await logAudit({ req, action: 'USER_REGISTER', description: `Registration failed for ${req.body.email}`, status: 'FAILED', details: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Login user
router.post('/login', [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    // Find user by username or email
    const user = await User.findOne({
      $or: [{ username }, { email: username }]
    });

    if (!user) {
      await logAudit({ req, action: 'LOGIN', description: `Failed login for ${username}`, status: 'FAILED' });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      await logAudit({ req, action: 'LOGIN', description: `Login attempt for deactivated user ${username}`, status: 'FAILED' });
      return res.status(401).json({ error: 'Account is deactivated. Please contact administrator.' });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      await logAudit({ req, action: 'LOGIN', description: `Failed login for ${username}`, status: 'FAILED' });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);
    await logAudit({ req, action: 'LOGIN', description: `User ${user.email} logged in`, status: 'SUCCESS' });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        department: user.department,
        permissions: user.permissions
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    res.json({
      user: req.user
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.put('/profile', authenticateToken, [
  body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email required'),
  body('bloodType').optional().isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Valid blood type required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, email, contactInfo, bloodType, emergencyContact, insurance } = req.body;

    // Check if email is already taken by another user
    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        firstName,
        lastName,
        email,
        contactInfo,
        bloodType,
        emergencyContact,
        insurance
      },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
    await logAudit({ req, action: 'PROFILE_UPDATE', description: `Profile updated for ${req.user.email}`, status: 'SUCCESS', details: req.body });
  } catch (error) {
    await logAudit({ req, action: 'PROFILE_UPDATE', description: `Profile update failed for ${req.user.email}`, status: 'FAILED', details: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Change password
router.put('/change-password', authenticateToken, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    // Verify current password
    const user = await User.findById(req.user._id);
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();
    await logAudit({ req, action: 'PASSWORD_CHANGE', description: `Password changed for ${req.user.email}`, status: 'SUCCESS' });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    await logAudit({ req, action: 'PASSWORD_CHANGE', description: `Password change failed for ${req.user.email}`, status: 'FAILED', details: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Get all users (admin only)
router.get('/users', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, role, roles, department, search } = req.query;
    const skip = (page - 1) * limit;
    
    let query = {};
    const allowedRoles = ['doctor', 'nurse', 'receptionist', 'pharmacist', 'staff'];
    if (roles) {
      // Only allow allowedRoles, ignore any others
      const rolesArray = roles.split(',').filter(r => allowedRoles.includes(r));
      query.role = { $in: rolesArray };
    } else if (role && allowedRoles.includes(role)) {
      query.role = role;
    } else {
      // Default: only allowedRoles
      query.role = { $in: allowedRoles };
    }
    if (department) query.department = department;
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }
    
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await User.countDocuments(query);
    
    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasNext: skip + users.length < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new user (admin only)
router.post('/users', authenticateToken, requireRole('admin'), [
  body('username').isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('role').isIn(['admin', 'doctor', 'nurse', 'receptionist', 'pharmacist']).withMessage('Valid role required'),
  body('department').optional().isIn(['Emergency', 'Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'General Medicine', 'Surgery', 'ICU', 'Pharmacy', 'Administration']),
  body('employeeId').optional().isString().withMessage('Employee ID must be a string')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, firstName, lastName, role, department, employeeId } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      console.error('Duplicate user error: Username or email already exists');
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    // Set permissions based on role
    let permissions = [];
    switch (role) {
      case 'admin':
        permissions = ['system_admin', 'manage_users'];
        break;
      case 'doctor':
        permissions = [
          'view_patients', 'edit_patients',
          'view_appointments', 'edit_appointments',
          'view_emergency', 'edit_emergency',
          'view_stats'
        ];
        break;
      case 'nurse':
        permissions = [
          'view_patients', 'edit_patients',
          'view_appointments', 'edit_appointments',
          'view_emergency', 'edit_emergency'
        ];
        break;
      case 'receptionist':
        permissions = [
          'view_patients', 'edit_patients',
          'view_appointments', 'edit_appointments',
          'view_doctors'
        ];
        break;
      case 'pharmacist':
        permissions = [
          'view_inventory', 'edit_inventory',
          'view_patients'
        ];
        break;
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      firstName,
      lastName,
      role,
      department: role !== 'admin' ? department : undefined,
      employeeId,
      permissions,
      isActive: true
    });

    await user.save();

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      message: 'User created successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update user (admin only)
router.put('/users/:userId', authenticateToken, requireRole('admin'), [
  body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email required'),
  body('role').optional().isIn(['admin', 'doctor', 'nurse', 'receptionist', 'pharmacist']).withMessage('Valid role required'),
  body('department').optional().isIn(['Emergency', 'Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'General Medicine', 'Surgery', 'ICU', 'Pharmacy', 'Administration']),
  body('employeeId').optional().isString().withMessage('Employee ID must be a string'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
], async (req, res) => {
  console.log('PUT /users/:userId route hit');
  console.log('Request URL:', req.url);
  console.log('Request method:', req.method);
  console.log('Request params:', req.params);
  console.log('Request body:', req.body);
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Validation errors (edit user):', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }
    const { userId } = req.params;
    const updateData = { ...req.body };
    // Prevent username change
    delete updateData.username;
    // Prevent password change here
    delete updateData.password;
    // If role is changed, update permissions
    if (updateData.role) {
      let permissions = [];
      switch (updateData.role) {
        case 'admin':
          permissions = ['system_admin', 'manage_users'];
          break;
        case 'doctor':
          permissions = [
            'view_patients', 'edit_patients',
            'view_appointments', 'edit_appointments',
            'view_emergency', 'edit_emergency',
            'view_stats'
          ];
          break;
        case 'nurse':
          permissions = [
            'view_patients', 'edit_patients',
            'view_appointments', 'edit_appointments',
            'view_emergency', 'edit_emergency'
          ];
          break;
        case 'receptionist':
          permissions = [
            'view_patients', 'edit_patients',
            'view_appointments', 'edit_appointments',
            'view_doctors'
          ];
          break;
        case 'pharmacist':
          permissions = [
            'view_inventory', 'edit_inventory',
            'view_patients'
          ];
          break;
      }
      updateData.permissions = permissions;
    }
    // If role is admin, remove department
    if (updateData.role === 'admin') {
      updateData.department = undefined;
    }
    // Debug log
    console.log('Edit userId:', userId);
    console.log('Edit updateData:', updateData);
    const foundUser = await User.findById(userId);
    console.log('Direct find result:', foundUser);
    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) {
      console.error('User not found for update:', userId);
      return res.status(404).json({ error: 'User not found' });
    }
    await logAudit({ req, action: 'USER_UPDATE', description: `User ${userId} updated by ${req.user.email}`, status: 'SUCCESS', details: updateData });
    res.json({
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update user role and department (admin only)
router.put('/users/:userId/assign-role', authenticateToken, requireRole('admin'), [
  body('role').isIn(['admin', 'doctor', 'nurse', 'receptionist', 'pharmacist']).withMessage('Valid role required'),
  body('department').optional().isIn(['Emergency', 'Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'General Medicine', 'Surgery', 'ICU', 'Pharmacy', 'Administration']),
  body('employeeId').optional().isString().withMessage('Employee ID must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { role, department, employeeId } = req.body;
    const { userId } = req.params;

    // Set permissions based on role
    let permissions = [];
    switch (role) {
      case 'admin':
        permissions = ['system_admin', 'manage_users'];
        break;
      case 'doctor':
        permissions = [
          'view_patients', 'edit_patients',
          'view_appointments', 'edit_appointments',
          'view_emergency', 'edit_emergency',
          'view_stats'
        ];
        break;
      case 'nurse':
        permissions = [
          'view_patients', 'edit_patients',
          'view_appointments', 'edit_appointments',
          'view_emergency', 'edit_emergency'
        ];
        break;
      case 'receptionist':
        permissions = [
          'view_patients', 'edit_patients',
          'view_appointments', 'edit_appointments',
          'view_doctors'
        ];
        break;
      case 'pharmacist':
        permissions = [
          'view_inventory', 'edit_inventory',
          'view_patients'
        ];
        break;
    }

    const updateData = {
      role,
      permissions,
      isActive: true
    };

    // Only set department if role is not admin
    if (role !== 'admin' && department) {
      updateData.department = department;
    } else if (role === 'admin') {
      updateData.department = undefined;
    }

    // Set Employee ID if provided
    if (employeeId) {
      updateData.employeeId = employeeId;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User role and department assigned successfully',
      user
    });
    await logAudit({ req, action: 'ROLE_ASSIGN', description: `Role/department assigned to user ${userId} by ${req.user.email}`, status: 'SUCCESS', details: req.body });
  } catch (error) {
    await logAudit({ req, action: 'ROLE_ASSIGN', description: `Role/department assignment failed for user ${req.params.userId}`, status: 'FAILED', details: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Activate/Deactivate user (admin only)
router.put('/users/:userId/toggle-status', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user
    });
    await logAudit({ req, action: 'STATUS_TOGGLE', description: `User ${userId} status set to ${isActive} by ${req.user.email}`, status: 'SUCCESS' });
  } catch (error) {
    await logAudit({ req, action: 'STATUS_TOGGLE', description: `Status toggle failed for user ${req.params.userId}`, status: 'FAILED', details: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Delete user (admin only)
router.delete('/users/:userId', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    await logAudit({ req, action: 'USER_DELETE', description: `User ${userId} deleted by ${req.user.email}`, status: 'SUCCESS' });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Logout (client-side token removal)
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // In a more complex system, you might want to blacklist the token
    res.json({ message: 'Logout successful' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user profile by email
router.get('/users/profile', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile by id
router.put('/users/profile/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const update = req.body;
    // Prevent email change to an existing email
    if (update.email) {
      const existing = await User.findOne({ email: update.email, _id: { $ne: id } });
      if (existing) return res.status(400).json({ error: 'Email already exists' });
    }
    const user = await User.findByIdAndUpdate(id, update, { new: true, runValidators: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add medical record to patient (doctor or admin)
router.put('/users/:userId/medical-record', authenticateToken, requireRole(['doctor', 'admin']), [
  body('condition').notEmpty().withMessage('Condition is required'),
  body('diagnosis').notEmpty().withMessage('Diagnosis is required'),
  body('type').isIn(['Consultation', 'Surgery', 'Test', 'Prescription', 'Follow-up', 'Emergency']).withMessage('Valid record type required'),
  body('status').isIn(['Active', 'Completed', 'Cancelled']).withMessage('Valid status required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.params;
    const { condition, diagnosis, treatment, type, notes, status } = req.body;

    // Check if the patient is assigned to this doctor
    const patient = await User.findById(userId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    if (patient.assignedDoctor?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Patient not assigned to you' });
    }

    // Add medical record to patient
    const medicalRecord = {
      condition,
      diagnosis,
      treatment,
      type,
      notes,
      status,
      date: new Date(),
      doctor: `${req.user.firstName} ${req.user.lastName}`
    };

    const updatedPatient = await User.findByIdAndUpdate(
      userId,
      { $push: { medicalHistory: medicalRecord } },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Medical record added successfully',
      patient: updatedPatient
    });
    await logAudit({ req, action: 'MEDICAL_RECORD_ADD', description: `Medical record added for patient ${patient.email} by ${req.user.email}`, status: 'SUCCESS', details: req.body });
  } catch (error) {
    await logAudit({ req, action: 'MEDICAL_RECORD_ADD', description: `Medical record addition failed`, status: 'FAILED', details: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Add prescription to patient (doctor or admin)
router.put('/users/:userId/prescription', authenticateToken, requireRole(['doctor', 'admin']), [
  body('name').notEmpty().withMessage('Medication name is required'),
  body('dosage').notEmpty().withMessage('Dosage is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.params;
    const { name, dosage, frequency, notes, endDate } = req.body;

    // Check if the patient is assigned to this doctor
    const patient = await User.findById(userId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    if (patient.assignedDoctor?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Patient not assigned to you' });
    }

    // Add prescription to patient
    const prescription = {
      name,
      dosage,
      frequency,
      notes,
      endDate: endDate ? new Date(endDate) : null,
      prescribedBy: `${req.user.firstName} ${req.user.lastName}`,
      prescribedDate: new Date(),
      status: 'Active'
    };

    const updatedPatient = await User.findByIdAndUpdate(
      userId,
      { $push: { currentMedications: prescription } },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Prescription added successfully',
      patient: updatedPatient
    });
    await logAudit({ req, action: 'PRESCRIPTION_ADD', description: `Prescription added for patient ${patient.email} by ${req.user.email}`, status: 'SUCCESS', details: req.body });
  } catch (error) {
    await logAudit({ req, action: 'PRESCRIPTION_ADD', description: `Prescription addition failed`, status: 'FAILED', details: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Get assigned patients for doctor (also accessible by admin)
router.get('/doctor/patients', authenticateToken, requireRole(['doctor', 'admin']), async (req, res) => {
  try {
    const { roles, assignedDoctor, search } = req.query;
    
    let query = {};
    
    // Filter by roles if specified
    if (roles) {
      const rolesArray = roles.split(',').filter(r => ['user', 'patient'].includes(r));
      if (rolesArray.length > 0) {
        query.role = { $in: rolesArray };
      }
    }
    
    // Filter by assigned doctor
    if (assignedDoctor) {
      query.assignedDoctor = assignedDoctor;
    }
    
    // Search functionality
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } }
      ];
    }
    
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json({
      users,
      total: users.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Assign doctor to patient (admin only)
router.put('/users/:userId/assign-doctor', authenticateToken, requireRole('admin'), [
  body('doctorId').notEmpty().withMessage('Doctor ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.params;
    const { doctorId } = req.body;

    // Check if patient exists
    const patient = await User.findById(userId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Check if doctor exists and is actually a doctor
    const doctor = await User.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    if (doctor.role !== 'doctor') {
      return res.status(400).json({ error: 'User is not a doctor' });
    }

    // Update patient's assigned doctor
    const updatedPatient = await User.findByIdAndUpdate(
      userId,
      { assignedDoctor: doctorId },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Doctor assigned successfully',
      patient: updatedPatient
    });
    
    await logAudit({ 
      req, 
      action: 'DOCTOR_ASSIGNMENT', 
      description: `Doctor ${doctor.email} assigned to patient ${patient.email} by ${req.user.email}`, 
      status: 'SUCCESS' 
    });
  } catch (error) {
    await logAudit({ 
      req, 
      action: 'DOCTOR_ASSIGNMENT', 
      description: `Doctor assignment failed`, 
      status: 'FAILED', 
      details: error.message 
    });
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 