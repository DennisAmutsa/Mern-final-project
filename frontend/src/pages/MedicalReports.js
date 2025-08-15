import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  Calendar,
  User,
  Stethoscope,
  Activity,
  AlertTriangle,
  CheckCircle,
  X,
  Save,
  Printer,
  Clock,
  FilePlus,
  FileCheck,
  FileX
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiClient from '../config/axios';
import toast from 'react-hot-toast';

const MedicalReports = () => {
  const [reports, setReports] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPatient, setFilterPatient] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReports, setTotalReports] = useState(0);

  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const reportTypes = [
    'Consultation Report',
    'Lab Results Report',
    'Diagnostic Report',
    'Surgery Report',
    'Discharge Summary',
    'Progress Note',
    'Radiology Report',
    'Pathology Report'
  ];

  const reportStatuses = ['Draft', 'Completed', 'Reviewed', 'Archived'];

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchPatients();
      fetchReports();
    }
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [authLoading, isAuthenticated, navigate, currentPage, filterPatient, filterType, filterStatus]);

  const fetchPatients = async () => {
    try {
      const userId = user?.id || user?._id;
      const response = await apiClient.get(`/api/auth/doctor/patients?roles=user&assignedDoctor=${userId}`);
      setPatients(response.data.users || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
      setPatients([]);
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const userId = user?.id || user?._id;
      let url = `/api/medical-reports?page=${currentPage}&limit=7&doctor=${userId}`;
      
      if (filterPatient) url += `&patient=${filterPatient}`;
      if (filterType !== 'all') url += `&type=${filterType}`;
      if (filterStatus !== 'all') url += `&status=${filterStatus}`;
      
      // Add timestamp to prevent caching
      url += `&_t=${Date.now()}`;
      
      const response = await apiClient.get(url);
      
      console.log('Medical reports response:', response.data);
      
      if (response.data.reports) {
        setReports(response.data.reports);
        setTotalPages(response.data.pagination.totalPages);
        setTotalReports(response.data.pagination.totalReports);
      } else {
        setReports([]);
        setTotalPages(1);
        setTotalReports(0);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReport = async (reportData) => {
    try {
      const userId = user?.id || user?._id;
      await apiClient.post('/api/medical-reports', {
        ...reportData,
        doctor: userId,
        status: 'Draft'
      });
      
      toast.success('Medical report created successfully');
      setShowCreateModal(false);
      
      // Reset to first page and refresh data
      setCurrentPage(1);
      await fetchReports();
    } catch (error) {
      toast.error('Failed to create medical report');
      console.error('Error creating report:', error);
    }
  };

  const handleUpdateReport = async (reportId, reportData) => {
    try {
      await apiClient.put(`/api/medical-reports/${reportId}`, reportData);
      toast.success('Medical report updated successfully');
      setShowReportModal(false);
      fetchReports();
    } catch (error) {
      toast.error('Failed to update medical report');
      console.error('Error updating report:', error);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      try {
        await apiClient.delete(`/api/medical-reports/${reportId}`);
        toast.success('Medical report deleted successfully');
        fetchReports();
      } catch (error) {
        toast.error('Failed to delete medical report');
        console.error('Error deleting report:', error);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Reviewed': return 'bg-blue-100 text-blue-800';
      case 'Draft': return 'bg-yellow-100 text-yellow-800';
      case 'Archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPatientName = (patient) => {
    // Handle both old format (patient ID) and new format (populated patient object)
    if (typeof patient === 'string') {
      // Old format: patient is just an ID
      const patientObj = patients.find(p => p._id === patient);
      return patientObj ? `${patientObj.firstName} ${patientObj.lastName}` : 'Unknown Patient';
    } else if (patient && patient.firstName && patient.lastName) {
      // New format: patient is a populated object
      return `${patient.firstName} ${patient.lastName}`;
    }
    return 'Unknown Patient';
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Lab Results Report': return <Activity className="h-4 w-4" />;
      case 'Diagnostic Report': return <Stethoscope className="h-4 w-4" />;
      case 'Surgery Report': return <AlertTriangle className="h-4 w-4" />;
      case 'Discharge Summary': return <CheckCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const filteredReports = reports.filter(report => {
    const patientName = getPatientName(report.patient);
    const matchesSearch = !searchTerm || 
      patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.type?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Medical Reports</h1>
          <p className="text-sm sm:text-base text-gray-600">Create and manage patient medical reports</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center space-x-2 text-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Create Report</span>
          </button>
          <button className="px-3 sm:px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center space-x-2 text-sm">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="sm:col-span-2 lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>
          
          <div>
            <select
              value={filterPatient}
              onChange={(e) => setFilterPatient(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="">All Patients</option>
              {patients.map(patient => (
                <option key={patient._id} value={patient._id}>
                  {patient.firstName} {patient.lastName}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="all">All Types</option>
              {reportTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="all">All Status</option>
              {reportStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <div className="text-sm text-gray-600">
              Showing {filteredReports.length} of {totalReports} reports
              {totalPages > 1 && (
                <span className="ml-2">(Page {currentPage} of {totalPages})</span>
              )}
            </div>
            {totalReports > 0 && (
              <div className="text-sm text-gray-600">
                Total: {totalReports} report{totalReports !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
        
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Report Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500">Loading reports...</p>
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No medical reports found.
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr key={report._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-blue-500 mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          {getPatientName(report.patient)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getTypeIcon(report.type)}
                        <span className="text-sm text-gray-900 ml-2">
                          {report.type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {report.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedReport(report);
                            setShowReportModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedReport(report);
                            setShowReportModal(true);
                          }}
                          className="text-green-600 hover:text-green-800"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteReport(report._id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden">
          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Loading reports...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No medical reports found.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredReports.map((report) => (
                <div key={report._id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center mb-2">
                        <User className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-900 break-words">
                          {getPatientName(report.patient)}
                        </span>
                      </div>
                      <div className="flex items-center mb-2">
                        {getTypeIcon(report.type)}
                        <span className="text-sm text-gray-600 ml-2">
                          {report.type}
                        </span>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${getStatusColor(report.status)}`}>
                      {report.status}
                    </span>
                  </div>
                  
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-900 mb-1">{report.title}</h4>
                    <p className="text-sm text-gray-600">
                      Created: {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setSelectedReport(report);
                        setShowReportModal(true);
                      }}
                      className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                    >
                      View
                    </button>
                    <button
                      onClick={() => {
                        setSelectedReport(report);
                        setShowReportModal(true);
                      }}
                      className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteReport(report._id)}
                      className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pagination Controls */}
      {(totalPages > 1) && (
        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 mt-6">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Previous
          </button>
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Next
          </button>
        </div>
      )}

      {/* Create Report Modal */}
      {showCreateModal && (
        <CreateReportModal
          patients={patients}
          reportTypes={reportTypes}
          onSubmit={handleCreateReport}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* View/Edit Report Modal */}
      {showReportModal && selectedReport && (
        <ReportModal
          report={selectedReport}
          patients={patients}
          reportTypes={reportTypes}
          reportStatuses={reportStatuses}
          onSubmit={handleUpdateReport}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
};

// Create Report Modal Component
const CreateReportModal = ({ patients, reportTypes, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    patient: '',
    type: 'Consultation Report',
    title: '',
    content: '',
    findings: '',
    recommendations: '',
    attachments: []
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.patient || !formData.title || !formData.content) {
      toast.error('Please fill in all required fields');
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-medium text-gray-900">Create Medical Report</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Patient *</label>
              <select
                required
                value={formData.patient}
                onChange={(e) => setFormData({ ...formData, patient: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">Select Patient</option>
                {patients.map(patient => (
                  <option key={patient._id} value={patient._id}>
                    {patient.firstName} {patient.lastName}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Report Type *</label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                {reportTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="Enter report title..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Content *</label>
            <textarea
              required
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
              placeholder="Enter detailed report content..."
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Findings</label>
              <textarea
                value={formData.findings}
                onChange={(e) => setFormData({ ...formData, findings: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                placeholder="Enter findings..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Recommendations</label>
              <textarea
                value={formData.recommendations}
                onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                placeholder="Enter recommendations..."
              />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center space-x-2 text-sm"
            >
              <FilePlus className="h-4 w-4" />
              <span>Create Report</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Report Modal Component
const ReportModal = ({ report, patients, reportTypes, reportStatuses, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    patient: report.patient || '',
    type: report.type || 'Consultation Report',
    title: report.title || '',
    content: report.content || '',
    findings: report.findings || '',
    recommendations: report.recommendations || '',
    status: report.status || 'Draft'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.patient || !formData.title || !formData.content) {
      toast.error('Please fill in all required fields');
      return;
    }
    onSubmit(report._id, formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-medium text-gray-900">Medical Report</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Patient *</label>
              <select
                required
                value={formData.patient}
                onChange={(e) => setFormData({ ...formData, patient: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">Select Patient</option>
                {patients.map(patient => (
                  <option key={patient._id} value={patient._id}>
                    {patient.firstName} {patient.lastName}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Report Type *</label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                {reportTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="Enter report title..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Content *</label>
            <textarea
              required
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
              placeholder="Enter detailed report content..."
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Findings</label>
              <textarea
                value={formData.findings}
                onChange={(e) => setFormData({ ...formData, findings: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                placeholder="Enter findings..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Recommendations</label>
              <textarea
                value={formData.recommendations}
                onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                placeholder="Enter recommendations..."
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              {reportStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center space-x-2 text-sm"
            >
              <Save className="h-4 w-4" />
              <span>Save Report</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MedicalReports;
