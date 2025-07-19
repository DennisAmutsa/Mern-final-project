import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  AlertTriangle, 
  TrendingUp, 
  Activity,
  Clock,
  Heart,
  Phone,
  FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../config/axios';
import toast from 'react-hot-toast';

const ReceptionistDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await apiClient.get('/api/stats/receptionist-dashboard');
      setStats(response.data);
    } catch (error) {
      toast.error('Failed to fetch dashboard statistics');
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Today\'s Appointments',
      value: stats?.overview?.todayAppointments || 0,
      icon: Calendar,
      color: 'bg-blue-500',
      change: stats?.overview?.appointmentChange || '0',
      changeType: stats?.overview?.appointmentChange?.startsWith('+') ? 'positive' : 'negative'
    },
    {
      title: 'New Registrations',
      value: stats?.overview?.newRegistrations || 0,
      icon: Users,
      color: 'bg-green-500',
      change: stats?.overview?.registrationChange || '0',
      changeType: stats?.overview?.registrationChange?.startsWith('+') ? 'positive' : 'negative'
    },
    {
      title: 'Pending Calls',
      value: stats?.overview?.pendingCalls || 0,
      icon: Phone,
      color: 'bg-yellow-500',
      change: stats?.overview?.callChange || '0',
      changeType: stats?.overview?.callChange?.startsWith('+') ? 'positive' : 'negative'
    },
    {
      title: 'Documents Pending',
      value: stats?.overview?.documentsPending || 0,
      icon: FileText,
      color: 'bg-purple-500',
      change: stats?.overview?.documentChange || '0',
      changeType: stats?.overview?.documentChange?.startsWith('+') ? 'positive' : 'negative'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Receptionist Dashboard</h1>
          <p className="text-gray-600">Patient Registration and Appointment Management</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Phone className="h-4 w-4" />
          <span>Receptionist</span>
          <span>•</span>
          <Clock className="h-4 w-4" />
          <span>{new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* SDG 3 Banner */}
      <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-6 text-white">
        <div className="flex items-center space-x-3">
          <Heart className="h-8 w-8" />
          <div>
            <h2 className="text-xl font-bold">Good Health and Well-being</h2>
            <p className="text-yellow-100">Efficient patient care coordination</p>
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
              <span className="ml-2 text-sm text-gray-500">from yesterday</span>
            </div>
          </div>
        ))}
      </div>

      {/* Receptionist Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 transform hover:scale-105 cursor-pointer" 
            onClick={() => {
              toast.success('Navigating to Patient Registration...');
              navigate('/receptionist-dashboard/patients');
            }}
          >
            <Users className="h-6 w-6 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Register Patient</span>
            <span className="text-xs text-gray-500 mt-1">Add new patients</span>
          </button>
          <button 
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-all duration-200 transform hover:scale-105 cursor-pointer" 
            onClick={() => {
              toast.success('Navigating to Appointment Scheduling...');
              navigate('/receptionist-dashboard/appointments');
            }}
          >
            <Calendar className="h-6 w-6 text-green-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Schedule Appointment</span>
            <span className="text-xs text-gray-500 mt-1">Book appointments</span>
          </button>
          <button 
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-300 transition-all duration-200 transform hover:scale-105 cursor-pointer" 
            onClick={() => {
              toast.success('Navigating to Emergency Management...');
              navigate('/receptionist-dashboard/emergency');
            }}
          >
            <AlertTriangle className="h-6 w-6 text-red-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Emergency</span>
            <span className="text-xs text-gray-500 mt-1">Handle emergencies</span>
          </button>
          <button 
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-all duration-200 transform hover:scale-105 cursor-pointer" 
            onClick={() => {
              toast.success('Navigating to Doctor Schedule...');
              navigate('/receptionist-dashboard/doctor-schedule');
            }}
          >
            <FileText className="h-6 w-6 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Doctor Schedule</span>
            <span className="text-xs text-gray-500 mt-1">View doctor availability</span>
          </button>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Appointments */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Today's Appointments</h3>
          </div>
          <div className="p-6">
            {stats?.todayAppointments?.length > 0 ? (
              <div className="space-y-4">
                {stats.todayAppointments.map((appointment, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {appointment.patientName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {appointment.time} • Dr. {appointment.doctorName}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        appointment.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                        appointment.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {appointment.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No appointments today</p>
            )}
          </div>
        </div>

        {/* Recent Registrations */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Registrations</h3>
          </div>
          <div className="p-6">
            {stats?.recentRegistrations?.length > 0 ? (
              <div className="space-y-4">
                {stats.recentRegistrations.map((registration, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Users className="h-4 w-4 text-green-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {registration.patientName}
                      </p>
                      <p className="text-sm text-gray-500">
                        ID: {registration.patientId} • {registration.department}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="text-xs text-gray-500">
                        {registration.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No recent registrations</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceptionistDashboard; 