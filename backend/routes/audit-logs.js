const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const admin = require('../middleware/admin');
const AuditLog = require('../models/AuditLog');

// @route   GET /api/audit-logs
// @desc    Get audit logs
// @access  Private (Admin only)
router.get('/', [auth, admin], async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(100).lean();
    res.json(logs); // Return as an array
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/audit-logs
// @desc    Create audit log entry
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { action, description, details, status = 'SUCCESS' } = req.body;

    const auditLog = new AuditLog({
      user: req.user.email,
      action,
      description,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      status,
      details
    });

    await auditLog.save();

    res.status(201).json({ message: 'Audit log created successfully' });
  } catch (error) {
    console.error('Error creating audit log:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/audit-logs/stats
// @desc    Get audit log statistics
// @access  Private (Admin only)
router.get('/stats', [auth, admin], async (req, res) => {
  try {
    // Return empty stats since we don't have audit logs yet
    const stats = {
      totalLogs: 0,
      todayLogs: 0,
      failedLogins: 0,
      successfulLogins: 0,
      userActions: {},
      topUsers: []
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching audit log stats:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/audit-logs/user
// @desc    Get audit logs for the current user
// @access  Private
router.get('/user', auth, async (req, res) => {
  try {
    const userEmail = req.user.email;
    const userLogs = await AuditLog.find({
      $or: [
        { user: userEmail },
        { 'details.userId': req.user._id },
        { description: { $regex: userEmail, $options: 'i' } }
      ]
    })
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();
    res.json(userLogs);
  } catch (error) {
    console.error('Error fetching user audit logs:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/audit-logs/notifications/user
// @desc    Get notifications for the current user
// @access  Private
router.get('/notifications/user', auth, async (req, res) => {
  try {
    const userEmail = req.user.email;
    const userId = req.user._id;
    
    // Get user's recent activities as notifications
    const userActivities = await AuditLog.find({
      $or: [
        { user: userEmail },
        { 'details.userId': userId },
        { description: { $regex: userEmail, $options: 'i' } }
      ]
    })
      .sort({ timestamp: -1 })
      .limit(5)
      .lean();
    
    // Convert activities to notifications
    const notifications = userActivities.map((activity, index) => ({
      id: index + 1,
      title: activity.action || 'System Activity',
      message: activity.description || 'An activity was performed on your account',
      type: activity.status === 'SUCCESS' ? 'success' : 
            activity.status === 'FAILED' ? 'error' : 'info',
      timestamp: activity.timestamp
    }));
    
    // If no activities, return empty array
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching user notifications:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 