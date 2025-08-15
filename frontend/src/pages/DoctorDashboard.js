import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  AlertTriangle, 
  TrendingUp, 
  Activity,
  Clock,
  Heart,
  Stethoscope,
  FileText,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Pill,
  User,
  Phone,
  Mail,
  MapPin,
  X,
  Save,
  CheckCircle,
  Clipboard
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiClient from '../config/axios';
import toast from 'react-hot-toast';

const DoctorDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assignedPatients, setAssignedPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showMedicalRecordModal, setShowMedicalRecordModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddCareTask, setShowAddCareTask] = useState(false);
  const [showCareTasksList, setShowCareTasksList] = useState(false);
  const [careTasksList, setCareTasksList] = useState([]);
  const [careTaskData, setCareTaskData] = useState({
    task: '',
    description: '',
    priority: 'Medium',
    dueDate: '',
    room: '',
    category: 'General',
    notes: '',
    assignedTo: '',
    patientId: ''
  });
  const [availableNurses, setAvailableNurses] = useState([]);
  const [loadingNurses, setLoadingNurses] = useState(false);
  
  // Form states
  const [medicalRecordForm, setMedicalRecordForm] = useState({
    condition: '',
    diagnosis: '',
    treatment: '',
    type: 'Consultation',
    notes: '',
    status: 'Completed'
  });
  
  const [prescriptionForm, setPrescriptionForm] = useState({
    name: '',
    dosage: '',
    frequency: '',
    notes: '',
    endDate: ''
  });

  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const recordTypes = ['Consultation', 'Surgery', 'Test', 'Prescription', 'Follow-up', 'Emergency'];
  const statusOptions = ['Active', 'Completed', 'Cancelled'];

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      // Small delay to ensure user state is fully updated
      const timer = setTimeout(() => {
      fetchDashboardStats();
        fetchAssignedPatients();
      }, 100);
      
      return () => clearTimeout(timer);
    }
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [authLoading, isAuthenticated, user, navigate]);

  const fetchDashboardStats = async () => {
    try {
      console.log('🔍 Fetching doctor dashboard stats...');
      const response = await apiClient.get('/api/stats/doctor-dashboard');
      console.log('📊 Dashboard stats response:', response.data);
      setStats(response.data);
    } catch (error) {
      console.error('❌ Error fetching dashboard stats:', error);
      toast.error('Failed to fetch dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignedPatients = async () => {
    try {
      // Use user.id instead of user._id (MongoDB vs API response format)
      const userId = user?.id || user?._id;
      if (!userId) {
        console.error('❌ User ID not available');
        setAssignedPatients([]);
        return;
      }
      
      console.log('🔍 Fetching assigned patients for doctor:', userId);
      const response = await apiClient.get(`/api/auth/doctor/patients?roles=user&assignedDoctor=${userId}`);
      console.log('📊 Assigned patients response:', response.data);
      setAssignedPatients(response.data.users || []);
    } catch (error) {
      console.error('❌ Error fetching assigned patients:', error);
      if (error.response?.status === 403) {
        console.log('⚠️ Access denied - this feature requires doctor role');
        toast.error('Access denied. This feature is only available for doctors.');
      }
      setAssignedPatients([]);
    }
  };

  const handleAddMedicalRecord = async () => {
    if (!selectedPatient || !medicalRecordForm.condition || !medicalRecordForm.diagnosis) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const recordData = {
        ...medicalRecordForm,
        date: new Date(),
        doctor: `${user.firstName} ${user.lastName}`
      };

      await apiClient.put(`/api/auth/users/${selectedPatient._id}/medical-record`, recordData);
      
      toast.success('Medical record added successfully');
      setShowMedicalRecordModal(false);
      setMedicalRecordForm({
        condition: '',
        diagnosis: '',
        treatment: '',
        type: 'Consultation',
        notes: '',
        status: 'Completed'
      });
      
      // Refresh patient data
      fetchAssignedPatients();
    } catch (error) {
      toast.error('Failed to add medical record');
      console.error('Error adding medical record:', error);
    }
  };

  const handleAddPrescription = async () => {
    if (!selectedPatient || !prescriptionForm.name || !prescriptionForm.dosage) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const prescriptionData = {
        ...prescriptionForm,
        prescribedBy: `${user.firstName} ${user.lastName}`,
        prescribedDate: new Date(),
        status: 'Active'
      };

      await apiClient.put(`/api/auth/users/${selectedPatient._id}/prescription`, prescriptionData);
      
      toast.success('Prescription added successfully');
      setShowPrescriptionModal(false);
      setPrescriptionForm({
        name: '',
        dosage: '',
        frequency: '',
        notes: '',
        endDate: ''
      });
      
      // Refresh patient data
      fetchAssignedPatients();
    } catch (error) {
      toast.error('Failed to add prescription');
      console.error('Error adding prescription:', error);
    }
  };

  const handleAddCareTask = async () => {
    if (!careTaskData.task || !careTaskData.description || !careTaskData.assignedTo || !careTaskData.patientId) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await apiClient.post('/api/care-tasks', {
        ...careTaskData,
        assignedBy: user._id,
        status: 'Assigned'
      });
      
      toast.success('Care task created and assigned successfully');
      setShowAddCareTask(false);
      setCareTaskData({
        task: '',
        description: '',
        priority: 'Medium',
        dueDate: '',
        room: '',
        category: 'General',
        notes: '',
        assignedTo: '',
        patientId: ''
      });
      fetchDashboardStats();
    } catch (error) {
      toast.error('Failed to create care task');
      console.error('Error creating care task:', error);
    }
  };

  const fetchCareTasksList = async () => {
    try {
      const response = await apiClient.get('/api/care-tasks');
      setCareTasksList(response.data);
      setShowCareTasksList(true);
    } catch (error) {
      toast.error('Failed to fetch care tasks');
      console.error('Error fetching care tasks:', error);
    }
  };

  const updateCareTaskStatus = async (taskId, newStatus) => {
    try {
      await apiClient.patch(`/api/care-tasks/${taskId}/status`, { status: newStatus });
      toast.success('Task status updated successfully');
      fetchCareTasksList();
      fetchDashboardStats();
    } catch (error) {
      toast.error('Failed to update task status');
      console.error('Error updating task status:', error);
    }
  };

  const updatePatientStatus = async (patientId, newStatus) => {
    try {
      await apiClient.patch(`/api/auth/users/${patientId}/status`, { status: newStatus });
      toast.success('Patient status updated successfully');
      fetchAssignedPatients();
      fetchDashboardStats();
    } catch (error) {
      toast.error('Failed to update patient status');
      console.error('Error updating patient status:', error);
    }
  };

  const fetchAvailableNurses = async () => {
    try {
      setLoadingNurses(true);
      const response = await apiClient.get('/api/auth/users?roles=nurse');
      setAvailableNurses(response.data.users || []);
    } catch (error) {
      console.error('Error fetching nurses:', error);
      toast.error('Failed to fetch available nurses');
    } finally {
      setLoadingNurses(false);
    }
  };

  // Fetch nurses when care task modal opens
  useEffect(() => {
    if (showAddCareTask) {
      fetchAvailableNurses();
    }
  }, [showAddCareTask]);

  const filteredPatients = assignedPatients.filter(patient => {
    const matchesSearch = patient.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || patient.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const statCards = [
    {
      title: 'Assigned Patients',
      value: assignedPatients.length,
      icon: Users,
      color: 'bg-blue-500',
      change: '+2',
      changeType: 'positive'
    },
    {
      title: 'Today\'s Appointments',
      value: stats?.overview?.todayPatients || 0,
      icon: Calendar,
      color: 'bg-yellow-500',
      change: stats?.overview?.patientChange || '0',
      changeType: stats?.overview?.patientChange?.startsWith('+') ? 'positive' : 'negative'
    },
    {
      title: 'Completed Today',
      value: stats?.overview?.completedToday || 0,
      icon: Activity,
      color: 'bg-green-500',
      change: stats?.overview?.completedChange || '0',
      changeType: stats?.overview?.completedChange?.startsWith('+') ? 'positive' : 'negative'
    },
    {
      title: 'Emergency Cases',
      value: stats?.overview?.emergencyCases || 0,
      icon: AlertTriangle,
      color: 'bg-red-500',
      change: stats?.overview?.emergencyChange || '0',
      changeType: stats?.overview?.emergencyChange?.startsWith('+') ? 'positive' : 'negative'
    }
  ];

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Check if user is a doctor
  if (user?.role !== 'doctor') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Stethoscope className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Doctor Dashboard</h2>
          <p className="text-gray-600 mb-4">This dashboard is only available for doctors.</p>
          <p className="text-sm text-gray-500">Current role: {user?.role || 'Unknown'}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Main Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Doctor Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600">Patient Care and Medical Management</p>
        </div>
        <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500">
          <Stethoscope className="h-3 w-3 sm:h-4 sm:w-4" />
          <span>Dr. {user?.firstName} {user?.lastName}</span>
          <span>•</span>
          <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
          <span>{new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* SDG 3 Banner */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 sm:p-6 text-white">
        <div className="flex items-center space-x-3">
          <Heart className="h-6 w-6 sm:h-8 sm:w-8" />
          <div>
            <h2 className="text-lg sm:text-xl font-bold"> Good Health and Well-being</h2>
            <p className="text-sm sm:text-base text-blue-100">Providing quality healthcare and patient care</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`p-2 sm:p-3 rounded-full ${stat.color}`}>
                <stat.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
            <div className="mt-3 sm:mt-4 flex items-center">
              <TrendingUp className={`h-3 w-3 sm:h-4 sm:w-4 ${
                stat.changeType === 'positive' ? 'text-green-500' : 
                stat.changeType === 'negative' ? 'text-red-500' : 'text-gray-500'
              }`} />
              <span className={`ml-1 text-xs sm:text-sm font-medium ${
                stat.changeType === 'positive' ? 'text-green-600' : 
                stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {stat.change}
              </span>
              <span className="ml-2 text-xs sm:text-sm text-gray-500">from yesterday</span>
            </div>
          </div>
        ))}
      </div>

      {/* Doctor Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <button 
            className="flex flex-col items-center p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors" 
            onClick={() => navigate('/doctor-dashboard/appointments')}
          >
            <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 mb-2" />
            <span className="text-xs sm:text-sm font-medium text-gray-900 text-center">View Appointments</span>
        </button>
          <button 
            className="flex flex-col items-center p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors" 
            onClick={() => navigate('/doctor-dashboard/patients')}
          >
            <Users className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 mb-2" />
            <span className="text-xs sm:text-sm font-medium text-gray-900 text-center">Patient Records</span>
        </button>
          <button 
            className="flex flex-col items-center p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors" 
            onClick={() => navigate('/doctor-dashboard/emergency')}
          >
            <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 mb-2" />
            <span className="text-xs sm:text-sm font-medium text-gray-900 text-center">Emergency Cases</span>
        </button>
          <button 
            className="flex flex-col items-center p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors" 
            onClick={() => navigate('/doctor-dashboard/medical-reports')}
          >
            <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 mb-2" />
            <span className="text-xs sm:text-sm font-medium text-gray-900 text-center">Medical Reports</span>
        </button>
        </div>
      </div>

      {/* Care Tasks Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 className="text-base sm:text-lg font-medium text-gray-900">Care Tasks Management</h3>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <button
                onClick={() => setShowAddCareTask(true)}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Create Task</span>
              </button>
              <button
                onClick={fetchCareTasksList}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
              >
                View All Tasks
              </button>
            </div>
          </div>
        </div>
        <div className="p-4 sm:p-6">
          <div className="text-center py-6 sm:py-8">
            <Clipboard className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Care Tasks</h3>
            <p className="text-sm sm:text-base text-gray-600">Create and manage nursing care tasks and assignments</p>
          </div>
        </div>
      </div>

      {/* Assigned Patients Section */}
      <div id="assigned-patients-section" className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 className="text-base sm:text-lg font-medium text-gray-900">My Assigned Patients</h3>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search patients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="all">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {filteredPatients.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPatients.map((patient) => (
                <div key={patient._id} className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm sm:text-base">
                          {patient.firstName} {patient.lastName}
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-500">Patient ID: {patient.username}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                      patient.status === 'Active' ? 'bg-green-100 text-green-800' : 
                      patient.status === 'Discharged' ? 'bg-gray-100 text-gray-800' :
                      patient.status === 'Under Observation' ? 'bg-yellow-100 text-yellow-800' :
                      patient.status === 'Critical' ? 'bg-red-100 text-red-800' :
                      patient.status === 'Recovering' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {patient.status || 'Active'}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                      <Mail className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="truncate">{patient.email}</span>
                    </div>
                    {patient.contactInfo?.phone && (
                      <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                        <Phone className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span className="truncate">{patient.contactInfo.phone}</span>
                      </div>
                    )}
                    {patient.bloodType && (
                      <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                        <Heart className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span>Blood Type: {patient.bloodType}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 pt-3 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setSelectedPatient(patient);
                        setShowPatientModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm font-medium flex items-center justify-center space-x-1 w-full sm:w-auto"
                    >
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>View Details</span>
                    </button>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <select
                        value={patient.status || 'Active'}
                        onChange={(e) => updatePatientStatus(patient._id, e.target.value)}
                        className="text-xs border border-gray-300 rounded px-2 py-1 flex-shrink-0"
                      >
                        <option value="Active">Active</option>
                        <option value="Discharged">Discharged</option>
                        <option value="Under Observation">Under Observation</option>
                        <option value="Critical">Critical</option>
                        <option value="Recovering">Recovering</option>
                      </select>
                      <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedPatient(patient);
                          setShowMedicalRecordModal(true);
                        }}
                          className="text-green-600 hover:text-green-800 text-xs sm:text-sm font-medium flex items-center justify-center space-x-1 flex-1"
                      >
                          <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>Add Record</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPatient(patient);
                          setShowPrescriptionModal(true);
                        }}
                          className="text-purple-600 hover:text-purple-800 text-xs sm:text-sm font-medium flex items-center justify-center space-x-1 flex-1"
                      >
                          <Pill className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>Prescribe</span>
                      </button>
                      </div>
                    </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
            <div className="text-center py-6 sm:py-8">
              <Users className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm sm:text-base text-gray-500">No patients assigned</p>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">
                {searchTerm || filterStatus !== 'all' ? 'Try adjusting your search or filters' : 'Patients will appear here when assigned'}
              </p>
            </div>
            )}
          </div>
        </div>

      {/* Patient Details Modal */}
      {showPatientModal && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-medium text-gray-900">
                Patient Details: {selectedPatient.firstName} {selectedPatient.lastName}
              </h3>
              <button
                onClick={() => setShowPatientModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Basic Information */}
              <div>
                <h4 className="text-sm sm:text-md font-medium text-gray-900 mb-3">Basic Information</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Full Name</p>
                    <p className="text-xs sm:text-sm font-medium text-gray-900">
                      {selectedPatient.firstName} {selectedPatient.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Email</p>
                    <p className="text-xs sm:text-sm font-medium text-gray-900">{selectedPatient.email}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Phone</p>
                    <p className="text-xs sm:text-sm font-medium text-gray-900">
                      {selectedPatient.contactInfo?.phone || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Blood Type</p>
                    <p className="text-xs sm:text-sm font-medium text-gray-900">
                      {selectedPatient.bloodType || 'Not specified'}
                    </p>
          </div>
                      </div>
                    </div>

              {/* Medical Information */}
              <div>
                <h4 className="text-sm sm:text-md font-medium text-gray-900 mb-3">Medical Information</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Status</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedPatient.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedPatient.status || 'Active'}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Member Since</p>
                    <p className="text-xs sm:text-sm font-medium text-gray-900">
                      {selectedPatient.createdAt ? new Date(selectedPatient.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Medical Records</p>
                    <p className="text-xs sm:text-sm font-medium text-gray-900">
                      {selectedPatient.medicalHistory?.length || 0} records
                    </p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Current Medications</p>
                    <p className="text-xs sm:text-sm font-medium text-gray-900">
                      {selectedPatient.currentMedications?.filter(med => med.status === 'Active').length || 0} active
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            {selectedPatient.emergencyContact?.name && (
              <div className="mt-6">
                <h4 className="text-sm sm:text-md font-medium text-gray-900 mb-3">Emergency Contact</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">Name</p>
                      <p className="text-xs sm:text-sm font-medium text-gray-900">{selectedPatient.emergencyContact.name}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">Relationship</p>
                      <p className="text-xs sm:text-sm font-medium text-gray-900">{selectedPatient.emergencyContact.relationship}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">Phone</p>
                      <p className="text-xs sm:text-sm font-medium text-gray-900">{selectedPatient.emergencyContact.phone}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowPatientModal(false);
                  setShowMedicalRecordModal(true);
                }}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center space-x-2"
              >
                <FileText className="h-4 w-4" />
                <span>Add Medical Record</span>
              </button>
              <button
                onClick={() => {
                  setShowPatientModal(false);
                  setShowPrescriptionModal(true);
                }}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 flex items-center space-x-2"
              >
                <Pill className="h-4 w-4" />
                <span>Add Prescription</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Medical Record Modal */}
      {showMedicalRecordModal && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-medium text-gray-900">
                Add Medical Record - {selectedPatient.firstName} {selectedPatient.lastName}
              </h3>
              <button
                onClick={() => setShowMedicalRecordModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
      </div>

            <form className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Condition *
                  </label>
                  <input
                    type="text"
                    value={medicalRecordForm.condition}
                    onChange={(e) => setMedicalRecordForm({ ...medicalRecordForm, condition: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="e.g., Hypertension, Diabetes"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Record Type
                  </label>
                  <select
                    value={medicalRecordForm.type}
                    onChange={(e) => setMedicalRecordForm({ ...medicalRecordForm, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    {recordTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
        </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Diagnosis *
                </label>
                <textarea
                  value={medicalRecordForm.diagnosis}
                  onChange={(e) => setMedicalRecordForm({ ...medicalRecordForm, diagnosis: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Detailed diagnosis..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Treatment
                </label>
                <textarea
                  value={medicalRecordForm.treatment}
                  onChange={(e) => setMedicalRecordForm({ ...medicalRecordForm, treatment: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Treatment plan..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={medicalRecordForm.notes}
                  onChange={(e) => setMedicalRecordForm({ ...medicalRecordForm, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Additional notes..."
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowMedicalRecordModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddMedicalRecord}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center space-x-2 text-sm"
                >
                  <Save className="h-4 w-4" />
                  <span>Add Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Prescription Modal */}
      {showPrescriptionModal && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-medium text-gray-900">
                Add Prescription - {selectedPatient.firstName} {selectedPatient.lastName}
              </h3>
              <button
                onClick={() => setShowPrescriptionModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>
            
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medication Name *
                </label>
                <input
                  type="text"
                  value={prescriptionForm.name}
                  onChange={(e) => setPrescriptionForm({ ...prescriptionForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="e.g., Amoxicillin, Ibuprofen"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dosage *
                  </label>
                  <input
                    type="text"
                    value={prescriptionForm.dosage}
                    onChange={(e) => setPrescriptionForm({ ...prescriptionForm, dosage: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="e.g., 500mg, 10ml"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frequency
                  </label>
                  <input
                    type="text"
                    value={prescriptionForm.frequency}
                    onChange={(e) => setPrescriptionForm({ ...prescriptionForm, frequency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="e.g., Twice daily, Every 8 hours"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={prescriptionForm.endDate}
                    onChange={(e) => setPrescriptionForm({ ...prescriptionForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={prescriptionForm.notes}
                  onChange={(e) => setPrescriptionForm({ ...prescriptionForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Special instructions, side effects to watch for..."
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowPrescriptionModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddPrescription}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 flex items-center justify-center space-x-2 text-sm"
                >
                  <Pill className="h-4 w-4" />
                  <span>Add Prescription</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Care Task Modal */}
      {showAddCareTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Create Care Task</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Patient *</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  value={careTaskData.patientId}
                  onChange={(e) => setCareTaskData({ ...careTaskData, patientId: e.target.value })}
                >
                  <option value="">Select a patient</option>
                  {assignedPatients.map(patient => (
                    <option key={patient._id} value={patient._id}>
                      {patient.firstName} {patient.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Task *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  value={careTaskData.task}
                  onChange={(e) => setCareTaskData({ ...careTaskData, task: e.target.value })}
                  placeholder="e.g., Medication Check"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  rows="2"
                  value={careTaskData.description}
                  onChange={(e) => setCareTaskData({ ...careTaskData, description: e.target.value })}
                  placeholder="Detailed description of the task..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assign To *</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  value={careTaskData.assignedTo}
                  onChange={(e) => setCareTaskData({ ...careTaskData, assignedTo: e.target.value })}
                  disabled={loadingNurses}
                >
                  <option value="">
                    {loadingNurses ? 'Loading nurses...' : 'Select a nurse'}
                  </option>
                  {availableNurses.map(nurse => (
                    <option key={nurse._id} value={nurse._id}>
                      {nurse.firstName} {nurse.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  value={careTaskData.priority}
                  onChange={(e) => setCareTaskData({ ...careTaskData, priority: e.target.value })}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={careTaskData.category}
                    onChange={(e) => setCareTaskData({ ...careTaskData, category: e.target.value })}
                  >
                    <option value="General">General</option>
                    <option value="Medication">Medication</option>
                    <option value="Observation">Observation</option>
                    <option value="Procedure">Procedure</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                <input
                  type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  value={careTaskData.dueDate}
                  onChange={(e) => setCareTaskData({ ...careTaskData, dueDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Room</label>
                <input
                  type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  value={careTaskData.room}
                  onChange={(e) => setCareTaskData({ ...careTaskData, room: e.target.value })}
                  placeholder="e.g., Room 101"
                />
              </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  rows="2"
                  value={careTaskData.notes}
                  onChange={(e) => setCareTaskData({ ...careTaskData, notes: e.target.value })}
                  placeholder="Additional notes for the care task..."
                />
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={() => setShowAddCareTask(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCareTask}
                  className="flex-1 px-4 py-2 text-white bg-purple-600 rounded-md hover:bg-purple-700 text-sm"
                >
                  Create Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Care Tasks List Modal */}
      {showCareTasksList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base sm:text-lg font-medium text-gray-900">All Care Tasks</h3>
              <button 
                onClick={() => setShowCareTasksList(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>
            <div className="space-y-4">
              {careTasksList.length > 0 ? (
                careTasksList.map((task, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm sm:text-base">{task.task}</h4>
                        <p className="text-xs sm:text-sm text-gray-500">
                          Patient: {task.patient?.firstName} {task.patient?.lastName}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500">
                          Assigned to: {task.assignedTo?.firstName} {task.assignedTo?.lastName}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          task.priority === 'High' ? 'bg-red-100 text-red-800' :
                          task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {task.priority}
                        </span>
                        <div className="mt-2">
                          <select
                            value={task.status}
                            onChange={(e) => updateCareTaskStatus(task._id, e.target.value)}
                            className="text-xs border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm mb-2">
                      <div>
                        <span className="text-gray-500">Category:</span>
                        <span className="ml-1 font-medium">{task.category}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Room:</span>
                        <span className="ml-1 font-medium">{task.room}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Due Date:</span>
                        <span className="ml-1 font-medium">{task.dueDate}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Status:</span>
                        <span className="ml-1 font-medium">{task.status}</span>
                      </div>
                    </div>
                    {task.notes && (
                      <div className="text-xs sm:text-sm text-gray-600">
                        <span className="font-medium">Notes:</span> {task.notes}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-6 sm:py-8">No care tasks found</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard; 