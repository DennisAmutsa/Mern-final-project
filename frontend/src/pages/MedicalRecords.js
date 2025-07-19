import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Calendar,
  User,
  Stethoscope,
  Pill,
  AlertTriangle,
  CheckCircle,
  X,
  ChevronDown,
  ChevronUp,
  Download,
  Printer
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiClient from '../config/axios';
import toast from 'react-hot-toast';

const MedicalRecords = () => {
  const [records, setRecords] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPatient, setFilterPatient] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedRecords, setExpandedRecords] = useState(new Set());

  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const recordTypes = ['Consultation', 'Surgery', 'Test', 'Prescription', 'Follow-up', 'Emergency'];
  const statusOptions = ['Active', 'Completed', 'Cancelled'];

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchPatients();
      fetchMedicalRecords();
    }
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  const fetchPatients = async () => {
    try {
      if (user.role === 'doctor') {
        // For doctors: fetch assigned patients
        const userId = user?.id || user?._id;
        console.log('🔍 Fetching patients for doctor:', userId);
        const response = await apiClient.get(`/api/auth/doctor/patients?roles=user&assignedDoctor=${userId}`);
        console.log('📊 Patients response:', response.data);
        setPatients(response.data.users || []);
      } else {
        // For patients: they are their own "patient"
        setPatients([user]);
      }
    } catch (error) {
      console.error('❌ Error fetching patients:', error);
      if (error.response?.status === 403) {
        toast.error('Access denied. This feature requires doctor role.');
      }
      setPatients([]);
    }
  };

  const fetchMedicalRecords = async () => {
    try {
      setLoading(true);
      
      if (user.role === 'doctor') {
        // For doctors: fetch all assigned patients' records
        const userId = user?.id || user?._id;
        console.log('🔍 Fetching medical records for doctor:', userId);
        const response = await apiClient.get(`/api/auth/doctor/patients?roles=user&assignedDoctor=${userId}`);
        const allRecords = [];
        
        response.data.users?.forEach(patient => {
          if (patient.medicalHistory && patient.medicalHistory.length > 0) {
            patient.medicalHistory.forEach(record => {
              allRecords.push({
                ...record,
                patientId: patient._id,
                patientName: `${patient.firstName} ${patient.lastName}`,
                patientEmail: patient.email
              });
            });
          }
        });
        
        console.log('📊 Medical records found:', allRecords.length);
        setRecords(allRecords);
      } else {
        // For patients: fetch their own records
        const response = await apiClient.get('/api/auth/profile');
        const userData = response.data.user;
        
        if (userData.medicalHistory && userData.medicalHistory.length > 0) {
          const ownRecords = userData.medicalHistory.map(record => ({
            ...record,
            patientId: userData._id,
            patientName: `${userData.firstName} ${userData.lastName}`,
            patientEmail: userData.email
          }));
          setRecords(ownRecords);
        } else {
          setRecords([]);
        }
      }
    } catch (error) {
      toast.error('Failed to fetch medical records');
      console.error('❌ Error fetching medical records:', error);
      } finally {
        setLoading(false);
      }
    };

  const handleAddRecord = async (recordData) => {
    try {
      console.log('🔍 Adding medical record for patient:', recordData.patientId);
      await apiClient.put(`/api/auth/users/${recordData.patientId}/medical-record`, {
        condition: recordData.condition,
        diagnosis: recordData.diagnosis,
        treatment: recordData.treatment,
        type: recordData.type,
        notes: recordData.notes,
        status: recordData.status
      });
      
      toast.success('Medical record added successfully');
      setShowAddModal(false);
      fetchMedicalRecords();
    } catch (error) {
      toast.error('Failed to add medical record');
      console.error('❌ Error adding medical record:', error);
    }
  };

  const handleUpdateRecord = async (recordData) => {
    try {
      // For now, we'll add a new record since updating existing records requires more complex logic
      console.log('🔍 Updating medical record for patient:', recordData.patientId);
      await apiClient.put(`/api/auth/users/${recordData.patientId}/medical-record`, {
        condition: recordData.condition,
        diagnosis: recordData.diagnosis,
        treatment: recordData.treatment,
        type: recordData.type,
        notes: recordData.notes,
        status: recordData.status
      });
      
      toast.success('Medical record updated successfully');
      setShowRecordModal(false);
      fetchMedicalRecords();
    } catch (error) {
      toast.error('Failed to update medical record');
      console.error('❌ Error updating medical record:', error);
    }
  };

  const toggleRecordExpansion = (recordId) => {
    const newExpanded = new Set(expandedRecords);
    if (newExpanded.has(recordId)) {
      newExpanded.delete(recordId);
    } else {
      newExpanded.add(recordId);
    }
    setExpandedRecords(newExpanded);
  };

  const getFilteredAndSortedRecords = () => {
    let filtered = records.filter(record => {
      const matchesSearch = record.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           record.condition?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           record.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPatient = !filterPatient || record.patientId === filterPatient;
      const matchesType = filterType === 'all' || record.type === filterType;
      const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
      
      return matchesSearch && matchesPatient && matchesType && matchesStatus;
    });

    // Sort records
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          break;
        case 'patient':
          aValue = a.patientName;
          bValue = b.patientName;
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = new Date(a.date);
          bValue = new Date(b.date);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-blue-100 text-blue-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Consultation': return <Stethoscope className="h-4 w-4" />;
      case 'Surgery': return <AlertTriangle className="h-4 w-4" />;
      case 'Test': return <FileText className="h-4 w-4" />;
      case 'Prescription': return <Pill className="h-4 w-4" />;
      case 'Follow-up': return <CheckCircle className="h-4 w-4" />;
      case 'Emergency': return <AlertTriangle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const filteredRecords = getFilteredAndSortedRecords();

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Medical Records</h1>
          <p className="text-gray-600">Manage and view patient medical records</p>
        </div>
        <div className="flex items-center space-x-3">
          {user.role === 'doctor' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Record</span>
            </button>
          )}
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {user.role === 'doctor' ? (
            <>
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search records..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <select
                  value={filterPatient}
                  onChange={(e) => setFilterPatient(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Types</option>
                  {recordTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  {statusOptions.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortBy(field);
                    setSortOrder(order);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="date-desc">Date (Newest)</option>
                  <option value="date-asc">Date (Oldest)</option>
                  <option value="patient-asc">Patient (A-Z)</option>
                  <option value="patient-desc">Patient (Z-A)</option>
                  <option value="type-asc">Type (A-Z)</option>
                  <option value="status-asc">Status (A-Z)</option>
                </select>
              </div>
            </>
          ) : (
            // For patients: only show basic search and sorting of their own records
            <>
              <div className="lg:col-span-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search your records..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Types</option>
                  {recordTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortBy(field);
                    setSortOrder(order);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="date-desc">Date (Newest)</option>
                  <option value="date-asc">Date (Oldest)</option>
                  <option value="type-asc">Type (A-Z)</option>
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Records List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Medical Records ({filteredRecords.length})
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading records...</p>
            </div>
          ) : filteredRecords.length > 0 ? (
            filteredRecords.map((record, index) => (
              <div key={`${record.patientId}-${index}`} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(record.type)}
                      <span className="text-sm font-medium text-gray-900">{record.type}</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{record.patientName}</h4>
                      <p className="text-sm text-gray-500">{record.condition}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-900">{record.doctor}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(record.date).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                      {record.status}
                    </span>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleRecordExpansion(`${record.patientId}-${index}`)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {expandedRecords.has(`${record.patientId}-${index}`) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRecord(record);
                          setShowRecordModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
                
                {expandedRecords.has(`${record.patientId}-${index}`) && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="text-sm font-medium text-gray-900 mb-2">Diagnosis</h5>
                        <p className="text-sm text-gray-600">{record.diagnosis}</p>
                      </div>
                      {record.treatment && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-900 mb-2">Treatment</h5>
                          <p className="text-sm text-gray-600">{record.treatment}</p>
                        </div>
                      )}
                      {record.notes && (
                        <div className="md:col-span-2">
                          <h5 className="text-sm font-medium text-gray-900 mb-2">Notes</h5>
                          <p className="text-sm text-gray-600">{record.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-6 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No medical records found</p>
              <p className="text-sm text-gray-400 mt-1">
                {searchTerm || filterPatient || filterType !== 'all' || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'Medical records will appear here when added'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Record Details Modal */}
      {showRecordModal && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Medical Record Details</h3>
              <button
                onClick={() => setShowRecordModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Patient</p>
                  <p className="text-sm font-medium text-gray-900">{selectedRecord.patientName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Doctor</p>
                  <p className="text-sm font-medium text-gray-900">{selectedRecord.doctor}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(selectedRecord.date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="text-sm font-medium text-gray-900">{selectedRecord.type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedRecord.status)}`}>
                    {selectedRecord.status}
                  </span>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Condition</p>
                <p className="text-sm font-medium text-gray-900">{selectedRecord.condition}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Diagnosis</p>
                <p className="text-sm text-gray-900">{selectedRecord.diagnosis}</p>
              </div>
              
              {selectedRecord.treatment && (
                <div>
                  <p className="text-sm text-gray-600">Treatment</p>
                  <p className="text-sm text-gray-900">{selectedRecord.treatment}</p>
                </div>
              )}
              
              {selectedRecord.notes && (
                <div>
                  <p className="text-sm text-gray-600">Notes</p>
                  <p className="text-sm text-gray-900">{selectedRecord.notes}</p>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowRecordModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center space-x-2">
                <Printer className="h-4 w-4" />
                <span>Print</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Record Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Add Medical Record</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <AddRecordForm 
              patients={patients}
              onSubmit={handleAddRecord}
              onCancel={() => setShowAddModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Add Record Form Component
const AddRecordForm = ({ patients, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    patientId: '',
    condition: '',
    diagnosis: '',
    treatment: '',
    type: 'Consultation',
    notes: '',
    status: 'Completed'
  });

  const recordTypes = ['Consultation', 'Surgery', 'Test', 'Prescription', 'Follow-up', 'Emergency'];
  const statusOptions = ['Active', 'Completed', 'Cancelled'];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.patientId || !formData.condition || !formData.diagnosis) {
      toast.error('Please fill in all required fields');
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Patient *
          </label>
          <select
            value={formData.patientId}
            onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Record Type *
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {recordTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Condition *
        </label>
        <input
          type="text"
          value={formData.condition}
          onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., Hypertension, Diabetes"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Diagnosis *
        </label>
        <textarea
          value={formData.diagnosis}
          onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Detailed diagnosis..."
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Treatment
        </label>
        <textarea
          value={formData.treatment}
          onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Treatment plan..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {statusOptions.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Additional notes..."
        />
      </div>

      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Record</span>
        </button>
      </div>
    </form>
  );
};

export default MedicalRecords; 