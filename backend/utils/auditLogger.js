const AuditLog = require('../models/AuditLog');

async function logAudit({ req, action, description, status = 'SUCCESS', details }) {
  try {
    // Try to get user from req.user, then req.body, then fallback
    let user = 'Unknown';
    if (req.user && req.user.email) {
      user = req.user.email;
    } else if (req.body && req.body.email) {
      user = req.body.email;
    } else if (req.body && req.body.username) {
      user = req.body.username;
    }
    await AuditLog.create({
      user,
      action,
      description,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      status,
      details
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}

module.exports = logAudit; 