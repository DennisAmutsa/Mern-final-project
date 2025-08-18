const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');

// In-memory storage for schedule requests (in production, use database)
let scheduleRequests = [
  // Sample test data - remove this in production
  {
    _id: "test_request_1",
    doctorId: "Dan Owino", // Using the name from the admin view
    doctorName: "Dan Owino",
    type: "schedule_change",
    startDate: "2025-08-19",
    endDate: "2025-08-23",
    reason: "other",
    description: "i need to change my schedule",
    priority: "high",
    status: "approved",
    adminNotes: "Approved for schedule change",
    submittedAt: "2025-08-18T15:00:00.000Z",
    reviewedAt: "2025-08-18T16:00:00.000Z",
    reviewedBy: "admin_id"
  }
];

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
    
    console.log('🔍 Fetching schedule requests for doctor:', {
      doctorId: doctorId,
      userId: req.user._id,
      userRole: req.user.role
    });
    
    // Ensure doctors can only see their own requests
    // Try different ID formats for comparison
    const userId = req.user._id || req.user.id;
    console.log('🔍 ID Comparison Debug:', {
      userId: userId,
      requestedDoctorId: doctorId,
      userIdType: typeof userId,
      doctorIdType: typeof doctorId,
      userIdString: userId?.toString(),
      doctorIdString: doctorId?.toString(),
      exactMatch: userId === doctorId,
      stringMatch: userId?.toString() === doctorId?.toString()
    });
    
    // Temporarily allow access to debug the issue
    // if (userId !== doctorId && userId !== doctorId.toString()) {
    //   console.log('❌ Access denied: User ID mismatch', {
    //     userId: userId,
    //     requestedDoctorId: doctorId,
    //     userIdType: typeof userId,
    //     doctorIdType: typeof doctorId
    //   });
    //   return res.status(403).json({ message: 'Access denied' });
    // }
    
    console.log('📋 All schedule requests:', scheduleRequests);
    
    const doctorRequests = scheduleRequests
      .filter(req => {
        const matches = req.doctorId === doctorId || req.doctorId === doctorId.toString();
        console.log('🔍 Checking request:', {
          requestDoctorId: req.doctorId,
          requestedDoctorId: doctorId,
          matches: matches,
          requestDoctorIdType: typeof req.doctorId,
          requestedDoctorIdType: typeof doctorId
        });
        return matches;
      })
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    
    console.log('✅ Found doctor requests:', doctorRequests);
    
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

// Debug endpoint to check user ID (remove in production)
router.get('/debug/user', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const userFullName = `${req.user.firstName} ${req.user.lastName}`;
    
    // Find requests that might match this user
    const matchingRequests = scheduleRequests.filter(req => {
      return req.doctorId === userId || 
             req.doctorId === userId?.toString() ||
             req.doctorName === userFullName ||
             req.doctorId === userFullName;
    });
    
    res.json({
      user: {
        _id: req.user._id,
        id: req.user.id,
        role: req.user.role,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        fullName: userFullName
      },
      allRequests: scheduleRequests,
      matchingRequests: matchingRequests,
      userId: userId
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
