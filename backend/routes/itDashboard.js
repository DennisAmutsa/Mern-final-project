const express = require('express');
const router = express.Router();
const User = require('../models/User');
const SystemSettings = require('../models/SystemSettings');
const { authenticateToken, requireRole } = require('../middleware/auth');
const logAudit = require('../utils/auditLogger');
const os = require('os');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Helper functions for security events
const getSecurityEventTitle = (action) => {
  const titles = {
    'LOGIN_SUCCESS': 'Successful Login',
    'LOGIN_FAILED': 'Failed Login Attempt',
    'LOGIN_BLOCKED': 'Login Blocked',
    'USER_SUSPENDED': 'User Account Suspended',
    'USER_ACTIVATED': 'User Account Activated',
    'PASSWORD_CHANGE': 'Password Changed',
    'ROLE_CHANGE': 'User Role Changed',
    'SYSTEM_ALERT': 'System Security Alert'
  };
  return titles[action] || 'Security Event';
};

const getSecurityEventDescription = (action, userEmail) => {
  const descriptions = {
    'LOGIN_SUCCESS': `User ${userEmail} successfully logged in`,
    'LOGIN_FAILED': `Failed login attempt for user ${userEmail}`,
    'LOGIN_BLOCKED': `Login blocked for suspended user ${userEmail}`,
    'USER_SUSPENDED': `User account ${userEmail} has been suspended`,
    'USER_ACTIVATED': `User account ${userEmail} has been activated`,
    'PASSWORD_CHANGE': `Password changed for user ${userEmail}`,
    'ROLE_CHANGE': `Role changed for user ${userEmail}`,
    'SYSTEM_ALERT': 'System security alert detected'
  };
  return descriptions[action] || `Security event for user ${userEmail}`;
};

// Get system health status
router.get('/system-health', authenticateToken, requireRole(['it']), async (req, res) => {
  try {
    // Get real system metrics
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memoryUsagePercent = Math.round((1 - freeMem / totalMem) * 100);
    const serverUptime = Math.floor(os.uptime() / 3600);
    
    // Handle CPU load average (not available on Windows)
    let cpuLoad = 0;
    try {
      cpuLoad = os.loadavg()[0];
    } catch (err) {
      console.log('CPU load average not available on this system, using fallback');
      cpuLoad = 0.5; // Default load
    }
    
    // Check database connection status
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Calculate uptime percentage (simplified)
    const uptimePercent = serverUptime > 24 ? '99.9%' : serverUptime > 12 ? '99.5%' : '98.0%';
    
    // Get last backup time from file system or database
    let lastBackup = 'Never';
    try {
      const backupDir = path.join(__dirname, '../backups');
      if (fs.existsSync(backupDir)) {
        const files = fs.readdirSync(backupDir);
        if (files.length > 0) {
          const latestFile = files.sort().reverse()[0];
          const stats = fs.statSync(path.join(backupDir, latestFile));
          const hoursAgo = Math.floor((Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60));
          lastBackup = hoursAgo === 0 ? 'Less than 1 hour ago' : `${hoursAgo} hours ago`;
        }
      }
    } catch (error) {
      console.log('No backup directory found');
    }

    const systemHealth = {
      serverStatus: memoryUsagePercent < 90 ? 'online' : 'warning',
      databaseStatus: dbStatus,
      apiStatus: 'healthy',
      uptime: uptimePercent,
      lastBackup: lastBackup,
      serverUptime: `${serverUptime} hours`,
      memoryUsage: `${memoryUsagePercent}%`,
      cpuLoad: Math.round(cpuLoad * 100) / 100,
      totalMemory: Math.round(totalMem / (1024 * 1024 * 1024) * 100) / 100 + ' GB',
      freeMemory: Math.round(freeMem / (1024 * 1024 * 1024) * 100) / 100 + ' GB'
    };

    res.json(systemHealth);
  } catch (error) {
    console.error('Error fetching system health:', error);
    res.status(500).json({ error: 'Failed to fetch system health' });
  }
});

// Get user statistics
router.get('/user-stats', authenticateToken, requireRole(['it']), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });
    
    // Get users by role
    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get users created in last 7 days
    const newUsersThisWeek = await User.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    // Get REAL recent logins from audit logs (last 24 hours)
    const AuditLog = require('../models/AuditLog');
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const recentLogins = await AuditLog.countDocuments({
      action: 'LOGIN_SUCCESS',
      createdAt: { $gte: twentyFourHoursAgo }
    });

    // Get REAL failed login attempts from audit logs (last 24 hours)
    const failedAttempts = await AuditLog.countDocuments({
      action: 'LOGIN_FAILED',
      createdAt: { $gte: twentyFourHoursAgo }
    });

    const userStats = {
      totalUsers,
      activeUsers,
      inactiveUsers,
      recentLogins,
      failedAttempts,
      newUsersThisWeek,
      usersByRole: usersByRole.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    };

    res.json(userStats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
});

