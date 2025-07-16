import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  Calendar, 
  AlertTriangle, 
  TrendingUp, 
  Activity,
  Clock,
  Heart,
  Download,
  FileText,
  Wifi,
  WifiOff
} from 'lucide-react';
import axios from '../config/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { API_URL } from '../config/api';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize WebSocket connection
    const newSocket = io(API_URL);
    setSocket(newSocket);

    // Socket event handlers
    newSocket.on('connect', () => {
      console.log('🔌 Connected to WebSocket server');
      setIsConnected(true);
      newSocket.emit('join-dashboard');
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Disconnected from WebSocket server');
      setIsConnected(false);
    });

    // Real-time dashboard updates
    newSocket.on('dashboard-update', (updatedStats) => {
      console.log('📊 Received real-time dashboard update');
      setStats(updatedStats);
      toast.success('Dashboard updated in real-time!');
    });

    newSocket.on('new-emergency', (emergencyData) => {
      console.log('🚨 New emergency received:', emergencyData);
      toast.error(`New emergency: ${emergencyData.patientName} - ${emergencyData.condition}`);
      // Refresh dashboard stats
      fetchDashboardStats();
    });

    newSocket.on('new-appointment', (appointmentData) => {
      console.log('📅 New appointment received:', appointmentData);
      toast.success(`New appointment scheduled: ${appointmentData.patientName}`);
      // Refresh dashboard stats
      fetchDashboardStats();
    });

    // Cleanup on unmount
    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get('/api/stats/dashboard');
      setStats(response.data);
    } catch (error) {
      toast.error('Failed to fetch dashboard statistics');
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Export functionality
  const exportDashboardData = () => {
    if (!stats) return;
    
    const data = {
      overview: stats.overview,
      recentAppointments: stats.recent?.appointments || [],
      recentPatients: stats.recent?.patients || [],
      exportDate: new Date().toISOString(),
      generatedBy: 'Hospital Management System'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Dashboard data exported successfully!');
  };

  const exportCSV = () => {
    if (!stats) return;
    
    // Create CSV content
    let csvContent = 'data:text/csv;charset=utf-8,';
    
    // Overview stats
    csvContent += 'Category,Value\n';
    csvContent += `Total Patients,${stats.overview?.totalPatients || 0}\n`;
    csvContent += `Active Doctors,${stats.overview?.activeDoctors || 0}\n`;
    csvContent += `Today's Appointments,${stats.overview?.todayAppointments || 0}\n`;
    csvContent += `Emergency Cases,${stats.overview?.emergencyPatients || 0}\n`;
    
    // Recent appointments
    if (stats.recent?.appointments?.length > 0) {
      csvContent += '\nRecent Appointments\n';
      csvContent += 'Patient Name,Doctor,Status,Date\n';
      stats.recent.appointments.forEach(apt => {
        csvContent += `"${apt.patient?.firstName} ${apt.patient?.lastName}","Dr. ${apt.doctor?.firstName} ${apt.doctor?.lastName}",${apt.status},${apt.date || 'N/A'}\n`;
      });
    }
    
    // Recent patients
    if (stats.recent?.patients?.length > 0) {
      csvContent += '\nRecent Patients\n';
      csvContent += 'Name,Patient ID,Department,Status\n';
      stats.recent.patients.forEach(patient => {
        csvContent += `"${patient.firstName} ${patient.lastName}",${patient.patientId},${patient.department},${patient.status}\n`;
      });
    }
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `dashboard-report-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Dashboard data exported as CSV!');
  };

  const statCards = [
    {
      title: 'Total Patients',
      value: stats?.overview?.totalPatients || 0,
      icon: Users,
      color: 'bg-blue-500',
      change: stats?.overview?.patientChange || '0%',
      changeType: stats?.overview?.patientChange?.startsWith('+') ? 'positive' : 'negative'
    },
    {
      title: 'Active Doctors',
      value: stats?.overview?.activeDoctors || 0,
      icon: UserCheck,
      color: 'bg-green-500',
      change: stats?.overview?.doctorChange || '0%',
      changeType: stats?.overview?.doctorChange?.startsWith('+') ? 'positive' : 'negative'
    },
    {
      title: 'Today\'s Appointments',
      value: stats?.overview?.todayAppointments || 0,
      icon: Calendar,
      color: 'bg-purple-500',
      change: stats?.overview?.appointmentChange || '0%',
      changeType: stats?.overview?.appointmentChange?.startsWith('+') ? 'positive' : 'negative'
    },
    {
      title: 'Emergency Cases',
      value: stats?.overview?.emergencyPatients || 0,
      icon: AlertTriangle,
      color: 'bg-red-500',
      change: stats?.overview?.emergencyChange || '0%',
      changeType: stats?.overview?.emergencyChange?.startsWith('+') ? 'positive' : 'negative'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Hospital Management System Overview</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span>{new Date().toLocaleDateString()}</span>
            <div className="flex items-center space-x-1 ml-4">
              {isConnected ? (
                <>
                  <Wifi className="h-4 w-4 text-green-500" />
                  <span className="text-green-600">Live</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-red-500" />
                  <span className="text-red-600">Offline</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={exportCSV}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <FileText className="h-4 w-4" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={exportDashboardData}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <Download className="h-4 w-4" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* SDG 3 Banner */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
        <div className="flex items-center space-x-3">
          <Heart className="h-8 w-8" />
          <div>
            <h2 className="text-xl font-bold"> Good Health and Well-being</h2>
            <p className="text-green-100">Ensuring healthy lives and promoting well-being for all</p>
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
                stat.changeType === 'positive' ? 'text-green-500' : 'text-red-500'
              }`} />
              <span className={`ml-1 text-sm font-medium ${
                stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.change}
              </span>
              <span className="ml-2 text-sm text-gray-500">from last month</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Appointments */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Appointments</h3>
          </div>
          <div className="p-6">
            {stats?.recent?.appointments?.length > 0 ? (
              <div className="space-y-4">
                {stats.recent.appointments.map((appointment, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {appointment.patient?.firstName} {appointment.patient?.lastName}
                      </p>
                      <p className="text-sm text-gray-500">
                        with Dr. {appointment.doctor?.firstName} {appointment.doctor?.lastName}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {appointment.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No recent appointments</p>
            )}
          </div>
        </div>

        {/* Recent Patients */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Patients</h3>
          </div>
          <div className="p-6">
            {stats?.recent?.patients?.length > 0 ? (
              <div className="space-y-4">
                {stats.recent.patients.map((patient, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Users className="h-4 w-4 text-green-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {patient.firstName} {patient.lastName}
                      </p>
                      <p className="text-sm text-gray-500">
                        ID: {patient.patientId} • {patient.department}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        patient.status === 'Active' ? 'bg-green-100 text-green-800' :
                        patient.status === 'Emergency' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {patient.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No recent patients</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors" onClick={() => navigate('/users')}>
            <Users className="h-6 w-6 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Add User</span>
          </button>
          <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors" onClick={() => navigate('/appointments')}>
            <Calendar className="h-6 w-6 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Schedule Appointment</span>
          </button>
          <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors" onClick={() => navigate('/emergency')}>
            <AlertTriangle className="h-6 w-6 text-red-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Emergency Case</span>
          </button>
          <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors" onClick={() => navigate('/stats')}>
            <Activity className="h-6 w-6 text-green-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">View Reports</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 