const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const LabEquipment = require('../models/LabEquipment');

// Get all lab equipment
router.get('/', authenticateToken, requireRole(['lab_technician', 'admin']), async (req, res) => {
  try {
    const { page = 1, limit = 10, status, equipmentType } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    let query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }
    if (equipmentType && equipmentType !== 'all') {
      query.equipmentType = equipmentType;
    }
    
    const totalEquipment = await LabEquipment.countDocuments(query);
    const equipment = await LabEquipment.find(query)
      .populate('assignedTechnician', 'firstName lastName')
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    res.json({
      equipment,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalEquipment / limit),
        totalEquipment,
        hasNext: skip + equipment.length < totalEquipment,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching lab equipment:', error);
    res.status(500).json({ error: 'Failed to fetch lab equipment' });
  }
});

// Get single equipment
router.get('/:id', authenticateToken, requireRole(['lab_technician', 'admin']), async (req, res) => {
  try {
    const equipment = await LabEquipment.findById(req.params.id)
      .populate('assignedTechnician', 'firstName lastName');
    
    if (!equipment) {
      return res.status(404).json({ error: 'Equipment not found' });
    }
    
    res.json({ equipment });
  } catch (error) {
    console.error('Error fetching equipment:', error);
    res.status(500).json({ error: 'Failed to fetch equipment' });
  }
});

// Create new equipment
router.post('/', authenticateToken, requireRole(['admin', 'lab_technician']), async (req, res) => {
  try {
    const {
      name,
      equipmentType,
      model,
      serialNumber,
      location,
      assignedTechnician,
      purchaseDate,
      warrantyExpiry,
      manufacturer,
      supplier
    } = req.body;
    
    if (!name || !equipmentType) {
      return res.status(400).json({ error: 'Name and equipment type are required' });
    }
    
    const newEquipment = new LabEquipment({
      name,
      equipmentType,
      model,
      serialNumber,
      location,
      assignedTechnician,
      purchaseDate,
      warrantyExpiry,
      manufacturer,
      supplier
    });
    
    const savedEquipment = await newEquipment.save();
    await savedEquipment.populate('assignedTechnician', 'firstName lastName');
    
    res.status(201).json({ message: 'Equipment added successfully', equipment: savedEquipment });
  } catch (error) {
    console.error('Error creating equipment:', error);
    res.status(500).json({ error: 'Failed to create equipment' });
  }
});

// Update equipment
router.put('/:id', authenticateToken, requireRole(['lab_technician', 'admin']), async (req, res) => {
  try {
    const updatedEquipment = await LabEquipment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('assignedTechnician', 'firstName lastName');
    
    if (!updatedEquipment) {
      return res.status(404).json({ error: 'Equipment not found' });
    }
    
    res.json({ message: 'Equipment updated successfully', equipment: updatedEquipment });
  } catch (error) {
    console.error('Error updating equipment:', error);
    res.status(500).json({ error: 'Failed to update equipment' });
  }
});

// Update equipment status
router.patch('/:id/status', authenticateToken, requireRole(['lab_technician', 'admin']), async (req, res) => {
  try {
    const { status, notes } = req.body;
    
    const updatedEquipment = await LabEquipment.findByIdAndUpdate(
      req.params.id,
      { status, notes },
      { new: true }
    ).populate('assignedTechnician', 'firstName lastName');
    
    if (!updatedEquipment) {
      return res.status(404).json({ error: 'Equipment not found' });
    }
    
    res.json({ message: 'Equipment status updated successfully', equipment: updatedEquipment });
  } catch (error) {
    console.error('Error updating equipment status:', error);
    res.status(500).json({ error: 'Failed to update equipment status' });
  }
});

// Schedule maintenance
router.patch('/:id/maintenance', authenticateToken, requireRole(['lab_technician', 'admin']), async (req, res) => {
  try {
    const { lastMaintenance, nextMaintenance, notes } = req.body;
    
    const updatedEquipment = await LabEquipment.findByIdAndUpdate(
      req.params.id,
      { lastMaintenance, nextMaintenance, notes },
      { new: true }
    ).populate('assignedTechnician', 'firstName lastName');
    
    if (!updatedEquipment) {
      return res.status(404).json({ error: 'Equipment not found' });
    }
    
    res.json({ message: 'Maintenance scheduled successfully', equipment: updatedEquipment });
  } catch (error) {
    console.error('Error scheduling maintenance:', error);
    res.status(500).json({ error: 'Failed to schedule maintenance' });
  }
});

// Delete equipment
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const equipment = await LabEquipment.findByIdAndDelete(req.params.id);
    
    if (!equipment) {
      return res.status(404).json({ error: 'Equipment not found' });
    }
    
    res.json({ message: 'Equipment deleted successfully' });
  } catch (error) {
    console.error('Error deleting equipment:', error);
    res.status(500).json({ error: 'Failed to delete equipment' });
  }
});

module.exports = router;
