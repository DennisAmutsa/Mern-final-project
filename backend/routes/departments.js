const express = require('express');
const router = express.Router();
const Department = require('../models/Department');
const { auth } = require('../middleware/auth');
const admin = require('../middleware/admin');
const User = require('../models/User');

// @route   GET /api/departments
// @desc    Get all departments
// @access  Public (for now, can be made private later)
router.get('/', async (req, res) => {
  try {
    const departments = await Department.find()
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

// @route   DELETE /api/departments/:id
// @desc    Delete department
// @access  Private (Admin only)
router.delete('/:id', [auth, admin], async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    // Check if department has staff assigned
    if (department.staffCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete department with assigned staff. Please reassign staff first.' 
      });
    }

    await department.remove();
    res.json({ message: 'Department removed successfully' });
  } catch (error) {
    console.error('Error deleting department:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ error: 'Department not found' });
    }
    res.status(500).json({ error: 'Server error' });
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