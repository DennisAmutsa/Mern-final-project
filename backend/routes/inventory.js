const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');

// Get all inventory items
router.get('/', async (req, res) => {
  try {
    const { category, status, search } = req.query;
    let query = {};
    if (search) {fix
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { itemId: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } },
        { batchNumber: { $regex: search, $options: 'i' } },
        { manufacturer: { $regex: search, $options: 'i' } }
      ];
    }
    if (category) query.category = category;
    if (status) query.status = status;
    const items = await Inventory.find(query);
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single inventory item
router.get('/:id', async (req, res) => {
  try {
    const item = await Inventory.findOne({ itemId: req.params.id });
    if (!item) return res.status(404).json({ error: 'Inventory item not found' });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new inventory item
router.post('/', async (req, res) => {
  try {
    // Generate unique barcode
    const generateBarcode = () => {
      const timestamp = Date.now().toString();
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `BC${timestamp.slice(-8)}${random}`;
    };

    let barcode;
    let isUnique = false;
    let attempts = 0;
    
    // Keep generating until we get a unique barcode
    while (!isUnique && attempts < 10) {
      barcode = generateBarcode();
      const existingItem = await Inventory.findOne({ barcode });
      if (!existingItem) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return res.status(500).json({ error: 'Could not generate unique barcode' });
    }

    // Ensure barcode, batchNumber, and manufacturer are always set
    const newItem = new Inventory({
      ...req.body,
      itemId: 'ITEM' + Date.now().toString().slice(-6),
      barcode: barcode,
      batchNumber: req.body.batchNumber,
      manufacturer: req.body.manufacturer,
      status: 'Available'
    });
    await newItem.save();
    if (global.io) global.io.emit('inventory-updated');
    res.status(201).json({
      message: 'Inventory item added successfully',
      item: newItem
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update inventory item
router.put('/:id', async (req, res) => {
  try {
    const item = await Inventory.findOneAndUpdate(
      { itemId: req.params.id },
      req.body,
      { new: true }
    );
    if (!item) return res.status(404).json({ error: 'Inventory item not found' });
    if (global.io) global.io.emit('inventory-updated');
    res.json({
      message: 'Inventory item updated successfully',
      item
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete inventory item
router.delete('/:id', async (req, res) => {
  try {
    const item = await Inventory.findOneAndDelete({ itemId: req.params.id });
    if (!item) return res.status(404).json({ error: 'Inventory item not found' });
    if (global.io) global.io.emit('inventory-updated');
    res.json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get low stock items
router.get('/low-stock/alerts', async (req, res) => {
  try {
    const lowStockItems = await Inventory.find({ $expr: { $lte: ["$quantity", "$minStock"] } });
    res.json(lowStockItems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get expiring items
router.get('/expiring/alerts', async (req, res) => {
  try {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const expiringItems = await Inventory.find({ expiryDate: { $lte: thirtyDaysFromNow } });
    res.json(expiringItems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get inventory statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const totalItems = await Inventory.countDocuments();
    const lowStockCount = await Inventory.countDocuments({ $expr: { $lte: ["$quantity", "$minStock"] } });
    const outOfStockCount = await Inventory.countDocuments({ quantity: 0 });
    const items = await Inventory.find();
    const categoryStats = items.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {});
    const totalValue = items.reduce((sum, item) => sum + (item.quantity * (item.cost || 0)), 0);
    res.json({
      totalItems: Number(totalItems),
      lowStockCount: Number(lowStockCount),
      outOfStockCount: Number(outOfStockCount),
      categoryStats,
      totalValue: Number(totalValue).toFixed(2)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update stock quantity
router.put('/:id/stock', async (req, res) => {
  try {
    const { quantity, operation } = req.body; // operation: 'add' or 'subtract'
    const item = await Inventory.findOne({ itemId: req.params.id });
    if (!item) return res.status(404).json({ error: 'Inventory item not found' });
    if (operation === 'add') {
      item.quantity += quantity;
    } else if (operation === 'subtract') {
      if (item.quantity < quantity) {
        return res.status(400).json({ error: 'Insufficient stock' });
      }
      item.quantity -= quantity;
    }
    // Update status based on quantity
    if (item.quantity === 0) {
      item.status = 'Out of Stock';
    } else if (item.quantity <= item.minStock) {
      item.status = 'Low Stock';
    } else {
      item.status = 'Available';
    }
    await item.save();
    res.json({
      message: 'Stock updated successfully',
      item
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router; 