// Get suspended accounts
router.get('/suspended-accounts', authenticateToken, requireRole(['it']), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '', department = '' } = req.query;
    
    // Build query for suspended users
    let query = { isActive: false };
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) {
      query.role = role;
    }
    
    if (department) {
      query.department = department;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get suspended users with pagination
    const suspendedUsers = await User.find(query)
      .select('-password') // Exclude password
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalSuspendedUsers = await User.countDocuments(query);

    // Get suspension statistics
    const suspensionStats = await User.aggregate([
      { $match: { isActive: false } },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      suspendedUsers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalSuspendedUsers / limit),
        totalSuspendedUsers,
        itemsPerPage: parseInt(limit),
        hasNext: skip + suspendedUsers.length < totalSuspendedUsers,
        hasPrev: page > 1
      },
      stats: {
        totalSuspended: totalSuspendedUsers,
        byRole: suspensionStats
      }
    });
  } catch (error) {
    console.error('Error fetching suspended accounts:', error);
    res.status(500).json({ error: 'Failed to fetch suspended accounts' });
  }
});

// Get all users for management
router.get('/users', authenticateToken, requireRole(['it']), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '', status = '', accountLocked = '' } = req.query;
    
    // Build query
    let query = {};
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) {
      query.role = role;
    }
    
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    // Filter by locked accounts
    if (accountLocked === 'true') {
      query.accountLocked = true;
    } else if (accountLocked === 'false') {
      query.accountLocked = false;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get users with pagination
    const users = await User.find(query)
      .select('-password') // Exclude password
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalUsers = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalUsers / parseInt(limit)),
        totalUsers,
        hasNextPage: skip + users.length < totalUsers,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Update user status (activate/deactivate)
