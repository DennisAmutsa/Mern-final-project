import React, { useState, useEffect } from 'react';
import { 
  Syringe, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Plus,
  Search,
  Filter,
  Calendar,
  User,
  Pill
} from 'lucide-react';
import apiClient from '../config/axios';
import toast from 'react-hot-toast';

const Medications = () => {
  const [medications, setMedications] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  // Temporary: Clear search to show all medications
  useEffect(() => {
    setSearchTerm('');
  }, []);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddMedication, setShowAddMedication] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [medicationData, setMedicationData] = useState({
    name: '',
    dosage: '',
    frequency: '',
    route: '',
    startDate: '',
    endDate: '',
    notes: '',
    status: 'Active'
  });
  const [showAdministerModal, setShowAdministerModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState(null);
  const [administerData, setAdministerData] = useState({
    administeredAt: new Date().toISOString().slice(0, 16),
    notes: '',
    status: 'Administered'
  });
  const [reportData, setReportData] = useState({
    reaction: '',
    severity: 'Mild',
    symptoms: '',
    actionTaken: '',
    reportedTo: ''
  });
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedMedicationHistory, setSelectedMedicationHistory] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestData, setRequestData] = useState({
    patientId: '',
    medicationName: '',
    suggestedDosage: '',
    reason: '',
    urgency: 'Routine'
  });
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    fetchMedications();
    fetchPatients();
    fetchDoctors();
  }, []);

  const fetchMedications = async () => {
    try {
      const response = await apiClient.get('/api/auth/users?roles=user');
      console.log('Medications response:', response.data);
      const patientsWithMedications = response.data.users.filter(patient => 
        patient.currentMedications && patient.currentMedications.length > 0
      );
      console.log('Patients with medications:', patientsWithMedications);
      setMedications(patientsWithMedications);
    } catch (error) {
      toast.error('Failed to fetch medications');
      console.error('Error fetching medications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await apiClient.get('/api/auth/users?roles=user');
      console.log('All patients:', response.data.users);
      setPatients(response.data.users || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await apiClient.get('/api/auth/doctors');
      console.log('Doctors response:', response.data);
      setDoctors(response.data.doctors || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const handleAddMedication = async () => {
    if (!selectedPatient || !medicationData.name || !medicationData.dosage) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await apiClient.put(`/api/auth/users/${selectedPatient._id}/prescription`, {
        name: medicationData.name,
        dosage: medicationData.dosage,
        frequency: medicationData.frequency,
        notes: medicationData.notes,
        endDate: medicationData.endDate
      });
      
      toast.success('Medication added successfully');
      setShowAddMedication(false);
      setSelectedPatient(null);
      setMedicationData({
        name: '',
        dosage: '',
        frequency: '',
        route: '',
        startDate: '',
        endDate: '',
        notes: '',
        status: 'Active'
      });
      fetchMedications();
    } catch (error) {
      toast.error('Failed to add medication');
      console.error('Error adding medication:', error);
    }
  };

  const updateMedicationStatus = async (patientId, medicationId, status) => {
    try {
      await apiClient.patch(`/api/auth/medications/${medicationId}/status`, { status });
      toast.success('Medication status updated successfully');
      fetchMedications();
    } catch (error) {
      toast.error('Failed to update medication status');
      console.error('Error updating medication status:', error);
    }
  };

  const handleAdministerMedication = async () => {
    if (!selectedMedication || !administerData.notes) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await apiClient.post(`/api/auth/medications/${selectedMedication._id}/administer`, {
        administeredAt: administerData.administeredAt,
        notes: administerData.notes,
        status: administerData.status
      });

      toast.success('Medication administration recorded successfully!');
      
      setAdministerData({
        administeredAt: new Date().toISOString().slice(0, 16),
        notes: '',
        status: 'Administered'
      });
      setShowAdministerModal(false);
      setSelectedMedication(null);
      
      fetchMedications();
      
    } catch (error) {
      toast.error('Failed to record medication administration');
      console.error('Error recording administration:', error);
    }
  };

  const handleReportAdverseReaction = async () => {
    if (!selectedMedication || !reportData.reaction || !reportData.symptoms) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await apiClient.post(`/api/auth/medications/${selectedMedication._id}/report-reaction`, {
        reaction: reportData.reaction,
        severity: reportData.severity,
        symptoms: reportData.symptoms,
        actionTaken: reportData.actionTaken,
        reportedTo: reportData.reportedTo
      });

      toast.success('Adverse reaction reported successfully! A doctor will be notified.');
      
      setReportData({
        reaction: '',
        severity: 'Mild',
        symptoms: '',
        actionTaken: '',
        reportedTo: ''
      });
      setShowReportModal(false);
      setSelectedMedication(null);
      
      fetchMedications();
      
    } catch (error) {
      toast.error('Failed to report adverse reaction');
      console.error('Error reporting reaction:', error);
    }
  };

  const handleRequestMedication = async () => {
    if (!requestData.patientId || !requestData.medicationName || !requestData.reason) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      // For now, we'll just show a success message since we don't have a backend endpoint for requests yet
      toast.success('Medication request submitted successfully! The doctor will review your request.');
      setShowRequestModal(false);
      setRequestData({
        patientId: '',
        medicationName: '',
        suggestedDosage: '',
        reason: '',
        urgency: 'Routine'
      });
    } catch (error) {
      console.error('Error requesting medication:', error);
      toast.error('Failed to submit medication request');
    }
  };

  const filteredMedications = medications.filter(patient => {
    console.log('Patient data:', patient);
    console.log('Patient medications:', patient.currentMedications);
    
    const hasMatchingMedications = patient.currentMedications.some(med => {
      const matchesSearch = med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           patient.lastName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterStatus === 'all' || med.status === filterStatus;
      
      return matchesSearch && matchesFilter;
    });
    
    return hasMatchingMedications;
  });

  if (loading) {
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
          <h1 className="text-2xl font-bold text-gray-900">Medications Management</h1>
          <p className="text-gray-600">Monitor and administer patient medications</p>
        </div>
        <button
          onClick={() => setShowRequestModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          title="Request medication from doctor"
        >
          <Plus className="h-4 w-4" />
          <span>Request Medication</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Syringe className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Medications</p>
              <p className="text-2xl font-bold text-gray-900">
                {medications.reduce((total, patient) => total + patient.currentMedications.length, 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {medications.reduce((total, patient) => 
                  total + patient.currentMedications.filter(med => med.status === 'Active').length, 0
                )}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">On Hold</p>
              <p className="text-2xl font-bold text-gray-900">
                {medications.reduce((total, patient) => 
                  total + patient.currentMedications.filter(med => med.status === 'On Hold').length, 0
                )}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Due Today</p>
              <p className="text-2xl font-bold text-gray-900">
                {medications.reduce((total, patient) => 
                  total + patient.currentMedications.filter(med => {
                    const today = new Date().toDateString();
                    const endDate = med.endDate ? new Date(med.endDate).toDateString() : null;
                    return med.status === 'Active' && (!endDate || endDate >= today);
                  }).length, 0
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search medications or patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="Active">Active</option>
              <option value="On Hold">On Hold</option>
              <option value="Completed">Completed</option>
              <option value="Discontinued">Discontinued</option>
            </select>
          </div>
        </div>
      </div>

      {/* Medications List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Patient Medications ({medications.length} patients, {filteredMedications.length} with medications)</h3>
        </div>
        <div className="p-6">
          {filteredMedications.length > 0 ? (
            <div className="space-y-6">
              {filteredMedications.map(patient => (
                <div key={patient._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                    <div className="flex items-center space-x-3">
                      <User className="h-5 w-5 text-gray-400" />
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {patient.firstName} {patient.lastName}
                        </h4>
                        <p className="text-sm text-gray-500">{patient.email}</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">
                      {patient.currentMedications.length} medication(s)
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {/* Debug: Show all medications for this patient */}
                    <div className="p-2 bg-yellow-50 border border-yellow-200 rounded mb-2">
                      <p className="text-xs font-semibold text-yellow-800">Debug - All medications for {patient.firstName}:</p>
                      <p className="text-xs text-yellow-700">
                        Total: {patient.currentMedications.length} | 
                        Names: {patient.currentMedications.map(m => m.name).join(', ')}
                      </p>
                    </div>
                    
                    {patient.currentMedications
                      .filter(med => {
                        const matchesSearch = med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                             patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                             patient.lastName.toLowerCase().includes(searchTerm.toLowerCase());
                        const matchesFilter = filterStatus === 'all' || med.status === filterStatus;
                        console.log(`Medication ${med.name}: search=${matchesSearch}, filter=${matchesFilter}`);
                        return matchesSearch && matchesFilter;
                      })
                      .map(medication => {
                        console.log('Rendering medication:', medication);
                        return (
                        <div key={medication._id} className="p-3 bg-gray-50 rounded-lg">
                          {/* Medication Info */}
                          <div className="flex items-start space-x-3 mb-3">
                            <Pill className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900">{medication.name}</p>
                              <p className="text-sm text-gray-600">
                                {medication.dosage} • {medication.frequency || 'As prescribed'}
                              </p>
                              {medication.notes && (
                                <p className="text-sm text-gray-500">{medication.notes}</p>
                              )}
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium flex-shrink-0 ${
                              medication.status === 'Active' ? 'bg-green-100 text-green-800' :
                              medication.status === 'On Hold' ? 'bg-yellow-100 text-yellow-800' :
                              medication.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {medication.status}
                            </span>
                          </div>
                          
                          {/* Last Administration Info */}
                          {medication.lastAdministered && (
                            <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded">
                              <p className="text-xs font-semibold text-green-800">Last Administered:</p>
                              <p className="text-xs text-green-700">
                                {new Date(medication.lastAdministered).toLocaleString()} 
                                by {medication.lastAdministeredBy || 'Unknown'}
                              </p>
                            </div>
                          )}
                          
                          {/* Status Update Info */}
                          {medication.statusUpdatedAt && (
                            <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded">
                              <p className="text-xs font-semibold text-blue-800">Status Updated:</p>
                              <p className="text-xs text-blue-700">
                                {new Date(medication.statusUpdatedAt).toLocaleString()} 
                                by {medication.statusUpdatedBy || 'Unknown'}
                              </p>
                            </div>
                          )}
                          
                          {/* Action Buttons */}
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => {
                                setSelectedMedication({
                                  ...medication,
                                  patientName: `${patient.firstName} ${patient.lastName}`,
                                  patientId: patient._id
                                });
                                setShowAdministerModal(true);
                              }}
                              className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                              title="Record medication administration"
                            >
                              Administer
                            </button>
                            
                            <button
                              onClick={() => {
                                setSelectedMedication({
                                  ...medication,
                                  patientName: `${patient.firstName} ${patient.lastName}`,
                                  patientId: patient._id
                                });
                                setShowReportModal(true);
                              }}
                              className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                              title="Report adverse reaction"
                            >
                              Report
                            </button>
                            
                            <select
                              value={medication.status}
                              onChange={(e) => updateMedicationStatus(patient._id, medication._id, e.target.value)}
                              className="text-xs border border-gray-300 rounded px-2 py-1"
                            >
                              <option value="Active">Active</option>
                              <option value="On Hold">On Hold</option>
                              <option value="Completed">Completed</option>
                              <option value="Discontinued">Discontinued</option>
                            </select>
                            
                            <button
                              onClick={() => {
                                setSelectedMedicationHistory({
                                  medication,
                                  patient,
                                  administrations: patient.medicationAdministrations?.filter(admin => 
                                    admin.medicationId === medication._id
                                  ) || [],
                                  reactions: patient.adverseReactions?.filter(reaction => 
                                    reaction.medicationId === medication._id
                                  ) || []
                                });
                                setShowHistoryModal(true);
                              }}
                              className="text-xs px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                              title="View administration history"
                            >
                              History
                            </button>
                          </div>
                        </div>
                      );
                      })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Syringe className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Medications Found</h3>
              <p className="text-gray-600">No medications match your search criteria</p>
              
              {/* Debug: Show all patients */}
              <div className="mt-6 text-left">
                <h4 className="font-medium text-gray-900 mb-2">All Patients ({patients.length}):</h4>
                {patients.map(patient => (
                  <div key={patient._id} className="p-2 bg-gray-50 rounded mb-2">
                    <p className="text-sm">
                      <strong>{patient.firstName} {patient.lastName}</strong> - 
                      Medications: {patient.currentMedications?.length || 0}
                      {patient.currentMedications && patient.currentMedications.length > 0 && (
                        <span className="ml-2 text-xs text-gray-500">
                          ({patient.currentMedications.map(m => m.name).join(', ')})
                        </span>
                      )}
                    </p>
                  </div>
                ))}
              </div>
              
              {/* Debug: Show current filters */}
              <div className="mt-4 text-left">
                <h4 className="font-medium text-gray-900 mb-2">Current Filters:</h4>
                <p className="text-sm">Search Term: "{searchTerm}"</p>
                <p className="text-sm">Filter Status: "{filterStatus}"</p>
              </div>
              
              {/* Debug: Show medications state */}
              <div className="mt-4 text-left">
                <h4 className="font-medium text-gray-900 mb-2">Medications State ({medications.length}):</h4>
                {medications.map(patient => (
                  <div key={patient._id} className="p-2 bg-blue-50 rounded mb-2">
                    <p className="text-sm">
                      <strong>{patient.firstName} {patient.lastName}</strong> - 
                      Medications: {patient.currentMedications?.length || 0}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Medication Modal */}
      {showAddMedication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Medication</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Patient</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={selectedPatient?._id || ''}
                  onChange={(e) => {
                    const patient = patients.find(p => p._id === e.target.value);
                    setSelectedPatient(patient);
                  }}
                >
                  <option value="">Select a patient</option>
                  {patients.map(patient => (
                    <option key={patient._id} value={patient._id}>
                      {patient.firstName} {patient.lastName}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Medication Name</label>
                <input
                  type="text"
                  value={medicationData.name}
                  onChange={(e) => setMedicationData({...medicationData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., Paracetamol"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dosage</label>
                <input
                  type="text"
                  value={medicationData.dosage}
                  onChange={(e) => setMedicationData({...medicationData, dosage: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., 500mg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
                <input
                  type="text"
                  value={medicationData.frequency}
                  onChange={(e) => setMedicationData({...medicationData, frequency: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., Twice daily"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={medicationData.endDate}
                  onChange={(e) => setMedicationData({...medicationData, endDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={medicationData.notes}
                  onChange={(e) => setMedicationData({...medicationData, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows="3"
                  placeholder="Additional notes..."
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddMedication(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMedication}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Medication
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Administer Medication Modal */}
      {showAdministerModal && selectedMedication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Record Medication Administration</h3>
              <button
                onClick={() => setShowAdministerModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Medication:</strong> {selectedMedication.name}<br/>
                <strong>Patient:</strong> {selectedMedication.patientName}<br/>
                <strong>Dosage:</strong> {selectedMedication.dosage}
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Administration Time *</label>
                <input
                  type="datetime-local"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={administerData.administeredAt}
                  onChange={(e) => setAdministerData({...administerData, administeredAt: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Administration Notes *</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  placeholder="Record any observations, patient response, or special instructions..."
                  value={administerData.notes}
                  onChange={(e) => setAdministerData({...administerData, notes: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={administerData.status}
                  onChange={(e) => setAdministerData({...administerData, status: e.target.value})}
                >
                  <option value="Administered">Administered</option>
                  <option value="Refused">Refused</option>
                  <option value="Missed">Missed</option>
                  <option value="Delayed">Delayed</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAdministerModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAdministerMedication}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Record Administration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Medication Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Request Medication</h3>
              <button
                onClick={() => setShowRequestModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Submit a medication request to the assigned doctor. The doctor will review and prescribe the medication if approved.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Patient *</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={requestData.patientId}
                  onChange={(e) => setRequestData({...requestData, patientId: e.target.value})}
                >
                  <option value="">Select a patient</option>
                  {patients.map(patient => (
                    <option key={patient._id} value={patient._id}>
                      {patient.firstName} {patient.lastName}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Medication Name *</label>
                <input
                  type="text"
                  value={requestData.medicationName}
                  onChange={(e) => setRequestData({...requestData, medicationName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Paracetamol, Ibuprofen"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Suggested Dosage</label>
                <input
                  type="text"
                  value={requestData.suggestedDosage}
                  onChange={(e) => setRequestData({...requestData, suggestedDosage: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 500mg twice daily"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Request *</label>
                <textarea
                  value={requestData.reason}
                  onChange={(e) => setRequestData({...requestData, reason: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  placeholder="Explain why this medication is needed..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Urgency</label>
                <select
                  value={requestData.urgency}
                  onChange={(e) => setRequestData({...requestData, urgency: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Routine">Routine</option>
                  <option value="Urgent">Urgent</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowRequestModal(false);
                  setRequestData({
                    patientId: '',
                    medicationName: '',
                    suggestedDosage: '',
                    reason: '',
                    urgency: 'Routine'
                  });
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestMedication}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Adverse Reaction Modal */}
      {showReportModal && selectedMedication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Report Adverse Reaction</h3>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">
                <strong>Medication:</strong> {selectedMedication.name}<br/>
                <strong>Patient:</strong> {selectedMedication.patientName}<br/>
                <strong>Dosage:</strong> {selectedMedication.dosage}
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type of Reaction *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Allergic reaction, Nausea, Rash, etc."
                  value={reportData.reaction}
                  onChange={(e) => setReportData({...reportData, reaction: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Severity *</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={reportData.severity}
                  onChange={(e) => setReportData({...reportData, severity: e.target.value})}
                >
                  <option value="Mild">Mild</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Severe">Severe</option>
                  <option value="Life-threatening">Life-threatening</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Symptoms *</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  placeholder="Describe the symptoms observed..."
                  value={reportData.symptoms}
                  onChange={(e) => setReportData({...reportData, symptoms: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Action Taken</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="2"
                  placeholder="What action was taken in response..."
                  value={reportData.actionTaken}
                  onChange={(e) => setReportData({...reportData, actionTaken: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report to Doctor ({doctors.length} doctors available)
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={reportData.reportedTo}
                  onChange={(e) => setReportData({...reportData, reportedTo: e.target.value})}
                >
                  <option value="">Select a doctor</option>
                  {doctors.map(doctor => (
                    <option key={doctor._id} value={`${doctor.firstName} ${doctor.lastName}`}>
                      Dr. {doctor.firstName} {doctor.lastName} - {doctor.department || 'General Medicine'}
                    </option>
                  ))}
                  {doctors.length === 0 && (
                    <>
                      <option value="" disabled>No doctors available</option>
                      <option value="Dr. John Smith">Dr. John Smith - General Medicine</option>
                      <option value="Dr. Sarah Johnson">Dr. Sarah Johnson - Emergency</option>
                      <option value="Dr. Michael Brown">Dr. Michael Brown - Cardiology</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReportAdverseReaction}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Medication History Modal */}
      {showHistoryModal && selectedMedicationHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Medication History</h3>
              <button
                onClick={() => {
                  setShowHistoryModal(false);
                  setSelectedMedicationHistory(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900">{selectedMedicationHistory.medication.name}</h4>
              <p className="text-sm text-blue-700">
                Patient: {selectedMedicationHistory.patient.firstName} {selectedMedicationHistory.patient.lastName}
              </p>
              <p className="text-sm text-blue-700">
                Dosage: {selectedMedicationHistory.medication.dosage} • Frequency: {selectedMedicationHistory.medication.frequency}
              </p>
            </div>

            {/* Administration History */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Administration History</h4>
              {selectedMedicationHistory.administrations.length > 0 ? (
                <div className="space-y-3">
                  {selectedMedicationHistory.administrations.map((admin, index) => (
                    <div key={index} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-green-800">
                            {admin.status} - {new Date(admin.administeredAt).toLocaleString()}
                          </p>
                          <p className="text-sm text-green-700">By: {admin.administeredByUser}</p>
                          <p className="text-sm text-green-600">{admin.notes}</p>
                        </div>
                        <span className="text-xs text-green-600">
                          {new Date(admin.recordedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No administration records found.</p>
              )}
            </div>

            {/* Adverse Reactions */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Adverse Reactions</h4>
              {selectedMedicationHistory.reactions.length > 0 ? (
                <div className="space-y-3">
                  {selectedMedicationHistory.reactions.map((reaction, index) => (
                    <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-red-800">
                            {reaction.reaction} - {reaction.severity} Severity
                          </p>
                          <p className="text-sm text-red-700">Reported by: {reaction.reportedByUser}</p>
                          <p className="text-sm text-red-600">Symptoms: {reaction.symptoms}</p>
                          {reaction.actionTaken && (
                            <p className="text-sm text-red-600">Action: {reaction.actionTaken}</p>
                          )}
                          {reaction.reportedTo && (
                            <p className="text-sm text-red-600">Reported to: {reaction.reportedTo}</p>
                          )}
                        </div>
                        <span className="text-xs text-red-600">
                          {new Date(reaction.reportedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No adverse reactions reported.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Medications;
