const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const LabOrder = require('../models/LabOrder');

// Get all lab orders with pagination and filters
router.get('/', authenticateToken, requireRole(['lab_technician', 'doctor', 'admin', 'nurse']), async (req, res) => {
  try {
    const { page = 1, limit = 10, status, priority, patient, doctor } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    let query = {};
    
    // Role-based filtering
    if (req.user.role === 'lab_technician') {
      query.labTechnician = req.user._id;
    } else if (req.user.role === 'doctor') {
      query.doctor = req.user._id;
    }
    
    // Additional filters
    if (status && status !== 'all') {
      query.orderStatus = status;
    }
    if (priority && priority !== 'all') {
      query.priority = priority;
    }
    if (patient) {
      query.patient = patient;
    }
    if (doctor) {
      query.doctor = doctor;
    }
    
    const totalOrders = await LabOrder.countDocuments(query);
    const orders = await LabOrder.find(query)
      .populate('patient', 'firstName lastName')
      .populate('doctor', 'firstName lastName')
      .populate('labTechnician', 'firstName lastName')
      .sort({ requestedDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    res.json({
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders,
        hasNext: skip + orders.length < totalOrders,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching lab orders:', error);
    res.status(500).json({ error: 'Failed to fetch lab orders' });
  }
});

// Get single lab order
router.get('/:id', authenticateToken, requireRole(['lab_technician', 'doctor', 'admin', 'nurse']), async (req, res) => {
  try {
    const order = await LabOrder.findById(req.params.id)
      .populate('patient', 'firstName lastName')
      .populate('doctor', 'firstName lastName')
      .populate('labTechnician', 'firstName lastName');
    
    if (!order) {
      return res.status(404).json({ error: 'Lab order not found' });
    }
    
    res.json({ order });
  } catch (error) {
    console.error('Error fetching lab order:', error);
    res.status(500).json({ error: 'Failed to fetch lab order' });
  }
});

// Create new lab order (doctors only)
router.post('/', authenticateToken, requireRole(['doctor']), async (req, res) => {
  try {
    const { patient, tests, priority, dueDate, notes, instructions } = req.body;
    
    if (!patient || !tests || tests.length === 0) {
      return res.status(400).json({ error: 'Patient and tests are required' });
    }
    
    const newOrder = new LabOrder({
      patient,
      doctor: req.user._id,
      tests,
      priority: priority || 'Routine',
      dueDate,
      notes,
      instructions
    });
    
    const savedOrder = await newOrder.save();
    await savedOrder.populate('patient', 'firstName lastName');
    await savedOrder.populate('doctor', 'firstName lastName');
    
    res.status(201).json({ message: 'Lab order created successfully', order: savedOrder });
  } catch (error) {
    console.error('Error creating lab order:', error);
    res.status(500).json({ error: 'Failed to create lab order' });
  }
});

// Update lab order status (lab technicians only)
router.patch('/:id/status', authenticateToken, requireRole(['lab_technician']), async (req, res) => {
  try {
    const { orderStatus, sampleStatus, sampleCollectionDate } = req.body;
    
    const order = await LabOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Lab order not found' });
    }
    
    const updates = {};
    if (orderStatus) updates.orderStatus = orderStatus;
    if (sampleStatus) updates.sampleStatus = sampleStatus;
    if (sampleCollectionDate) updates.sampleCollectionDate = sampleCollectionDate;
    
    if (orderStatus === 'Completed') {
      updates.completedDate = new Date();
    }
    
    const updatedOrder = await LabOrder.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    ).populate('patient', 'firstName lastName')
     .populate('doctor', 'firstName lastName')
     .populate('labTechnician', 'firstName lastName');
    
    res.json({ message: 'Lab order status updated successfully', order: updatedOrder });
  } catch (error) {
    console.error('Error updating lab order status:', error);
    res.status(500).json({ error: 'Failed to update lab order status' });
  }
});

// Add test results (lab technicians only)
router.post('/:id/results', authenticateToken, requireRole(['lab_technician']), async (req, res) => {
  try {
    const { testResults } = req.body;
    
    const order = await LabOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Lab order not found' });
    }
    
    // Update all tests with results
    const updatedTests = order.tests.map((test, index) => {
      if (testResults[index]) {
        return {
          ...test.toObject(),
          results: testResults[index].results || test.results,
          status: testResults[index].status || test.status,
          notes: testResults[index].notes || test.notes,
          completedDate: testResults[index].status === 'Completed' ? new Date() : test.completedDate
        };
      }
      return test;
    });
    
    const updatedOrder = await LabOrder.findByIdAndUpdate(
      req.params.id,
      { 
        tests: updatedTests,
        orderStatus: updatedTests.every(test => test.status === 'Completed') ? 'Completed' : 'In Progress'
      },
      { new: true }
    ).populate('patient', 'firstName lastName')
     .populate('doctor', 'firstName lastName')
     .populate('labTechnician', 'firstName lastName');
    
    res.json({ message: 'Test results added successfully', order: updatedOrder });
  } catch (error) {
    console.error('Error adding test results:', error);
    res.status(500).json({ error: 'Failed to add test results' });
  }
});

// Update test results (lab technicians only)
router.patch('/:id/tests/:testIndex/results', authenticateToken, requireRole(['lab_technician']), async (req, res) => {
  try {
    const { results, status, notes } = req.body;
    const testIndex = parseInt(req.params.testIndex);
    
    const order = await LabOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Lab order not found' });
    }
    
    if (testIndex < 0 || testIndex >= order.tests.length) {
      return res.status(400).json({ error: 'Invalid test index' });
    }
    
    const updates = {};
    if (results) updates[`tests.${testIndex}.results`] = results;
    if (status) updates[`tests.${testIndex}.status`] = status;
    if (notes) updates[`tests.${testIndex}.notes`] = notes;
    
    if (status === 'Completed') {
      updates[`tests.${testIndex}.completedDate`] = new Date();
    }
    
    const updatedOrder = await LabOrder.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    ).populate('patient', 'firstName lastName')
     .populate('doctor', 'firstName lastName')
     .populate('labTechnician', 'firstName lastName');
    
    res.json({ message: 'Test results updated successfully', order: updatedOrder });
  } catch (error) {
    console.error('Error updating test results:', error);
    res.status(500).json({ error: 'Failed to update test results' });
  }
});

// Assign lab technician to order
router.patch('/:id/assign', authenticateToken, requireRole(['admin', 'lab_technician']), async (req, res) => {
  try {
    const { labTechnician } = req.body;
    
    const updatedOrder = await LabOrder.findByIdAndUpdate(
      req.params.id,
      { labTechnician },
      { new: true }
    ).populate('patient', 'firstName lastName')
     .populate('doctor', 'firstName lastName')
     .populate('labTechnician', 'firstName lastName');
    
    res.json({ message: 'Lab technician assigned successfully', order: updatedOrder });
  } catch (error) {
    console.error('Error assigning lab technician:', error);
    res.status(500).json({ error: 'Failed to assign lab technician' });
  }
});

// Delete lab order
router.delete('/:id', authenticateToken, requireRole(['doctor', 'admin']), async (req, res) => {
  try {
    const order = await LabOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Lab order not found' });
    }
    
    // Only the doctor who created it or admin can delete
    if (req.user.role === 'doctor' && order.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await LabOrder.findByIdAndDelete(req.params.id);
    res.json({ message: 'Lab order deleted successfully' });
  } catch (error) {
    console.error('Error deleting lab order:', error);
    res.status(500).json({ error: 'Failed to delete lab order' });
  }
});

module.exports = router;