router.patch('/users/:userId/status', authenticateToken, requireRole(['it']), async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log the action for audit trail
    const action = isActive ? 'USER_ACTIVATED' : 'USER_SUSPENDED';
    const description = `User ${user.email} was ${isActive ? 'activated' : 'suspended'} by IT administrator`;
    
    await logAudit({ 
      req, 
      action, 
      description,
      status: 'SUCCESS',
      details: `${isActive ? 'Activated' : 'Suspended'} the user ${user.email}`
    });

    // If user is being suspended, log a special security event
    if (!isActive) {
      console.log(`🚫 USER SUSPENDED: ${user.email} (${user.firstName} ${user.lastName})`);
      console.log(`   - User ID: ${userId}`);
      console.log(`   - Suspended by: ${req.user.email}`);
      console.log(`   - Date: ${new Date().toISOString()}`);
      
      // In a real system, you would send an email notification here
      // Example: await sendSuspensionNotificationEmail(user);
    } else {
      console.log(`✅ USER ACTIVATED: ${user.email} (${user.firstName} ${user.lastName})`);
    }

    res.json({ 
      message: `User ${isActive ? 'activated' : 'suspended'} successfully`,
      user 
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Update user role
router.patch('/users/:userId/role', authenticateToken, requireRole(['it']), async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      message: 'User role updated successfully',
      user 
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Delete user
router.delete('/users/:userId', authenticateToken, requireRole(['it']), async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get security alerts
router.get('/security-alerts', authenticateToken, requireRole(['it']), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    // Get real security data based on actual system state
    const securityAlerts = [];
    
    // Get recent audit logs for security events
    const AuditLog = require('../models/AuditLog');
    const recentSecurityEvents = await AuditLog.find({
      $or: [
        { action: 'LOGIN_SUCCESS' },
        { action: 'LOGIN_FAILED' },
        { action: 'LOGIN_BLOCKED' },
        { action: 'USER_SUSPENDED' },
        { action: 'USER_ACTIVATED' },
        { action: 'PASSWORD_CHANGE' },
        { action: 'ROLE_CHANGE' }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit) + 10); // Get a bit more to account for system alerts

    // Convert audit logs to security alerts format
    recentSecurityEvents.forEach((event, index) => {
      let severity = 'medium';
      let status = 'monitoring';
      
      if (event.action === 'LOGIN_BLOCKED' || event.action === 'USER_SUSPENDED') {
        severity = 'high';
        status = 'action-required';
      } else if (event.action === 'LOGIN_FAILED') {
        severity = 'medium';
        status = 'investigating';
      } else if (event.action === 'LOGIN_SUCCESS') {
        severity = 'low';
        status = 'resolved';
      }

      securityAlerts.push({
        id: index + 1,
        title: getSecurityEventTitle(event.action),
        description: event.description || getSecurityEventDescription(event.action, event.user),
        severity: severity,
        timestamp: (event.createdAt || event.timestamp || new Date()).toISOString(),
        status: status,
        // Additional details for "who tried to do what"
        userEmail: event.user || 'Unknown',
        eventType: event.action,
        ipAddress: event.ipAddress || '127.0.0.1',
        userAgent: event.userAgent || 'Unknown device',
        details: event.details || 'No additional details'
      });
    });

    // Add system-level security alerts
    const inactiveUsers = await User.countDocuments({ isActive: false });
    if (inactiveUsers > 0) {
      securityAlerts.push({
        id: securityAlerts.length + 1,
        title: 'Inactive User Accounts',
        description: `${inactiveUsers} inactive user accounts detected`,
        severity: inactiveUsers > 5 ? 'high' : 'medium',
        timestamp: new Date().toISOString(),
        status: 'monitoring',
        userEmail: 'System',
        eventType: 'SYSTEM_ALERT',
        ipAddress: 'N/A',
        userAgent: 'System Monitor',
        details: `Found ${inactiveUsers} suspended accounts`
      });
    }

    // Check for users without proper roles
    const usersWithoutRole = await User.countDocuments({ role: { $exists: false } });
    if (usersWithoutRole > 0) {
      securityAlerts.push({
        id: securityAlerts.length + 1,
        title: 'Users Without Assigned Roles',
        description: `${usersWithoutRole} users found without proper role assignments`,
        severity: 'high',
        timestamp: new Date().toISOString(),
        status: 'investigating',
        userEmail: 'System',
        eventType: 'SYSTEM_ALERT',
        ipAddress: 'N/A',
        userAgent: 'System Monitor',
        details: `Found ${usersWithoutRole} users without roles`
      });
    }

    // Check database connection health
    const dbStatus = mongoose.connection.readyState;
    if (dbStatus !== 1) {
      securityAlerts.push({
        id: securityAlerts.length + 1,
        title: 'Database Connection Issues',
        description: `Database connection status: ${dbStatus === 0 ? 'disconnected' : 'connecting'}`,
        severity: 'high',
        timestamp: new Date().toISOString(),
        status: 'investigating',
        userEmail: 'System',
        eventType: 'SYSTEM_ALERT',
        ipAddress: 'N/A',
        userAgent: 'Database Monitor',
        details: `Connection state: ${dbStatus}`
      });
    }

    // Check memory usage
    const memoryUsage = Math.round((1 - os.freemem() / os.totalmem()) * 100);
    if (memoryUsage > 85) {
      securityAlerts.push({
        id: securityAlerts.length + 1,
        title: 'High Memory Usage',
        description: `System memory usage is at ${memoryUsage}%`,
        severity: 'medium',
        timestamp: new Date().toISOString(),
        status: 'monitoring',
        userEmail: 'System',
        eventType: 'SYSTEM_ALERT',
        ipAddress: 'N/A',
        userAgent: 'System Monitor',
        details: `Memory usage: ${memoryUsage}%`
      });
    }

    // Check for recent user registrations (potential security audit)
    const recentRegistrations = await User.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
    });
    if (recentRegistrations > 3) {
      securityAlerts.push({
        id: securityAlerts.length + 1,
        title: 'Unusual Registration Activity',
        description: `${recentRegistrations} new user registrations in the last hour`,
        severity: 'medium',
        timestamp: new Date().toISOString(),
        status: 'investigating',
        userEmail: 'System',
        eventType: 'SYSTEM_ALERT',
        ipAddress: 'N/A',
        userAgent: 'System Monitor',
        details: `${recentRegistrations} registrations in last hour`
      });
    }

    // Check for users with weak passwords (simulated)
    const weakPasswordUsers = await User.countDocuments({ 
      $or: [
        { password: { $regex: /^123456/ } },
        { password: { $regex: /^password/ } }
      ]
    });
    if (weakPasswordUsers > 0) {
      securityAlerts.push({
        id: securityAlerts.length + 1,
        title: 'Weak Password Detection',
        description: `${weakPasswordUsers} users detected with potentially weak passwords`,
        severity: 'high',
        timestamp: new Date().toISOString(),
        status: 'action-required',
        userEmail: 'System',
        eventType: 'SYSTEM_ALERT',
        ipAddress: 'N/A',
        userAgent: 'Password Monitor',
        details: `${weakPasswordUsers} weak passwords detected`
      });
    }

    // Check for multiple failed login attempts (simulated)
    const failedLoginAttempts = Math.floor(Math.random() * 10) + 1;
    if (failedLoginAttempts > 5) {
      securityAlerts.push({
        id: securityAlerts.length + 1,
        title: 'Multiple Failed Login Attempts',
        description: `${failedLoginAttempts} failed login attempts detected in the last hour`,
        severity: 'high',
        timestamp: new Date().toISOString(),
        status: 'investigating'
      });
    }

    // Check for suspicious IP addresses (simulated)
    const suspiciousIPs = Math.floor(Math.random() * 3);
    if (suspiciousIPs > 0) {
      securityAlerts.push({
        id: 8,
        title: 'Suspicious IP Activity',
        description: `${suspiciousIPs} suspicious IP addresses detected accessing the system`,
        severity: 'high',
        timestamp: new Date().toISOString(),
        status: 'blocked'
      });
    }

    // Check for unauthorized access attempts (simulated)
    const unauthorizedAttempts = Math.floor(Math.random() * 5);
    if (unauthorizedAttempts > 2) {
      securityAlerts.push({
        id: 9,
        title: 'Unauthorized Access Attempts',
        description: `${unauthorizedAttempts} unauthorized access attempts to restricted areas`,
        severity: 'critical',
        timestamp: new Date().toISOString(),
        status: 'investigating'
      });
    }

    // Check for system vulnerabilities (simulated)
    const systemVulnerabilities = Math.floor(Math.random() * 2);
    if (systemVulnerabilities > 0) {
      securityAlerts.push({
        id: 10,
        title: 'System Vulnerability Detected',
        description: 'Potential security vulnerability detected in system components',
        severity: 'high',
        timestamp: new Date().toISOString(),
        status: 'patch-required'
      });
    }

    // Check for data backup issues
    const backupDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) {
      securityAlerts.push({
        id: 11,
        title: 'Backup System Not Configured',
        description: 'No backup directory found - data backup system not properly configured',
        severity: 'high',
        timestamp: new Date().toISOString(),
        status: 'action-required'
      });
    }

    // Check for SSL/TLS certificate expiration (simulated)
    const daysUntilExpiry = Math.floor(Math.random() * 30) + 1;
    if (daysUntilExpiry < 7) {
      securityAlerts.push({
        id: 12,
        title: 'SSL Certificate Expiring Soon',
        description: `SSL certificate will expire in ${daysUntilExpiry} days`,
        severity: 'medium',
        timestamp: new Date().toISOString(),
        status: 'action-required'
      });
    }

    // Apply pagination
    const totalAlerts = securityAlerts.length;
    const paginatedAlerts = securityAlerts.slice(skip, skip + parseInt(limit));
    
    res.json({
      alerts: paginatedAlerts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalAlerts / limit),
        totalAlerts: totalAlerts,
        hasNext: skip + parseInt(limit) < totalAlerts,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching security alerts:', error);
    res.status(500).json({ error: 'Failed to fetch security alerts' });
  }
});

// Get support tickets
router.get('/support-tickets', authenticateToken, requireRole(['it']), async (req, res) => {
  try {
    // Generate support tickets based on actual system issues
    const supportTickets = [];
    
    // Check for users with issues
    const usersWithIssues = await User.find({
      $or: [
        { isActive: false },
        { role: { $exists: false } },
        { email: { $exists: false } }
      ]
    }).limit(5);

    usersWithIssues.forEach((user, index) => {
      let title, description, priority;
      
      if (!user.isActive) {
        title = 'Account Deactivation Request';
        description = `User ${user.firstName} ${user.lastName} account is inactive`;
        priority = 'medium';
      } else if (!user.role) {
        title = 'Role Assignment Required';
        description = `User ${user.firstName} ${user.lastName} needs role assignment`;
        priority = 'high';
      } else if (!user.email) {
        title = 'Missing Email Address';
        description = `User ${user.firstName} ${user.lastName} has no email address`;
        priority = 'low';
      }

      supportTickets.push({
        id: index + 1,
        title,
        description,
        priority,
        status: 'open',
        submittedBy: user.firstName + ' ' + user.lastName,
        timestamp: user.createdAt.toISOString()
      });
    });

    // Add system-related tickets based on actual metrics
    const memoryUsage = Math.round((1 - os.freemem() / os.totalmem()) * 100);
    if (memoryUsage > 80) {
      supportTickets.push({
        id: supportTickets.length + 1,
        title: 'High System Memory Usage',
        description: `System memory usage is at ${memoryUsage}%, may affect performance`,
        priority: 'high',
        status: 'in-progress',
        submittedBy: 'System Monitor',
        timestamp: new Date().toISOString()
      });
    }

    const dbStatus = mongoose.connection.readyState;
    if (dbStatus !== 1) {
      supportTickets.push({
        id: supportTickets.length + 1,
        title: 'Database Connection Issue',
        description: 'Database connection is not stable',
        priority: 'high',
        status: 'investigating',
        submittedBy: 'System Monitor',
        timestamp: new Date().toISOString()
      });
    }

    res.json(supportTickets);
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    res.status(500).json({ error: 'Failed to fetch support tickets' });
  }
});

// Get system metrics
router.get('/system-metrics', authenticateToken, requireRole(['it']), async (req, res) => {
  try {
    console.log('🔍 System metrics request received');
    
    // Get real system metrics
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memoryUsage = Math.round((1 - freeMem / totalMem) * 100);
    
    // Handle CPU load average (not available on Windows)
    let cpuLoad = 0;
    let cpuUsage = 0;
    try {
      cpuLoad = os.loadavg()[0];
      cpuUsage = Math.min(100, Math.round(cpuLoad * 25)); // Convert load to percentage
    } catch (err) {
      console.log('CPU load average not available on this system, using fallback');
      // Fallback for Windows or systems without loadavg
      cpuLoad = 0.5; // Default load
      cpuUsage = Math.floor(Math.random() * 30) + 10; // Random 10-40% usage
    }
    
    // Get disk usage (simplified - in real app would use disk-usage package)
    const diskUsage = Math.floor(Math.random() * 20) + 70; // 70-90%
    
    // Calculate network usage based on active connections
    let activeConnections = 0;
    try {
      // Try to get active connections, but handle cases where the path doesn't exist
      if (mongoose.connection.client && 
          mongoose.connection.client.topology && 
          mongoose.connection.client.topology.s && 
          mongoose.connection.client.topology.s.connections) {
        activeConnections = mongoose.connection.client.topology.s.connections.length;
      }
    } catch (err) {
      console.log('Could not get active connections count:', err.message);
      activeConnections = 0;
    }
    const networkUsage = Math.min(100, Math.round(activeConnections * 2));
    
    // Calculate response time based on database connection
    const dbStatus = mongoose.connection.readyState;
    const responseTime = dbStatus === 1 ? Math.floor(Math.random() * 50) + 20 : 500; // 20-70ms if connected, 500ms if not

    const systemMetrics = {
      cpuUsage: cpuUsage,
      memoryUsage: memoryUsage,
      diskUsage: diskUsage,
      networkUsage: networkUsage,
      activeConnections: activeConnections,
      responseTime: responseTime,
      totalMemory: Math.round(totalMem / (1024 * 1024 * 1024) * 100) / 100 + ' GB',
      freeMemory: Math.round(freeMem / (1024 * 1024 * 1024) * 100) / 100 + ' GB',
      cpuLoad: Math.round(cpuLoad * 100) / 100,
      uptime: Math.floor(os.uptime() / 3600) + ' hours'
    };

    console.log('✅ System metrics calculated successfully:', systemMetrics);
    res.json(systemMetrics);
  } catch (error) {
    console.error('❌ Error fetching system metrics:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to fetch system metrics', details: error.message });
  }
});

// Get recent activity
router.get('/recent-activity', authenticateToken, requireRole(['it']), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    // Get real recent activity based on actual system events
    const recentActivity = [];
    
    // Get recent audit logs for detailed activity tracking
    const AuditLog = require('../models/AuditLog');
    const recentAuditEvents = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) + 10); // Get a bit more to account for system events

    // Convert audit logs to activity format with detailed information
    recentAuditEvents.forEach((event, index) => {
      const eventTime = event.createdAt || event.timestamp || new Date();
      const minutesAgo = Math.floor((Date.now() - eventTime.getTime()) / (1000 * 60));
      const timeAgo = minutesAgo < 60 ? `${minutesAgo} minutes ago` : 
                     minutesAgo < 1440 ? `${Math.floor(minutesAgo / 60)} hours ago` : 
                     `${Math.floor(minutesAgo / 1440)} days ago`;

      let type = 'info';
      if (event.action.includes('FAILED') || event.action.includes('BLOCKED')) {
        type = 'error';
      } else if (event.action.includes('SUSPENDED') || event.action.includes('WARNING')) {
        type = 'warning';
      }

      recentActivity.push({
        id: index + 1,
        description: event.description || getSecurityEventDescription(event.action, event.user),
        type: type,
        timestamp: (event.createdAt || event.timestamp || new Date()).toISOString(),
        timeAgo: timeAgo,
        // Additional details for "who tried to do what"
        userEmail: event.user || 'System',
        eventType: event.action,
        ipAddress: event.ipAddress || '127.0.0.1',
        userAgent: event.userAgent || 'Unknown device',
        details: event.details || 'No additional details',
        status: event.status || 'completed'
      });
    });
    
    // Get recent user registrations
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5);
    
    recentUsers.forEach((user, index) => {
      const minutesAgo = Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60));
      const timeAgo = minutesAgo < 60 ? `${minutesAgo} minutes ago` : 
                     minutesAgo < 1440 ? `${Math.floor(minutesAgo / 60)} hours ago` : 
                     `${Math.floor(minutesAgo / 1440)} days ago`;

      recentActivity.push({
        id: recentActivity.length + 1,
        description: `New user account created: ${user.firstName} ${user.lastName} (${user.role || 'No role'})`,
        type: 'info',
        timestamp: user.createdAt.toISOString(),
        timeAgo: timeAgo,
        userEmail: user.email,
        eventType: 'USER_REGISTRATION',
        ipAddress: '127.0.0.1',
        userAgent: 'Registration System',
        details: `Role: ${user.role || 'No role'}, Status: ${user.isActive ? 'Active' : 'Inactive'}`,
        status: 'completed'
      });
    });

    // Add system health activities
    const memoryUsage = Math.round((1 - os.freemem() / os.totalmem()) * 100);
    if (memoryUsage > 80) {
      recentActivity.push({
        id: recentActivity.length + 1,
        description: `High memory usage detected: ${memoryUsage}%`,
        type: 'warning',
        timestamp: new Date().toISOString(),
        timeAgo: 'Just now',
        userEmail: 'System Monitor',
        eventType: 'SYSTEM_HEALTH',
        ipAddress: 'N/A',
        userAgent: 'System Monitor',
        details: `High memory usage detected (${memoryUsage}%)`,
        status: 'monitoring'
      });
    }

    const dbStatus = mongoose.connection.readyState;
    if (dbStatus !== 1) {
      recentActivity.push({
        id: recentActivity.length + 1,
        description: 'Database connection issue detected',
        type: 'error',
        timestamp: new Date().toISOString(),
        timeAgo: 'Just now',
        userEmail: 'Database Monitor',
        eventType: 'SYSTEM_HEALTH',
        ipAddress: 'N/A',
        userAgent: 'Database Monitor',
        details: `Database connection issue detected`,
        status: 'investigating'
      });
    }

    // Add server uptime activity
    const uptime = Math.floor(os.uptime() / 3600);
    if (uptime > 24) {
      recentActivity.push({
        id: recentActivity.length + 1,
        description: `Server running for ${uptime} hours`,
        type: 'info',
        timestamp: new Date().toISOString(),
        timeAgo: 'Just now',
        userEmail: 'System Monitor',
        eventType: 'SYSTEM_HEALTH',
        ipAddress: 'N/A',
        userAgent: 'System Monitor',
        details: `Server running for ${uptime} hours`,
        status: 'normal'
      });
    }

    // Add user activity summary
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    if (totalUsers > 0) {
      recentActivity.push({
        id: recentActivity.length + 1,
        description: `System status: ${activeUsers}/${totalUsers} users active`,
        type: 'info',
        timestamp: new Date().toISOString(),
        timeAgo: 'Just now',
        userEmail: 'System Monitor',
        eventType: 'SYSTEM_STATUS',
        ipAddress: 'N/A',
        userAgent: 'System Monitor',
        details: `${activeUsers} active users out of ${totalUsers} total`,
        status: 'normal'
      });
    }

    // Sort by timestamp (most recent first)
    recentActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Apply pagination
    const totalActivities = recentActivity.length;
    const paginatedActivities = recentActivity.slice(skip, skip + parseInt(limit));
    
    res.json({
      activities: paginatedActivities,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalActivities / limit),
        totalActivities: totalActivities,
        hasNext: skip + parseInt(limit) < totalActivities,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ error: 'Failed to fetch recent activity' });
  }
});

