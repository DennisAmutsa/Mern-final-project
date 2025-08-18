const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');

// In-memory storage for schedule requests (in production, use database)
let scheduleRequests = [];

// Submit a new schedule request (doctors)
router.post('/', authenticateToken, requireRole(['doctor']), async (req, res) => {
  try {
    const requestData = {
      _id: Date.now().toString(), // Simple ID generation
      ...req.body,
      submittedAt: new Date().toISOString(),
      status: 'pending'
    };
    
    scheduleRequests.push(requestData);
    
    console.log('📋 New schedule request submitted:', requestData);
    
    res.status(201).json({
      message: 'Schedule request submitted successfully',
      request: requestData
    });
  } catch (error) {
    console.error('Error submitting schedule request:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all schedule requests (admin only)
router.get('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { status, doctorId } = req.query;
    
    let filteredRequests = [...scheduleRequests];
    
    // Filter by status if provided
    if (status && status !== 'all') {
      filteredRequests = filteredRequests.filter(req => req.status === status);
    }
    
    // Filter by doctor if provided
    if (doctorId) {
      filteredRequests = filteredRequests.filter(req => req.doctorId === doctorId);
    }
    
    // Sort by submission date (newest first)
    filteredRequests.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    
    res.json({
      requests: filteredRequests,
      total: filteredRequests.length
    });
  } catch (error) {
    console.error('Error fetching schedule requests:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get schedule requests for a specific doctor
router.get('/doctor/:doctorId', authenticateToken, requireRole(['doctor']), async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    // Ensure doctors can only see their own requests
    if (req.user._id !== doctorId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const doctorRequests = scheduleRequests
      .filter(req => req.doctorId === doctorId)
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    
    res.json({
      requests: doctorRequests,
      total: doctorRequests.length
    });
  } catch (error) {
    console.error('Error fetching doctor schedule requests:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update schedule request status (admin only)
router.put('/:requestId', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, adminNotes } = req.body;
    
    const requestIndex = scheduleRequests.findIndex(req => req._id === requestId);
    
    if (requestIndex === -1) {
      return res.status(404).json({ message: 'Schedule request not found' });
    }
    
    // Update the request
    scheduleRequests[requestIndex] = {
      ...scheduleRequests[requestIndex],
      status,
      adminNotes,
      reviewedAt: new Date().toISOString(),
      reviewedBy: req.user._id
    };
    
    console.log('📋 Schedule request updated:', scheduleRequests[requestIndex]);
    
    res.json({
      message: 'Schedule request updated successfully',
      request: scheduleRequests[requestIndex]
    });
  } catch (error) {
    console.error('Error updating schedule request:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete a schedule request (admin only)
router.delete('/:requestId', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { requestId } = req.params;
    
    const requestIndex = scheduleRequests.findIndex(req => req._id === requestId);
    
    if (requestIndex === -1) {
      return res.status(404).json({ message: 'Schedule request not found' });
    }
    
    scheduleRequests.splice(requestIndex, 1);
    
    console.log('📋 Schedule request deleted:', requestId);
    
    res.json({ message: 'Schedule request deleted successfully' });
  } catch (error) {
    console.error('Error deleting schedule request:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
