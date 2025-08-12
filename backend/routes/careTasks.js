const express = require('express');
const router = express.Router();
const CareTask = require('../models/CareTask');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// Get all care tasks
router.get('/', auth, async (req, res) => {
  try {
    const { status, priority, assignedTo } = req.query;
    let query = {};
    
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignedTo) query.assignedTo = assignedTo;
    
    const tasks = await CareTask.find(query)
      .populate('patient', 'firstName lastName')
      .populate('assignedTo', 'firstName lastName')
      .populate('assignedBy', 'firstName lastName')
      .sort({ dueDate: 1 });
    
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get pending care tasks
router.get('/pending', auth, async (req, res) => {
  try {
    const tasks = await CareTask.find({ 
      status: { $in: ['Pending', 'In Progress'] },
      dueDate: { $lte: new Date(Date.now() + 24 * 60 * 60 * 1000) } // Due within 24 hours
    })
      .populate('patient', 'firstName lastName')
      .populate('assignedTo', 'firstName lastName')
      .sort({ priority: -1, dueDate: 1 });
    
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new care task
router.post('/', auth, async (req, res) => {
  try {
    const { patientId, task, description, priority, dueDate, room, category, notes } = req.body;
    
    const careTask = new CareTask({
      patient: patientId,
      task,
      description,
      priority,
      dueDate,
      room,
      category,
      notes,
      assignedTo: req.user.id,
      assignedBy: req.user.id
    });
    
    await careTask.save();
    
    await careTask.populate([
      { path: 'patient', select: 'firstName lastName' },
      { path: 'assignedTo', select: 'firstName lastName' },
      { path: 'assignedBy', select: 'firstName lastName' }
    ]);
    
    res.status(201).json(careTask);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update care task status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const task = await CareTask.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    task.status = status;
    if (status === 'Completed') {
      task.completedDate = new Date();
    }
    
    await task.save();
    
    await task.populate([
      { path: 'patient', select: 'firstName lastName' },
      { path: 'assignedTo', select: 'firstName lastName' },
      { path: 'assignedBy', select: 'firstName lastName' }
    ]);
    
    res.json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get care tasks by patient
router.get('/patient/:patientId', auth, async (req, res) => {
  try {
    const tasks = await CareTask.find({ patient: req.params.patientId })
      .populate('patient', 'firstName lastName')
      .populate('assignedTo', 'firstName lastName')
      .populate('assignedBy', 'firstName lastName')
      .sort({ dueDate: 1 });
    
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
