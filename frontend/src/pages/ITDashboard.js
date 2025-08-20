import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Monitor, 
  Users, 
  Shield, 
  Server, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Clock,
  Database,
  Network,
  HardDrive,
  Cpu,
  Memory,
  Wifi,
  Settings,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Eye,
  UserCheck,
  UserX,
  Lock,
  Unlock,
  FileText,
  Download,
  Upload,
  Zap,
  BarChart3,
  Calendar,
  Bell,
  Search,
  Filter,
  Wrench,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../config/axios';
import toast from 'react-hot-toast';
import { 
  trackITDashboardEvent, 
  trackUserSession, 
  trackPageView, 
  trackFeatureUsage,
  trackSystemHealth,
  initializeClarity 
} from '../utils/clarity';
import ClarityAnalytics from '../components/ClarityAnalytics';

const ITDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [systemHealth, setSystemHealth] = useState({
    serverStatus: 'online',
    databaseStatus: 'connected',
    apiStatus: 'healthy',
    uptime: '99.9%',
    lastBackup: '2 hours ago'
  });
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    recentLogins: 0,
    failedAttempts: 0
  });
  const [securityAlerts, setSecurityAlerts] = useState([]);
  const [alertPagination, setAlertPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalAlerts: 0,
    hasNext: false,
    hasPrev: false
  });
  const [supportTickets, setSupportTickets] = useState([]);
  const [systemMetrics, setSystemMetrics] = useState({
    cpuUsage: 45,
    memoryUsage: 62,
    diskUsage: 78,
    networkUsage: 23
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [activityPagination, setActivityPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalActivities: 0,
    hasNext: false,
    hasPrev: false
  });
  const [networkStatus, setNetworkStatus] = useState({
    internetConnection: 'connected',
    bandwidthUsage: 0,
    latency: 0,
    activeConnections: 0
  });
  const [backupStatus, setBackupStatus] = useState({
    lastBackup: 'Never',
    backupSize: '0 GB',
    nextBackup: 'Not scheduled',
    backupStatus: 'unknown'
  });
  const [users, setUsers] = useState([]);
  const [userPagination, setUserPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [userFilters, setUserFilters] = useState({
    search: '',
    role: '',
    status: ''
  });
  const [userLoading, setUserLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Determine current view based on URL path
  const [lockedAccounts, setLockedAccounts] = useState([]);
  const [lockedAccountsLoading, setLockedAccountsLoading] = useState(false);
  const [maintenanceStatus, setMaintenanceStatus] = useState({
    enabled: false,
    message: '',
    estimatedDuration: '',
    activatedAt: null,
    activatedBy: null
  });
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);
  const [maintenanceForm, setMaintenanceForm] = useState({
    reason: '',
    duration: ''
  });
  const [blockedAttempts, setBlockedAttempts] = useState([]);

  // System Lock state
  const [systemLockStatus, setSystemLockStatus] = useState({
    enabled: false,
    reason: '',
    emergencyContact: '',
    activatedAt: null,
    activatedBy: null
  });
  const [systemLockLoading, setSystemLockLoading] = useState(false);
  const [systemLockForm, setSystemLockForm] = useState({
    reason: '',
    emergencyContact: ''
  });
    const [systemLockBlockedAttempts, setSystemLockBlockedAttempts] = useState([]);
  
  // Suspended Accounts state
  const [suspendedAccounts, setSuspendedAccounts] = useState([]);
  const [suspendedAccountsLoading, setSuspendedAccountsLoading] = useState(false);
  const [suspendedAccountsPagination, setSuspendedAccountsPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalSuspendedUsers: 0,
    itemsPerPage: 10,
    hasNext: false,
    hasPrev: false
  });
  const [suspendedAccountsStats, setSuspendedAccountsStats] = useState({
    totalSuspended: 0,
    byRole: []
  });
  const [suspendedAccountsFilters, setSuspendedAccountsFilters] = useState({
    search: '',
    role: '',
    department: ''
  });
  
  // User details modal state
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);

  const getCurrentView = () => {
    const path = location.pathname;
    let view = 'overview';
    
    if (path.includes('/health')) view = 'health';
    else if (path.includes('/users')) view = 'users';
    else if (path.includes('/suspended-accounts')) view = 'suspended-accounts';
    else if (path.includes('/security')) view = 'security';
    else if (path.includes('/support')) view = 'support';
    else if (path.includes('/metrics')) view = 'metrics';
    else if (path.includes('/activity')) view = 'activity';
    else if (path.includes('/locked-accounts')) view = 'locked-accounts';
    else if (path.includes('/maintenance')) view = 'maintenance';
    else if (path.includes('/system-lock')) view = 'system-lock';
    else if (path.includes('/analytics')) view = 'analytics';
    
    // Track dashboard section access
    trackFeatureUsage('dashboard_navigation', 'section_accessed', { section: view });
    
    return view;
  };

  useEffect(() => {
    // Initialize Clarity tracking
    const initClarity = () => {
      setTimeout(() => {
        if (initializeClarity()) {
          trackUserSession(user?.role, user?.permissions || []);
          trackPageView('IT Dashboard', { 
            userRole: user?.role,
            dashboardType: 'IT'
          });
        }
      }, 1000); // Wait for Clarity to load
    };

    initClarity();
    fetchDashboardData();
    
    // Refresh every 5 minutes (300 seconds) with silent updates
    const interval = setInterval(() => fetchDashboardData(false), 300000);
    return () => clearInterval(interval);
  }, []); // Empty dependency array to run only once on mount

  useEffect(() => {
    if (getCurrentView() === 'users') {
      fetchUsers();
    }
    if (getCurrentView() === 'suspended-accounts') {
      fetchSuspendedAccounts();
    }
    if (getCurrentView() === 'locked-accounts') {
      fetchLockedAccounts();
    }
    if (getCurrentView() === 'maintenance') {
      fetchMaintenanceStatus();
      fetchSystemLockStatus();
    }
    if (getCurrentView() === 'system-lock') {
      fetchSystemLockStatus();
    }
  }, [location.pathname]); // Only fetch users when the path changes

  const fetchDashboardData = async (showLoading = true) => {
    try {
      if (showLoading) {
      setLoading(true);
      } else {
        setRefreshing(true);
      }
      // Fetch system health data
      const healthResponse = await apiClient.get('/api/it/system-health');
      setSystemHealth(healthResponse.data);
      
      // Track system health
      trackSystemHealth('overall', healthResponse.data.serverStatus, {
        uptime: healthResponse.data.uptime,
        memoryUsage: healthResponse.data.memoryUsage,
        cpuLoad: healthResponse.data.cpuLoad
      });

      // Fetch user statistics
      const userResponse = await apiClient.get('/api/it/user-stats');
      setUserStats(userResponse.data);

      // Fetch security alerts
      const securityResponse = await apiClient.get('/api/it/security-alerts');
      setSecurityAlerts(securityResponse.data.alerts);
      setAlertPagination(securityResponse.data.pagination);

      // Fetch support tickets
      const ticketsResponse = await apiClient.get('/api/it/support-tickets');
      setSupportTickets(ticketsResponse.data);

      // Fetch system metrics
      const metricsResponse = await apiClient.get('/api/it/system-metrics');
      setSystemMetrics(metricsResponse.data);

      // Fetch recent activity
      const activityResponse = await apiClient.get('/api/it/recent-activity');
      setRecentActivity(activityResponse.data.activities);
      setActivityPagination(activityResponse.data.pagination);

      // Fetch network status
      const networkResponse = await apiClient.get('/api/it/network-status');
      setNetworkStatus(networkResponse.data);

      // Fetch backup status
      const backupResponse = await apiClient.get('/api/it/backup-status');
      setBackupStatus(backupResponse.data);

    } catch (error) {
      console.error('Error fetching IT dashboard data:', error);
      if (showLoading) {
      toast.error('Failed to load dashboard data');
      }
      // Track error
      trackITDashboardEvent.errorOccurred('dashboard_data_fetch', error.message, 'overview');
    } finally {
      if (showLoading) {
      setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  };

  const fetchUsers = async (page = 1) => {
    try {
      setUserLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...userFilters
      });
      
      const response = await apiClient.get(`/api/it/users?${params}`);
      setUsers(response.data.users);
      setUserPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setUserLoading(false);
    }
  };

  const fetchActivities = async (page = 1) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });
      
      const response = await apiClient.get(`/api/it/recent-activity?${params}`);
      setRecentActivity(response.data.activities);
      setActivityPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast.error('Failed to load activities');
    }
  };

  const fetchSecurityAlerts = async (page = 1) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });
      
      const response = await apiClient.get(`/api/it/security-alerts?${params}`);
      setSecurityAlerts(response.data.alerts);
      setAlertPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching security alerts:', error);
      toast.error('Failed to load security alerts');
    }
  };

  const fetchSuspendedAccounts = async (page = 1) => {
    try {
      setSuspendedAccountsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...suspendedAccountsFilters
      });
      
      const response = await apiClient.get(`/api/it/suspended-accounts?${params}`);
      setSuspendedAccounts(response.data.suspendedUsers);
      setSuspendedAccountsPagination(response.data.pagination);
      setSuspendedAccountsStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching suspended accounts:', error);
      toast.error('Failed to load suspended accounts');
      setSuspendedAccounts([]);
    } finally {
      setSuspendedAccountsLoading(false);
    }
  };

  const fetchLockedAccounts = async () => {
    try {
      setLockedAccountsLoading(true);
      const response = await apiClient.get('/api/it/users?accountLocked=true');
      setLockedAccounts(response.data.users);
    } catch (error) {
      console.error('Error fetching locked accounts:', error);
      toast.error('Failed to load locked accounts');
    } finally {
      setLockedAccountsLoading(false);
    }
  };

  const fetchMaintenanceStatus = async () => {
    try {
      setMaintenanceLoading(true);
      const response = await apiClient.get('/api/it/maintenance/status');
      setMaintenanceStatus(response.data.maintenanceMode);
      
      // Fetch blocked login attempts if maintenance is enabled
      if (response.data.maintenanceMode.enabled) {
        await fetchBlockedAttempts();
      } else {
        setBlockedAttempts([]);
      }
    } catch (error) {
      console.error('Error fetching maintenance status:', error);
      toast.error('Failed to load maintenance status');
    } finally {
      setMaintenanceLoading(false);
    }
  };

  const fetchBlockedAttempts = async () => {
    try {
      const response = await apiClient.get('/api/it/blocked-login-attempts?limit=10&days=1');
      setBlockedAttempts(response.data.blockedAttempts);
    } catch (error) {
      console.error('Error fetching blocked attempts:', error);
      setBlockedAttempts([]);
    }
  };

  const handleMaintenanceToggle = async (enable, message = '', estimatedDuration = '') => {
    try {
      setMaintenanceLoading(true);
      const endpoint = enable ? '/api/it/maintenance/enable' : '/api/it/maintenance/disable';
      const data = enable ? { message, estimatedDuration } : {};
      
      const response = await apiClient.post(endpoint, data);
      setMaintenanceStatus(response.data.maintenanceMode);
      
      // Track maintenance mode toggle
      if (enable) {
        trackITDashboardEvent.maintenanceModeEnabled(message, estimatedDuration);
      } else {
        trackITDashboardEvent.maintenanceModeDisabled();
      }
      
      toast.success(response.data.message);
    } catch (error) {
      console.error('Error toggling maintenance mode:', error);
      
      // Handle specific conflict errors
      if (error.response?.status === 409) {
        toast.error(error.response.data.message || 'Cannot enable maintenance mode while system lock is active', {
          duration: 6000,
          style: {
            background: '#fef3c7',
            border: '1px solid #fbbf24',
            color: '#d97706',
            minWidth: '400px'
          }
        });
      } else {
        toast.error(error.response?.data?.error || 'Failed to toggle maintenance mode');
      }
      
      // Track error
      trackITDashboardEvent.errorOccurred('maintenance_toggle', error.message, 'maintenance');
    } finally {
      setMaintenanceLoading(false);
    }
  };

  const fetchSystemLockStatus = async () => {
    try {
      setSystemLockLoading(true);
      const response = await apiClient.get('/api/it/system-lock/status');
      
      // Ensure we have a valid response with the expected structure
      if (response.data && response.data.systemLock) {
        setSystemLockStatus(response.data.systemLock);
      } else {
        // Set default values if response is invalid
        setSystemLockStatus({
          enabled: false,
          reason: '',
          emergencyContact: '',
          activatedAt: null,
          activatedBy: null
        });
      }
      
      // Fetch blocked login attempts if system lock is enabled
      if (response.data?.systemLock?.enabled) {
        await fetchSystemLockBlockedAttempts();
      } else {
        setSystemLockBlockedAttempts([]);
      }
    } catch (error) {
      console.error('Error fetching system lock status:', error);
      toast.error('Failed to load system lock status');
      
      // Set default values on error to prevent undefined access
      setSystemLockStatus({
        enabled: false,
        reason: '',
        emergencyContact: '',
        activatedAt: null,
        activatedBy: null
      });
      setSystemLockBlockedAttempts([]);
    } finally {
      setSystemLockLoading(false);
    }
  };

  const fetchSystemLockBlockedAttempts = async () => {
    try {
      const response = await apiClient.get('/api/it/system-lock/blocked-attempts?limit=10&days=1');
      setSystemLockBlockedAttempts(response.data.blockedAttempts);
    } catch (error) {
      console.error('Error fetching system lock blocked attempts:', error);
      setSystemLockBlockedAttempts([]);
    }
  };

  const handleSystemLockToggle = async (enable, reason = '', emergencyContact = '') => {
    try {
      setSystemLockLoading(true);
      const endpoint = enable ? '/api/it/system-lock/enable' : '/api/it/system-lock/disable';
      const data = enable ? { reason, emergencyContact } : {};
      
      const response = await apiClient.post(endpoint, data);
      setSystemLockStatus(response.data.systemLock);
      
      // Track system lock toggle
      if (enable) {
        trackITDashboardEvent.systemLockEnabled(reason);
      } else {
        trackITDashboardEvent.systemLockDisabled();
      }
      
      toast.success(response.data.message);
    } catch (error) {
      console.error('Error toggling system lock:', error);
      
      // Handle specific conflict errors
      if (error.response?.status === 409) {
        toast.error(error.response.data.message || 'Cannot enable system lock while maintenance mode is active', {
          duration: 6000,
          style: {
            background: '#fef3c7',
            border: '1px solid #fbbf24',
            color: '#d97706',
            minWidth: '400px'
          }
        });
      } else {
        toast.error(error.response?.data?.error || 'Failed to toggle system lock');
      }
      
      // Track error
      trackITDashboardEvent.errorOccurred('system_lock_toggle', error.message, 'system-lock');
    } finally {
      setSystemLockLoading(false);
    }
  };

  const handleUserAction = async (userId, action, data = {}) => {
    try {
      let response;
      
      switch (action) {
        case 'view':
          // Find the user in the current list (suspended accounts or regular users)
          const userList = getCurrentView() === 'suspended-accounts' ? suspendedAccounts : users;
          const user = userList.find(u => u._id === userId);
          if (user) {
            setSelectedUser(user);
            setShowUserDetailsModal(true);
            // Track user details view
            trackFeatureUsage('user_management', 'view_details', { 
              userId, 
              userEmail: user.email,
              userRole: user.role,
              context: getCurrentView()
            });
          }
          return;
        case 'activate':
          response = await apiClient.patch(`/api/it/users/${userId}/status`, {
            isActive: true
          });
          // Track user activation
          trackITDashboardEvent.userActivated(userId, data.userEmail || 'unknown');
          break;
        case 'deactivate':
          response = await apiClient.patch(`/api/it/users/${userId}/status`, {
            isActive: false
          });
          // Track user suspension
          trackITDashboardEvent.userSuspended(userId, data.userEmail || 'unknown', data.reason || 'No reason provided');
          break;
        case 'updateRole':
          response = await apiClient.patch(`/api/it/users/${userId}/role`, {
            role: data.role
          });
          // Track role change
          trackITDashboardEvent.userRoleChanged(userId, data.oldRole || 'unknown', data.role);
          break;
        case 'unlock':
          response = await apiClient.patch(`/api/it/users/${userId}/unlock`);
          // Track account unlock
          trackFeatureUsage('user_management', 'unlock_account', { userId });
          break;
        case 'delete':
          response = await apiClient.delete(`/api/it/users/${userId}`);
          // Track user deletion
          trackFeatureUsage('user_management', 'delete_user', { userId });
          break;
        default:
          return;
      }
      
      toast.success(response.data.message);
      
      // Refresh the appropriate list based on current view
      if (getCurrentView() === 'suspended-accounts') {
        fetchSuspendedAccounts(suspendedAccountsPagination.currentPage);
      } else {
      fetchUsers(userPagination.currentPage);
      }
    } catch (error) {
      console.error('Error performing user action:', error);
      
      // Handle specific IT user protection errors
      if (error.response?.data?.error === 'Cannot suspend IT users') {
        toast.error('IT users are protected from suspension for system security', {
          duration: 5000,
          icon: '🛡️'
        });
      } else if (error.response?.data?.error === 'Cannot delete IT users') {
        toast.error('IT users are protected from deletion for system security', {
          duration: 5000,
          icon: '🛡️'
        });
      } else if (error.response?.data?.error === 'Cannot change IT user role') {
        toast.error('IT users must maintain their IT role for system security', {
          duration: 5000,
          icon: '🛡️'
        });
      } else {
        toast.error(error.response?.data?.error || 'Failed to perform action');
      }
      
      // Track error
      trackITDashboardEvent.errorOccurred('user_action', error.message, getCurrentView());
    }
  };

  const handleFilterChange = (filterType, value) => {
    setUserFilters(prev => ({ ...prev, [filterType]: value }));
  };

  const handleSearch = () => {
    fetchUsers(1);
    // Track search
    trackITDashboardEvent.searchPerformed(userFilters.search || '', users.length);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
      case 'connected':
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'offline':
      case 'disconnected':
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'online':
      case 'connected':
      case 'healthy':
        return <CheckCircle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'offline':
      case 'disconnected':
      case 'error':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getUsageColor = (usage) => {
    if (usage < 50) return 'text-green-600';
    if (usage < 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Helper function to safely render details (handles both strings and objects)
  const renderDetails = (details) => {
    if (!details) return 'No details';
    if (typeof details === 'string') return details;
    if (typeof details === 'object') {
      // Handle the specific case of LOGIN_BLOCKED details object
      if (details.reason) return details.reason;
      if (details.type) return `${details.type}: ${details.reason || 'No reason provided'}`;
      // For other objects, try to stringify safely
      try {
        return JSON.stringify(details);
      } catch {
        return 'Object details';
      }
    }
    return String(details);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">IT Dashboard</h1>
          <p className="text-gray-600">System monitoring and IT infrastructure management</p>
        </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
             {refreshing && (
               <div className="flex items-center space-x-2 text-sm text-gray-500">
                 <RefreshCw className="h-4 w-4 animate-spin" />
                 <span className="hidden sm:inline">Updating...</span>
               </div>
             )}
          <button
            onClick={fetchDashboardData}
              className="flex items-center space-x-2 px-3 py-2 sm:px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>



      {/* Content based on current view */}
      {getCurrentView() === 'overview' && (
        <div className="space-y-6">
          {/* System Health Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Server Status</p>
                  <p className="text-2xl font-bold text-gray-900">{systemHealth.uptime}</p>
                </div>
                <div className={`p-3 rounded-full ${getStatusColor(systemHealth.serverStatus)}`}>
                  {getStatusIcon(systemHealth.serverStatus)}
                </div>
              </div>
              <div className="mt-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(systemHealth.serverStatus)}`}>
                  {systemHealth.serverStatus}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Database</p>
                  <p className="text-2xl font-bold text-gray-900">{systemHealth.databaseStatus === 'connected' ? 'Connected' : 'Disconnected'}</p>
                </div>
                <div className={`p-3 rounded-full ${getStatusColor(systemHealth.databaseStatus)}`}>
                  {getStatusIcon(systemHealth.databaseStatus)}
                </div>
              </div>
              <div className="mt-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(systemHealth.databaseStatus)}`}>
                  {systemHealth.databaseStatus}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Memory Usage</p>
                  <p className="text-2xl font-bold text-gray-900">{systemHealth.memoryUsage}</p>
                </div>
                <div className={`p-3 rounded-full ${getStatusColor(systemHealth.serverStatus)}`}>
                  <Database className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-xs text-gray-500">
                  {systemHealth.freeMemory} free of {systemHealth.totalMemory}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Server Uptime</p>
                  <p className="text-2xl font-bold text-gray-900">{systemHealth.serverUptime}</p>
                </div>
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  <Clock className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-xs text-gray-500">
                  CPU Load: {systemHealth.cpuLoad}
                </span>
              </div>
            </div>
          </div>

          {/* System Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">System Resources</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">CPU Usage</span>
                    <span className={getUsageColor(systemMetrics.cpuUsage)}>{systemMetrics.cpuUsage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${systemMetrics.cpuUsage < 50 ? 'bg-green-500' : systemMetrics.cpuUsage < 80 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${systemMetrics.cpuUsage}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Memory Usage</span>
                    <span className={getUsageColor(systemMetrics.memoryUsage)}>{systemMetrics.memoryUsage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${systemMetrics.memoryUsage < 50 ? 'bg-green-500' : systemMetrics.memoryUsage < 80 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${systemMetrics.memoryUsage}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Disk Usage</span>
                    <span className={getUsageColor(systemMetrics.diskUsage)}>{systemMetrics.diskUsage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${systemMetrics.diskUsage < 50 ? 'bg-green-500' : systemMetrics.diskUsage < 80 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${systemMetrics.diskUsage}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Network Usage</span>
                    <span className={getUsageColor(systemMetrics.networkUsage)}>{systemMetrics.networkUsage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${systemMetrics.networkUsage < 50 ? 'bg-green-500' : systemMetrics.networkUsage < 80 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${systemMetrics.networkUsage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">User Statistics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Users</span>
                  <span className="text-lg font-semibold">{userStats.totalUsers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Active Users</span>
                  <span className="text-lg font-semibold text-green-600">{userStats.activeUsers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Inactive Users</span>
                  <span className="text-lg font-semibold text-red-600">{userStats.inactiveUsers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Recent Logins (24h)</span>
                  <span className="text-lg font-semibold text-blue-600">{userStats.recentLogins}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Failed Attempts</span>
                  <span className="text-lg font-semibold text-orange-600">{userStats.failedAttempts}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">New Users (7 days)</span>
                  <span className="text-lg font-semibold text-purple-600">{userStats.newUsersThisWeek}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                                         <div className="flex-1 min-w-0">
                       <p className="text-sm text-gray-900">{activity.description}</p>
                       <p className="text-xs text-gray-500">{activity.timeAgo || new Date(activity.timestamp).toLocaleString()}</p>
                     </div>
                    <div className="flex-shrink-0">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        activity.type === 'info' ? 'bg-blue-100 text-blue-800' :
                        activity.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {activity.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {getCurrentView() === 'users' && (
        <div className="space-y-6">
                     {/* User Statistics Summary */}
           <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl shadow-lg border border-blue-200">
             <div className="px-6 py-4 border-b border-blue-200 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-xl">
               <div className="flex items-center space-x-3">
                 <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                   <Users className="h-6 w-6 text-white" />
                 </div>
                 <h3 className="text-xl font-bold text-white">User Statistics Overview</h3>
               </div>
            </div>
                         <div className="p-4 sm:p-6">
                {/* Main Statistics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                 <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                   <div className="flex items-center justify-between">
                     <div>
                       <p className="text-sm font-medium text-gray-600 mb-1">Total Users</p>
                       <p className="text-3xl font-bold text-blue-600">{userStats.totalUsers}</p>
                </div>
                     <div className="p-3 bg-blue-100 rounded-full">
                       <Users className="h-6 w-6 text-blue-600" />
                </div>
                   </div>
                   <div className="mt-4 flex items-center text-sm text-gray-500">
                     <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                     <span>All registered users</span>
                   </div>
                 </div>

                 <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                   <div className="flex items-center justify-between">
                     <div>
                       <p className="text-sm font-medium text-gray-600 mb-1">Active Users</p>
                       <p className="text-3xl font-bold text-green-600">{userStats.activeUsers}</p>
                     </div>
                     <div className="p-3 bg-green-100 rounded-full">
                       <UserCheck className="h-6 w-6 text-green-600" />
                     </div>
                   </div>
                   <div className="mt-4 flex items-center text-sm text-gray-500">
                     <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                     <span>Currently active</span>
                   </div>
                 </div>

                 <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                   <div className="flex items-center justify-between">
                     <div>
                       <p className="text-sm font-medium text-gray-600 mb-1">Inactive Users</p>
                       <p className="text-3xl font-bold text-red-600">{userStats.inactiveUsers}</p>
                     </div>
                     <div className="p-3 bg-red-100 rounded-full">
                       <UserX className="h-6 w-6 text-red-600" />
                     </div>
                   </div>
                   <div className="mt-4 flex items-center text-sm text-gray-500">
                     <XCircle className="h-4 w-4 text-red-500 mr-1" />
                     <span>Suspended accounts</span>
                   </div>
                </div>
              </div>
              
                              {/* User Roles Breakdown */}
                {userStats.usersByRole && Object.keys(userStats.usersByRole).length > 0 && (
                  <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
                    <div className="flex items-center space-x-3 mb-4 sm:mb-6">
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <Shield className="h-5 w-5 text-indigo-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">Users by Role</h4>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4">
                    {Object.entries(userStats.usersByRole).map(([role, count]) => (
                       <div key={role} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 text-center hover:shadow-md transition-all duration-300 transform hover:scale-105 border border-gray-200">
                         <div className="text-2xl font-bold text-gray-900 mb-1">{count}</div>
                         <div className="text-xs font-medium text-gray-600 capitalize leading-tight">
                           {role.replace('_', ' ')}
                         </div>
                         <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
                           <div 
                             className="bg-gradient-to-r from-blue-500 to-indigo-500 h-1 rounded-full"
                             style={{ width: `${(count / userStats.totalUsers) * 100}%` }}
                           ></div>
                         </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

                               {/* Additional Statistics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-4 sm:mt-6">
                 <div className="bg-white rounded-xl shadow-md p-6">
                   <div className="flex items-center space-x-3 mb-4">
                     <div className="p-2 bg-blue-100 rounded-lg">
                       <Activity className="h-5 w-5 text-blue-600" />
            </div>
                     <h4 className="text-lg font-semibold text-gray-900">Recent Activity</h4>
          </div>
                   <div className="space-y-3">
                     <div className="flex justify-between items-center">
                       <span className="text-sm text-gray-600">Recent Logins (24h)</span>
                       <span className="text-lg font-semibold text-blue-600">{userStats.recentLogins}</span>
        </div>
                     <div className="flex justify-between items-center">
                       <span className="text-sm text-gray-600">Failed Attempts</span>
                       <span className="text-lg font-semibold text-orange-600">{userStats.failedAttempts}</span>
                     </div>
                     <div className="flex justify-between items-center">
                       <span className="text-sm text-gray-600">New Users (7 days)</span>
                       <span className="text-lg font-semibold text-purple-600">{userStats.newUsersThisWeek || 0}</span>
                     </div>
                   </div>
                 </div>

                 <div className="bg-white rounded-xl shadow-md p-6">
                   <div className="flex items-center space-x-3 mb-4">
                     <div className="p-2 bg-green-100 rounded-lg">
                       <BarChart3 className="h-5 w-5 text-green-600" />
                     </div>
                     <h4 className="text-lg font-semibold text-gray-900">System Health</h4>
                   </div>
                   <div className="space-y-3">
                     <div className="flex justify-between items-center">
                       <span className="text-sm text-gray-600">Active Rate</span>
                       <span className="text-lg font-semibold text-green-600">
                         {userStats.totalUsers > 0 ? Math.round((userStats.activeUsers / userStats.totalUsers) * 100) : 0}%
                       </span>
                     </div>
                     <div className="flex justify-between items-center">
                       <span className="text-sm text-gray-600">Inactive Rate</span>
                       <span className="text-lg font-semibold text-red-600">
                         {userStats.totalUsers > 0 ? Math.round((userStats.inactiveUsers / userStats.totalUsers) * 100) : 0}%
                       </span>
                     </div>
                     <div className="flex justify-between items-center">
                       <span className="text-sm text-gray-600">Growth Rate</span>
                       <span className="text-lg font-semibold text-blue-600">
                         {userStats.newUsersThisWeek > 0 ? '+' : ''}{userStats.newUsersThisWeek || 0} this week
                       </span>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
           </div>

          {/* User Management Table */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">User Management</h3>
            </div>
            <div className="p-6">
                             {/* Search and Filters */}
               <div className="mb-6 space-y-4">
                 <div className="flex flex-col sm:flex-row gap-4">
                   <div className="flex-1">
                     <div className="relative">
                       <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                       <input
                         type="text"
                         placeholder="Search users by name, email, or username..."
                         className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                         value={userFilters.search}
                         onChange={(e) => handleFilterChange('search', e.target.value)}
                         onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                       />
                </div>
                </div>
                   <div className="flex flex-col sm:flex-row gap-2">
                     <select
                       className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                       value={userFilters.role}
                       onChange={(e) => handleFilterChange('role', e.target.value)}
                     >
                       <option value="">All Roles</option>
                       <option value="admin">Admin</option>
                       <option value="doctor">Doctor</option>
                       <option value="nurse">Nurse</option>
                       <option value="receptionist">Receptionist</option>
                       <option value="lab_technician">Lab Technician</option>
                       <option value="it">IT</option>
                       <option value="user">User</option>
                     </select>
                     <select
                       className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                       value={userFilters.status}
                       onChange={(e) => handleFilterChange('status', e.target.value)}
                     >
                       <option value="">All Status</option>
                       <option value="active">Active</option>
                       <option value="inactive">Inactive</option>
                     </select>
                     <button
                       onClick={handleSearch}
                       className="px-3 py-2 sm:px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm"
                     >
                       Search
                     </button>
                   </div>
                </div>
              </div>
              
                             {/* Users Table */}
               {userLoading ? (
                 <div className="text-center py-8">
                   <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                   <p className="mt-2 text-gray-600">Loading users...</p>
                      </div>
               ) : (
                 <div>
                   {/* Desktop Table View */}
                   <div className="hidden lg:block overflow-x-auto">
                     <table className="min-w-full divide-y divide-gray-200">
                       <thead className="bg-gray-50">
                         <tr>
                           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                             User
                           </th>
                           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                             Role
                           </th>
                           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                             Status
                           </th>
                           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                             Created
                           </th>
                           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                             Actions
                           </th>
                         </tr>
                       </thead>
                       <tbody className="bg-white divide-y divide-gray-200">
                         {users.map((user) => (
                           <tr key={user._id} className="hover:bg-gray-50">
                             <td className="px-6 py-4 whitespace-nowrap">
                               <div className="flex items-center">
                                 <div className="flex-shrink-0 h-10 w-10">
                                   <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                     <span className="text-sm font-medium text-blue-600">
                                       {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                                     </span>
                                   </div>
                                 </div>
                                 <div className="ml-4">
                                   <div className="text-sm font-medium text-gray-900">
                                     {user.firstName} {user.lastName}
                                   </div>
                                   <div className="text-sm text-gray-500">{user.email}</div>
                                   <div className="text-xs text-gray-400">@{user.username}</div>
                                 </div>
                               </div>
                             </td>
                             <td className="px-6 py-4 whitespace-nowrap">
                               <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                 user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                 user.role === 'doctor' ? 'bg-blue-100 text-blue-800' :
                                 user.role === 'nurse' ? 'bg-green-100 text-green-800' :
                                 user.role === 'it' ? 'bg-orange-100 text-orange-800' :
                                 'bg-gray-100 text-gray-800'
                               }`}>
                                 {user.role || 'No Role'}
                               </span>
                             </td>
                             <td className="px-6 py-4 whitespace-nowrap">
                               <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                 user.isActive 
                                   ? 'bg-green-100 text-green-800' 
                                   : 'bg-red-100 text-red-800'
                               }`}>
                                 {user.isActive ? (
                                   <>
                                     <UserCheck className="h-3 w-3 mr-1" />
                                     {user.role === 'it' ? 'Protected' : 'Active'}
                                   </>
                                 ) : (
                                   <>
                                     <UserX className="h-3 w-3 mr-1" />
                                     Inactive
                                   </>
                                 )}
                               </span>
                               {user.role === 'it' && (
                                 <div className="mt-1 text-xs text-blue-600">
                                   <Shield className="h-3 w-3 inline mr-1" />
                                   IT Protected
                                 </div>
                               )}
                             </td>
                             <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                               {new Date(user.createdAt).toLocaleDateString()}
                             </td>
                             <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                               <div className="flex space-x-2">
                                 {user.isActive ? (
                                   user.role !== 'it' && (
                                     <button
                                       onClick={() => handleUserAction(user._id, 'deactivate')}
                                       className="text-red-600 hover:text-red-900 flex items-center"
                                       title="Deactivate User"
                                     >
                                       <UserX className="h-4 w-4 mr-1" />
                                       Suspend
                                     </button>
                                   )
                                 ) : (
                                   <button
                                     onClick={() => handleUserAction(user._id, 'activate')}
                                     className="text-green-600 hover:text-green-900 flex items-center"
                                     title="Activate User"
                                   >
                                     <UserCheck className="h-4 w-4 mr-1" />
                                     Activate
                                   </button>
                                 )}
                                 {user.accountLocked && (
                                   <button
                                     onClick={() => handleUserAction(user._id, 'unlock')}
                                     className="text-orange-600 hover:text-orange-900 flex items-center"
                                     title="Unlock Account"
                                   >
                                     <Unlock className="h-4 w-4 mr-1" />
                                     Unlock
                                   </button>
                                 )}
                                 <select
                                   className="text-sm border border-gray-300 rounded px-2 py-1"
                                   value={user.role || ''}
                                   onChange={(e) => handleUserAction(user._id, 'updateRole', { role: e.target.value })}
                                 >
                                   <option value="">No Role</option>
                                   <option value="admin">Admin</option>
                                   <option value="doctor">Doctor</option>
                                   <option value="nurse">Nurse</option>
                                   <option value="receptionist">Receptionist</option>
                                   <option value="lab_technician">Lab Technician</option>
                                   <option value="it">IT</option>
                                   <option value="user">User</option>
                                 </select>
                                 {user.role !== 'it' && (
                                   <button
                                     onClick={() => {
                                       if (window.confirm('Are you sure you want to delete this user?')) {
                                         handleUserAction(user._id, 'delete');
                                       }
                                     }}
                                     className="text-red-600 hover:text-red-900"
                                     title="Delete User"
                                   >
                                     <XCircle className="h-4 w-4" />
                                   </button>
                                 )}
                               </div>
                             </td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                  </div>

                   {/* Mobile Card View */}
                   <div className="lg:hidden space-y-4">
                     {users.map((user) => (
                       <div key={user._id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                         {/* User Header */}
                         <div className="flex items-center justify-between mb-3">
                           <div className="flex items-center">
                             <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                               <span className="text-sm font-medium text-blue-600">
                                 {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                               </span>
                </div>
                             <div className="ml-3">
                               <div className="text-sm font-medium text-gray-900">
                                 {user.firstName} {user.lastName}
                               </div>
                               <div className="text-xs text-gray-500">{user.email}</div>
                             </div>
                           </div>
                           <div className="text-right">
                             <div className="text-xs text-gray-400">@{user.username}</div>
                             <div className="text-xs text-gray-500 mt-1">
                               {new Date(user.createdAt).toLocaleDateString()}
                             </div>
                           </div>
                         </div>

                         {/* User Details */}
                         <div className="flex flex-wrap gap-2 mb-3">
                           <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                             user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                             user.role === 'doctor' ? 'bg-blue-100 text-blue-800' :
                             user.role === 'nurse' ? 'bg-green-100 text-green-800' :
                             user.role === 'it' ? 'bg-orange-100 text-orange-800' :
                             'bg-gray-100 text-gray-800'
                           }`}>
                             {user.role || 'No Role'}
                           </span>
                           <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                             user.isActive 
                               ? 'bg-green-100 text-green-800' 
                               : 'bg-red-100 text-red-800'
                           }`}>
                             {user.isActive ? (
                               <>
                                 <UserCheck className="h-3 w-3 mr-1" />
                                 {user.role === 'it' ? 'Protected' : 'Active'}
                               </>
                             ) : (
                               <>
                                 <UserX className="h-3 w-3 mr-1" />
                                 Inactive
                               </>
                             )}
                           </span>
                           {user.role === 'it' && (
                             <div className="mt-1 text-xs text-blue-600">
                               <Shield className="h-3 w-3 inline mr-1" />
                               IT Protected
                             </div>
                           )}
            </div>

                         {/* Actions */}
                         <div className="flex flex-col sm:flex-row gap-2">
                           <div className="flex gap-2">
                             {user.isActive ? (
                               user.role !== 'it' && (
                                 <button
                                   onClick={() => handleUserAction(user._id, 'deactivate')}
                                   className="flex-1 sm:flex-none flex items-center justify-center px-3 py-2 text-sm text-red-600 hover:text-red-900 border border-red-200 rounded-md hover:bg-red-50 transition-colors"
                                   title="Deactivate User"
                                 >
                                   <UserX className="h-4 w-4 mr-1" />
                                   Suspend
                                 </button>
                               )
                             ) : (
                               <button
                                 onClick={() => handleUserAction(user._id, 'activate')}
                                 className="flex-1 sm:flex-none flex items-center justify-center px-3 py-2 text-sm text-green-600 hover:text-green-900 border border-green-200 rounded-md hover:bg-green-50 transition-colors"
                                 title="Activate User"
                               >
                                 <UserCheck className="h-4 w-4 mr-1" />
                                 Activate
                               </button>
                             )}
                             {user.accountLocked && (
                               <button
                                 onClick={() => handleUserAction(user._id, 'unlock')}
                                 className="flex-1 sm:flex-none flex items-center justify-center px-3 py-2 text-sm text-orange-600 hover:text-orange-900 border border-orange-200 rounded-md hover:bg-orange-50 transition-colors"
                                 title="Unlock Account"
                               >
                                 <Unlock className="h-4 w-4 mr-1" />
                                 Unlock
                               </button>
                             )}
                             {user.role !== 'it' && (
                               <button
                                 onClick={() => {
                                   if (window.confirm('Are you sure you want to delete this user?')) {
                                     handleUserAction(user._id, 'delete');
                                   }
                                 }}
                                 className="px-3 py-2 text-sm text-red-600 hover:text-red-900 border border-red-200 rounded-md hover:bg-red-50 transition-colors"
                                 title="Delete User"
                               >
                                 <XCircle className="h-4 w-4" />
                               </button>
                             )}
                           </div>
                           <select
                             className="flex-1 sm:flex-none text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                             value={user.role || ''}
                             onChange={(e) => handleUserAction(user._id, 'updateRole', { role: e.target.value })}
                           >
                             <option value="">No Role</option>
                             <option value="admin">Admin</option>
                             <option value="doctor">Doctor</option>
                             <option value="nurse">Nurse</option>
                             <option value="receptionist">Receptionist</option>
                             <option value="lab_technician">Lab Technician</option>
                             <option value="it">IT</option>
                             <option value="user">User</option>
                           </select>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               )}

                             {/* Pagination */}
               {userPagination.totalPages > 1 && (
                 <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                   <div className="text-sm text-gray-700 text-center sm:text-left">
                     Showing page {userPagination.currentPage} of {userPagination.totalPages} 
                     ({userPagination.totalUsers} total users)
                   </div>
                   <div className="flex justify-center sm:justify-end space-x-2">
                     <button
                       onClick={() => fetchUsers(userPagination.currentPage - 1)}
                       disabled={!userPagination.hasPrevPage}
                       className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                     >
                       Previous
                     </button>
                     <button
                       onClick={() => fetchUsers(userPagination.currentPage + 1)}
                       disabled={!userPagination.hasNextPage}
                       className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                     >
                       Next
                     </button>
                   </div>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {getCurrentView() === 'security' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
               <h3 className="text-lg font-medium text-gray-900">Recent Security Events</h3>
            </div>
            <div className="p-6">
               {/* Desktop Table View */}
               <div className="hidden lg:block overflow-x-auto">
                 <table className="min-w-full divide-y divide-gray-200">
                   <thead className="bg-gray-50">
                     <tr>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                         Timestamp
                       </th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                         Email
                       </th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                         Event Type
                       </th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                         IP
                       </th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                         Device
                       </th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                         Details
                       </th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                         Status
                       </th>
                     </tr>
                   </thead>
                   <tbody className="bg-white divide-y divide-gray-200">
                {securityAlerts.map((alert, index) => (
                       <tr key={index} className="hover:bg-gray-50">
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                           {new Date(alert.timestamp).toLocaleString()}
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                           {alert.userEmail || 'N/A'}
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap">
                           <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                             alert.eventType === 'LOGIN_SUCCESS' ? 'bg-green-100 text-green-800' :
                             alert.eventType === 'LOGIN_FAILED' ? 'bg-red-100 text-red-800' :
                             alert.eventType === 'LOGIN_BLOCKED' ? 'bg-red-100 text-red-800' :
                             alert.eventType === 'USER_SUSPENDED' ? 'bg-orange-100 text-orange-800' :
                             alert.eventType === 'USER_ACTIVATED' ? 'bg-green-100 text-green-800' :
                             'bg-gray-100 text-gray-800'
                           }`}>
                             {alert.eventType || 'N/A'}
                           </span>
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                           {alert.ipAddress || 'N/A'}
                         </td>
                         <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                           <div className="truncate" title={alert.userAgent || 'N/A'}>
                             {alert.userAgent || 'N/A'}
                           </div>
                         </td>
                         <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                           <div className="break-words" title={renderDetails(alert.details)}>
                             {renderDetails(alert.details)}
                           </div>
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap">
                           <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                             alert.status === 'action-required' ? 'bg-red-100 text-red-800' :
                             alert.status === 'investigating' ? 'bg-yellow-100 text-yellow-800' :
                             alert.status === 'monitoring' ? 'bg-blue-100 text-blue-800' :
                             'bg-green-100 text-green-800'
                           }`}>
                             {alert.status || 'N/A'}
                           </span>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>

               {/* Mobile Card View */}
               <div className="lg:hidden space-y-4">
                 {securityAlerts.map((alert, index) => (
                   <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                     <div className="flex items-center justify-between mb-2">
                       <div className="flex items-center space-x-2">
                         <div className={`p-1 rounded-full ${
                      alert.severity === 'high' ? 'bg-red-100 text-red-600' :
                      alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                           <AlertTriangle className="h-3 w-3" />
                    </div>
                         <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                           alert.eventType === 'LOGIN_SUCCESS' ? 'bg-green-100 text-green-800' :
                           alert.eventType === 'LOGIN_FAILED' ? 'bg-red-100 text-red-800' :
                           alert.eventType === 'LOGIN_BLOCKED' ? 'bg-red-100 text-red-800' :
                           alert.eventType === 'USER_SUSPENDED' ? 'bg-orange-100 text-orange-800' :
                           alert.eventType === 'USER_ACTIVATED' ? 'bg-green-100 text-green-800' :
                           'bg-gray-100 text-gray-800'
                         }`}>
                           {alert.eventType || 'N/A'}
                         </span>
                    </div>
                       <span className="text-xs text-gray-500">
                         {new Date(alert.timestamp).toLocaleString()}
                       </span>
                     </div>
                                            <div className="space-y-1 text-sm">
                         <div><span className="font-medium">Email:</span> {alert.userEmail || 'N/A'}</div>
                         <div><span className="font-medium">IP:</span> {alert.ipAddress || 'N/A'}</div>
                         <div><span className="font-medium">Device:</span> <span className="text-xs break-all">{alert.userAgent || 'N/A'}</span></div>
                         <div><span className="font-medium">Details:</span> <span className="text-sm break-words">{renderDetails(alert.details)}</span></div>
                         <div><span className="font-medium">Status:</span> 
                           <span className={`ml-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                             alert.status === 'action-required' ? 'bg-red-100 text-red-800' :
                             alert.status === 'investigating' ? 'bg-yellow-100 text-yellow-800' :
                             alert.status === 'monitoring' ? 'bg-blue-100 text-blue-800' :
                             'bg-green-100 text-green-800'
                           }`}>
                             {alert.status || 'N/A'}
                           </span>
                         </div>
                       </div>
                  </div>
                ))}
              </div>
              
              {/* Pagination Controls */}
              {alertPagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing page {alertPagination.currentPage} of {alertPagination.totalPages} 
                      ({alertPagination.totalAlerts} total alerts)
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => fetchSecurityAlerts(alertPagination.currentPage - 1)}
                        disabled={!alertPagination.hasPrev}
                        className={`px-3 py-1 text-sm font-medium rounded-md ${
                          alertPagination.hasPrev
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        Previous
                      </button>
                      <span className="text-sm text-gray-700">
                        Page {alertPagination.currentPage} of {alertPagination.totalPages}
                      </span>
                      <button
                        onClick={() => fetchSecurityAlerts(alertPagination.currentPage + 1)}
                        disabled={!alertPagination.hasNext}
                        className={`px-3 py-1 text-sm font-medium rounded-md ${
                          alertPagination.hasNext
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Infrastructure Tab */}
      {getCurrentView() === 'infrastructure' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Network Status</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Internet Connection</span>
                  <span className={`font-medium ${networkStatus.internetConnection === 'connected' ? 'text-green-600' : 'text-red-600'}`}>
                    {networkStatus.internetConnection}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Bandwidth Usage</span>
                  <span className="text-blue-600 font-medium">{networkStatus.bandwidthUsage}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Latency</span>
                  <span className="text-green-600 font-medium">{networkStatus.latency}ms</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Active Connections</span>
                  <span className="text-purple-600 font-medium">{networkStatus.activeConnections}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Backup Status</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Last Backup</span>
                  <span className={`font-medium ${backupStatus.backupStatus === 'successful' ? 'text-green-600' : 'text-red-600'}`}>
                    {backupStatus.lastBackup}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Backup Size</span>
                  <span className="text-blue-600 font-medium">{backupStatus.backupSize}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Next Backup</span>
                  <span className="text-gray-600 font-medium">{backupStatus.nextBackup}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Backups</span>
                  <span className="text-purple-600 font-medium">{backupStatus.totalBackups || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Support Tab */}
      {getCurrentView() === 'support' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Support Tickets</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {supportTickets.map((ticket, index) => (
                  <div key={index} className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg">
                    <div className={`p-2 rounded-full ${
                      ticket.priority === 'high' ? 'bg-red-100 text-red-600' :
                      ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-green-100 text-green-600'
                    }`}>
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{ticket.title}</p>
                      <p className="text-xs text-gray-500">Submitted by {ticket.submittedBy}</p>
                    </div>
                    <div className="text-xs text-gray-500">{ticket.status}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Health Tab */}
      {getCurrentView() === 'health' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">System Health</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Server Status</p>
                      <p className="text-2xl font-bold text-gray-900">{systemHealth.uptime}</p>
                    </div>
                    <div className={`p-3 rounded-full ${getStatusColor(systemHealth.serverStatus)}`}>
                      {getStatusIcon(systemHealth.serverStatus)}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Database</p>
                      <p className="text-2xl font-bold text-gray-900">{systemHealth.databaseStatus === 'connected' ? 'Connected' : 'Disconnected'}</p>
                    </div>
                    <div className={`p-3 rounded-full ${getStatusColor(systemHealth.databaseStatus)}`}>
                      {getStatusIcon(systemHealth.databaseStatus)}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Memory Usage</p>
                      <p className="text-2xl font-bold text-gray-900">{systemHealth.memoryUsage}</p>
                    </div>
                    <div className={`p-3 rounded-full ${getStatusColor(systemHealth.serverStatus)}`}>
                      <Database className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Server Uptime</p>
                      <p className="text-2xl font-bold text-gray-900">{systemHealth.serverUptime}</p>
                    </div>
                    <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                      <Clock className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Tab */}
      {getCurrentView() === 'metrics' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">System Metrics</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">System Resources</h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">CPU Usage</span>
                        <span className={getUsageColor(systemMetrics.cpuUsage)}>{systemMetrics.cpuUsage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${systemMetrics.cpuUsage < 50 ? 'bg-green-500' : systemMetrics.cpuUsage < 80 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${systemMetrics.cpuUsage}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Memory Usage</span>
                        <span className={getUsageColor(systemMetrics.memoryUsage)}>{systemMetrics.memoryUsage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${systemMetrics.memoryUsage < 50 ? 'bg-green-500' : systemMetrics.memoryUsage < 80 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${systemMetrics.memoryUsage}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Disk Usage</span>
                        <span className={getUsageColor(systemMetrics.diskUsage)}>{systemMetrics.diskUsage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${systemMetrics.diskUsage < 50 ? 'bg-green-500' : systemMetrics.diskUsage < 80 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${systemMetrics.diskUsage}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Network Usage</span>
                        <span className={getUsageColor(systemMetrics.networkUsage)}>{systemMetrics.networkUsage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${systemMetrics.networkUsage < 50 ? 'bg-green-500' : systemMetrics.networkUsage < 80 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${systemMetrics.networkUsage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Performance Metrics</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Response Time</span>
                      <span className="text-lg font-semibold">{systemMetrics.responseTime || 0}ms</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Active Connections</span>
                      <span className="text-lg font-semibold">{systemMetrics.activeConnections || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Memory</span>
                      <span className="text-lg font-semibold">{systemMetrics.totalMemory || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Free Memory</span>
                      <span className="text-lg font-semibold">{systemMetrics.freeMemory || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activity Tab */}
      {getCurrentView() === 'activity' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
               <h3 className="text-lg font-medium text-gray-900">Recent System Activity</h3>
            </div>
            <div className="p-6">
               {/* Desktop Table View */}
               <div className="hidden lg:block overflow-x-auto">
                 <table className="min-w-full divide-y divide-gray-200">
                   <thead className="bg-gray-50">
                     <tr>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                         Timestamp
                       </th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                         Type
                       </th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                         Event
                       </th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                         User
                       </th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                         IP Address
                       </th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                         Details
                       </th>
                     </tr>
                   </thead>
                   <tbody className="bg-white divide-y divide-gray-200">
                {recentActivity.map((activity, index) => (
                       <tr key={index} className="hover:bg-gray-50">
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                           {new Date(activity.timestamp).toLocaleString()}
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap">
                           <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                             activity.type === 'info' ? 'bg-blue-100 text-blue-800' :
                             activity.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                             activity.type === 'error' ? 'bg-red-100 text-red-800' :
                             'bg-gray-100 text-gray-800'
                           }`}>
                             {activity.type}
                           </span>
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                           {activity.eventType || 'N/A'}
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                           {activity.userEmail || 'N/A'}
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                           {activity.ipAddress || 'N/A'}
                         </td>
                         <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                           <div className="break-words" title={renderDetails(activity.details)}>
                             {renderDetails(activity.details)}
                    </div>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
                    </div>

               {/* Mobile Card View */}
               <div className="lg:hidden space-y-4">
                 {recentActivity.map((activity, index) => (
                   <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                     <div className="flex items-center justify-between mb-2">
                       <div className="flex items-center space-x-2">
                         <div className={`w-2 h-2 rounded-full ${
                           activity.type === 'info' ? 'bg-blue-500' :
                           activity.type === 'warning' ? 'bg-yellow-500' :
                           activity.type === 'error' ? 'bg-red-500' :
                           'bg-gray-500'
                         }`}></div>
                         <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        activity.type === 'info' ? 'bg-blue-100 text-blue-800' :
                        activity.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                           activity.type === 'error' ? 'bg-red-100 text-red-800' :
                           'bg-gray-100 text-gray-800'
                      }`}>
                        {activity.type}
                      </span>
                    </div>
                       <span className="text-xs text-gray-500">
                         {activity.timeAgo || new Date(activity.timestamp).toLocaleString()}
                       </span>
                     </div>
                                            <div className="space-y-1 text-sm">
                         <div><span className="font-medium">Event:</span> {activity.eventType || 'N/A'}</div>
                         <div><span className="font-medium">User:</span> {activity.userEmail || 'N/A'}</div>
                         <div><span className="font-medium">IP:</span> {activity.ipAddress || 'N/A'}</div>
                         <div><span className="font-medium">Details:</span> <span className="text-sm break-words">{renderDetails(activity.details)}</span></div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Pagination Controls */}
              {activityPagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing page {activityPagination.currentPage} of {activityPagination.totalPages} 
                      ({activityPagination.totalActivities} total activities)
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => fetchActivities(activityPagination.currentPage - 1)}
                        disabled={!activityPagination.hasPrev}
                        className={`px-3 py-1 text-sm font-medium rounded-md ${
                          activityPagination.hasPrev
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        Previous
                      </button>
                      <span className="text-sm text-gray-700">
                        Page {activityPagination.currentPage} of {activityPagination.totalPages}
                      </span>
                      <button
                        onClick={() => fetchActivities(activityPagination.currentPage + 1)}
                        disabled={!activityPagination.hasNext}
                        className={`px-3 py-1 text-sm font-medium rounded-md ${
                          activityPagination.hasNext
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        Next
                      </button>
            </div>
          </div>
        </div>
      )}
            </div>
          </div>
        </div>
      )}

      {/* Locked Accounts Tab */}
      {getCurrentView() === 'locked-accounts' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-br from-orange-50 to-red-100 rounded-xl shadow-lg border border-orange-200">
            <div className="px-6 py-4 border-b border-orange-200 bg-gradient-to-r from-orange-600 to-red-600 rounded-t-xl">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                  <Lock className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">Locked Accounts Management</h3>
              </div>
            </div>
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-orange-700 mb-1">
                    {lockedAccountsLoading ? 'Loading...' : `${lockedAccounts.length} locked accounts found`}
                  </p>
                  <p className="text-xs text-orange-600">
                    Accounts locked due to multiple failed login attempts
                  </p>
                </div>
                <button
                  onClick={fetchLockedAccounts}
                  disabled={lockedAccountsLoading}
                  className="flex items-center space-x-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 text-sm disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${lockedAccountsLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>
          </div>

          {/* Locked Accounts List */}
          <div className="bg-white rounded-lg shadow">
            {lockedAccountsLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading locked accounts...</p>
              </div>
            ) : lockedAccounts.length === 0 ? (
              <div className="p-8 text-center">
                <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Locked Accounts</h3>
                <p className="text-gray-600">All user accounts are currently unlocked and accessible.</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Failed Attempts
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Locked At
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {lockedAccounts.map((user) => (
                        <tr key={user._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-orange-600">
                                  {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {user.firstName} {user.lastName}
                                </div>
                                <div className="text-sm text-gray-500">@{user.username}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                              user.role === 'doctor' ? 'bg-blue-100 text-blue-800' :
                              user.role === 'nurse' ? 'bg-green-100 text-green-800' :
                              user.role === 'it' ? 'bg-orange-100 text-orange-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {user.role || 'No Role'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center space-x-1">
                              <span className="font-medium text-red-600">
                                {user.failedLoginAttempts || 0}
                              </span>
                              <span className="text-gray-500">/ 4</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.accountLockedAt ? new Date(user.accountLockedAt).toLocaleString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleUserAction(user._id, 'unlock')}
                              className="text-orange-600 hover:text-orange-900 flex items-center"
                              title="Unlock Account"
                            >
                              <Unlock className="h-4 w-4 mr-1" />
                              Unlock
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden space-y-4">
                  {lockedAccounts.map((user) => (
                    <div key={user._id} className="bg-white border border-orange-200 rounded-lg p-4 shadow-sm">
                      {/* User Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-orange-600">
                              {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-xs text-gray-500">{user.email}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-400">@{user.username}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {user.accountLockedAt ? new Date(user.accountLockedAt).toLocaleString() : 'N/A'}
                          </div>
                        </div>
                      </div>

                      {/* User Details */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                          user.role === 'doctor' ? 'bg-blue-100 text-blue-800' :
                          user.role === 'nurse' ? 'bg-green-100 text-green-800' :
                          user.role === 'it' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role || 'No Role'}
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <Lock className="h-3 w-3 mr-1" />
                          Locked
                        </span>
                      </div>

                      {/* Failed Attempts */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Failed Attempts:</span>
                          <span className="font-medium text-red-600">
                            {user.failedLoginAttempts || 0} / 4
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-end">
                        <button
                          onClick={() => handleUserAction(user._id, 'unlock')}
                          className="flex items-center justify-center px-4 py-2 text-sm text-orange-600 hover:text-orange-900 border border-orange-200 rounded-md hover:bg-orange-50 transition-colors"
                          title="Unlock Account"
                        >
                          <Unlock className="h-4 w-4 mr-1" />
                          Unlock Account
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Maintenance Mode Tab */}
      {getCurrentView() === 'maintenance' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-br from-orange-50 to-red-100 rounded-xl shadow-lg border border-orange-200">
            <div className="px-6 py-4 border-b border-orange-200 bg-gradient-to-r from-orange-600 to-red-600 rounded-t-xl">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                  <Wrench className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">Maintenance Mode Management</h3>
              </div>
            </div>
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-orange-700 mb-1">
                    {maintenanceLoading ? 'Loading...' : `Maintenance Mode: ${maintenanceStatus.enabled ? 'ENABLED' : 'DISABLED'}`}
                  </p>
                  <p className="text-xs text-orange-600">
                    Control system-wide maintenance mode to restrict access
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    <Shield className="h-3 w-3 inline mr-1" />
                    IT users are protected from suspension and deletion
                  </p>
                </div>
                <button
                  onClick={fetchMaintenanceStatus}
                  disabled={maintenanceLoading}
                  className="flex items-center space-x-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 text-sm disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${maintenanceLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>
          </div>

          {/* Maintenance Status */}
          <div className="bg-white rounded-lg shadow p-6">
            {maintenanceLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading maintenance status...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Current Status */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full ${maintenanceStatus.enabled ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Current Status: {maintenanceStatus.enabled ? 'Maintenance Mode Active' : 'System Normal'}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {maintenanceStatus.enabled 
                          ? 'Only IT users can access the system'
                          : 'All users can access the system normally'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                      maintenanceStatus.enabled 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {maintenanceStatus.enabled ? 'MAINTENANCE' : 'NORMAL'}
                    </span>
                  </div>
                </div>

                {/* Maintenance Details */}
                {maintenanceStatus.enabled && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h4 className="font-medium text-orange-800 mb-3">Maintenance Details</h4>
                    <div className="space-y-2 text-sm">
                      {maintenanceStatus.message && (
                        <div>
                          <span className="font-medium text-orange-700">Message:</span>
                          <p className="text-orange-600 mt-1">{maintenanceStatus.message}</p>
                        </div>
                      )}
                      {maintenanceStatus.estimatedDuration && (
                        <div>
                          <span className="font-medium text-orange-700">Estimated Duration:</span>
                          <span className="text-orange-600 ml-2">{maintenanceStatus.estimatedDuration}</span>
                        </div>
                      )}
                      {maintenanceStatus.activatedAt && (
                        <div>
                          <span className="font-medium text-orange-700">Activated At:</span>
                          <span className="text-orange-600 ml-2">
                            {new Date(maintenanceStatus.activatedAt).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* System Maintenance Control */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h4 className="text-lg font-bold text-blue-600 mb-4">System Maintenance Control</h4>
                  
                  {/* Warning when system lock is active */}
                  {systemLockStatus?.enabled && (
                    <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                        <div>
                          <h5 className="font-medium text-orange-800">System Lock Active</h5>
                          <p className="text-sm text-orange-700 mt-1">
                            Maintenance mode cannot be enabled while system lock is active. 
                            Please disable system lock first to enable maintenance mode.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {!maintenanceStatus.enabled ? (
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="maintenanceReason" className="block text-sm font-medium text-gray-700 mb-2">
                          Reason for Maintenance
                        </label>
                        <input
                          type="text"
                          id="maintenanceReason"
                          placeholder="Reason for Maintenance"
                          value={maintenanceForm.reason || ''}
                          onChange={(e) => setMaintenanceForm(prev => ({ ...prev, reason: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="maintenanceDuration" className="block text-sm font-medium text-gray-700 mb-2">
                          Estimated Duration (hours)
                        </label>
                        <input
                          type="number"
                          id="maintenanceDuration"
                          placeholder="Estimated Duration (hours)"
                          min="1"
                          max="24"
                          value={maintenanceForm.duration || ''}
                          onChange={(e) => setMaintenanceForm(prev => ({ ...prev, duration: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <button
                        onClick={() => {
                          const reason = maintenanceForm.reason || 'System is currently under maintenance. Please try again later.';
                          const duration = maintenanceForm.duration ? `${maintenanceForm.duration} hours` : '2 hours';
                          handleMaintenanceToggle(true, reason, duration);
                          setMaintenanceForm({ reason: '', duration: '' });
                        }}
                        disabled={maintenanceLoading || systemLockStatus?.enabled}
                        className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors font-medium"
                      >
                        {systemLockStatus?.enabled ? 'System Lock Active - Cannot Enable' : 'Enable Maintenance Mode'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <div>
                            <h5 className="font-medium text-green-800">Maintenance Mode Active</h5>
                            <p className="text-sm text-green-700">Only IT users can access the system</p>
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleMaintenanceToggle(false)}
                        disabled={maintenanceLoading}
                        className="w-full px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 transition-colors font-medium"
                      >
                        Disable Maintenance Mode
                      </button>
                    </div>
                  )}
                </div>

                {/* Recent Blocked Login Attempts */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h4 className="text-lg font-bold text-blue-600 mb-4">
                    Recent Blocked Login Attempts ({blockedAttempts.length})
                  </h4>
                  {blockedAttempts.length === 0 ? (
                    <p className="text-gray-600">No blocked login attempts during maintenance.</p>
                  ) : (
                    <div className="space-y-3">
                      {blockedAttempts.slice(0, 5).map((attempt, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{attempt.email}</p>
                            <p className="text-xs text-gray-500">{attempt.role} • {new Date(attempt.timestamp).toLocaleString()}</p>
                            {attempt.reason && (
                              <p className="text-xs text-gray-500 mt-1">Reason: {attempt.reason}</p>
                            )}
                          </div>
                          <span className="text-xs text-red-600 font-medium">BLOCKED</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Warning */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-800">Important Notice</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        When maintenance mode is enabled, only users with IT role can access the system. 
                        All other users (including administrators) will be blocked from logging in and 
                        will see a maintenance page instead.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* System Lock Tab */}
      {getCurrentView() === 'system-lock' && (
        <div className="space-y-6">
          {/* Show loading state if systemLockStatus is not yet loaded */}
          {!systemLockStatus && systemLockLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading system lock status...</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-lg border border-red-200">
                <div className="px-6 py-4 border-b border-red-200 bg-gradient-to-r from-red-600 to-red-700 rounded-t-xl">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                      <Lock className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white">System Lock Management</h3>
                  </div>
                </div>
                <div className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-red-700 mb-1">
                        {systemLockLoading ? 'Loading...' : `System Lock: ${systemLockStatus?.enabled ? 'ENABLED' : 'DISABLED'}`}
                      </p>
                      <p className="text-xs text-red-600">
                        Complete system lockdown - no login or registration except IT users
                      </p>
                    </div>
                    <button
                      onClick={fetchSystemLockStatus}
                      disabled={systemLockLoading}
                      className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 text-sm disabled:opacity-50"
                    >
                      <RefreshCw className={`h-4 w-4 ${systemLockLoading ? 'animate-spin' : ''}`} />
                      <span>Refresh</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* System Lock Status */}
              <div className="bg-white rounded-lg shadow p-6">
                {systemLockLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading system lock status...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Current Status */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full ${systemLockStatus?.enabled ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            Current Status: {systemLockStatus?.enabled ? 'System Locked' : 'System Unlocked'}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {systemLockStatus?.enabled 
                              ? 'Complete lockdown - no login or registration except IT users'
                              : 'System is accessible to all users'
                            }
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                          systemLockStatus?.enabled 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {systemLockStatus?.enabled ? 'LOCKED' : 'UNLOCKED'}
                        </span>
                      </div>
                    </div>

                    {/* System Lock Details */}
                    {systemLockStatus?.enabled && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <h4 className="font-medium text-red-800 mb-3">System Lock Details</h4>
                        <div className="space-y-2 text-sm">
                          {systemLockStatus?.reason && (
                            <div>
                              <span className="font-medium text-red-700">Reason:</span>
                              <p className="text-red-600 mt-1">{systemLockStatus.reason}</p>
                            </div>
                          )}
                          {systemLockStatus?.emergencyContact && (
                            <div>
                              <span className="font-medium text-red-700">Emergency Contact:</span>
                              <div className="flex items-center mt-1">
                                <span className="text-red-600">{systemLockStatus.emergencyContact}</span>
                                <span className="ml-2 text-xs bg-red-200 text-red-800 px-2 py-1 rounded">Fixed</span>
                              </div>
                            </div>
                          )}
                          {systemLockStatus?.activatedAt && (
                            <div>
                              <span className="font-medium text-red-700">Activated:</span>
                              <p className="text-red-600 mt-1">
                                {new Date(systemLockStatus.activatedAt).toLocaleString()}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* System Lock Control */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h4 className="text-lg font-bold text-red-600 mb-4">System Lock Control</h4>
                      
                      {/* Warning when maintenance mode is active */}
                      {maintenanceStatus?.enabled && (
                        <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                          <div className="flex items-start space-x-3">
                            <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                            <div>
                              <h5 className="font-medium text-orange-800">Maintenance Mode Active</h5>
                              <p className="text-sm text-orange-700 mt-1">
                                System lock will override maintenance mode. Please disable maintenance mode first 
                                for clarity before enabling system lock.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {!systemLockStatus?.enabled ? (
                        <div className="space-y-4">
                          <div>
                            <label htmlFor="systemLockReason" className="block text-sm font-medium text-gray-700 mb-2">
                              Reason for System Lock
                            </label>
                            <input
                              type="text"
                              id="systemLockReason"
                              placeholder="Reason for system lock"
                              value={systemLockForm.reason || ''}
                              onChange={(e) => setSystemLockForm(prev => ({ ...prev, reason: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="emergencyContact" className="block text-sm font-medium text-gray-700 mb-2">
                              Emergency Contact Email
                            </label>
                            <input
                              type="email"
                              id="emergencyContact"
                              value="epicedgecreative@gmail.com"
                              disabled
                              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              This emergency contact is permanently set and cannot be changed
                            </p>
                          </div>
                          
                          <button
                            onClick={() => {
                              const reason = systemLockForm.reason || 'System is currently locked for security reasons.';
                              const emergencyContact = 'epicedgecreative@gmail.com';
                              handleSystemLockToggle(true, reason, emergencyContact);
                              setSystemLockForm({ reason: '', emergencyContact: '' });
                            }}
                            disabled={systemLockLoading || maintenanceStatus?.enabled}
                            className="w-full px-4 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 transition-colors font-medium"
                          >
                            {maintenanceStatus?.enabled ? 'Maintenance Mode Active - Disable First' : 'Enable System Lock'}
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-center space-x-3">
                              <Lock className="h-5 w-5 text-red-600" />
                              <div>
                                <h5 className="font-medium text-red-800">System Lock Active</h5>
                                <p className="text-sm text-red-700">Complete lockdown - only IT users can access</p>
                              </div>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => handleSystemLockToggle(false)}
                            disabled={systemLockLoading}
                            className="w-full px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 transition-colors font-medium"
                          >
                            Disable System Lock
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Recent Blocked Login Attempts */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h4 className="text-lg font-bold text-red-600 mb-4">
                        Recent Blocked Login Attempts ({systemLockBlockedAttempts.length})
                      </h4>
                      {systemLockBlockedAttempts.length === 0 ? (
                        <p className="text-gray-600">No blocked login attempts during system lock.</p>
                      ) : (
                        <div className="space-y-3">
                          {systemLockBlockedAttempts.slice(0, 5).map((attempt, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div>
                                <p className="text-sm font-medium text-gray-900">{attempt.email}</p>
                                <p className="text-xs text-gray-500">{attempt.role} • {new Date(attempt.timestamp).toLocaleString()}</p>
                                {attempt.reason && (
                                  <p className="text-xs text-gray-500 mt-1">Reason: {attempt.reason}</p>
                                )}
                              </div>
                              <span className="text-xs text-red-600 font-medium">BLOCKED</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Warning */}
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-red-800">Critical Notice</h4>
                          <p className="text-sm text-red-700 mt-1">
                            When system lock is enabled, NO users (including administrators) can login or register 
                            except IT users. This is a complete system lockdown for emergency situations only. 
                            Use with extreme caution.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {getCurrentView() === 'analytics' && (
        <ClarityAnalytics />
      )}

      {/* Suspended Accounts Tab */}
      {getCurrentView() === 'suspended-accounts' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-br from-orange-50 to-red-100 rounded-xl shadow-lg border border-orange-200">
            <div className="px-6 py-4 border-b border-orange-200 bg-gradient-to-r from-orange-600 to-red-600 rounded-t-xl">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                  <UserX className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">Suspended Accounts Management</h3>
              </div>
            </div>
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-orange-700 mb-1">
                    {suspendedAccountsLoading ? 'Loading...' : `Total Suspended: ${suspendedAccountsStats.totalSuspended}`}
                  </p>
                  <p className="text-xs text-orange-600">
                    Manage and monitor suspended user accounts
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    <Shield className="h-3 w-3 inline mr-1" />
                    IT users are protected from suspension and deletion
                  </p>
                </div>
                <button
                  onClick={fetchSuspendedAccounts}
                  disabled={suspendedAccountsLoading}
                  className="flex items-center space-x-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 text-sm disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${suspendedAccountsLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <input
                  type="text"
                  placeholder="Search by name, email, or username..."
                  value={suspendedAccountsFilters.search}
                  onChange={(e) => {
                    setSuspendedAccountsFilters(prev => ({ ...prev, search: e.target.value }));
                    setTimeout(() => fetchSuspendedAccounts(1), 500);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  value={suspendedAccountsFilters.role}
                  onChange={(e) => {
                    setSuspendedAccountsFilters(prev => ({ ...prev, role: e.target.value }));
                    fetchSuspendedAccounts(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="doctor">Doctor</option>
                  <option value="nurse">Nurse</option>
                  <option value="receptionist">Receptionist</option>
                  <option value="pharmacist">Pharmacist</option>
                  <option value="lab_technician">Lab Technician</option>
                  <option value="it">IT</option>
                  <option value="user">User</option>
                  <option value="patient">Patient</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                <select
                  value={suspendedAccountsFilters.department}
                  onChange={(e) => {
                    setSuspendedAccountsFilters(prev => ({ ...prev, department: e.target.value }));
                    fetchSuspendedAccounts(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">All Departments</option>
                  <option value="Emergency">Emergency</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Neurology">Neurology</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="General Medicine">General Medicine</option>
                  <option value="Surgery">Surgery</option>
                  <option value="ICU">ICU</option>
                  <option value="Pharmacy">Pharmacy</option>
                  <option value="Administration">Administration</option>
                </select>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600">Total Suspended</p>
                    <p className="text-2xl font-bold text-orange-800">{suspendedAccountsStats.totalSuspended}</p>
                  </div>
                  <UserX className="h-8 w-8 text-orange-600" />
                </div>
              </div>
              {suspendedAccountsStats.byRole.map((role, index) => (
                <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{role._id || 'Unknown'}</p>
                      <p className="text-2xl font-bold text-gray-800">{role.count}</p>
                    </div>
                    <UserX className="h-8 w-8 text-gray-600" />
                  </div>
                </div>
              ))}
            </div>

            {/* Suspended Accounts List */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Suspended Accounts</h3>
              </div>
              <div className="overflow-x-auto">
                {suspendedAccountsLoading ? (
                  <div className="p-6 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading suspended accounts...</p>
                  </div>
                ) : suspendedAccounts.length === 0 ? (
                  <div className="p-6 text-center">
                    <UserX className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No suspended accounts found</p>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Suspended Since</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {suspendedAccounts.map((user) => (
                        <tr key={user._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                                  <UserX className="h-5 w-5 text-orange-600" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {user.firstName} {user.lastName}
                                </div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                                <div className="text-xs text-gray-400">@{user.username}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                              user.role === 'doctor' ? 'bg-blue-100 text-blue-800' :
                              user.role === 'nurse' ? 'bg-green-100 text-green-800' :
                              user.role === 'it' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.department || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'Unknown'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleUserAction(user._id, 'activate')}
                              className="text-green-600 hover:text-green-900 mr-3"
                            >
                              Activate
                            </button>
                            <button
                              onClick={() => handleUserAction(user._id, 'view')}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination */}
              {suspendedAccountsPagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing {((suspendedAccountsPagination.currentPage - 1) * suspendedAccountsPagination.itemsPerPage) + 1} to{' '}
                      {Math.min(suspendedAccountsPagination.currentPage * suspendedAccountsPagination.itemsPerPage, suspendedAccountsPagination.totalSuspendedUsers)} of{' '}
                      {suspendedAccountsPagination.totalSuspendedUsers} results
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => fetchSuspendedAccounts(suspendedAccountsPagination.currentPage - 1)}
                        disabled={!suspendedAccountsPagination.hasPrev}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <span className="px-3 py-1 text-sm text-gray-700">
                        Page {suspendedAccountsPagination.currentPage} of {suspendedAccountsPagination.totalPages}
                      </span>
                      <button
                        onClick={() => fetchSuspendedAccounts(suspendedAccountsPagination.currentPage + 1)}
                        disabled={!suspendedAccountsPagination.hasNext}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showUserDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">User Details</h3>
                <button
                  onClick={() => {
                    setShowUserDetailsModal(false);
                    setSelectedUser(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.firstName} {selectedUser.lastName}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.email}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Username</label>
                  <p className="mt-1 text-sm text-gray-900">@{selectedUser.username}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
                    selectedUser.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                    selectedUser.role === 'doctor' ? 'bg-blue-100 text-blue-800' :
                    selectedUser.role === 'nurse' ? 'bg-green-100 text-green-800' :
                    selectedUser.role === 'it' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedUser.role}
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Department</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.department || 'N/A'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
                    selectedUser.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedUser.isActive ? 'Active' : 'Suspended'}
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Employee ID</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.employeeId || 'N/A'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedUser.updatedAt ? new Date(selectedUser.updatedAt).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
                
                {selectedUser.contactInfo && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contact Info</label>
                    <p className="mt-1 text-sm text-gray-900">
                      Phone: {selectedUser.contactInfo.phone || 'N/A'}
                    </p>
                    {selectedUser.contactInfo.address && (
                      <p className="mt-1 text-sm text-gray-900">
                        Address: {selectedUser.contactInfo.address.street || ''} {selectedUser.contactInfo.address.city || ''} {selectedUser.contactInfo.address.state || ''}
                      </p>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowUserDetailsModal(false);
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Close
                </button>
                {!selectedUser.isActive && (
                  <button
                    onClick={() => {
                      handleUserAction(selectedUser._id, 'activate');
                      setShowUserDetailsModal(false);
                      setSelectedUser(null);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    Activate User
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default ITDashboard;
