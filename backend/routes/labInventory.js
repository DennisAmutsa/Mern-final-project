const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const LabInventory = require('../models/LabInventory');

// Get all lab inventory
router.get('/', authenticateToken, requireRole(['lab_technician', 'admin']), async (req, res) => {
  try {
    const { page = 1, limit = 10, status, category } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    let query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }
    if (category && category !== 'all') {
      query.category = category;
    }
    
    const totalItems = await LabInventory.countDocuments(query);
    const inventory = await LabInventory.find(query)
      .populate('assignedTechnician', 'firstName lastName')
      .sort({ itemName: 1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    res.json({
      inventory,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalItems / limit),
        totalItems,
        hasNext: skip + inventory.length < totalItems,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching lab inventory:', error);
    res.status(500).json({ error: 'Failed to fetch lab inventory' });
  }
});

// Get single inventory item
router.get('/:id', authenticateToken, requireRole(['lab_technician', 'admin']), async (req, res) => {
  try {
    const item = await LabInventory.findById(req.params.id)
      .populate('assignedTechnician', 'firstName lastName');
    
    if (!item) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    
    res.json({ item });
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    res.status(500).json({ error: 'Failed to fetch inventory item' });
  }
});

// Create new inventory item
router.post('/', authenticateToken, requireRole(['lab_technician', 'admin']), async (req, res) => {
  try {
    const {
      itemName,
      category,
      description,
      unit,
      currentStock,
      minimumStock,
      maximumStock,
      supplier,
      catalogNumber,
      cost,
      expiryDate,
      location,
      assignedTechnician
    } = req.body;
    
    if (!itemName || !category || !unit) {
      return res.status(400).json({ error: 'Item name, category, and unit are required' });
    }
    
    const newItem = new LabInventory({
      itemName,
      category,
      description,
      unit,
      currentStock: currentStock || 0,
      minimumStock: minimumStock || 10,
      maximumStock: maximumStock || 100,
      supplier,
      catalogNumber,
      cost,
      expiryDate,
      location,
      assignedTechnician
    });
    
    const savedItem = await newItem.save();
    await savedItem.populate('assignedTechnician', 'firstName lastName');
    
    res.status(201).json({ message: 'Inventory item added successfully', item: savedItem });
  } catch (error) {
    console.error('Error creating inventory item:', error);
    res.status(500).json({ error: 'Failed to create inventory item' });
  }
});

// Update inventory item
router.put('/:id', authenticateToken, requireRole(['lab_technician', 'admin']), async (req, res) => {
  try {
    const updatedItem = await LabInventory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('assignedTechnician', 'firstName lastName');
    
    if (!updatedItem) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    
    res.json({ message: 'Inventory item updated successfully', item: updatedItem });
  } catch (error) {
    console.error('Error updating inventory item:', error);
    res.status(500).json({ error: 'Failed to update inventory item' });
  }
});

// Update stock levels
router.patch('/:id/stock', authenticateToken, requireRole(['lab_technician', 'admin']), async (req, res) => {
  try {
    const { currentStock, lastRestocked } = req.body;
    
    const item = await LabInventory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    
    const updates = {};
    if (currentStock !== undefined) {
      updates.currentStock = currentStock;
      // Update status based on stock level
      if (currentStock <= 0) {
        updates.status = 'Out of Stock';
      } else if (currentStock <= item.minimumStock) {
        updates.status = 'Low Stock';
      } else {
        updates.status = 'Available';
      }
    }
    if (lastRestocked) {
      updates.lastRestocked = lastRestocked;
    }
    
    const updatedItem = await LabInventory.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    ).populate('assignedTechnician', 'firstName lastName');
    
    res.json({ message: 'Stock updated successfully', item: updatedItem });
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({ error: 'Failed to update stock' });
  }
});

// Delete inventory item
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const item = await LabInventory.findByIdAndDelete(req.params.id);
    
    if (!item) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    
    res.json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    res.status(500).json({ error: 'Failed to delete inventory item' });
  }
});

// Get low stock items
router.get('/alerts/low-stock', authenticateToken, requireRole(['lab_technician', 'admin']), async (req, res) => {
  try {
    const lowStockItems = await LabInventory.find({
      $or: [
        { status: 'Low Stock' },
        { status: 'Out of Stock' }
      ]
    }).populate('assignedTechnician', 'firstName lastName');
    
    res.json({ lowStockItems });
  } catch (error) {
    console.error('Error fetching low stock alerts:', error);
    res.status(500).json({ error: 'Failed to fetch low stock alerts' });
  }
});

// Request restock
router.post('/:id/restock', authenticateToken, requireRole(['lab_technician', 'admin']), async (req, res) => {
  try {
    const { quantity, priority, notes } = req.body;
    
    const item = await LabInventory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    
    // Create restock request
    const restockRequest = {
      itemId: item._id,
      itemName: item.itemName,
      requestedQuantity: quantity || (item.maximumStock - item.currentStock),
      priority: priority || 'Normal',
      notes: notes || '',
      requestedBy: req.user._id,
      requestedDate: new Date(),
      status: 'Pending'
    };
    
    // For now, we'll just update the item with restock request info
    // In a real system, you might want to create a separate RestockRequest model
    const updatedItem = await LabInventory.findByIdAndUpdate(
      req.params.id,
      {
        lastRestockRequest: restockRequest,
        lastRestockRequestDate: new Date()
      },
      { new: true }
    ).populate('assignedTechnician', 'firstName lastName');
    
    res.json({ 
      message: 'Restock request submitted successfully', 
      item: updatedItem,
      restockRequest 
    });
  } catch (error) {
    console.error('Error submitting restock request:', error);
    res.status(500).json({ error: 'Failed to submit restock request' });
  }
});

// Get expiring items
router.get('/alerts/expiring', authenticateToken, requireRole(['lab_technician', 'admin']), async (req, res) => {
  try {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const expiringItems = await LabInventory.find({
      expiryDate: { $lte: thirtyDaysFromNow, $gte: new Date() }
    }).populate('assignedTechnician', 'firstName lastName');
    
    res.json({ expiringItems });
  } catch (error) {
    console.error('Error fetching expiring items:', error);
    res.status(500).json({ error: 'Failed to fetch expiring items' });
  }
});

module.exports = router;
