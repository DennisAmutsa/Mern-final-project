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
  Shield,
  Settings,
  Building,
  DollarSign,
  FileText,
  BarChart3,
  UserPlus,
  Database,
  Bell,
  CheckCircle,
  XCircle,
  PieChart,
  BarChart,
  LineChart,
  Target,
  TrendingDown,
  Eye,
  Download,
  Filter,
  Clipboard,
  Plus,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, LineChart as RechartsLineChart, Line, AreaChart, Area } from 'recharts';
import apiClient from '../config/axios';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();
  const [systemStatus, setSystemStatus] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [doctorForm, setDoctorForm] = useState({ firstName: '', lastName: '', email: '', department: '', specialization: '', phone: '', password: '' });
  const [departments, setDepartments] = useState([]);
  const [deptForm, setDeptForm] = useState({ name: '', description: '', location: '', phone: '', email: '' });
  const [analyticsData, setAnalyticsData] = useState({
    patientDemographics: [],
    revenueTrends: [],
    appointmentMetrics: [],
    departmentPerformance: [],
    qualityMetrics: [],
    staffProductivity: []
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('month');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [allUsers, setAllUsers] = useState([]);
  const [financialReports, setFinancialReports] = useState([]);
  const [budgets, setBudgets] = useState([]);
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
  const [availablePatients, setAvailablePatients] = useState([]);
  const [loadingNurses, setLoadingNurses] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(false);

  const allowedDepartments = [
    'Emergency', 'Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics',
    'General Medicine', 'Surgery', 'ICU', 'Pharmacy', 'Administration'
  ];

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      try {
        // Test API connection first
        console.log('Testing API connection...');
        const testResponse = await apiClient.get('/api/health');
        console.log('API Health Check:', testResponse.data);
        
        fetchDashboardStats();
        fetchSystemStatus();
        fetchAlerts();
        fetchDepartments();
        fetchAllAnalyticsData();
      } catch (error) {
        toast.error('Failed to connect to backend. Please check server status.');
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await apiClient.get('/api/stats/dashboard');
      setStats(response.data);
    } catch (error) {
      toast.error('Failed to fetch dashboard statistics');
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemStatus = async () => {
    try {
      const res = await apiClient.get('/api/health');
      setSystemStatus(res.data);
    } catch {
      setSystemStatus(null);
    }
  };

  const fetchAlerts = async () => {
    try {
      const res = await apiClient.get('/api/audit-logs');
      setAlerts(Array.isArray(res.data) ? res.data.slice(0, 5) : []);
    } catch {
      setAlerts([]);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await apiClient.get('/api/departments');
      setDepartments(Array.isArray(res.data) ? res.data : []);
    } catch {
      setDepartments([]);
    }
  };

  const fetchAllAnalyticsData = async () => {
    setAnalyticsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const [usersRes, financialRes, budgetRes, appointmentsRes, departmentsRes] = await Promise.all([
        apiClient.get('/api/auth/users'),
        apiClient.get('/api/financial-reports'),
        apiClient.get('/api/budget'),
        apiClient.get('/api/appointments'),
        apiClient.get('/api/departments')
      ]);
      setAllUsers(usersRes.data.users || []);
      setFinancialReports(Array.isArray(financialRes.data) ? financialRes.data : []);
      setBudgets(Array.isArray(budgetRes.data) ? budgetRes.data : []);
      // Process patient demographics
      const patientData = allUsers.filter(user => user.role === 'user'); // Assuming 'user' role is for patients
      const demographics = processPatientDemographics(patientData);
      
      // Process revenue trends
      const billingData = financialReports.map(report => ({
        month: new Date(report.date).toLocaleString('default', { month: 'short' }),
        amount: report.amount
      }));
      const revenueData = processRevenueTrends(billingData);
      
      // Process appointment metrics
      const appointmentData = appointmentsRes.data.appointments || [];
      const appointmentMetrics = processAppointmentMetrics(appointmentData);
      
      // Process department performance
      const deptData = departmentsRes.data;
      const deptPerformance = processDepartmentPerformance(deptData, appointmentData, financialReports);
      
      // Process quality metrics
      const qualityMetrics = processQualityMetrics(patientData, appointmentData);
      
      // Process staff productivity
      const staffProductivity = processStaffProductivity(appointmentData);

      setAnalyticsData({
        patientDemographics: demographics,
        revenueTrends: revenueData,
        appointmentMetrics: appointmentMetrics,
        departmentPerformance: deptPerformance,
        qualityMetrics: qualityMetrics,
        staffProductivity: staffProductivity
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const processPatientDemographics = (patients) => {
    const ageGroups = { '0-18': 0, '19-30': 0, '31-50': 0, '51-70': 0, '70+': 0 };
    const genderCount = { male: 0, female: 0, other: 0 };
    
    patients.forEach(patient => {
      const age = new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear();
      if (age <= 18) ageGroups['0-18']++;
      else if (age <= 30) ageGroups['19-30']++;
      else if (age <= 50) ageGroups['31-50']++;
      else if (age <= 70) ageGroups['51-70']++;
      else ageGroups['70+']++;
      
      genderCount[patient.gender?.toLowerCase() || 'other']++;
    });

    return {
      ageDistribution: Object.entries(ageGroups).map(([age, count]) => ({ age, count })),
      genderDistribution: Object.entries(genderCount).map(([gender, count]) => ({ gender, count })),
      totalPatients: patients.length
    };
  };

  const processRevenueTrends = (billing) => {
    const monthlyRevenue = {};
    const currentYear = new Date().getFullYear();
    
    billing.forEach(bill => {
      const date = new Date(bill.month); // Assuming 'month' is the key for month
      if (date.getFullYear() === currentYear) {
        const month = date.toLocaleString('default', { month: 'short' });
        monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (bill.amount || 0);
      }
    });

    return Object.entries(monthlyRevenue).map(([month, revenue]) => ({ month, revenue }));
  };

  const processAppointmentMetrics = (appointments) => {
    const today = new Date();
    const thisMonth = today.getMonth();
    const thisYear = today.getFullYear();
    
    const monthlyStats = {};
    const statusCount = { scheduled: 0, completed: 0, cancelled: 0, noShow: 0 };
    
    appointments.forEach(apt => {
      const date = new Date(apt.date);
      if (date.getMonth() === thisMonth && date.getFullYear() === thisYear) {
        const day = date.getDate();
        monthlyStats[day] = (monthlyStats[day] || 0) + 1;
      }
      statusCount[apt.status?.toLowerCase() || 'scheduled']++;
    });

    return {
      dailyAppointments: Object.entries(monthlyStats).map(([day, count]) => ({ day, count })),
      statusDistribution: Object.entries(statusCount).map(([status, count]) => ({ status, count })),
      totalAppointments: appointments.length
    };
  };

  const processDepartmentPerformance = (departments, appointments, billing) => {
    return departments.map(dept => {
      const deptAppointments = appointments.filter(apt => apt.department === dept._id);
      const deptBilling = billing.filter(bill => bill.department === dept._id);
      
      const revenue = deptBilling.reduce((sum, bill) => sum + (bill.amount || 0), 0);
      const completedAppointments = deptAppointments.filter(apt => apt.status === 'completed').length;
      
      return {
        name: dept.name,
        appointments: deptAppointments.length,
        completed: completedAppointments,
        revenue: revenue,
        efficiency: deptAppointments.length > 0 ? (completedAppointments / deptAppointments.length * 100).toFixed(1) : 0
      };
    });
  };

  const processQualityMetrics = (patients, appointments) => {
    const totalPatients = patients.length;
    const totalAppointments = appointments.length;
    const completedAppointments = appointments.filter(apt => apt.status === 'completed').length;
    const cancelledAppointments = appointments.filter(apt => apt.status === 'cancelled').length;
    
    return {
      patientSatisfaction: 4.2, // Mock data - would come from surveys
      appointmentCompletionRate: totalAppointments > 0 ? (completedAppointments / totalAppointments * 100).toFixed(1) : 0,
      cancellationRate: totalAppointments > 0 ? (cancelledAppointments / totalAppointments * 100).toFixed(1) : 0,
      averageWaitTime: 15, // Mock data in minutes
      readmissionRate: 8.5 // Mock data percentage
    };
  };

  // Care Task Functions
  const handleAddCareTask = async () => {
    if (!careTaskData.task || !careTaskData.description || !careTaskData.assignedTo || !careTaskData.patientId) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await apiClient.post('/api/care-tasks', {
        ...careTaskData,
        assignedBy: 'admin', // Admin is creating the task
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

  const fetchAvailableNurses = async () => {
    try {
      setLoadingNurses(true);
      console.log('🔍 Fetching nurses for care task...');
      
      // Try the users endpoint first, then fallback to auth endpoint
      let response;
      try {
        response = await apiClient.get('/api/users?roles=nurse');
        console.log('✅ Nurses response from /api/users:', response.data);
      } catch (error) {
        console.log('❌ /api/users failed, trying /api/auth/users...');
        response = await apiClient.get('/api/auth/users?roles=nurse');
        console.log('✅ Nurses response from /api/auth/users:', response.data);
      }
      
      const nurses = response.data.users || response.data || [];
      console.log('👩‍⚕️ Available nurses:', nurses);
      setAvailableNurses(nurses);
    } catch (error) {
      console.error('❌ Error fetching nurses:', error);
      console.error('❌ Error response:', error.response?.data);
      toast.error(`Failed to fetch nurses: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoadingNurses(false);
    }
  };

  const fetchAvailablePatients = async () => {
    try {
      setLoadingPatients(true);
      console.log('🔍 Fetching patients for care task...');
      
      // Try the users endpoint first, then fallback to auth endpoint
      let response;
      try {
        response = await apiClient.get('/api/users?roles=user');
        console.log('✅ Patients response from /api/users:', response.data);
      } catch (error) {
        console.log('❌ /api/users failed, trying /api/auth/users...');
        response = await apiClient.get('/api/auth/users?roles=user');
        console.log('✅ Patients response from /api/auth/users:', response.data);
      }
      
      const patients = response.data.users || response.data || [];
      console.log('📋 Available patients:', patients);
      setAvailablePatients(patients);
    } catch (error) {
      console.error('❌ Error fetching patients:', error);
      console.error('❌ Error response:', error.response?.data);
      toast.error(`Failed to fetch patients: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoadingPatients(false);
    }
  };

  // Fetch data when care task modal opens
  useEffect(() => {
    if (showAddCareTask) {
      fetchAvailableNurses();
      fetchAvailablePatients();
    }
  }, [showAddCareTask]);

  const processStaffProductivity = (appointments) => {
    const doctorStats = {};
    
    appointments.forEach(apt => {
      if (apt.doctor) {
        if (!doctorStats[apt.doctor]) {
          doctorStats[apt.doctor] = { appointments: 0, completed: 0, name: apt.doctorName || 'Unknown' };
        }
        doctorStats[apt.doctor].appointments++;
        if (apt.status === 'completed') {
          doctorStats[apt.doctor].completed++;
        }
      }
    });

    return Object.values(doctorStats).map(doctor => ({
      name: doctor.name,
      appointments: doctor.appointments,
      completed: doctor.completed,
      efficiency: doctor.appointments > 0 ? (doctor.completed / doctor.appointments * 100).toFixed(1) : 0
    }));
  };

  const statCards = [
    {
      title: 'Total Staff',
      value: stats?.overview?.totalStaff || 0,
      icon: Users,
      color: 'bg-blue-500',
      change: stats?.overview?.staffChange || '0%',
      changeType: stats?.overview?.staffChange?.startsWith('+') ? 'positive' : 'negative'
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

  const adminFunctions = [
    {
      title: 'User Management',
      description: 'Manage hospital staff accounts',
      icon: UserPlus,
      color: 'bg-blue-500',
      actions: [
        { name: 'Add New User', action: () => navigate('/admin-dashboard/users') },
        { name: 'Manage Roles', action: () => navigate('/admin-dashboard/users') },
        { name: 'Account Status', action: () => navigate('/admin-dashboard/users') }
      ]
    },
    {
      title: 'Department Management',
      description: 'Configure hospital departments',
      icon: Building,
      color: 'bg-green-500',
      actions: [
        { name: 'Add Department', action: () => navigate('/admin-dashboard/departments') },
        { name: 'Staff Assignment', action: () => navigate('/admin-dashboard/departments') },
        { name: 'Department Stats', action: () => navigate('/admin-dashboard/stats') }
      ]
    },
    {
      title: 'System Administration',
      description: 'System settings and maintenance',
      icon: Settings,
      color: 'bg-purple-500',
      actions: [
        { name: 'System Settings', action: () => navigate('/admin-dashboard/settings') },
        { name: 'Audit Logs', action: () => navigate('/admin-dashboard/audit') },
        { name: 'Backup & Restore', action: () => navigate('/admin-dashboard/backup') }
      ]
    },
    {
      title: 'Financial Management',
      description: 'Billing and budget oversight',
      icon: DollarSign,
      color: 'bg-yellow-500',
      actions: [
        { name: 'Billing Overview', action: () => navigate('/admin-dashboard/billing') },
        { name: 'Budget Reports', action: () => navigate('/admin-dashboard/budget-reports') },
        { name: 'Financial Reports', action: () => navigate('/admin-dashboard/financial-reports') }
      ]
    }
  ];

  const quickActions = [
    {
      title: 'Add New Doctor',
      icon: UserCheck,
      color: 'bg-blue-500',
      action: () => setShowDoctorModal(true)
    },
    {
      title: 'Create Department',
      icon: Building,
      color: 'bg-green-500',
      action: () => setShowDepartmentModal(true)
    },
    {
      title: 'System Backup',
      icon: Database,
      color: 'bg-purple-500',
      action: async () => {
        try {
          await apiClient.post('/api/backup/trigger');
          toast.success('Backup triggered!');
          fetchSystemStatus();
        } catch {
          toast.error('Failed to trigger backup');
        }
      }
    },
    {
      title: 'Generate Reports',
      icon: FileText,
      color: 'bg-yellow-500',
      action: () => navigate('/admin-dashboard/financial-reports')
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
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Hospital Management System - Administrative Overview</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Shield className="h-4 w-4" />
          <span>Administrator</span>
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

      {/* Admin Functions Grid */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Administrative Functions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {adminFunctions.map((func, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3 mb-3">
                <div className={`p-2 rounded-full ${func.color}`}>
                  <func.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{func.title}</h4>
                  <p className="text-xs text-gray-500">{func.description}</p>
                </div>
              </div>
              <div className="space-y-2">
                {func.actions.map((action, actionIndex) => (
                  <button
                    key={actionIndex}
                    onClick={action.action}
                    className="w-full text-left text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                  >
                    {action.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Care Tasks Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Care Tasks Management</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowAddCareTask(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Create Task</span>
              </button>
              <button
                onClick={fetchCareTasksList}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                View All Tasks
              </button>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="text-center py-8">
            <Clipboard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Care Tasks</h3>
            <p className="text-gray-600">Create and manage nursing care tasks and assignments</p>
            <div className="flex justify-center space-x-4 mt-4">
              <button
                onClick={() => setShowAddCareTask(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Create New Task
              </button>
              <button
                onClick={fetchCareTasksList}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                View All Tasks
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className={`p-3 rounded-full ${action.color} mb-2`}>
                <action.icon className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-900 text-center">{action.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* System Status & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">System Status</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-900">Database Connection</span>
                </div>
                <span className="text-xs text-green-600 font-medium">
                  {systemStatus?.databaseStatus || 'Offline'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-900">API Services</span>
                </div>
                <span className="text-xs text-green-600 font-medium">
                  {systemStatus?.apiStatus || 'Offline'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-900">Backup System</span>
                </div>
                <span className="text-xs text-green-600 font-medium">
                  {systemStatus?.backupStatus || 'Offline'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-900">Security Monitoring</span>
                </div>
                <span className="text-xs text-green-600 font-medium">
                  {systemStatus?.securityStatus || 'Offline'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Alerts</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {alerts.map((alert, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Bell className="h-4 w-4 text-yellow-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{alert.action}</p>
                    <p className="text-sm text-gray-500">{alert.description}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="text-xs text-gray-500">{alert.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Statistics & Analytics</h3>
          <div className="flex items-center space-x-4">
            <select 
              value={selectedTimeframe} 
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
            <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-800">
              <Download className="h-4 w-4" />
              <span className="text-sm">Export</span>
            </button>
          </div>
        </div>

        {analyticsLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Patient Analytics */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Patient Analytics</h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-3">Age Distribution</h5>
                                     <ResponsiveContainer width="100%" height={200}>
                     <RechartsPieChart>
                       <Pie
                         data={(analyticsData.patientDemographics?.ageDistribution ?? [])}
                         dataKey="count"
                         nameKey="age"
                         cx="50%"
                         cy="50%"
                         outerRadius={60}
                         fill="#8884d8"
                         label
                       >
                         {(analyticsData.patientDemographics?.ageDistribution ?? []).map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'][index % 5]} />
                         ))}
                       </Pie>
                       <Tooltip />
                     </RechartsPieChart>
                   </ResponsiveContainer>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-3">Gender Distribution</h5>
                                     <ResponsiveContainer width="100%" height={200}>
                     <RechartsBarChart data={analyticsData.patientDemographics.genderDistribution}>
                       <CartesianGrid strokeDasharray="3 3" />
                       <XAxis dataKey="gender" />
                       <YAxis />
                       <Tooltip />
                       <Bar dataKey="count" fill="#8884d8" />
                     </RechartsBarChart>
                   </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Financial Analytics */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Financial Analytics</h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-3">Revenue Trends</h5>
                                     <ResponsiveContainer width="100%" height={200}>
                     <RechartsLineChart data={analyticsData.revenueTrends}>
                       <CartesianGrid strokeDasharray="3 3" />
                       <XAxis dataKey="month" />
                       <YAxis />
                       <Tooltip formatter={(value) => [`Ksh${value.toLocaleString()}`, 'Revenue']} />
                       <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
                     </RechartsLineChart>
                   </ResponsiveContainer>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-3">Department Revenue</h5>
                                     <ResponsiveContainer width="100%" height={200}>
                     <RechartsBarChart data={analyticsData.departmentPerformance}>
                       <CartesianGrid strokeDasharray="3 3" />
                       <XAxis dataKey="name" />
                       <YAxis />
                       <Tooltip formatter={(value) => [`Ksh${value.toLocaleString()}`, 'Revenue']} />
                       <Bar dataKey="revenue" fill="#00C49F" />
                     </RechartsBarChart>
                   </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Operational Analytics */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Operational Analytics</h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-3">Daily Appointments</h5>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={analyticsData.appointmentMetrics.dailyAppointments}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="count" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-3">Appointment Status</h5>
                                     <ResponsiveContainer width="100%" height={200}>
                     <RechartsPieChart>
                       <Pie
                         data={(analyticsData.appointmentMetrics?.statusDistribution ?? [])}
                         dataKey="count"
                         nameKey="status"
                         cx="50%"
                         cy="50%"
                         outerRadius={60}
                         fill="#8884d8"
                         label
                       >
                         {(analyticsData.appointmentMetrics?.statusDistribution ?? []).map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042'][index % 4]} />
                         ))}
                       </Pie>
                       <Tooltip />
                     </RechartsPieChart>
                   </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Quality Metrics */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Quality Metrics</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{analyticsData.qualityMetrics.patientSatisfaction}</div>
                  <div className="text-sm text-green-700">Patient Satisfaction</div>
                  <div className="text-xs text-green-600">/ 5.0</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{analyticsData.qualityMetrics.appointmentCompletionRate}%</div>
                  <div className="text-sm text-blue-700">Completion Rate</div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">{analyticsData.qualityMetrics.averageWaitTime}min</div>
                  <div className="text-sm text-yellow-700">Avg Wait Time</div>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{analyticsData.qualityMetrics.readmissionRate}%</div>
                  <div className="text-sm text-red-700">Readmission Rate</div>
                </div>
              </div>
            </div>

            {/* Staff Productivity */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Staff Productivity</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                                 <ResponsiveContainer width="100%" height={300}>
                   <RechartsBarChart data={analyticsData.staffProductivity}>
                     <CartesianGrid strokeDasharray="3 3" />
                     <XAxis dataKey="name" />
                     <YAxis />
                     <Tooltip />
                     <Legend />
                     <Bar dataKey="appointments" fill="#8884d8" name="Total Appointments" />
                     <Bar dataKey="completed" fill="#00C49F" name="Completed" />
                   </RechartsBarChart>
                 </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Financial Reports Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-8">
        <h4 className="text-md font-medium text-gray-900 mb-4">Financial Reports</h4>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded shadow p-4 text-center">
            <div className="text-gray-500">Total Revenue</div>
            <div className="text-2xl font-bold text-blue-700">Ksh{financialReports.reduce((sum, r) => sum + (r.totals?.revenue ? Number(r.totals.revenue) : 0), 0).toLocaleString()}</div>
          </div>
          <div className="bg-red-50 rounded shadow p-4 text-center">
            <div className="text-gray-500">Total Expenses</div>
            <div className="text-2xl font-bold text-red-700">Ksh{financialReports.reduce((sum, r) => sum + (r.totals?.expenses ? Number(r.totals.expenses) : 0), 0).toLocaleString()}</div>
          </div>
          <div className="bg-green-50 rounded shadow p-4 text-center">
            <div className="text-gray-500">Net Profit/Loss</div>
            <div className="text-2xl font-bold text-green-700">Ksh{(financialReports.reduce((sum, r) => sum + (r.totals?.revenue ? Number(r.totals.revenue) : 0), 0) - financialReports.reduce((sum, r) => sum + (r.totals?.expenses ? Number(r.totals.expenses) : 0), 0)).toLocaleString()}</div>
          </div>
        </div>
        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-50 rounded-lg p-4">
            <h5 className="text-sm font-medium text-gray-700 mb-3">Profit/Loss by Period</h5>
            <ResponsiveContainer width="100%" height={200}>
              <RechartsBarChart data={financialReports.map(r => ({ period: r.period, profit: (Number(r.totals?.revenue || 0) - Number(r.totals?.expenses || 0)) }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="profit" fill="#00C49F" />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h5 className="text-sm font-medium text-gray-700 mb-3">Revenue & Expenses by Period</h5>
            <ResponsiveContainer width="100%" height={200}>
              <RechartsLineChart data={financialReports.map(r => ({ period: r.period, revenue: Number(r.totals?.revenue || 0), expenses: Number(r.totals?.expenses || 0) }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#0088FE" strokeWidth={2} />
                <Line type="monotone" dataKey="expenses" stroke="#FF8042" strokeWidth={2} />
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead>
              <tr>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Period</th>
                <th className="px-4 py-2">Revenue</th>
                <th className="px-4 py-2">Expenses</th>
                <th className="px-4 py-2">Profit</th>
                <th className="px-4 py-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {financialReports.map(r => (
                <tr key={r._id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 capitalize">{r.type}</td>
                  <td className="px-4 py-2">{r.period}</td>
                  <td className="px-4 py-2">Ksh{Number(r.totals?.revenue || 0).toLocaleString()}</td>
                  <td className="px-4 py-2">Ksh{Number(r.totals?.expenses || 0).toLocaleString()}</td>
                  <td className="px-4 py-2">Ksh{(Number(r.totals?.revenue || 0) - Number(r.totals?.expenses || 0)).toLocaleString()}</td>
                  <td className="px-4 py-2">{r.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Budget Analytics Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-8">
        <h4 className="text-md font-medium text-gray-900 mb-4">Budget Analytics</h4>
        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-50 rounded-lg p-4">
            <h5 className="text-sm font-medium text-gray-700 mb-3">Allocated vs Spent by Department</h5>
            <ResponsiveContainer width="100%" height={200}>
              <RechartsBarChart data={budgets.map(b => ({ department: b.department?.name || 'Unknown', allocated: b.allocated, spent: b.spent }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="allocated" fill="#0088FE" name="Allocated" />
                <Bar dataKey="spent" fill="#FF8042" name="Spent" />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h5 className="text-sm font-medium text-gray-700 mb-3">Budget Utilization</h5>
            <ResponsiveContainer width="100%" height={200}>
              <RechartsPieChart>
                <Pie
                  data={budgets.map(b => ({ name: b.department?.name || 'Unknown', value: b.spent / (b.allocated || 1) * 100 }))}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  fill="#8884d8"
                  label
                >
                  {budgets.map((b, idx) => (
                    <Cell key={`cell-${idx}`} fill={["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"][idx % 5]} />
                  ))}
                </Pie>
                <Tooltip formatter={v => `${v.toFixed(1)}%`} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead>
              <tr>
                <th className="px-4 py-2">Department</th>
                <th className="px-4 py-2">Year</th>
                <th className="px-4 py-2">Allocated</th>
                <th className="px-4 py-2">Spent</th>
                <th className="px-4 py-2">Utilization</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {budgets.map(b => (
                <tr key={b._id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">{b.department?.name || 'Unknown'}</td>
                  <td className="px-4 py-2">{b.year}</td>
                  <td className="px-4 py-2">Ksh{Number(b.allocated || 0).toLocaleString()}</td>
                  <td className="px-4 py-2">Ksh{Number(b.spent || 0).toLocaleString()}</td>
                  <td className="px-4 py-2">{b.allocated ? ((b.spent / b.allocated) * 100).toFixed(1) : 0}%</td>
                  <td className="px-4 py-2 capitalize">{b.status}</td>
                  <td className="px-4 py-2">{b.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals for Quick Actions */}
      {showDoctorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Doctor</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              addDoctor();
            }} className="space-y-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First Name</label>
                <input
                  type="text"
                  id="firstName"
                  value={doctorForm.firstName}
                  onChange={(e) => setDoctorForm({ ...doctorForm, firstName: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  value={doctorForm.lastName}
                  onChange={(e) => setDoctorForm({ ...doctorForm, lastName: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  id="email"
                  value={doctorForm.email}
                  onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  id="password"
                  value={doctorForm.password}
                  onChange={(e) => setDoctorForm({ ...doctorForm, password: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                />
              </div>
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700">Department</label>
                <select
                  id="department"
                  value={doctorForm.department}
                  onChange={(e) => setDoctorForm({ ...doctorForm, department: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                >
                  <option value="">Select Department</option>
                  {allowedDepartments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="specialization" className="block text-sm font-medium text-gray-700">Specialization</label>
                <input
                  type="text"
                  id="specialization"
                  value={doctorForm.specialization}
                  onChange={(e) => setDoctorForm({ ...doctorForm, specialization: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="tel"
                  id="phone"
                  value={doctorForm.phone}
                  onChange={(e) => setDoctorForm({ ...doctorForm, phone: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full text-sm text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md transition-colors"
              >
                Add Doctor
              </button>
              <button
                type="button"
                onClick={() => setShowDoctorModal(false)}
                className="w-full text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-4 py-2 rounded-md transition-colors"
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

      {showDepartmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Department</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              createDepartment();
            }} className="space-y-4">
              <div>
                <label htmlFor="deptName" className="block text-sm font-medium text-gray-700">Department Name</label>
                <input
                  type="text"
                  id="deptName"
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                />
              </div>
              <div>
                <label htmlFor="deptDescription" className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  id="deptDescription"
                  value={deptForm.description}
                  onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  rows="3"
                />
              </div>
              <div>
                <label htmlFor="deptLocation" className="block text-sm font-medium text-gray-700">Location</label>
                <input
                  type="text"
                  id="deptLocation"
                  value={deptForm.location}
                  onChange={(e) => setDeptForm({ ...deptForm, location: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div>
                <label htmlFor="deptPhone" className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="tel"
                  id="deptPhone"
                  value={deptForm.phone}
                  onChange={(e) => setDeptForm({ ...deptForm, phone: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div>
                <label htmlFor="deptEmail" className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  id="deptEmail"
                  value={deptForm.email}
                  onChange={(e) => setDeptForm({ ...deptForm, email: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <button
                type="submit"
                className="w-full text-sm text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md transition-colors"
              >
                Create Department
              </button>
              <button
                type="button"
                onClick={() => setShowDepartmentModal(false)}
                className="w-full text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-4 py-2 rounded-md transition-colors"
              >
                Cancel
              </button>
            </form>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Patient *</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={careTaskData.patientId}
                  onChange={(e) => setCareTaskData({ ...careTaskData, patientId: e.target.value })}
                  disabled={loadingPatients}
                >
                  <option value="">
                    {loadingPatients ? 'Loading patients...' : `Select a patient (${availablePatients.length} available)`}
                  </option>
                  {availablePatients.map(patient => (
                    <option key={patient._id} value={patient._id}>
                      {patient.firstName} {patient.lastName}
                    </option>
                  ))}
                </select>
                {availablePatients.length === 0 && !loadingPatients && (
                  <p className="text-xs text-red-500 mt-1">No patients found. Please check if patients exist in the system.</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Task *</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Assign To *</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={careTaskData.assignedTo}
                  onChange={(e) => setCareTaskData({ ...careTaskData, assignedTo: e.target.value })}
                  disabled={loadingNurses}
                >
                  <option value="">
                    {loadingNurses ? 'Loading nurses...' : `Select a nurse (${availableNurses.length} available)`}
                  </option>
                  {availableNurses.map(nurse => (
                    <option key={nurse._id} value={nurse._id}>
                      {nurse.firstName} {nurse.lastName}
                    </option>
                  ))}
                </select>
                {availableNurses.length === 0 && !loadingNurses && (
                  <p className="text-xs text-red-500 mt-1">No nurses found. Please check if nurses exist in the system.</p>
                )}
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

      {/* Care Tasks List Modal */}
      {showCareTasksList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">All Care Tasks</h3>
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
                        <span className="text-gray-500">Due Date:</span>
                        <span className="ml-1 font-medium">{task.dueDate}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Status:</span>
                        <span className="ml-1 font-medium">{task.status}</span>
                      </div>
                    </div>
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
    </div>
  );

  async function addDoctor() {
    try {
      await apiClient.post('/api/doctors', doctorForm);
      toast.success('Doctor added successfully!');
      setShowDoctorModal(false);
      setDoctorForm({ firstName: '', lastName: '', email: '', department: '', specialization: '', phone: '', password: '' });
      fetchDepartments(); // Refresh departments to show newly added one
    } catch (error) {
      toast.error('Failed to add doctor. ' + (error.response?.data?.message || error.message));
      console.error('Error adding doctor:', error);
    }
  }

  async function createDepartment() {
    try {
      await apiClient.post('/api/departments', deptForm);
      toast.success('Department created successfully!');
      setShowDepartmentModal(false);
      setDeptForm({ name: '', description: '', location: '', phone: '', email: '' });
      fetchDepartments(); // Refresh departments to show newly added one
    } catch (error) {
      toast.error('Failed to create department. ' + (error.response?.data?.message || error.message));
      console.error('Error creating department:', error);
    }
  }
};

export default AdminDashboard; 