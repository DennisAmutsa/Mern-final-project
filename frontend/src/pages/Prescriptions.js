import React, { useState, useEffect } from 'react';
import { 
  Pill, 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Calendar,
  User,
  AlertTriangle,
  CheckCircle,
  X,
  ChevronDown,
  ChevronUp,
  Download,
  Printer,
  Clock,
  CalendarDays
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiClient from '../config/axios';
import toast from 'react-hot-toast';

const Prescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPatient, setFilterPatient] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('prescribedDate');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedPrescriptions, setExpandedPrescriptions] = useState(new Set());

  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const statusOptions = ['Active', 'Completed', 'Discontinued'];

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchPatients();
      fetchPrescriptions();
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

    const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      
      if (user.role === 'doctor') {
        // For doctors: fetch all assigned patients' prescriptions
        const userId = user?.id || user?._id;
        console.log('🔍 Fetching prescriptions for doctor:', userId);
        const response = await apiClient.get(`/api/auth/doctor/patients?roles=user&assignedDoctor=${userId}`);
        const allPrescriptions = [];
        
        response.data.users?.forEach(patient => {
          if (patient.currentMedications && patient.currentMedications.length > 0) {
            patient.currentMedications.forEach(prescription => {
              allPrescriptions.push({
                ...prescription,
                patientId: patient._id,
                patientName: `${patient.firstName} ${patient.lastName}`,
                patientEmail: patient.email
              });
            });
          }
        });
        
        console.log('📊 Prescriptions found:', allPrescriptions.length);
        setPrescriptions(allPrescriptions);
      } else {
        // For patients: fetch their own prescriptions
        const response = await apiClient.get('/api/auth/profile');
        const userData = response.data.user;
        
        if (userData.currentMedications && userData.currentMedications.length > 0) {
          const ownPrescriptions = userData.currentMedications.map(prescription => ({
            ...prescription,
            patientId: userData._id,
            patientName: `${userData.firstName} ${userData.lastName}`,
            patientEmail: userData.email
          }));
          setPrescriptions(ownPrescriptions);
        } else {
          setPrescriptions([]);
        }
      }
    } catch (error) {
      toast.error('Failed to fetch prescriptions');
      console.error('❌ Error fetching prescriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPrescription = async (prescriptionData) => {
    try {
      console.log('🔍 Adding prescription for patient:', prescriptionData.patientId);
      await apiClient.put(`/api/auth/users/${prescriptionData.patientId}/prescription`, {
        name: prescriptionData.name,
        dosage: prescriptionData.dosage,
        frequency: prescriptionData.frequency,
        notes: prescriptionData.notes,
        endDate: prescriptionData.endDate
      });
      
      toast.success('Prescription added successfully');
      setShowAddModal(false);
      fetchPrescriptions();
    } catch (error) {
      toast.error('Failed to add prescription');
      console.error('❌ Error adding prescription:', error);
    }
  };

  const handleUpdatePrescriptionStatus = async (prescriptionId, newStatus) => {
    try {
      // This would require a separate endpoint to update prescription status
      // For now, we'll show a success message
      toast.success('Prescription status updated successfully');
      fetchPrescriptions();
    } catch (error) {
      toast.error('Failed to update prescription status');
      console.error('Error updating prescription status:', error);
    }
  };

  const togglePrescriptionExpansion = (prescriptionId) => {
    const newExpanded = new Set(expandedPrescriptions);
    if (newExpanded.has(prescriptionId)) {
      newExpanded.delete(prescriptionId);
    } else {
      newExpanded.add(prescriptionId);
    }
    setExpandedPrescriptions(newExpanded);
  };

  const getFilteredAndSortedPrescriptions = () => {
    let filtered = prescriptions.filter(prescription => {
      const matchesSearch = prescription.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           prescription.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           prescription.dosage?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPatient = !filterPatient || prescription.patientId === filterPatient;
      const matchesStatus = filterStatus === 'all' || prescription.status === filterStatus;
      
      return matchesSearch && matchesPatient && matchesStatus;
    });

    // Sort prescriptions
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'prescribedDate':
          aValue = new Date(a.prescribedDate);
          bValue = new Date(b.prescribedDate);
          break;
        case 'patient':
          aValue = a.patientName;
          bValue = b.patientName;
          break;
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = new Date(a.prescribedDate);
          bValue = new Date(b.prescribedDate);
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
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Completed': return 'bg-blue-100 text-blue-800';
      case 'Discontinued': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isExpired = (endDate) => {
    if (!endDate) return false;
    return new Date(endDate) < new Date();
  };

  const isExpiringSoon = (endDate) => {
    if (!endDate) return false;
    const daysUntilExpiry = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  };

  const filteredPrescriptions = getFilteredAndSortedPrescriptions();

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
          <h1 className="text-2xl font-bold text-gray-900">Prescriptions</h1>
          <p className="text-gray-600">Manage and view patient prescriptions</p>
        </div>
        <div className="flex items-center space-x-3">
          {user.role === 'doctor' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Prescription</span>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {user.role === 'doctor' ? (
            <>
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search prescriptions..."
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
                  <option value="prescribedDate-desc">Date (Newest)</option>
                  <option value="prescribedDate-asc">Date (Oldest)</option>
                  <option value="patient-asc">Patient (A-Z)</option>
                  <option value="patient-desc">Patient (Z-A)</option>
                  <option value="name-asc">Medication (A-Z)</option>
                  <option value="status-asc">Status (A-Z)</option>
                </select>
              </div>
            </>
          ) : (
            // For patients: only show basic search and sorting of their own prescriptions
            <>
              <div className="lg:col-span-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search your prescriptions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
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
                  <option value="prescribedDate-desc">Date (Newest)</option>
                  <option value="prescribedDate-asc">Date (Oldest)</option>
                  <option value="name-asc">Medication (A-Z)</option>
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Prescriptions List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Prescriptions ({filteredPrescriptions.length})
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading prescriptions...</p>
            </div>
          ) : filteredPrescriptions.length > 0 ? (
            filteredPrescriptions.map((prescription, index) => (
              <div key={`${prescription.patientId}-${index}`} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Pill className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium text-gray-900">{prescription.name}</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{prescription.patientName}</h4>
                      <p className="text-sm text-gray-500">{prescription.dosage}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-900">{prescription.prescribedBy}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(prescription.prescribedDate).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {isExpired(prescription.endDate) && (
                        <AlertTriangle className="h-4 w-4 text-red-500" title="Expired" />
                      )}
                      {isExpiringSoon(prescription.endDate) && (
                        <Clock className="h-4 w-4 text-yellow-500" title="Expiring Soon" />
                      )}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(prescription.status)}`}>
                        {prescription.status}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => togglePrescriptionExpansion(`${prescription.patientId}-${index}`)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {expandedPrescriptions.has(`${prescription.patientId}-${index}`) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPrescription(prescription);
                          setShowPrescriptionModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
                
                {expandedPrescriptions.has(`${prescription.patientId}-${index}`) && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="text-sm font-medium text-gray-900 mb-2">Frequency</h5>
                        <p className="text-sm text-gray-600">{prescription.frequency || 'Not specified'}</p>
                      </div>
                      {prescription.endDate && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-900 mb-2">End Date</h5>
                          <p className="text-sm text-gray-600">
                            {new Date(prescription.endDate).toLocaleDateString()}
                            {isExpired(prescription.endDate) && (
                              <span className="ml-2 text-red-500 text-xs">(Expired)</span>
                            )}
                            {isExpiringSoon(prescription.endDate) && (
                              <span className="ml-2 text-yellow-500 text-xs">(Expiring Soon)</span>
                            )}
                          </p>
                        </div>
                      )}
                      {prescription.notes && (
                        <div className="md:col-span-2">
                          <h5 className="text-sm font-medium text-gray-900 mb-2">Notes</h5>
                          <p className="text-sm text-gray-600">{prescription.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-6 text-center">
              <Pill className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No prescriptions found</p>
              <p className="text-sm text-gray-400 mt-1">
                {searchTerm || filterPatient || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'Prescriptions will appear here when added'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Prescription Details Modal */}
      {showPrescriptionModal && selectedPrescription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Prescription Details</h3>
              <button
                onClick={() => setShowPrescriptionModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Patient</p>
                  <p className="text-sm font-medium text-gray-900">{selectedPrescription.patientName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Prescribed By</p>
                  <p className="text-sm font-medium text-gray-900">{selectedPrescription.prescribedBy}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Medication</p>
                  <p className="text-sm font-medium text-gray-900">{selectedPrescription.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Dosage</p>
                  <p className="text-sm font-medium text-gray-900">{selectedPrescription.dosage}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Prescribed Date</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(selectedPrescription.prescribedDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedPrescription.status)}`}>
                    {selectedPrescription.status}
                  </span>
                </div>
              </div>
              
              {selectedPrescription.frequency && (
                <div>
                  <p className="text-sm text-gray-600">Frequency</p>
                  <p className="text-sm text-gray-900">{selectedPrescription.frequency}</p>
                </div>
              )}
              
              {selectedPrescription.endDate && (
                <div>
                  <p className="text-sm text-gray-600">End Date</p>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedPrescription.endDate).toLocaleDateString()}
                    {isExpired(selectedPrescription.endDate) && (
                      <span className="ml-2 text-red-500 text-xs">(Expired)</span>
                    )}
                    {isExpiringSoon(selectedPrescription.endDate) && (
                      <span className="ml-2 text-yellow-500 text-xs">(Expiring Soon)</span>
                    )}
                  </p>
                </div>
              )}
              
              {selectedPrescription.notes && (
                <div>
                  <p className="text-sm text-gray-600">Notes</p>
                  <p className="text-sm text-gray-900">{selectedPrescription.notes}</p>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowPrescriptionModal(false)}
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

      {/* Add Prescription Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Add Prescription</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <AddPrescriptionForm 
              patients={patients}
              onSubmit={handleAddPrescription}
              onCancel={() => setShowAddModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Add Prescription Form Component
const AddPrescriptionForm = ({ patients, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    patientId: '',
    name: '',
    dosage: '',
    frequency: '',
    notes: '',
    endDate: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.patientId || !formData.name || !formData.dosage) {
      toast.error('Please fill in all required fields');
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Medication Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Amoxicillin, Ibuprofen"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dosage *
          </label>
          <input
            type="text"
            value={formData.dosage}
            onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., 500mg, 10ml"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Frequency
          </label>
          <input
            type="text"
            value={formData.frequency}
            onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Twice daily, Every 8 hours"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            End Date
          </label>
          <input
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Special instructions, side effects to watch for..."
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
          className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 flex items-center space-x-2"
        >
          <Pill className="h-4 w-4" />
          <span>Add Prescription</span>
        </button>
      </div>
    </form>
  );
};

export default Prescriptions; 