// Get network status
router.get('/network-status', authenticateToken, requireRole(['it']), async (req, res) => {
  try {
    // Simulate network status (in a real app, this would be actual network monitoring)
    const networkStatus = {
      internetConnection: 'connected',
      bandwidthUsage: Math.floor(Math.random() * 30) + 10, // 10-40%
      latency: Math.floor(Math.random() * 20) + 5, // 5-25ms
      packetLoss: Math.random() * 0.1, // 0-10%
      activeConnections: Math.floor(Math.random() * 100) + 50
    };

    res.json(networkStatus);
  } catch (error) {
    console.error('Error fetching network status:', error);
    res.status(500).json({ error: 'Failed to fetch network status' });
  }
});

// Get backup status
router.get('/backup-status', authenticateToken, requireRole(['it']), async (req, res) => {
  try {
    // Simulate backup status (in a real app, this would come from backup system)
    const backupStatus = {
      lastBackup: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      backupSize: '2.3 GB',
      nextBackup: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
      backupStatus: 'successful',
      retentionDays: 30,
      totalBackups: 15
    };

    res.json(backupStatus);
  } catch (error) {
    console.error('Error fetching backup status:', error);
    res.status(500).json({ error: 'Failed to fetch backup status' });
  }
});

// Unlock user account (IT only)
router.patch('/users/:userId/unlock', authenticateToken, requireRole(['it']), async (req, res) => {
  try {
    console.log('🔓 Unlock account request received for userId:', req.params.userId);
    
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      console.log('❌ User not found:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('👤 Found user:', {
      email: user.email,
      accountLocked: user.accountLocked || false,
      failedLoginAttempts: user.failedLoginAttempts || 0
    });

    // Check if account is locked (with fallback for existing users)
    const isAccountLocked = user.accountLocked === true;
    if (!isAccountLocked) {
      console.log('⚠️ Account is not locked for user:', user.email);
      return res.status(400).json({ error: 'Account is not locked' });
    }

    // Unlock the account
    console.log('🔓 Unlocking account for user:', user.email);
    
    // Use findByIdAndUpdate to avoid enum validation issues
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          accountLocked: false,
          failedLoginAttempts: 0
        },
        $unset: {
          accountLockedAt: 1,
          accountLockedBy: 1,
          lastFailedLogin: 1
        }
      },
      { new: true, runValidators: false }
    );

    console.log('✅ User updated successfully');

    console.log('📝 Logging audit event...');
    try {
      await logAudit({
        req,
        action: 'ACCOUNT_UNLOCKED',
        description: `Account unlocked by IT administrator: ${updatedUser.email}`,
        status: 'SUCCESS',
        details: `IT Administrator ${req.user.email} unlocked account for ${updatedUser.email}`
      });
      console.log('✅ Audit logged successfully');
    } catch (auditError) {
      console.error('⚠️ Audit logging failed, but continuing with unlock:', auditError);
      // Don't fail the unlock operation if audit logging fails
    }

    const response = {
      message: 'Account unlocked successfully',
      user: {
        id: updatedUser._id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        accountLocked: updatedUser.accountLocked || false,
        failedLoginAttempts: updatedUser.failedLoginAttempts || 0
      }
    };

    console.log('✅ Sending success response:', response);
    res.json(response);
  } catch (error) {
    console.error('❌ Error unlocking account:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to unlock account', details: error.message });
  }
});

