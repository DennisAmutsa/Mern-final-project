const express = require('express');
const router = express.Router();
const PatientNote = require('../models/PatientNote');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// Get all notes for a patient
router.get('/patient/:patientId', auth, async (req, res) => {
  try {
    const notes = await PatientNote.find({ patient: req.params.patientId })
      .populate('patient', 'firstName lastName')
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 });
    
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all notes (with filters)
router.get('/', auth, async (req, res) => {
  try {
    const { type, shift, createdBy } = req.query;
    let query = {};
    
    if (type) query.type = type;
    if (shift) query.shift = shift;
    if (createdBy) query.createdBy = createdBy;
    
    const notes = await PatientNote.find(query)
      .populate('patient', 'firstName lastName')
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 });
    
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new note
router.post('/', auth, async (req, res) => {
  try {
    const { patientId, note, type, shift, isPrivate, tags } = req.body;
    
    const patientNote = new PatientNote({
      patient: patientId,
      note,
      type,
      shift,
      isPrivate,
      tags,
      createdBy: req.user.id
    });
    
    await patientNote.save();
    
    await patientNote.populate([
      { path: 'patient', select: 'firstName lastName' },
      { path: 'createdBy', select: 'firstName lastName' }
    ]);
    
    res.status(201).json(patientNote);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update note
router.put('/:id', auth, async (req, res) => {
  try {
    const { note, type, shift, isPrivate, tags } = req.body;
    
    const patientNote = await PatientNote.findById(req.params.id);
    
    if (!patientNote) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    // Only allow creator to update
    if (patientNote.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this note' });
    }
    
    patientNote.note = note;
    patientNote.type = type;
    patientNote.shift = shift;
    patientNote.isPrivate = isPrivate;
    patientNote.tags = tags;
    
    await patientNote.save();
    
    await patientNote.populate([
      { path: 'patient', select: 'firstName lastName' },
      { path: 'createdBy', select: 'firstName lastName' }
    ]);
    
    res.json(patientNote);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete note
router.delete('/:id', auth, async (req, res) => {
  try {
    const patientNote = await PatientNote.findById(req.params.id);
    
    if (!patientNote) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    // Only allow creator to delete
    if (patientNote.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this note' });
    }
    
    await PatientNote.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get shift handover notes
router.get('/shift-handover/:shift', auth, async (req, res) => {
  try {
    const notes = await PatientNote.find({ 
      type: 'shift_handover',
      shift: req.params.shift,
      createdAt: { 
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lt: new Date(new Date().setHours(23, 59, 59, 999))
      }
    })
      .populate('patient', 'firstName lastName')
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 });
    
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
