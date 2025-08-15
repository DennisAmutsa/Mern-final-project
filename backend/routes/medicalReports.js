const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const MedicalReport = require('../models/MedicalReport');

// Get all medical reports with pagination and filters
router.get('/', authenticateToken, requireRole(['doctor', 'admin', 'nurse']), async (req, res) => {
  try {
    // Add cache control headers to prevent caching
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    const { page = 1, limit = 7, doctor, patient, type, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    console.log('Fetching medical reports with query:', { page, limit, doctor, patient, type, status });
    console.log('Current user:', req.user._id, req.user.role);
    
    // Build query
    let query = {};
    
    // Role-based filtering
    if (req.user.role === 'doctor') {
      query.doctor = req.user._id;
    }
    
    // Additional filters
    if (doctor) {
      query.doctor = doctor;
    }
    if (patient) {
      query.patient = patient;
    }
    if (type && type !== 'all') {
      query.type = type;
    }
    if (status && status !== 'all') {
      query.status = status;
    }
    
    console.log('Database query:', query);
    
    // Get total count
    const totalReports = await MedicalReport.countDocuments(query);
    console.log('Total reports in database:', totalReports);
    
    // Get paginated reports with patient and doctor details
    const reports = await MedicalReport.find(query)
      .populate('patient', 'firstName lastName')
      .populate('doctor', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    console.log('Final paginated reports:', reports.length);
    
    res.json({
      reports: reports,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalReports / limit),
        totalReports: totalReports,
        hasNext: skip + reports.length < totalReports,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching medical reports:', error);
    res.status(500).json({ error: 'Failed to fetch medical reports' });
  }
});

// Create new medical report
router.post('/', authenticateToken, requireRole(['doctor']), async (req, res) => {
  try {
    const { patient, type, title, content, findings, recommendations, attachments } = req.body;
    
    console.log('Creating medical report with data:', { patient, type, title, content, doctor: req.user._id });
    
    if (!patient || !type || !title || !content) {
      return res.status(400).json({ error: 'Patient, type, title, and content are required' });
    }
    
    const newReport = new MedicalReport({
      patient,
      doctor: req.user._id,
      type,
      title,
      content,
      findings: findings || '',
      recommendations: recommendations || '',
      status: 'Draft',
      attachments: attachments || []
    });
    
    const savedReport = await newReport.save();
    
    // Populate patient and doctor details for response
    await savedReport.populate('patient', 'firstName lastName');
    await savedReport.populate('doctor', 'firstName lastName');
    
    console.log('Medical report saved to database:', savedReport._id);
    
    res.status(201).json({ message: 'Medical report created successfully', report: savedReport });
  } catch (error) {
    console.error('Error creating medical report:', error);
    res.status(500).json({ error: 'Failed to create medical report' });
  }
});

// Get single medical report
router.get('/:id', authenticateToken, requireRole(['doctor', 'admin', 'nurse']), async (req, res) => {
  try {
    const report = await MedicalReport.findById(req.params.id)
      .populate('patient', 'firstName lastName')
      .populate('doctor', 'firstName lastName');
    
    if (!report) {
      return res.status(404).json({ error: 'Medical report not found' });
    }
    
    // Check if user has access to this report
    if (req.user.role === 'doctor' && report.doctor._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json({ report });
  } catch (error) {
    console.error('Error fetching medical report:', error);
    res.status(500).json({ error: 'Failed to fetch medical report' });
  }
});

// Update medical report
router.put('/:id', authenticateToken, requireRole(['doctor']), async (req, res) => {
  try {
    const report = await MedicalReport.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ error: 'Medical report not found' });
    }
    
    // Check if user owns this report
    if (report.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const { patient, type, title, content, findings, recommendations, status, attachments } = req.body;
    
    const updatedReport = await MedicalReport.findByIdAndUpdate(
      req.params.id,
      {
        patient: patient || report.patient,
        type: type || report.type,
        title: title || report.title,
        content: content || report.content,
        findings: findings !== undefined ? findings : report.findings,
        recommendations: recommendations !== undefined ? recommendations : report.recommendations,
        status: status || report.status,
        attachments: attachments || report.attachments,
        updatedAt: new Date()
      },
      { new: true }
    ).populate('patient', 'firstName lastName')
     .populate('doctor', 'firstName lastName');
    
    res.json({ message: 'Medical report updated successfully', report: updatedReport });
  } catch (error) {
    console.error('Error updating medical report:', error);
    res.status(500).json({ error: 'Failed to update medical report' });
  }
});

// Delete medical report
router.delete('/:id', authenticateToken, requireRole(['doctor']), async (req, res) => {
  try {
    const report = await MedicalReport.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ error: 'Medical report not found' });
    }
    
    // Check if user owns this report
    if (report.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await MedicalReport.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Medical report deleted successfully' });
  } catch (error) {
    console.error('Error deleting medical report:', error);
    res.status(500).json({ error: 'Failed to delete medical report' });
  }
});

module.exports = router;