// Test unlock endpoint (for debugging)
router.patch('/users/:userId/test-unlock', authenticateToken, requireRole(['it']), async (req, res) => {
  try {
    console.log('🧪 Test unlock endpoint called');
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('🧪 User found:', {
      email: user.email,
      accountLocked: user.accountLocked,
      failedLoginAttempts: user.failedLoginAttempts
    });

    // Just return the user info without making changes
    res.json({
      message: 'Test successful',
      user: {
        id: user._id,
        email: user.email,
        accountLocked: user.accountLocked || false,
        failedLoginAttempts: user.failedLoginAttempts || 0
      }
    });
  } catch (error) {
    console.error('🧪 Test unlock error:', error);
    res.status(500).json({ error: 'Test failed', details: error.message });
  }
});

// ===== MAINTENANCE MODE ENDPOINTS =====

// Get maintenance mode status
router.get('/maintenance-status', authenticateToken, requireRole(['it']), async (req, res) => {
  try {
    const settings = await SystemSettings.getInstance();
    res.json({
      maintenanceMode: settings.maintenanceMode,
      lastUpdated: settings.lastUpdated
    });
  } catch (error) {
    console.error('Error fetching maintenance status:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance status' });
  }
});

// Enable maintenance mode
router.post('/maintenance/enable', authenticateToken, requireRole(['it']), async (req, res) => {
  try {
    const { message, estimatedDuration } = req.body;
    const settings = await SystemSettings.getInstance();
    
    settings.maintenanceMode.enabled = true;
    settings.maintenanceMode.activatedAt = new Date();
    settings.maintenanceMode.activatedBy = req.user._id;
    settings.maintenanceMode.message = message || 'System is currently under maintenance. Please try again later.';
    settings.maintenanceMode.estimatedDuration = estimatedDuration || '2 hours';
    settings.lastUpdated = new Date();
    
    await settings.save();

    // Log the maintenance mode activation
    await logAudit({
      req,
      action: 'MAINTENANCE_MODE_ENABLED',
      description: `Maintenance mode enabled by IT administrator: ${req.user.email}`,
      status: 'SUCCESS',
      details: `Maintenance mode activated with message: "${settings.maintenanceMode.message}"`
    });

    res.json({
      message: 'Maintenance mode enabled successfully',
      maintenanceMode: settings.maintenanceMode
    });
  } catch (error) {
    console.error('Error enabling maintenance mode:', error);
    res.status(500).json({ error: 'Failed to enable maintenance mode' });
  }
});

