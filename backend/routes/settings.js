const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const admin = require('../middleware/admin');

// @route   GET /api/settings
// @desc    Get system settings
// @access  Private (Admin only)
router.get('/', [auth, admin], async (req, res) => {
  try {
    // In a real application, you would fetch settings from a database
    // For now, return empty settings object
    const settings = {
      hospital: {
        name: '',
        address: '',
        phone: '',
        email: '',
        website: '',
        workingHours: {
          start: '08:00',
          end: '18:00'
        },
        timezone: 'UTC'
      },
      security: {
        passwordMinLength: 8,
        requireSpecialChars: true,
        sessionTimeout: 30,
        maxLoginAttempts: 5,
        enableTwoFactor: false,
        requireEmailVerification: true
      },
      notifications: {
        emailNotifications: true,
        smsNotifications: false,
        appointmentReminders: true,
        emergencyAlerts: true,
        systemAlerts: true
      },
      backup: {
        autoBackup: true,
        backupFrequency: 'daily',
        retentionDays: 30,
        backupLocation: 'local'
      },
      appearance: {
        theme: 'light',
        primaryColor: '#3B82F6',
        logoUrl: '',
        faviconUrl: ''
      }
    };

    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/settings
// @desc    Update system settings
// @access  Private (Admin only)
router.put('/', [auth, admin], async (req, res) => {
  try {
    const settings = req.body;

    // Validate required fields
    if (!settings.hospital || !settings.hospital.name) {
      return res.status(400).json({ error: 'Hospital name is required' });
    }

    // In a real application, you would save these to a database
    // For now, just return success
    res.json({ 
      message: 'Settings updated successfully',
      settings: settings
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 