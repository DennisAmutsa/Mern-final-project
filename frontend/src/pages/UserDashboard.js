import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  AlertTriangle, 
  TrendingUp, 
  Activity,
  Clock,
  Heart,
  User,
  FileText,
  Settings,
  Bell,
  CheckCircle,
  XCircle,
  Info,
  Stethoscope,
  Pill,
  FileText as MedicalFile,
  Phone,
  MapPin,
  Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../config/axios';
import toast from 'react-hot-toast';

const UserDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [patientData, setPatientData] = useState(null);
  const [editingHealth, setEditingHealth] = useState(false);
  const navigate = useNavigate();
  const { user, loading: authLoading, isAuthenticated, updateProfile } = useAuth();
  const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const [healthForm, setHealthForm] = useState({
    firstName: patientData?.firstName || '',
    lastName: patientData?.lastName || '',
    email: patientData?.contactInfo?.email || user?.email || '',
    phone: patientData?.contactInfo?.phone || '',
    bloodType: patientData?.bloodType || BLOOD_TYPES[0],
    emergencyContactName: patientData?.emergencyContact?.name || '',
    emergencyContactRelationship: patientData?.emergencyContact?.relationship || '',
    emergencyContactPhone: patientData?.emergencyContact?.phone || '',
  });

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      // Small delay to ensure authentication is fully established
      const timer = setTimeout(() => {
        fetchPatientData();
    fetchPatientStats();
    fetchRecentActivities();
    fetchNotifications();
    fetchUpcomingAppointments();
    fetchMedicalRecords();
    fetchPrescriptions();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [authLoading, isAuthenticated, user]);

  // Update healthForm when patientData changes
  useEffect(() => {
    setHealthForm({
      firstName: patientData?.firstName || '',
      lastName: patientData?.lastName || '',
      email: patientData?.contactInfo?.email || user?.email || '',
      phone: patientData?.contactInfo?.phone || '',
      bloodType: patientData?.bloodType || BLOOD_TYPES[0],
      emergencyContactName: patientData?.emergencyContact?.name || '',
      emergencyContactRelationship: patientData?.emergencyContact?.relationship || '',
      emergencyContactPhone: patientData?.emergencyContact?.phone || '',
    });
  }, [patientData, user]);

  const fetchPatientData = async () => {
    try {
      const response = await apiClient.get('/api/auth/profile');
      const userData = response.data?.user;
      
      if (!userData) {
        console.error('No user data received from profile endpoint');
        setPatientData(null);
        return;
      }
      
      const patientData = {
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        phone: userData.contactInfo?.phone || '',
        bloodType: userData.bloodType || '',
        emergencyContact: userData.emergencyContact || {},
        insurance: userData.insurance || {}
      };
      
      setPatientData(patientData);
    } catch (error) {
      console.error('Error fetching patient data:', error);
      setPatientData(null);
    }
  };

  const fetchPatientStats = async () => {
    try {
      const response = await apiClient.get('/api/stats/user-dashboard');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching patient stats:', error);
      setStats({
        overview: {
          totalAppointments: 0,
          upcomingAppointments: 0,
          completedAppointments: 0,
          pendingTasks: 0
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const response = await apiClient.get('/api/audit-logs/user');
      setRecentActivities(Array.isArray(response.data) ? response.data.slice(0, 5) : []);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      setRecentActivities([]);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await apiClient.get('/api/audit-logs/notifications/user');
      setNotifications(Array.isArray(response.data) ? response.data.slice(0, 3) : []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    }
  };

  const fetchUpcomingAppointments = async () => {
    try {
      const response = await apiClient.get(`/api/appointments/patient?email=${user?.email}`);
      setUpcomingAppointments(Array.isArray(response.data) ? response.data.slice(0, 3) : []);
    } catch (error) {
      console.error('Error fetching upcoming appointments:', error);
      setUpcomingAppointments([]);
    }
  };

  const fetchMedicalRecords = async () => {
    try {
      // Get medical records from user's medical history
      const response = await apiClient.get('/api/auth/profile');
      const userData = response.data?.user;
      
      if (!userData) {
        console.error('No user data received for medical records');
        setMedicalRecords([]);
        return;
      }
      
      if (userData.medicalHistory && userData.medicalHistory.length > 0) {
        // Convert medical history to the format expected by the UI
        const records = userData.medicalHistory
          .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort by date, newest first
          .slice(0, 3) // Get only the 3 most recent
          .map((record, index) => ({
            id: index + 1,
            type: record.type || 'Medical Record',
            date: new Date(record.date).toLocaleDateString(),
            doctor: record.doctor || 'Dr. Smith',
            condition: record.condition || '',
            diagnosis: record.diagnosis || '',
            treatment: record.treatment || '',
            notes: record.notes || ''
          }));
        
        setMedicalRecords(records);
      } else {
        setMedicalRecords([]);
      }
    } catch (error) {
      console.error('Error fetching medical records:', error);
      setMedicalRecords([]);
    }
  };

  const fetchPrescriptions = async () => {
    try {
      // Get prescriptions from user's own profile data
      const response = await apiClient.get('/api/auth/profile');
      const userData = response.data?.user;
      
      if (!userData) {
        console.error('No user data received for prescriptions');
        setPrescriptions([]);
        return;
      }
      
      if (userData.currentMedications && userData.currentMedications.length > 0) {
        // Filter for active prescriptions and take the first 3
        const activePrescriptions = userData.currentMedications
          .filter(med => med.status === 'Active')
          .slice(0, 3)
          .map(prescription => ({
            id: prescription._id || Math.random(),
            name: prescription.name,
            dosage: prescription.dosage,
            frequency: prescription.frequency,
            prescribedBy: prescription.prescribedBy,
            prescribedDate: prescription.prescribedDate,
            endDate: prescription.endDate,
            status: prescription.status,
            notes: prescription.notes
          }));
        
        setPrescriptions(activePrescriptions);
      } else {
        setPrescriptions([]);
      }
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      setPrescriptions([]);
    }
  };

  const statCards = [
    {
      title: 'Total Appointments',
      value: stats?.overview?.totalAppointments || 0,
      icon: Calendar,
      color: 'bg-blue-500',
      change: stats?.overview?.appointmentChange || '0',
      changeType: stats?.overview?.appointmentChange?.startsWith('+') ? 'positive' : 'negative'
    },
    {
      title: 'Upcoming',
      value: stats?.overview?.upcomingAppointments || 0,
      icon: Clock,
      color: 'bg-yellow-500',
      change: stats?.overview?.upcomingChange || '0',
      changeType: stats?.overview?.upcomingChange?.startsWith('+') ? 'positive' : 'negative'
    },
    {
      title: 'Completed',
      value: stats?.overview?.completedAppointments || 0,
      icon: CheckCircle,
      color: 'bg-green-500',
      change: stats?.overview?.completedChange || '0',
      changeType: stats?.overview?.completedChange?.startsWith('+') ? 'positive' : 'negative'
    },
    {
      title: 'Active Prescriptions',
      value: prescriptions.length,
      icon: Pill,
      color: 'bg-purple-500',
      change: stats?.overview?.prescriptionChange || '0',
      changeType: stats?.overview?.prescriptionChange?.startsWith('+') ? 'positive' : 'negative'
    }
  ];

  const handleHealthSave = async () => {
    // Validate required fields
    if (!healthForm.firstName || !healthForm.lastName || !healthForm.email || !healthForm.phone || !healthForm.bloodType) {
      toast.error('Please fill in all required fields.');
      return;
    }
    if (!BLOOD_TYPES.includes(healthForm.bloodType)) {
      toast.error('Please select a valid blood type.');
      return;
    }
    try {
      // Update user profile with all health info
      const response = await apiClient.put('/api/auth/profile', {
        firstName: healthForm.firstName,
        lastName: healthForm.lastName,
        email: healthForm.email,
        contactInfo: { phone: healthForm.phone },
        bloodType: healthForm.bloodType,
        emergencyContact: {
          name: healthForm.emergencyContactName,
          relationship: healthForm.emergencyContactRelationship,
          phone: healthForm.emergencyContactPhone
        }
      });
      
      // Update AuthContext with new user data
      if (response.data.user) {
        // Update the user state in AuthContext
        const { user: updatedUser } = response.data;
        // Trigger a re-fetch of user data in AuthContext
        window.location.reload(); // Simple solution to refresh all data
      }
      
      toast.success('Profile updated successfully!');
      setEditingHealth(false);
      fetchPatientData();
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <div>Please log in to view your dashboard.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patient Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.firstName}! Here's your health overview</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Heart className="h-4 w-4" />
          <span>Patient Portal</span>
          <span>•</span>
          <span>{new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* SDG 3 Banner */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
        <div className="flex items-center space-x-3">
          <Heart className="h-8 w-8" />
          <div>
            <h2 className="text-xl font-bold">Good Health and Well-being</h2>
            <p className="text-green-100">Your health journey matters - access quality healthcare services</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
              <span className="ml-2 text-sm text-gray-500">from last month</span>
            </div>
          </div>
        ))}
      </div>

      {/* Patient Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            onClick={() => navigate('/user-dashboard/appointments')}
          >
            <Calendar className="h-6 w-6 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Book Appointment</span>
          </button>
          <button 
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            onClick={() => navigate('/user-dashboard/profile')}
          >
            <User className="h-6 w-6 text-green-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">My Profile</span>
          </button>
          <button 
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            onClick={() => navigate('/user-dashboard/medical-records')}
          >
            <MedicalFile className="h-6 w-6 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Medical Records</span>
          </button>
          <button 
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            onClick={() => navigate('/user-dashboard/prescriptions')}
          >
            <Pill className="h-6 w-6 text-red-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Prescriptions</span>
          </button>
        </div>
      </div>

      {/* Upcoming Appointments and Medical Records */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Upcoming Appointments</h3>
          </div>
          <div className="p-6">
            {upcomingAppointments.length > 0 ? (
              <div className="space-y-4">
                {upcomingAppointments.map((appointment, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Calendar className="h-4 w-4 text-blue-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            Dr. {appointment.doctor?.firstName} {appointment.doctor?.lastName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {appointment.doctor?.department || 'General Medicine'}
                          </p>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          appointment.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                          appointment.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          appointment.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {appointment.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 font-medium">Date & Time</p>
                        <p className="text-gray-900">
                          {new Date(appointment.appointmentDate).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                        <p className="text-gray-700 font-medium">{appointment.appointmentTime}</p>
                      </div>
                      
                      <div>
                        <p className="text-gray-600 font-medium">Reason</p>
                        <p className="text-gray-900">{appointment.reason || 'General consultation'}</p>
                      </div>
                    </div>
                    
                    {appointment.notes && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-gray-600 font-medium text-sm">Notes</p>
                        <p className="text-gray-900 text-sm">{appointment.notes}</p>
                      </div>
                    )}
                    
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>Appointment ID: {appointment._id?.slice(-8)}</span>
                        {appointment.createdAt && (
                          <span>Booked: {new Date(appointment.createdAt).toLocaleDateString()}</span>
                        )}
                      </div>
                      <button 
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        onClick={() => navigate(`/user-dashboard/appointments/${appointment._id}`)}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No upcoming appointments</p>
            )}
          </div>
        </div>

        {/* Recent Medical Records */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Medical Records</h3>
          </div>
          <div className="p-6">
            {medicalRecords.length > 0 ? (
              <div className="space-y-4">
                {medicalRecords.map((record, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <MedicalFile className="h-4 w-4 text-purple-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {record.type}
                      </p>
                      <p className="text-sm text-gray-500">
                        {record.date} • {record.doctor}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No recent medical records</p>
            )}
          </div>
        </div>
      </div>

      {/* Active Prescriptions and Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Prescriptions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Active Prescriptions</h3>
          </div>
          <div className="p-6">
            {prescriptions.length > 0 ? (
              <div className="space-y-4">
                {prescriptions.map((prescription, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <Pill className="h-4 w-4 text-red-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {prescription.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {prescription.dosage} • {prescription.frequency}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="text-xs text-gray-500">
                        {prescription.endDate ? new Date(prescription.endDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No active prescriptions</p>
            )}
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
          </div>
          <div className="p-6">
            {notifications.length > 0 ? (
              <div className="space-y-4">
                {notifications.map((notification, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        notification.type === 'success' ? 'bg-green-100' :
                        notification.type === 'warning' ? 'bg-yellow-100' :
                        notification.type === 'error' ? 'bg-red-100' : 'bg-blue-100'
                      }`}>
                        {notification.type === 'success' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : notification.type === 'warning' ? (
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        ) : notification.type === 'error' ? (
                          <XCircle className="h-4 w-4 text-red-600" />
                        ) : (
                          <Info className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        {notification.message}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="text-xs text-gray-500">
                        {new Date(notification.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No notifications</p>
            )}
          </div>
        </div>
      </div>

      {/* Patient Information Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Your Health Information</h3>
          {!editingHealth && (
            <button
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={() => setEditingHealth(true)}
            >
              Edit
            </button>
          )}
        </div>
        {editingHealth ? (
          <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">First Name</label>
              <input
                className="mt-1 block w-full border rounded px-2 py-1"
                value={healthForm.firstName}
                onChange={e => setHealthForm(f => ({ ...f, firstName: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">Last Name</label>
              <input
                className="mt-1 block w-full border rounded px-2 py-1"
                value={healthForm.lastName}
                onChange={e => setHealthForm(f => ({ ...f, lastName: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">Email</label>
              <input
                className="mt-1 block w-full border rounded px-2 py-1"
                value={healthForm.email}
                onChange={e => setHealthForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">Patient ID</label>
              <input
                className="mt-1 block w-full border rounded px-2 py-1 bg-gray-100"
                value={patientData?.patientId || user?.username}
                readOnly
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">Phone</label>
              <input
                className="mt-1 block w-full border rounded px-2 py-1"
                value={healthForm.phone}
                onChange={e => setHealthForm(f => ({ ...f, phone: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">Blood Type</label>
              <select
                className="mt-1 block w-full border rounded px-2 py-1"
                value={healthForm.bloodType}
                onChange={e => setHealthForm(f => ({ ...f, bloodType: e.target.value }))}
                required
              >
                {BLOOD_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600">Emergency Contact Name</label>
              <input
                className="mt-1 block w-full border rounded px-2 py-1"
                value={healthForm.emergencyContactName}
                onChange={e => setHealthForm(f => ({ ...f, emergencyContactName: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">Emergency Contact Relationship</label>
              <input
                className="mt-1 block w-full border rounded px-2 py-1"
                value={healthForm.emergencyContactRelationship}
                onChange={e => setHealthForm(f => ({ ...f, emergencyContactRelationship: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">Emergency Contact Phone</label>
              <input
                className="mt-1 block w-full border rounded px-2 py-1"
                value={healthForm.emergencyContactPhone}
                onChange={e => setHealthForm(f => ({ ...f, emergencyContactPhone: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">Account Status</label>
              <input
                className="mt-1 block w-full border rounded px-2 py-1 bg-gray-100"
                value={patientData?.status || 'Active'}
                readOnly
              />
            </div>
            <div className="col-span-2 flex space-x-2 mt-2">
              <button
                type="button"
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                onClick={handleHealthSave}
              >
                Save
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                onClick={() => setEditingHealth(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Full Name</p>
            <p className="text-sm font-medium text-gray-900">{patientData?.firstName} {patientData?.lastName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Email</p>
            <p className="text-sm font-medium text-gray-900">{patientData?.contactInfo?.email || user?.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Patient ID</p>
            <p className="text-sm font-medium text-gray-900">{patientData?.patientId || user?.username}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Account Status</p>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              patientData?.status === 'Active' ? 'bg-green-100 text-green-800' :
              patientData?.status === 'Emergency' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {patientData?.status || 'Active'}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-600">Emergency Contact</p>
            <p className="text-sm font-medium text-gray-900">
              {patientData?.emergencyContact?.phone || 'Not provided'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Blood Type</p>
            <p className="text-sm font-medium text-gray-900">{patientData?.bloodType || 'Not specified'}</p>
          </div>
        </div>
        )}
      </div>

      {/* Emergency Information */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="h-6 w-6 text-red-600" />
          <div>
            <h3 className="text-lg font-medium text-red-900">Emergency Information</h3>
            <p className="text-red-700">In case of emergency, contact your healthcare provider immediately</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <Phone className="h-4 w-4 text-red-600" />
            <a
              href={`tel:${patientData?.emergencyContact?.phone || '0740968090'}`}
              className="text-sm text-red-700 underline hover:text-red-900"
            >
              Emergency: {patientData?.emergencyContact?.phone || '0740968090'}
            </a>
          </div>
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-700">
              Nearest Hospital: {patientData?.department || 'General Hospital'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-700">
              Insurance: {patientData?.insurance?.provider ? `${patientData.insurance.provider} (Active)` : 'Not specified'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard; 