// Disable maintenance mode
router.post('/maintenance/disable', authenticateToken, requireRole(['it']), async (req, res) => {
  try {
    const settings = await SystemSettings.getInstance();
    
    settings.maintenanceMode.enabled = false;
    settings.maintenanceMode.activatedAt = null;
    settings.maintenanceMode.activatedBy = null;
    settings.maintenanceMode.message = '';
    settings.maintenanceMode.estimatedDuration = '';
    settings.lastUpdated = new Date();
    
    await settings.save();

    // Log the maintenance mode deactivation
    await logAudit({
      req,
      action: 'MAINTENANCE_MODE_DISABLED',
      description: `Maintenance mode disabled by IT administrator: ${req.user.email}`,
      status: 'SUCCESS',
      details: 'Maintenance mode deactivated'
    });

    res.json({
      message: 'Maintenance mode disabled successfully',
      maintenanceMode: settings.maintenanceMode
    });
  } catch (error) {
    console.error('Error disabling maintenance mode:', error);
    res.status(500).json({ error: 'Failed to disable maintenance mode' });
  }
});

// Public endpoint to check maintenance status (no authentication required)
router.get('/maintenance/status', async (req, res) => {
  try {
    const settings = await SystemSettings.getInstance();
    res.json({
      maintenanceMode: settings.maintenanceMode.enabled,
      message: settings.maintenanceMode.message,
      estimatedDuration: settings.maintenanceMode.estimatedDuration,
      activatedAt: settings.maintenanceMode.activatedAt
    });
  } catch (error) {
    console.error('Error fetching public maintenance status:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance status' });
  }
});

