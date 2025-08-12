import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  AlertTriangle, 
  TrendingUp, 
  Activity,
  Clock,
  Heart,
  Syringe,
  Clipboard,
  FileText,
  Thermometer,
  Stethoscope,
  Bell,
  CheckCircle,
  XCircle,
  Plus,
  Eye,
  X,
  Save
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../config/axios';
import toast from 'react-hot-toast';

const NurseDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddNote, setShowAddNote] = useState(false);
  const [showAddVitals, setShowAddVitals] = useState(false);
  const [showAddCareTask, setShowAddCareTask] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [vitalsData, setVitalsData] = useState({
    bloodPressure: '',
    heartRate: '',
    temperature: '',
    respiratoryRate: '',
    oxygenSaturation: '',
    notes: ''
  });
  const [careTaskData, setCareTaskData] = useState({
    task: '',
    description: '',
    priority: 'Medium',
    dueDate: '',
    room: '',
    category: 'General',
    notes: ''
  });
  const [showVitalsHistory, setShowVitalsHistory] = useState(false);
  const [vitalsHistory, setVitalsHistory] = useState([]);
  const [showCareTasksList, setShowCareTasksList] = useState(false);
  const [careTasksList, setCareTasksList] = useState([]);
  const [showPatientNotes, setShowPatientNotes] = useState(false);
  const [patientNotes, setPatientNotes] = useState([]);
  const [showShiftHandover, setShowShiftHandover] = useState(false);
  const [shiftHandoverData, setShiftHandoverData] = useState({
    shift: 'Morning',
    handoverTo: '',
    patientsUnderCare: 0,
    criticalPatients: [],
    medicationsDue: [],
    emergencyAlerts: [],
    keyNotes: '',
    specialInstructions: [],
    equipmentIssues: [],
    nextShiftPriorities: []
  });
  const [availableNurses, setAvailableNurses] = useState([]);
  const [availablePatients, setAvailablePatients] = useState([]);
  const [selectedCriticalPatients, setSelectedCriticalPatients] = useState([]);
  const [selectedMedications, setSelectedMedications] = useState([]);
  const [loadingNurses, setLoadingNurses] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [currentHandover, setCurrentHandover] = useState(null);
  const [showHandoverHistory, setShowHandoverHistory] = useState(false);
  const [handoverHistory, setHandoverHistory] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchDashboardStats();
    fetchCurrentHandover();
    checkCurrentAuthState(); // Check auth state on component load
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await apiClient.get('/api/stats/nurse-dashboard');
      setStats(response.data);
    } catch (error) {
      toast.error('Failed to fetch dashboard statistics');
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim() || !selectedPatient) return;
    
    try {
      await apiClient.post('/api/patient-notes', {
        patientId: selectedPatient._id,
        note: noteText,
        type: 'nursing_note'
      });
      toast.success('Note added successfully');
      setNoteText('');
      setSelectedPatient(null);
      setShowAddNote(false);
      fetchDashboardStats(); // Refresh data
    } catch (error) {
      toast.error('Failed to add note');
    }
  };

  const handleAddVitals = async () => {
    if (!selectedPatient || !vitalsData.bloodPressure || !vitalsData.heartRate || !vitalsData.temperature) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      await apiClient.post('/api/vitals', {
        patientId: selectedPatient._id,
        ...vitalsData
      });
      toast.success('Vitals recorded successfully');
      setVitalsData({
        bloodPressure: '',
        heartRate: '',
        temperature: '',
        respiratoryRate: '',
        oxygenSaturation: '',
        notes: ''
      });
      setSelectedPatient(null);
      setShowAddVitals(false);
      fetchDashboardStats(); // Refresh data
      fetchVitalsHistory(); // Also refresh vitals history
    } catch (error) {
      toast.error('Failed to record vitals');
      console.error('Error recording vitals:', error);
    }
  };

  const handleAddCareTask = async () => {
    if (!selectedPatient || !careTaskData.task || !careTaskData.dueDate) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      await apiClient.post('/api/care-tasks', {
        patientId: selectedPatient._id,
        ...careTaskData
      });
      toast.success('Care task created successfully');
      setCareTaskData({
        task: '',
        description: '',
        priority: 'Medium',
        dueDate: '',
        room: '',
        category: 'General',
        notes: ''
      });
      setSelectedPatient(null);
      setShowAddCareTask(false);
      fetchDashboardStats(); // Refresh data
    } catch (error) {
      toast.error('Failed to create care task');
      console.error('Error creating care task:', error);
    }
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'patients':
        navigate('/nurse-dashboard/patients');
        break;
      case 'appointments':
        navigate('/nurse-dashboard/appointments');
        break;
      case 'emergency':
        navigate('/nurse-dashboard/emergency');
        break;
      case 'inventory':
        navigate('/nurse-dashboard/inventory');
        break;
      case 'vitals':
        setShowAddVitals(true);
        break;
      case 'add-note':
        setShowAddNote(true);
        break;
      case 'care-tasks':
        setShowAddCareTask(true);
        break;
      default:
        break;
    }
  };

  const fetchVitalsHistory = async () => {
    try {
      const response = await apiClient.get('/api/vitals/latest');
      setVitalsHistory(response.data);
      setShowVitalsHistory(true);
    } catch (error) {
      toast.error('Failed to fetch vitals history');
      console.error('Error fetching vitals history:', error);
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
      fetchCareTasksList(); // Refresh the list
      fetchDashboardStats(); // Refresh dashboard stats
    } catch (error) {
      toast.error('Failed to update task status');
      console.error('Error updating task status:', error);
    }
  };

  const fetchPatientNotes = async () => {
    try {
      const response = await apiClient.get('/api/patient-notes');
      setPatientNotes(response.data);
      setShowPatientNotes(true);
    } catch (error) {
      toast.error('Failed to fetch patient notes');
      console.error('Error fetching patient notes:', error);
    }
  };

  const fetchCurrentHandover = async () => {
    try {
      const response = await apiClient.get(`/api/shift-handover/today/${shiftHandoverData.shift}`);
      setCurrentHandover(response.data);
    } catch (error) {
      // No current handover found, which is fine
      setCurrentHandover(null);
    }
  };

  const fetchHandoverHistory = async () => {
    try {
      const response = await apiClient.get('/api/shift-handover');
      setHandoverHistory(response.data);
    } catch (error) {
      toast.error('Failed to fetch handover history');
    }
  };

  const handleCreateHandover = async () => {
    try {
      const response = await apiClient.post('/api/shift-handover', shiftHandoverData);
      setCurrentHandover(response.data);
      setShowShiftHandover(false);
      toast.success('Shift handover created successfully');
      fetchCurrentHandover();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create shift handover');
    }
  };

  const handleCompleteHandover = async (handoverId) => {
    try {
      await apiClient.patch(`/api/shift-handover/${handoverId}/complete`);
      toast.success('Shift handover completed successfully');
      fetchCurrentHandover();
      fetchHandoverHistory();
    } catch (error) {
      toast.error('Failed to complete shift handover');
    }
  };

  const fetchAvailableNurses = async () => {
    try {
      setLoadingNurses(true);
      console.log('🔍 Fetching available nurses...');
      const response = await apiClient.get('/api/users?roles=nurse');
      console.log('📊 Nurses response:', response.data);
      
      // Filter out the current logged-in user
      const currentUserStr = localStorage.getItem('user');
      let currentUser = null;
      
      if (currentUserStr) {
        try {
          currentUser = JSON.parse(currentUserStr);
          console.log('👤 Current user:', currentUser);
        } catch (parseError) {
          console.error('❌ Error parsing user from localStorage:', parseError);
          currentUser = null;
        }
      } else {
        console.log('⚠️ No user found in localStorage');
      }
      
      // Filter nurses only if we have a valid current user
      let filteredNurses = response.data;
      if (currentUser && currentUser._id) {
        filteredNurses = response.data.filter(nurse => nurse._id !== currentUser._id);
        console.log('✅ Filtered nurses (excluding current user):', filteredNurses);
      } else {
        console.log('⚠️ No current user ID found, showing all nurses');
      }
      
      setAvailableNurses(filteredNurses);
    } catch (error) {
      console.error('❌ Error fetching nurses:', error);
      toast.error('Failed to fetch available nurses');
    } finally {
      setLoadingNurses(false);
    }
  };

  const fetchAvailablePatients = async () => {
    try {
      console.log('🔍 Fetching available patients...');
      const response = await apiClient.get('/api/users?roles=user');
      console.log('📊 Patients response:', response.data);
      setAvailablePatients(response.data);
    } catch (error) {
      console.error('❌ Error fetching patients:', error);
      toast.error('Failed to fetch patients');
    }
  };

  const checkCurrentAuthState = () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    console.log('🔍 Current Authentication State:');
    console.log('🔑 Token:', token ? 'Present' : 'Missing');
    console.log('👤 User Data:', userStr ? 'Present' : 'Missing');
    
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        console.log('✅ User Details:', {
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          email: user.email
        });
      } catch (error) {
        console.error('❌ Error parsing user data:', error);
      }
    }
  };

  const refreshUserData = async () => {
    try {
      console.log('🔄 Refreshing user data from backend...');
      const response = await apiClient.get('/api/auth/profile');
      console.log('📊 User profile response:', response.data);
      
      if (response.data && response.data.user) {
        const userData = response.data.user;
        localStorage.setItem('user', JSON.stringify(userData));
        console.log('✅ User data refreshed and stored:', userData);
        return userData;
      } else {
        console.error('❌ No user data in profile response');
        return null;
      }
    } catch (error) {
      console.error('❌ Error refreshing user data:', error);
      return null;
    }
  };

  const addCriticalPatient = () => {
    const patient = availablePatients.find(p => p._id === selectedCriticalPatients.patientId);
    if (patient && selectedCriticalPatients.condition) {
      const newCriticalPatient = {
        patientId: patient._id,
        patientName: `${patient.firstName} ${patient.lastName}`,
        condition: selectedCriticalPatients.condition,
        specialInstructions: selectedCriticalPatients.specialInstructions || ''
      };
      setShiftHandoverData(prev => ({
        ...prev,
        criticalPatients: [...prev.criticalPatients, newCriticalPatient]
      }));
      setSelectedCriticalPatients({ patientId: '', condition: '', specialInstructions: '' });
    }
  };

  const removeCriticalPatient = (index) => {
    setShiftHandoverData(prev => ({
      ...prev,
      criticalPatients: prev.criticalPatients.filter((_, i) => i !== index)
    }));
  };

  const addMedication = () => {
    const patient = availablePatients.find(p => p._id === selectedMedications.patientId);
    if (patient && selectedMedications.medication && selectedMedications.dosage && selectedMedications.time) {
      const newMedication = {
        patientId: patient._id,
        patientName: `${patient.firstName} ${patient.lastName}`,
        medication: selectedMedications.medication,
        dosage: selectedMedications.dosage,
        time: selectedMedications.time,
        status: 'Pending'
      };
      setShiftHandoverData(prev => ({
        ...prev,
        medicationsDue: [...prev.medicationsDue, newMedication]
      }));
      setSelectedMedications({ patientId: '', medication: '', dosage: '', time: '' });
    }
  };

  const removeMedication = (index) => {
    setShiftHandoverData(prev => ({
      ...prev,
      medicationsDue: prev.medicationsDue.filter((_, i) => i !== index)
    }));
  };

  const statCards = [
    {
      title: 'Patients Under Care',
      value: stats?.overview?.patientsUnderCare || 0,
      icon: Users,
      color: 'bg-blue-500',
      change: stats?.overview?.patientChange || '0',
      changeType: stats?.overview?.patientChange?.startsWith('+') ? 'positive' : 'negative'
    },
    {
      title: 'Medications Due',
      value: stats?.overview?.medicationsDue || 0,
      icon: Syringe,
      color: 'bg-yellow-500',
      change: stats?.overview?.medicationChange || '0',
      changeType: stats?.overview?.medicationChange?.startsWith('+') ? 'positive' : 'negative'
    },
    {
      title: 'Vitals Checked',
      value: stats?.overview?.vitalsChecked || 0,
      icon: Activity,
      color: 'bg-green-500',
      change: stats?.overview?.vitalChange || '0',
      changeType: stats?.overview?.vitalChange?.startsWith('+') ? 'positive' : 'negative'
    },
    {
      title: 'Emergency Alerts',
      value: stats?.overview?.emergencyAlerts || 0,
      icon: AlertTriangle,
      color: 'bg-red-500',
      change: stats?.overview?.emergencyChange || '0',
      changeType: stats?.overview?.emergencyChange?.startsWith('+') ? 'positive' : 'negative'
    },
    {
      title: 'Lab Results Pending',
      value: stats?.overview?.labResultsPending || 0,
      icon: FileText,
      color: 'bg-purple-500',
      change: stats?.overview?.labChange || '0',
      changeType: stats?.overview?.labChange?.startsWith('+') ? 'positive' : 'negative'
    },
    {
      title: 'Critical Vitals',
      value: stats?.overview?.criticalVitals || 0,
      icon: Thermometer,
      color: 'bg-orange-500',
      change: stats?.overview?.criticalChange || '0',
      changeType: stats?.overview?.criticalChange?.startsWith('+') ? 'positive' : 'negative'
    }
  ];

  const getCurrentSection = () => {
    const path = location.pathname;
    if (path.includes('/vitals')) return 'vitals';
    if (path.includes('/care-tasks')) return 'care-tasks';
    if (path.includes('/lab-results')) return 'lab-results';
    if (path.includes('/shift-handover')) return 'shift-handover';
    return 'dashboard';
  };

  const currentSection = getCurrentSection();

  useEffect(() => {
    if (currentSection === 'vitals') {
      fetchVitalsHistory();
    }
    if (currentSection === 'shift-handover') {
      fetchCurrentHandover();
      fetchHandoverHistory();
    }
  }, [currentSection]);

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      if (showShiftHandover) {
        // Check if user is logged in
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        
        console.log('🔍 Checking authentication for shift handover...');
        console.log('🔑 Token exists:', !!token);
        console.log('👤 User data exists:', !!userStr);
        
        if (!token) {
          console.log('❌ No token found');
          toast.error('Please log in to create a shift handover');
          setShowShiftHandover(false);
          return;
        }
        
        let user = null;
        
        if (!userStr) {
          console.log('❌ No user data found, attempting to refresh...');
          user = await refreshUserData();
          
          if (!user) {
            console.log('❌ Failed to refresh user data');
            toast.error('User session expired. Please log in again');
            setShowShiftHandover(false);
            return;
          }
          
          console.log('✅ User data refreshed successfully');
        } else {
          try {
            user = JSON.parse(userStr);
          } catch (parseError) {
            console.error('❌ Error parsing user data:', parseError);
            console.log('🔄 Attempting to refresh user data...');
            user = await refreshUserData();
            
            if (!user) {
              toast.error('User session corrupted. Please log in again');
              setShowShiftHandover(false);
              return;
            }
          }
        }
        
        console.log('✅ User authenticated:', user.firstName, user.lastName, user.role);
        
        // Check if user is a nurse
        if (user.role !== 'nurse') {
          console.log('❌ User is not a nurse:', user.role);
          toast.error('Only nurses can create shift handovers');
          setShowShiftHandover(false);
          return;
        }
        
        console.log('✅ Authentication check passed, fetching data...');
        fetchAvailableNurses();
        fetchAvailablePatients();
      }
    };
    
    checkAuthAndFetchData();
  }, [showShiftHandover]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nurse Dashboard</h1>
          <p className="text-gray-600">Patient Care and Nursing Management</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Stethoscope className="h-4 w-4" />
          <span>Nurse</span>
          <span>•</span>
          <Clock className="h-4 w-4" />
          <span>{new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* SDG 3 Banner */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
        <div className="flex items-center space-x-3">
          <Heart className="h-8 w-8" />
          <div>
            <h2 className="text-xl font-bold">Good Health and Well-being</h2>
            <p className="text-green-100">Providing compassionate nursing care</p>
          </div>
        </div>
      </div>

      {/* Conditional Content Based on Route */}
      {currentSection === 'dashboard' && (
        <>
      {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className={`h-4 w-4 ${
                stat.changeType === 'positive' ? 'text-green-500' : 
                stat.changeType === 'negative' ? 'text-red-500' : 'text-gray-500'
              }`} />
              <span className={`ml-1 text-sm font-medium ${
                stat.changeType === 'positive' ? 'text-green-600' : 
                stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {stat.change}
              </span>
              <span className="ml-2 text-sm text-gray-500">from yesterday</span>
            </div>
          </div>
        ))}
      </div>

      {/* Nurse Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors" onClick={() => handleQuickAction('patients')}>
            <Users className="h-6 w-6 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Patient Care</span>
          </button>
              <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors" onClick={() => handleQuickAction('appointments')}>
            <Calendar className="h-6 w-6 text-green-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Appointments</span>
          </button>
              <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors" onClick={() => handleQuickAction('emergency')}>
            <AlertTriangle className="h-6 w-6 text-red-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Emergency</span>
          </button>
              <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors" onClick={() => handleQuickAction('inventory')}>
                <Syringe className="h-6 w-6 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Medications</span>
          </button>
              <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors" onClick={() => handleQuickAction('vitals')}>
                <Thermometer className="h-6 w-6 text-orange-600 mb-2" />
                <span className="text-sm font-medium text-gray-900">Vitals</span>
              </button>
              <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors" onClick={() => handleQuickAction('add-note')}>
                <Plus className="h-6 w-6 text-indigo-600 mb-2" />
                <span className="text-sm font-medium text-gray-900">Add Note</span>
              </button>
              <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors" onClick={() => handleQuickAction('care-tasks')}>
                <Clipboard className="h-6 w-6 text-teal-600 mb-2" />
                <span className="text-sm font-medium text-gray-900">Care Tasks</span>
          </button>
        </div>
      </div>
        </>
      )}

      {currentSection === 'vitals' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Vitals Management</h2>
              <p className="text-gray-600">Record and monitor patient vital signs</p>
            </div>
            <button
              onClick={() => setShowAddVitals(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Record Vitals</span>
            </button>
          </div>

          {/* Vitals Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Thermometer className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Total Vitals</p>
                  <p className="text-2xl font-bold text-gray-900">{vitalsHistory.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Thermometer className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Normal</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {vitalsHistory.filter(v => v.status === 'Normal').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Thermometer className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Warning</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {vitalsHistory.filter(v => v.status === 'Warning').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Thermometer className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Critical</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {vitalsHistory.filter(v => v.status === 'Critical').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Vitals */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Recent Vitals</h3>
              <button
                onClick={fetchVitalsHistory}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View All Vitals
              </button>
            </div>
            <div className="p-6">
              {vitalsHistory.length > 0 ? (
                <div className="space-y-4">
                  {vitalsHistory.slice(0, 5).map((vital, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {vital.patient?.firstName} {vital.patient?.lastName}
                          </h4>
                          <p className="text-sm text-gray-500">
                            Recorded by: {vital.recordedBy?.firstName} {vital.recordedBy?.lastName}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            vital.status === 'Critical' ? 'bg-red-100 text-red-800' :
                            vital.status === 'Warning' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {vital.status}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(vital.recordedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">BP:</span>
                          <span className="ml-1 font-medium">
                            {typeof vital.bloodPressure === 'object' 
                              ? `${vital.bloodPressure.systolic}/${vital.bloodPressure.diastolic}`
                              : vital.bloodPressure
                            }
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">HR:</span>
                          <span className="ml-1 font-medium">{vital.heartRate} BPM</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Temp:</span>
                          <span className="ml-1 font-medium">{vital.temperature}°C</span>
                        </div>
                        <div>
                          <span className="text-gray-500">RR:</span>
                          <span className="ml-1 font-medium">{vital.respiratoryRate || 'N/A'} BPM</span>
                        </div>
                        <div>
                          <span className="text-gray-500">O2:</span>
                          <span className="ml-1 font-medium">{vital.oxygenSaturation || 'N/A'}%</span>
                        </div>
                      </div>
                      {vital.notes && (
                        <div className="mt-2 text-sm text-gray-600">
                          <span className="font-medium">Notes:</span> {vital.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Thermometer className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Vitals Recorded</h3>
                  <p className="text-gray-600 mb-4">Start by recording patient vital signs</p>
                  <button
                    onClick={() => setShowAddVitals(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Record New Vitals
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {currentSection === 'care-tasks' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Care Tasks Management</h2>
            <button
              onClick={() => setShowAddCareTask(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Create Task</span>
            </button>
          </div>
          <div className="text-center py-8">
            <Clipboard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Care Tasks</h3>
            <p className="text-gray-600">Manage nursing care tasks and assignments</p>
            <button
              onClick={() => setShowAddCareTask(true)}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Create New Task
            </button>
          </div>
        </div>
      )}

      {currentSection === 'lab-results' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Lab Results</h2>
          <div className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Laboratory Results</h3>
            <p className="text-gray-600">View and track laboratory test results</p>
          </div>
        </div>
      )}

      {currentSection === 'shift-handover' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Shift Handover</h2>
              <p className="text-gray-600">Document important information for the next shift</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowHandoverHistory(true)}
                className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
              >
                View History
              </button>
              <button
                onClick={checkCurrentAuthState}
                className="px-2 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-xs"
                title="Debug: Check authentication state"
              >
                🔍 Debug Auth
              </button>
              {!currentHandover && (
                <button
                  onClick={() => setShowShiftHandover(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Handover
                </button>
              )}
            </div>
          </div>

          {/* Current Handover Status */}
          {currentHandover ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Today's {currentHandover.shift} Shift Handover
                </h3>
                <div className="flex space-x-2">
                  {!currentHandover.isCompleted && (
                    <button
                      onClick={() => handleCompleteHandover(currentHandover._id)}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      Complete
                    </button>
                  )}
                  <span className={`px-3 py-1 rounded text-sm ${
                    currentHandover.isCompleted 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {currentHandover.isCompleted ? 'Completed' : 'In Progress'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{currentHandover.patientsUnderCare}</div>
                  <div className="text-sm text-gray-600">Patients Under Care</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{currentHandover.medicationsDue.length}</div>
                  <div className="text-sm text-gray-600">Medications Due</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{currentHandover.emergencyAlerts.length}</div>
                  <div className="text-sm text-gray-600">Emergency Alerts</div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Key Notes for Next Shift:</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded">{currentHandover.keyNotes}</p>
                </div>

                {currentHandover.criticalPatients.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Critical Patients:</h4>
                    <div className="space-y-2">
                      {currentHandover.criticalPatients.map((patient, index) => (
                        <div key={index} className="bg-red-50 p-3 rounded border-l-4 border-red-500">
                          <div className="font-medium text-red-900">{patient.patientName}</div>
                          <div className="text-sm text-red-700">{patient.condition}</div>
                          {patient.specialInstructions && (
                            <div className="text-sm text-red-600 mt-1">{patient.specialInstructions}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentHandover.medicationsDue.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Medications Due:</h4>
                    <div className="space-y-2">
                      {currentHandover.medicationsDue.map((med, index) => (
                        <div key={index} className="bg-yellow-50 p-3 rounded border-l-4 border-yellow-500">
                          <div className="font-medium text-yellow-900">{med.patientName}</div>
                          <div className="text-sm text-yellow-700">{med.medication} - {med.dosage}</div>
                          <div className="text-sm text-yellow-600">Due: {med.time}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentHandover.specialInstructions.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Special Instructions:</h4>
                    <div className="space-y-2">
                      {currentHandover.specialInstructions.map((instruction, index) => (
                        <div key={index} className="bg-blue-50 p-3 rounded border-l-4 border-blue-500">
                          <div className="font-medium text-blue-900">{instruction.category}</div>
                          <div className="text-sm text-blue-700">{instruction.instruction}</div>
                          <span className={`inline-block px-2 py-1 text-xs rounded mt-1 ${
                            instruction.priority === 'High' ? 'bg-red-100 text-red-800' :
                            instruction.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {instruction.priority} Priority
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-sm text-gray-500">
                  Handover from: {currentHandover.handoverFrom?.firstName} {currentHandover.handoverFrom?.lastName} 
                  to: {currentHandover.handoverTo}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-center py-8">
                <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Handover Created</h3>
                <p className="text-gray-600 mb-4">Create a shift handover to document important information for the next shift</p>
                <button
                  onClick={() => setShowShiftHandover(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Handover
                </button>
              </div>
            </div>
          )}
        </div>
      )}



      {/* Main Content Grid - Only show on dashboard */}
      {currentSection === 'dashboard' && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient Care Tasks */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
           <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Patient Care Tasks</h3>
             <button 
               onClick={fetchCareTasksList}
               className="text-sm text-blue-600 hover:text-blue-800 font-medium"
             >
               View All Tasks
             </button>
          </div>
          <div className="p-6">
            {stats?.careTasks?.length > 0 ? (
              <div className="space-y-4">
                {stats.careTasks.map((task, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Clipboard className="h-4 w-4 text-green-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {task.patientName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {task.task} • Room {task.room}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        task.priority === 'High' ? 'bg-red-100 text-red-800' :
                        task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No pending care tasks</p>
            )}
          </div>
        </div>

        {/* Medication Schedule */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Medication Schedule</h3>
          </div>
          <div className="p-6">
            {stats?.medicationSchedule?.length > 0 ? (
              <div className="space-y-4">
                {stats.medicationSchedule.map((med, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Syringe className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {med.patientName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {med.medication} • {med.dosage}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="text-xs text-gray-500">
                        {med.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No medications scheduled</p>
            )}
          </div>
        </div>

                 {/* Vitals Monitoring */}
         <div className="bg-white rounded-lg shadow-sm border border-gray-200">
           <div className="p-6 border-b border-gray-200 flex justify-between items-center">
             <h3 className="text-lg font-medium text-gray-900">Vitals Monitoring</h3>
             <button 
               onClick={fetchVitalsHistory}
               className="text-sm text-blue-600 hover:text-blue-800 font-medium"
             >
               View All Vitals
             </button>
      </div>
          <div className="p-6">
            {stats?.vitalsMonitoring?.length > 0 ? (
              <div className="space-y-4">
                {stats.vitalsMonitoring.map((vital, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        vital.status === 'Critical' ? 'bg-red-100' : 
                        vital.status === 'Warning' ? 'bg-yellow-100' : 'bg-green-100'
                      }`}>
                        <Thermometer className={`h-4 w-4 ${
                          vital.status === 'Critical' ? 'text-red-600' : 
                          vital.status === 'Warning' ? 'text-yellow-600' : 'text-green-600'
                        }`} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {vital.patientName}
                      </p>
                                             <p className="text-sm text-gray-500">
                         BP: {typeof vital.bloodPressure === 'object' 
                           ? `${vital.bloodPressure.systolic}/${vital.bloodPressure.diastolic}`
                           : vital.bloodPressure
                         } • HR: {vital.heartRate} • Temp: {vital.temperature}°C
                       </p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        vital.status === 'Critical' ? 'bg-red-100 text-red-800' :
                        vital.status === 'Warning' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {vital.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No vitals recorded yet</p>
            )}
          </div>
        </div>

                 {/* Lab Results Pending */}
         <div className="bg-white rounded-lg shadow-sm border border-gray-200">
           <div className="p-6 border-b border-gray-200">
             <h3 className="text-lg font-medium text-gray-900">Lab Results Pending</h3>
           </div>
           <div className="p-6">
             <p className="text-gray-500 text-center py-4">Click "View All Notes" to see patient notes</p>
           </div>
         </div>

         {/* Patient Notes */}
         <div className="bg-white rounded-lg shadow-sm border border-gray-200">
           <div className="p-6 border-b border-gray-200 flex justify-between items-center">
             <h3 className="text-lg font-medium text-gray-900">Patient Notes</h3>
             <button 
               onClick={fetchPatientNotes}
               className="text-sm text-blue-600 hover:text-blue-800 font-medium"
             >
               View All Notes
             </button>
           </div>
          <div className="p-6">
            {stats?.labResults?.length > 0 ? (
              <div className="space-y-4">
                {stats.labResults.map((lab, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <FileText className="h-4 w-4 text-purple-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {lab.patientName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {lab.testType} • Ordered: {lab.orderedDate}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="text-xs text-gray-500">
                        {lab.expectedTime}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No pending lab results</p>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Shift Handover Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Shift Handover Summary</h3>
          <button
            onClick={() => navigate('/nurse-dashboard/shift-handover')}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View Details
          </button>
        </div>
        <div className="p-6">
          {currentHandover ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h4 className="font-medium text-gray-900">Today's {currentHandover.shift} Shift</h4>
                  <p className="text-sm text-gray-500">
                    From: {currentHandover.handoverFrom?.firstName} {currentHandover.handoverFrom?.lastName} 
                    To: {currentHandover.handoverTo}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded text-sm ${
                  currentHandover.isCompleted 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {currentHandover.isCompleted ? 'Completed' : 'In Progress'}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{currentHandover.patientsUnderCare}</div>
                  <div className="text-sm text-gray-600">Patients Under Care</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{currentHandover.medicationsDue.length}</div>
                  <div className="text-sm text-gray-600">Medications Due</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{currentHandover.emergencyAlerts.length}</div>
                  <div className="text-sm text-gray-600">Emergency Alerts</div>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Key Notes for Next Shift:</h4>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-700">
                    {currentHandover.keyNotes || 'No special notes for handover. All patients stable.'}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats?.overview?.patientsUnderCare || 0}</div>
                  <div className="text-sm text-gray-600">Patients Under Care</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{stats?.overview?.medicationsDue || 0}</div>
                  <div className="text-sm text-gray-600">Medications Due</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{stats?.overview?.emergencyAlerts || 0}</div>
                  <div className="text-sm text-gray-600">Emergency Alerts</div>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Key Notes for Next Shift:</h4>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">
                    No handover created yet. Click "View Details" to create a shift handover.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add Note Modal */}
      {showAddNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Patient Note</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Patient</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={selectedPatient?._id || ''}
                  onChange={(e) => {
                    const patient = stats?.patients?.find(p => p._id === e.target.value);
                    setSelectedPatient(patient);
                  }}
                >
                  <option value="">Select a patient</option>
                  {stats?.patients?.map(patient => (
                    <option key={patient._id} value={patient._id}>
                      {patient.firstName} {patient.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Note</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows="4"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Enter nursing note..."
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowAddNote(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddNote}
                  className="flex-1 px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700"
                >
                  Add Note
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Vitals Modal */}
      {showAddVitals && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Record Vitals</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Patient</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={selectedPatient?._id || ''}
                  onChange={(e) => {
                    const patient = stats?.patients?.find(p => p._id === e.target.value);
                    setSelectedPatient(patient);
                  }}
                >
                  <option value="">Select a patient</option>
                  {stats?.patients?.map(patient => (
                    <option key={patient._id} value={patient._id}>
                      {patient.firstName} {patient.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Blood Pressure (mmHg)</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={vitalsData.bloodPressure}
                  onChange={(e) => setVitalsData({ ...vitalsData, bloodPressure: e.target.value })}
                  placeholder="e.g., 120/80"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Heart Rate (BPM)</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={vitalsData.heartRate}
                  onChange={(e) => setVitalsData({ ...vitalsData, heartRate: e.target.value })}
                  placeholder="e.g., 70"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Temperature (°C)</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={vitalsData.temperature}
                  onChange={(e) => setVitalsData({ ...vitalsData, temperature: e.target.value })}
                  placeholder="e.g., 36.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Respiratory Rate (BPM)</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={vitalsData.respiratoryRate}
                  onChange={(e) => setVitalsData({ ...vitalsData, respiratoryRate: e.target.value })}
                  placeholder="e.g., 18"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Oxygen Saturation (%)</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={vitalsData.oxygenSaturation}
                  onChange={(e) => setVitalsData({ ...vitalsData, oxygenSaturation: e.target.value })}
                  placeholder="e.g., 98"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows="3"
                  value={vitalsData.notes}
                  onChange={(e) => setVitalsData({ ...vitalsData, notes: e.target.value })}
                  placeholder="Additional notes for the vitals..."
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowAddVitals(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddVitals}
                  className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Record Vitals
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Care Task Modal */}
      {showAddCareTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create Care Task</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Patient</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={selectedPatient?._id || ''}
                  onChange={(e) => {
                    const patient = stats?.patients?.find(p => p._id === e.target.value);
                    setSelectedPatient(patient);
                  }}
                >
                  <option value="">Select a patient</option>
                  {stats?.patients?.map(patient => (
                    <option key={patient._id} value={patient._id}>
                      {patient.firstName} {patient.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Task</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={careTaskData.task}
                  onChange={(e) => setCareTaskData({ ...careTaskData, task: e.target.value })}
                  placeholder="e.g., Medication Check"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows="2"
                  value={careTaskData.description}
                  onChange={(e) => setCareTaskData({ ...careTaskData, description: e.target.value })}
                  placeholder="Detailed description of the task..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={careTaskData.priority}
                  onChange={(e) => setCareTaskData({ ...careTaskData, priority: e.target.value })}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={careTaskData.dueDate}
                  onChange={(e) => setCareTaskData({ ...careTaskData, dueDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Room</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={careTaskData.room}
                  onChange={(e) => setCareTaskData({ ...careTaskData, room: e.target.value })}
                  placeholder="e.g., Room 101"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={careTaskData.category}
                  onChange={(e) => setCareTaskData({ ...careTaskData, category: e.target.value })}
                >
                  <option value="General">General</option>
                  <option value="Medication">Medication</option>
                  <option value="Observation">Observation</option>
                  <option value="Procedure">Procedure</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows="2"
                  value={careTaskData.notes}
                  onChange={(e) => setCareTaskData({ ...careTaskData, notes: e.target.value })}
                  placeholder="Additional notes for the care task..."
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowAddCareTask(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCareTask}
                  className="flex-1 px-4 py-2 text-white bg-purple-600 rounded-md hover:bg-purple-700"
                >
                  Create Task
                </button>
              </div>
            </div>
          </div>
                 </div>
       )}

       {/* Vitals History Modal */}
       {showVitalsHistory && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-medium text-gray-900">Vitals History</h3>
               <button 
                 onClick={() => setShowVitalsHistory(false)}
                 className="text-gray-400 hover:text-gray-600"
               >
                 <X className="h-6 w-6" />
               </button>
             </div>
             <div className="space-y-4">
               {vitalsHistory.length > 0 ? (
                 vitalsHistory.map((vital, index) => (
                   <div key={index} className="border border-gray-200 rounded-lg p-4">
                     <div className="flex justify-between items-start mb-2">
                       <div>
                         <h4 className="font-medium text-gray-900">
                           {vital.patient?.firstName} {vital.patient?.lastName}
                         </h4>
                         <p className="text-sm text-gray-500">
                           Recorded by: {vital.recordedBy?.firstName} {vital.recordedBy?.lastName}
                         </p>
                       </div>
                       <div className="text-right">
                         <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                           vital.status === 'Critical' ? 'bg-red-100 text-red-800' :
                           vital.status === 'Warning' ? 'bg-yellow-100 text-yellow-800' :
                           'bg-green-100 text-green-800'
                         }`}>
                           {vital.status}
                         </span>
                         <p className="text-xs text-gray-500 mt-1">
                           {new Date(vital.recordedAt).toLocaleString()}
                         </p>
                       </div>
                     </div>
                                           <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">BP:</span>
                          <span className="ml-1 font-medium">
                            {typeof vital.bloodPressure === 'object' 
                              ? `${vital.bloodPressure.systolic}/${vital.bloodPressure.diastolic}`
                              : vital.bloodPressure
                            }
                          </span>
                        </div>
                       <div>
                         <span className="text-gray-500">HR:</span>
                         <span className="ml-1 font-medium">{vital.heartRate} BPM</span>
                       </div>
                       <div>
                         <span className="text-gray-500">Temp:</span>
                         <span className="ml-1 font-medium">{vital.temperature}°C</span>
                       </div>
                       <div>
                         <span className="text-gray-500">RR:</span>
                         <span className="ml-1 font-medium">{vital.respiratoryRate} BPM</span>
                       </div>
                       <div>
                         <span className="text-gray-500">O2:</span>
                         <span className="ml-1 font-medium">{vital.oxygenSaturation}%</span>
                       </div>
                     </div>
                     {vital.notes && (
                       <div className="mt-2 text-sm text-gray-600">
                         <span className="font-medium">Notes:</span> {vital.notes}
                       </div>
                     )}
                   </div>
                 ))
               ) : (
                 <p className="text-gray-500 text-center py-8">No vitals recorded yet</p>
               )}
             </div>
           </div>
         </div>
       )}

       {/* Care Tasks List Modal */}
       {showCareTasksList && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-medium text-gray-900">Care Tasks</h3>
               <button 
                 onClick={() => setShowCareTasksList(false)}
                 className="text-gray-400 hover:text-gray-600"
               >
                 <X className="h-6 w-6" />
               </button>
             </div>
             <div className="space-y-4">
               {careTasksList.length > 0 ? (
                 careTasksList.map((task, index) => (
                   <div key={index} className="border border-gray-200 rounded-lg p-4">
                     <div className="flex justify-between items-start mb-2">
                       <div>
                         <h4 className="font-medium text-gray-900">{task.task}</h4>
                         <p className="text-sm text-gray-500">
                           Patient: {task.patient?.firstName} {task.patient?.lastName}
                         </p>
                         <p className="text-sm text-gray-500">
                           Assigned to: {task.assignedTo?.firstName} {task.assignedTo?.lastName}
                         </p>
                       </div>
                       <div className="text-right">
                         <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
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
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-2">
                       <div>
                         <span className="text-gray-500">Category:</span>
                         <span className="ml-1 font-medium">{task.category}</span>
                       </div>
                       <div>
                         <span className="text-gray-500">Room:</span>
                         <span className="ml-1 font-medium">{task.room}</span>
                       </div>
                       <div>
                         <span className="text-gray-500">Due:</span>
                         <span className="ml-1 font-medium">
                           {new Date(task.dueDate).toLocaleDateString()}
                         </span>
                       </div>
                       <div>
                         <span className="text-gray-500">Status:</span>
                         <span className="ml-1 font-medium">{task.status}</span>
                       </div>
                     </div>
                     {task.description && (
                       <div className="text-sm text-gray-600 mb-2">
                         <span className="font-medium">Description:</span> {task.description}
                       </div>
                     )}
                     {task.notes && (
                       <div className="text-sm text-gray-600">
                         <span className="font-medium">Notes:</span> {task.notes}
                       </div>
                     )}
                   </div>
                 ))
               ) : (
                 <p className="text-gray-500 text-center py-8">No care tasks found</p>
               )}
             </div>
           </div>
         </div>
       )}

       {/* Patient Notes Modal */}
       {showPatientNotes && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-medium text-gray-900">Patient Notes</h3>
               <button 
                 onClick={() => setShowPatientNotes(false)}
                 className="text-gray-400 hover:text-gray-600"
               >
                 <X className="h-6 w-6" />
               </button>
             </div>
             <div className="space-y-4">
               {patientNotes.length > 0 ? (
                 patientNotes.map((note, index) => (
                   <div key={index} className="border border-gray-200 rounded-lg p-4">
                     <div className="flex justify-between items-start mb-2">
                       <div>
                         <h4 className="font-medium text-gray-900">
                           {note.patient?.firstName} {note.patient?.lastName}
                         </h4>
                         <p className="text-sm text-gray-500">
                           Created by: {note.createdBy?.firstName} {note.createdBy?.lastName}
                         </p>
                       </div>
                       <div className="text-right">
                         <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                           note.type === 'nursing_note' ? 'bg-blue-100 text-blue-800' :
                           note.type === 'doctor_note' ? 'bg-green-100 text-green-800' :
                           note.type === 'shift_handover' ? 'bg-purple-100 text-purple-800' :
                           'bg-gray-100 text-gray-800'
                         }`}>
                           {note.type.replace('_', ' ').toUpperCase()}
                         </span>
                         <p className="text-xs text-gray-500 mt-1">
                           {new Date(note.createdAt).toLocaleString()}
                         </p>
                       </div>
                     </div>
                     <div className="text-sm text-gray-700 mb-2">
                       {note.note}
                     </div>
                     {note.tags && note.tags.length > 0 && (
                       <div className="flex flex-wrap gap-1">
                         {note.tags.map((tag, tagIndex) => (
                           <span key={tagIndex} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                             {tag}
                           </span>
                         ))}
                       </div>
                     )}
                   </div>
                 ))
               ) : (
                 <p className="text-gray-500 text-center py-8">No patient notes found</p>
               )}
        </div>
      </div>
         </div>
       )}

       {/* Shift Handover Modal */}
       {showShiftHandover && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-medium text-gray-900">Create Shift Handover</h3>
               <button 
                 onClick={() => setShowShiftHandover(false)}
                 className="text-gray-400 hover:text-gray-600"
               >
                 <X className="h-6 w-6" />
               </button>
             </div>
             <div className="space-y-6">
               {/* Basic Information */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
                   <select
                     value={shiftHandoverData.shift}
                     onChange={(e) => setShiftHandoverData({...shiftHandoverData, shift: e.target.value})}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                   >
                     <option value="Morning">Morning</option>
                     <option value="Afternoon">Afternoon</option>
                     <option value="Night">Night</option>
                   </select>
                 </div>
                                    <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Handover To</label>
                     <select
                       value={shiftHandoverData.handoverTo}
                       onChange={(e) => setShiftHandoverData({...shiftHandoverData, handoverTo: e.target.value})}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                       disabled={loadingNurses}
                     >
                       <option value="">
                         {loadingNurses ? 'Loading nurses...' : 'Select a nurse'}
                       </option>
                       {!loadingNurses && availableNurses.length > 0 ? (
                         availableNurses.map((nurse) => (
                           <option key={nurse._id} value={`${nurse.firstName} ${nurse.lastName}`}>
                             {nurse.firstName} {nurse.lastName}
                           </option>
                         ))
                       ) : !loadingNurses ? (
                         <option value="" disabled>No nurses available</option>
                       ) : null}
                     </select>
                     {availableNurses.length === 0 && (
                       <p className="text-sm text-red-600 mt-1">No other nurses found in the system</p>
                     )}
                   </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Patients Under Care</label>
                   <input
                     type="number"
                     value={shiftHandoverData.patientsUnderCare}
                     onChange={(e) => setShiftHandoverData({...shiftHandoverData, patientsUnderCare: parseInt(e.target.value) || 0})}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                   />
                 </div>
               </div>

               {/* Critical Patients Section */}
               <div className="border border-gray-200 rounded-lg p-4">
                 <h4 className="text-sm font-medium text-gray-900 mb-3">Critical Patients</h4>
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                   <div>
                     <select
                       value={selectedCriticalPatients.patientId}
                       onChange={(e) => setSelectedCriticalPatients({...selectedCriticalPatients, patientId: e.target.value})}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                     >
                       <option value="">Select Patient</option>
                       {availablePatients.map((patient) => (
                         <option key={patient._id} value={patient._id}>
                           {patient.firstName} {patient.lastName}
                         </option>
                       ))}
                     </select>
                   </div>
                   <div>
                     <input
                       type="text"
                       value={selectedCriticalPatients.condition}
                       onChange={(e) => setSelectedCriticalPatients({...selectedCriticalPatients, condition: e.target.value})}
                       placeholder="Condition"
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                     />
                   </div>
                   <div>
                     <input
                       type="text"
                       value={selectedCriticalPatients.specialInstructions}
                       onChange={(e) => setSelectedCriticalPatients({...selectedCriticalPatients, specialInstructions: e.target.value})}
                       placeholder="Special Instructions"
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                     />
                   </div>
                   <div>
                     <button
                       onClick={addCriticalPatient}
                       className="w-full px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                     >
                       Add Critical Patient
                     </button>
                   </div>
                 </div>
                 {shiftHandoverData.criticalPatients.length > 0 && (
                   <div className="space-y-2">
                     {shiftHandoverData.criticalPatients.map((patient, index) => (
                       <div key={index} className="flex items-center justify-between bg-red-50 p-3 rounded border-l-4 border-red-500">
                         <div>
                           <div className="font-medium text-red-900">{patient.patientName}</div>
                           <div className="text-sm text-red-700">{patient.condition}</div>
                           {patient.specialInstructions && (
                             <div className="text-sm text-red-600">{patient.specialInstructions}</div>
                           )}
                         </div>
                         <button
                           onClick={() => removeCriticalPatient(index)}
                           className="text-red-600 hover:text-red-800"
                         >
                           <X className="h-4 w-4" />
                         </button>
                       </div>
                     ))}
                   </div>
                 )}
               </div>

               {/* Medications Due Section */}
               <div className="border border-gray-200 rounded-lg p-4">
                 <h4 className="text-sm font-medium text-gray-900 mb-3">Medications Due</h4>
                 <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3">
                   <div>
                     <select
                       value={selectedMedications.patientId}
                       onChange={(e) => setSelectedMedications({...selectedMedications, patientId: e.target.value})}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                     >
                       <option value="">Select Patient</option>
                       {availablePatients.map((patient) => (
                         <option key={patient._id} value={patient._id}>
                           {patient.firstName} {patient.lastName}
                         </option>
                       ))}
                     </select>
                   </div>
                   <div>
                     <input
                       type="text"
                       value={selectedMedications.medication}
                       onChange={(e) => setSelectedMedications({...selectedMedications, medication: e.target.value})}
                       placeholder="Medication"
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                     />
                   </div>
                   <div>
                     <input
                       type="text"
                       value={selectedMedications.dosage}
                       onChange={(e) => setSelectedMedications({...selectedMedications, dosage: e.target.value})}
                       placeholder="Dosage"
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                     />
                   </div>
                   <div>
                     <input
                       type="text"
                       value={selectedMedications.time}
                       onChange={(e) => setSelectedMedications({...selectedMedications, time: e.target.value})}
                       placeholder="Time (e.g., 8:00 AM)"
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                     />
                   </div>
                   <div>
                     <button
                       onClick={addMedication}
                       className="w-full px-3 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                     >
                       Add Medication
                     </button>
                   </div>
                 </div>
                 {shiftHandoverData.medicationsDue.length > 0 && (
                   <div className="space-y-2">
                     {shiftHandoverData.medicationsDue.map((med, index) => (
                       <div key={index} className="flex items-center justify-between bg-yellow-50 p-3 rounded border-l-4 border-yellow-500">
                         <div>
                           <div className="font-medium text-yellow-900">{med.patientName}</div>
                           <div className="text-sm text-yellow-700">{med.medication} - {med.dosage}</div>
                           <div className="text-sm text-yellow-600">Due: {med.time}</div>
                         </div>
                         <button
                           onClick={() => removeMedication(index)}
                           className="text-yellow-600 hover:text-yellow-800"
                         >
                           <X className="h-4 w-4" />
                         </button>
                       </div>
                     ))}
                   </div>
                 )}
               </div>

               {/* Key Notes */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Key Notes for Next Shift</label>
                 <textarea
                   value={shiftHandoverData.keyNotes}
                   onChange={(e) => setShiftHandoverData({...shiftHandoverData, keyNotes: e.target.value})}
                   placeholder="Enter important information for the next shift..."
                   rows={4}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                 />
               </div>

               {/* Action Buttons */}
               <div className="flex justify-end space-x-2">
                 <button
                   onClick={() => setShowShiftHandover(false)}
                   className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                 >
                   Cancel
                 </button>
                 <button
                   onClick={handleCreateHandover}
                   className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                 >
                   Create Handover
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}

       {/* Shift Handover History Modal */}
       {showHandoverHistory && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-medium text-gray-900">Shift Handover History</h3>
               <button 
                 onClick={() => setShowHandoverHistory(false)}
                 className="text-gray-400 hover:text-gray-600"
               >
                 <X className="h-6 w-6" />
               </button>
             </div>
             <div className="space-y-4">
               {handoverHistory.length > 0 ? (
                 handoverHistory.map((handover, index) => (
                   <div key={index} className="border border-gray-200 rounded-lg p-4">
                     <div className="flex justify-between items-start mb-3">
                       <div>
                         <h4 className="font-medium text-gray-900">
                           {handover.shift} Shift - {new Date(handover.date).toLocaleDateString()}
                         </h4>
                         <p className="text-sm text-gray-500">
                           From: {handover.handoverFrom?.firstName} {handover.handoverFrom?.lastName} 
                           To: {handover.handoverTo}
                         </p>
                       </div>
                       <div className="text-right">
                         <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                           handover.isCompleted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                         }`}>
                           {handover.isCompleted ? 'Completed' : 'In Progress'}
                         </span>
                         <p className="text-xs text-gray-500 mt-1">
                           {new Date(handover.createdAt).toLocaleString()}
                         </p>
                       </div>
                     </div>
                     <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                       <div>
                         <span className="text-gray-500">Patients:</span>
                         <span className="ml-1 font-medium">{handover.patientsUnderCare}</span>
                       </div>
                       <div>
                         <span className="text-gray-500">Medications:</span>
                         <span className="ml-1 font-medium">{handover.medicationsDue.length}</span>
                       </div>
                       <div>
                         <span className="text-gray-500">Alerts:</span>
                         <span className="ml-1 font-medium">{handover.emergencyAlerts.length}</span>
                       </div>
                     </div>
                     <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                       <span className="font-medium">Key Notes:</span> {handover.keyNotes}
                     </div>
                   </div>
                 ))
               ) : (
                 <p className="text-gray-500 text-center py-8">No handover history found</p>
               )}
             </div>
           </div>
         </div>
       )}
    </div>
  );
};

export default NurseDashboard; 