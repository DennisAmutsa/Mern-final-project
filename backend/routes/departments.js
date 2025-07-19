const express = require('express');
const router = express.Router();
const Department = require('../models/Department');
const { auth } = require('../middleware/auth');
const admin = require('../middleware/admin');
const User = require('../models/User');
const Budget = require('../models/Budget');
const Appointment = require('../models/Appointment');

// @route   GET /api/departments
// @desc    Get all departments (excluding deleted ones by default)
// @access  Public (for now, can be made private later)
router.get('/', async (req, res) => {
  try {
    // Filter out deleted departments by default
    const departments = await Department.find({ status: { $ne: 'deleted' } })
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/departments/:id
// @desc    Get department by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    res.json(department);
  } catch (error) {
    console.error('Error fetching department:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ error: 'Department not found' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/departments
// @desc    Create a new department
// @access  Private (Admin only)
router.post('/', [auth, admin], async (req, res) => {
  try {
    const {
      name,
      description,
      location,
      phone,
      email,
      headOfDepartment,
      capacity,
      status
    } = req.body;

    // Check if department with same name already exists
    const existingDepartment = await Department.findOne({ name });
    if (existingDepartment) {
      return res.status(400).json({ error: 'Department with this name already exists' });
    }

    const department = new Department({
      name,
      description,
      location,
      phone,
      email,
      headOfDepartment,
      capacity,
      status: status || 'active',
      createdBy: req.user.id
    });

    await department.save();

    // Populate creator info
    await department.populate('createdBy', 'firstName lastName email');

    res.status(201).json(department);
  } catch (error) {
    console.error('Error creating department:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/departments/:id
// @desc    Update department
// @access  Private (Admin only)
router.put('/:id', [auth, admin], async (req, res) => {
  try {
    const {
      name,
      description,
      location,
      phone,
      email,
      headOfDepartment,
      capacity,
      status
    } = req.body;

    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    // Check if name is being changed and if it conflicts with existing department
    if (name && name !== department.name) {
      const existingDepartment = await Department.findOne({ name });
      if (existingDepartment) {
        return res.status(400).json({ error: 'Department with this name already exists' });
      }
    }

    // Update fields
    if (name) department.name = name;
    if (description) department.description = description;
    if (location) department.location = location;
    if (phone) department.phone = phone;
    if (email) department.email = email;
    if (headOfDepartment) department.headOfDepartment = headOfDepartment;
    if (capacity) department.capacity = capacity;
    if (status) department.status = status;
    
    department.updatedBy = req.user.id;

    await department.save();

    // Populate creator and updater info
    await department.populate('createdBy', 'firstName lastName email');
    await department.populate('updatedBy', 'firstName lastName email');

    res.json(department);
  } catch (error) {
    console.error('Error updating department:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ error: 'Department not found' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/departments/:id/delete
// @desc    Delete department (soft delete by setting status to deleted)
// @access  Private (Admin only)
router.post('/:id/delete', [auth, admin], async (req, res) => {
  try {
    console.log('🔍 Attempting to soft delete department:', req.params.id);
    
    // Find the department first
    const department = await Department.findById(req.params.id);
    
    if (!department) {
      console.log('❌ Department not found:', req.params.id);
      return res.status(404).json({ error: 'Department not found' });
    }
    
    console.log('📊 Department found:', department.name, 'Current status:', department.status);
    
    // Check if department has staff assigned
    if (department.staffCount > 0) {
      console.log('❌ Cannot delete department with staff assigned');
      return res.status(400).json({ 
        error: 'Cannot delete department with assigned staff. Please reassign staff first.' 
      });
    }
    
    // Instead of hard delete, set status to 'deleted' (soft delete)
    department.status = 'deleted';
    department.updatedBy = req.user.id;
    await department.save();
    
    console.log('✅ Department soft deleted successfully:', department.name);
    res.json({ 
      message: 'Department removed successfully', 
      deletedDepartment: department.name,
      note: 'Department has been marked as deleted and will not appear in active lists'
    });
  } catch (error) {
    console.error('❌ Error soft deleting department:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// @route   DELETE /api/departments/:id
// @desc    Delete department (legacy route - redirects to POST)
// @access  Private (Admin only)
router.delete('/:id', [auth, admin], async (req, res) => {
  try {
    console.log('🔍 DELETE route called, redirecting to POST delete...');
    // Redirect to the POST delete route
    req.method = 'POST';
    req.url = `${req.params.id}/delete`;
    return res.redirect(307, `/api/departments/${req.params.id}/delete`);
  } catch (error) {
    console.error('❌ Error in DELETE route:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// @route   GET /api/departments/stats/overview
// @desc    Get department statistics
// @access  Private (Admin only)
router.get('/stats/overview', [auth, admin], async (req, res) => {
  try {
    const totalDepartments = await Department.countDocuments();
    const activeDepartments = await Department.countDocuments({ status: 'active' });
    const inactiveDepartments = await Department.countDocuments({ status: 'inactive' });
    const maintenanceDepartments = await Department.countDocuments({ status: 'maintenance' });

    const totalStaff = await Department.aggregate([
      { $group: { _id: null, total: { $sum: '$staffCount' } } }
    ]);

    res.json({
      totalDepartments,
      activeDepartments,
      inactiveDepartments,
      maintenanceDepartments,
      totalStaff: totalStaff[0]?.total || 0
    });
  } catch (error) {
    console.error('Error fetching department stats:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Assign staff to department
router.post('/:id/assign-staff', [auth, admin], async (req, res) => {
  try {
    const { staffIds } = req.body;
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }
    if (!Array.isArray(staffIds) || staffIds.length === 0) {
      return res.status(400).json({ error: 'No staff selected' });
    }
    // Update users' department field
    const result = await User.updateMany(
      { _id: { $in: staffIds } },
      { department: department.name }
    );
    // Optionally update staffCount
    const allowedRoles = ['doctor', 'nurse', 'receptionist', 'pharmacist', 'staff'];
    const staffUsers = await User.find({ department: department.name, role: { $in: allowedRoles } });
    console.log('Staff users for department', department.name, staffUsers);
    const staffCount = staffUsers.length;
    department.staffCount = staffCount;
    await department.save();
    res.json({ message: 'Staff assigned successfully', staffCount });
  } catch (error) {
    console.error('Error assigning staff:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 