// Get blocked login attempts during maintenance mode
router.get('/blocked-login-attempts', authenticateToken, requireRole(['it']), async (req, res) => {
  try {
    const { limit = 10, days = 1 } = req.query;
    
    // Calculate the date range (last X days)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    // Get audit logs for blocked login attempts during maintenance
    const AuditLog = require('../models/AuditLog');
    const blockedAttempts = await AuditLog.find({
      action: 'LOGIN_BLOCKED',
      createdAt: { $gte: startDate },
      'details.type': 'MAINTENANCE_MODE'
    })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .populate('user', 'email firstName lastName role')
    .lean();

    // Format the response
    const formattedAttempts = blockedAttempts.map(attempt => ({
      id: attempt._id,
      email: attempt.user?.email || attempt.details?.email || 'Unknown',
      role: attempt.user?.role || attempt.details?.role || 'Unknown',
      timestamp: attempt.createdAt,
      ipAddress: attempt.ipAddress || 'Unknown',
      userAgent: attempt.userAgent || 'Unknown',
      reason: attempt.details?.reason || 'Maintenance mode active'
    }));

    res.json({
      blockedAttempts: formattedAttempts,
      total: formattedAttempts.length,
      period: `${days} day(s)`
    });
  } catch (error) {
    console.error('Error fetching blocked login attempts:', error);
    res.status(500).json({ error: 'Failed to fetch blocked login attempts' });
  }
});

// ===== SYSTEM LOCK ENDPOINTS =====

// Get system lock status
router.get('/system-lock/status', authenticateToken, requireRole(['it']), async (req, res) => {
  try {
    const settings = await SystemSettings.getInstance();
    res.json({
      systemLock: settings.systemLock
    });
  } catch (error) {
    console.error('Error fetching system lock status:', error);
    res.status(500).json({ error: 'Failed to fetch system lock status' });
  }
});

// Enable system lock
router.post('/system-lock/enable', authenticateToken, requireRole(['it']), async (req, res) => {
  try {
    const { reason, emergencyContact } = req.body;
    const settings = await SystemSettings.getInstance();
    
    settings.systemLock.enabled = true;
    settings.systemLock.activatedAt = new Date();
    settings.systemLock.activatedBy = req.user._id;
    settings.systemLock.reason = reason || 'System is currently locked for security reasons.';
    settings.systemLock.emergencyContact = emergencyContact || 'epicedgecreative@gmail.com';
    settings.lastUpdated = new Date();
    
    await settings.save();

    // Log the system lock activation
    await logAudit({
      req,
      action: 'SYSTEM_LOCK_ENABLED',
      description: `System lock enabled by IT administrator: ${req.user.email}`,
      status: 'SUCCESS',
      details: `System lock activated with reason: "${settings.systemLock.reason}"`
    });

    res.json({
      message: 'System lock enabled successfully',
      systemLock: settings.systemLock
    });
  } catch (error) {
    console.error('Error enabling system lock:', error);
    res.status(500).json({ error: 'Failed to enable system lock' });
  }
});

// Disable system lock
router.post('/system-lock/disable', authenticateToken, requireRole(['it']), async (req, res) => {
  try {
    const settings = await SystemSettings.getInstance();
    
    settings.systemLock.enabled = false;
    settings.systemLock.activatedAt = null;
    settings.systemLock.activatedBy = null;
    settings.systemLock.reason = '';
    settings.systemLock.emergencyContact = 'epicedgecreative@gmail.com';
    settings.lastUpdated = new Date();
    
    await settings.save();

    // Log the system lock deactivation
    await logAudit({
      req,
      action: 'SYSTEM_LOCK_DISABLED',
      description: `System lock disabled by IT administrator: ${req.user.email}`,
      status: 'SUCCESS',
      details: 'System lock deactivated'
    });

    res.json({
      message: 'System lock disabled successfully',
      systemLock: settings.systemLock
    });
  } catch (error) {
    console.error('Error disabling system lock:', error);
    res.status(500).json({ error: 'Failed to disable system lock' });
  }
});

// Public endpoint to check system lock status (no authentication required)
router.get('/system-lock/public-status', async (req, res) => {
  try {
    const settings = await SystemSettings.getInstance();
    res.json({
      systemLocked: settings.systemLock.enabled,
      reason: settings.systemLock.reason,
      emergencyContact: settings.systemLock.emergencyContact,
      activatedAt: settings.systemLock.activatedAt
    });
  } catch (error) {
    console.error('Error fetching public system lock status:', error);
    res.status(500).json({ error: 'Failed to fetch system lock status' });
  }
});

// Get blocked login attempts during system lock
router.get('/system-lock/blocked-attempts', authenticateToken, requireRole(['it']), async (req, res) => {
  try {
    const { limit = 10, days = 1 } = req.query;
    
    // Calculate the date range (last X days)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    // Get audit logs for blocked login attempts during system lock
    const AuditLog = require('../models/AuditLog');
    const blockedAttempts = await AuditLog.find({
      action: 'LOGIN_BLOCKED',
      createdAt: { $gte: startDate },
      'details.type': 'SYSTEM_LOCK'
    })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .populate('user', 'email firstName lastName role')
    .lean();

    // Format the response
    const formattedAttempts = blockedAttempts.map(attempt => ({
      id: attempt._id,
      email: attempt.user?.email || attempt.details?.email || 'Unknown',
      role: attempt.user?.role || attempt.details?.role || 'Unknown',
      timestamp: attempt.createdAt,
      ipAddress: attempt.ipAddress || 'Unknown',
      userAgent: attempt.userAgent || 'Unknown',
      reason: attempt.details?.reason || 'System lock active'
    }));

    res.json({
      blockedAttempts: formattedAttempts,
      total: formattedAttempts.length,
      period: `${days} day(s)`
    });
  } catch (error) {
    console.error('Error fetching system lock blocked attempts:', error);
    res.status(500).json({ error: 'Failed to fetch system lock blocked attempts' });
  }
});

module.exports = router;
