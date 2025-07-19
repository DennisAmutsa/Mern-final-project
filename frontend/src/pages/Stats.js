import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Heart, 
  ArrowUpRight, 
  ArrowDownRight, 
  X, 
  Download, 
  FileText, 
  Calendar,
  Filter,
  RefreshCw,
  Activity,
  Clock,
  Wifi,
  WifiOff,
  Eye,
  BarChart,
  PieChart,
  LineChart,
  DollarSign,
  Target,
  TrendingDown
} from 'lucide-react';
import {
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell, 
  Legend, 
  LineChart as RechartsLineChart, 
  Line,
  AreaChart,
  Area,
  ComposedChart,
  ScatterChart,
  Scatter
} from 'recharts';
import axios from 'axios';
import toast from 'react-hot-toast';
import io from 'socket.io-client';
import { API_BASE_URL, WS_BASE_URL } from '../config/api';

const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E42', '#EF4444', '#6366F1', '#F472B6', '#FBBF24'];

const getMoMChange = (monthlyStats) => {
  if (!monthlyStats || monthlyStats.length < 2) return null;
  const latest = monthlyStats[0]?.count || 0;
  const prev = monthlyStats[1]?.count || 0;
  if (prev === 0) return null;
  return (((latest - prev) / prev) * 100).toFixed(1);
};

const getYoYChange = (monthlyStats) => {
  if (!monthlyStats || monthlyStats.length < 13) return null;
  const latest = monthlyStats[0]?.count || 0;
  const lastYear = monthlyStats[12]?.count || 0;
  if (lastYear === 0) return null;
  return (((latest - lastYear) / lastYear) * 100).toFixed(1);
};

const Stats = () => {
  const [overview, setOverview] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [ageStats, setAgeStats] = useState([]);
  const [genderStats, setGenderStats] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drilldown, setDrilldown] = useState(null);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [dateRange, setDateRange] = useState('30'); // days
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [chartType, setChartType] = useState('bar');
  const [showFilters, setShowFilters] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  
  // Financial data states
  const [financialReports, setFinancialReports] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [bills, setBills] = useState([]);
  const [financialLoading, setFinancialLoading] = useState(false);

  useEffect(() => {
    // Initialize WebSocket connection
    const newSocket = io(WS_BASE_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('🔌 Connected to WebSocket server');
      setIsConnected(true);
      newSocket.emit('join-analytics');
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Disconnected from WebSocket server');
      setIsConnected(false);
    });

    newSocket.on('analytics-update', (updatedData) => {
      console.log('📊 Received real-time analytics update');
      toast.success('Analytics updated in real-time!');
      fetchStats();
    });

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    fetchStats();
    if (activeTab === 'financial' || activeTab === 'budget' || activeTab === 'billing') {
      fetchFinancialData();
    }
  }, [dateRange, selectedDepartment, activeTab]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [sdg3Res, deptRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/stats/sdg3-overview?days=${dateRange}&department=${selectedDepartment}`).then(r => r.data),
        axios.get(`${API_BASE_URL}/api/stats/department-performance?days=${dateRange}`).then(r => r.data)
      ]);
      setOverview(sdg3Res);
      setDepartments(deptRes);
      setAgeStats(sdg3Res.ageStats || []);
      setGenderStats(sdg3Res.genderStats || []);
      setMonthlyStats(sdg3Res.monthlyStats || []);
    } catch (e) {
      console.error('Error fetching stats:', e);
      toast.error('Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  const fetchFinancialData = async () => {
    setFinancialLoading(true);
    try {
      const token = localStorage.getItem('token');
      const [financialRes, budgetRes, billingRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/financial-reports`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/api/budget`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/api/billing`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setFinancialReports(Array.isArray(financialRes.data) ? financialRes.data : []);
      setBudgets(Array.isArray(budgetRes.data) ? budgetRes.data : []);
      setBills(Array.isArray(billingRes.data) ? billingRes.data : []);
    } catch (error) {
      console.error('Error fetching financial data:', error);
      toast.error('Failed to fetch financial data');
    } finally {
      setFinancialLoading(false);
    }
  };

  // Export functionality
  const exportAnalytics = async (format) => {
    setExporting(true);
    try {
      const data = {
        overview,
        departments,
        ageStats,
        genderStats,
        monthlyStats,
        filters: { dateRange, selectedDepartment },
        exportDate: new Date().toISOString(),
        generatedBy: 'Hospital Management System'
      };

      if (format === 'json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else if (format === 'csv') {
        let csvContent = 'data:text/csv;charset=utf-8,';
        
        // Overview stats
        csvContent += 'Category,Value\n';
        csvContent += `Total Patients,${overview?.totalPatients || 0}\n`;
        csvContent += `Active Doctors,${overview?.activeDoctors || 0}\n`;
        csvContent += `Today's Appointments,${overview?.todayAppointments || 0}\n`;
        csvContent += `Emergency Cases,${overview?.emergencyPatients || 0}\n`;
        
        // Department performance
        if (departments.length > 0) {
          csvContent += '\nDepartment Performance\n';
          csvContent += 'Department,Patients,Active,Emergency,Completion Rate\n';
          departments.forEach(dept => {
            csvContent += `"${dept.department}",${dept.patientCount},${dept.activePatients},${dept.emergencyPatients},${dept.completionRate}%\n`;
          });
        }
        
        // Monthly trends
        if (monthlyStats.length > 0) {
          csvContent += '\nMonthly Trends\n';
          csvContent += 'Month,Appointments\n';
          monthlyStats.forEach(stat => {
            csvContent += `"${stat._id.month}/${stat._id.year}",${stat.count}\n`;
          });
        }
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `analytics-report-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      toast.success(`Analytics exported as ${format.toUpperCase()} successfully!`);
    } catch (error) {
      toast.error('Failed to export analytics');
      console.error('Export error:', error);
    } finally {
      setExporting(false);
    }
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  const momChange = getMoMChange(monthlyStats);
  const yoyChange = getYoYChange(monthlyStats);

  // Drilldown modal content
  const renderDrilldown = () => {
    if (!drilldown) return null;
    if (drilldown.type === 'department') {
      const dept = departments.find(d => d.department === drilldown.value);
      return (
        <div className="p-4">
          <h2 className="text-lg font-bold mb-2">Department: {dept.department}</h2>
          <p>Patients: {dept.patientCount}</p>
          <p>Active Patients: {dept.activePatients}</p>
          <p>Emergency Patients: {dept.emergencyPatients}</p>
          <p>Total Appointments: {dept.totalAppointments}</p>
          <p>Completed Appointments: {dept.completedAppointments}</p>
          <p>Emergency Appointments: {dept.emergencyAppointments}</p>
          <p>Completion Rate: {dept.completionRate}%</p>
        </div>
      );
    }
    if (drilldown.type === 'age') {
      return (
        <div className="p-4">
          <h2 className="text-lg font-bold mb-2">Age Group: {drilldown.value}</h2>
          <p>Patients: {drilldown.count}</p>
        </div>
      );
    }
    if (drilldown.type === 'gender') {
      return (
        <div className="p-4">
          <h2 className="text-lg font-bold mb-2">Gender: {drilldown.value}</h2>
          <p>Patients: {drilldown.count}</p>
        </div>
      );
    }
    if (drilldown.type === 'month') {
      return (
        <div className="p-4">
          <h2 className="text-lg font-bold mb-2">Month: {drilldown.label}</h2>
          <p>Appointments: {drilldown.count}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Statistics & Analytics</h1>
          <p className="text-gray-600"> Impact Metrics and Hospital Performance</p>
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
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </button>
            <button
              onClick={fetchStats}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => exportAnalytics('csv')}
              disabled={exporting}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              <FileText className="h-4 w-4" />
              <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
            </button>
            <button
              onClick={() => exportAnalytics('json')}
              disabled={exporting}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              <span>{exporting ? 'Exporting...' : 'Export JSON'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('general')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'general'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span>General Analytics</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('financial')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'financial'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Financial Reports</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('budget')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'budget'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <PieChart className="h-4 w-4" />
                <span>Budget Analytics</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('billing')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'billing'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4" />
                <span>Financial Analytics</span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'general' && (
        <>
      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Analytics Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept.department} value={dept.department}>{dept.department}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Chart Type</label>
              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="bar">Bar Chart</option>
                <option value="line">Line Chart</option>
                <option value="area">Area Chart</option>
                <option value="composed">Composed Chart</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* SDG 3 Banner */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
        <div className="flex items-center space-x-3">
          <Heart className="h-8 w-8" />
          <div>
            <h2 className="text-xl font-bold">Good Health and Well-being</h2>
            <p className="text-green-100">Comprehensive healthcare analytics and impact measurement</p>
          </div>
        </div>
      </div>

      {/* Comparative Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col items-center">
          <span className="text-xs text-gray-500">Month-over-Month</span>
          <div className="flex items-center space-x-2 mt-1">
            {momChange !== null ? (
              <>
                {parseFloat(momChange) >= 0 ? (
                  <ArrowUpRight className="h-5 w-5 text-green-500" />
                ) : (
                  <ArrowDownRight className="h-5 w-5 text-red-500" />
                )}
                <span className={`text-lg font-bold ${parseFloat(momChange) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{Math.abs(momChange)}%</span>
              </>
            ) : (
              <span className="text-gray-400">N/A</span>
            )}
      </div>
          <span className="text-xs text-gray-400 mt-1">vs last month</span>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col items-center">
          <span className="text-xs text-gray-500">Year-over-Year</span>
          <div className="flex items-center space-x-2 mt-1">
            {yoyChange !== null ? (
              <>
                {parseFloat(yoyChange) >= 0 ? (
                  <ArrowUpRight className="h-5 w-5 text-green-500" />
                ) : (
                  <ArrowDownRight className="h-5 w-5 text-red-500" />
                )}
                <span className={`text-lg font-bold ${parseFloat(yoyChange) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{Math.abs(yoyChange)}%</span>
              </>
            ) : (
              <span className="text-gray-400">N/A</span>
            )}
                </div>
          <span className="text-xs text-gray-400 mt-1">vs last year</span>
                </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col items-center">
          <span className="text-xs text-gray-500">Latest Month</span>
          <span className="text-lg font-bold text-blue-600 mt-1">{monthlyStats[0]?.count || 0}</span>
          <span className="text-xs text-gray-400 mt-1">appointments</span>
              </div>
            </div>
            
      {/* Department Performance Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Department Performance</h3>
          <div className="flex items-center space-x-2">
            <BarChart className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-500">Click for details</span>
          </div>
        </div>
        {departments.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No department data available.</div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            {chartType === 'bar' && (
              <RechartsBarChart data={departments} margin={{ top: 20, right: 30, left: 0, bottom: 5 }} onClick={data => setDrilldown({ type: 'department', value: data.activeLabel })}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="patientCount" fill="#3B82F6" name="Patients" />
                <Bar dataKey="activePatients" fill="#10B981" name="Active" />
                <Bar dataKey="emergencyPatients" fill="#EF4444" name="Emergency" />
              </RechartsBarChart>
            )}
            {chartType === 'line' && (
              <RechartsLineChart data={departments} margin={{ top: 20, right: 30, left: 0, bottom: 5 }} onClick={data => setDrilldown({ type: 'department', value: data.activeLabel })}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="patientCount" stroke="#3B82F6" name="Patients" />
                <Line type="monotone" dataKey="activePatients" stroke="#10B981" name="Active" />
                <Line type="monotone" dataKey="emergencyPatients" stroke="#EF4444" name="Emergency" />
              </RechartsLineChart>
            )}
            {chartType === 'area' && (
              <AreaChart data={departments} margin={{ top: 20, right: 30, left: 0, bottom: 5 }} onClick={data => setDrilldown({ type: 'department', value: data.activeLabel })}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area type="monotone" dataKey="patientCount" stackId="1" stroke="#3B82F6" fill="#3B82F6" name="Patients" />
                <Area type="monotone" dataKey="activePatients" stackId="1" stroke="#10B981" fill="#10B981" name="Active" />
                <Area type="monotone" dataKey="emergencyPatients" stackId="1" stroke="#EF4444" fill="#EF4444" name="Emergency" />
              </AreaChart>
            )}
            {chartType === 'composed' && (
              <ComposedChart data={departments} margin={{ top: 20, right: 30, left: 0, bottom: 5 }} onClick={data => setDrilldown({ type: 'department', value: data.activeLabel })}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="patientCount" fill="#3B82F6" name="Patients" />
                <Line type="monotone" dataKey="completionRate" stroke="#8B5CF6" name="Completion Rate" />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      {/* Patient Demographics Pie Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Age Distribution Pie Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Age Distribution</h3>
            <PieChart className="h-4 w-4 text-gray-400" />
          </div>
          {ageStats.length === 0 ? (
            <div className="text-center text-gray-500 py-4">No age data available.</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <RechartsPieChart>
                <Pie 
                  data={ageStats} 
                  dataKey="count" 
                  nameKey="_id" 
                  cx="50%" 
                  cy="50%" 
                  outerRadius={80} 
                  label 
                  onClick={(_, idx) => setDrilldown({ type: 'age', value: ageStats[idx]._id, count: ageStats[idx].count })}
                >
                  {ageStats.map((entry, idx) => (
                    <Cell key={`cell-age-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          )}
        </div>
        {/* Gender Distribution Pie Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Gender Distribution</h3>
            <PieChart className="h-4 w-4 text-gray-400" />
          </div>
          {genderStats.length === 0 ? (
            <div className="text-center text-gray-500 py-4">No gender data available.</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <RechartsPieChart>
                <Pie 
                  data={genderStats} 
                  dataKey="count" 
                  nameKey="_id" 
                  cx="50%" 
                  cy="50%" 
                  outerRadius={80} 
                  label 
                  onClick={(_, idx) => setDrilldown({ type: 'gender', value: genderStats[idx]._id, count: genderStats[idx].count })}
                >
                  {genderStats.map((entry, idx) => (
                    <Cell key={`cell-gender-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Monthly Trends Line Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Monthly Trends</h3>
          <div className="flex items-center space-x-2">
            <LineChart className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-500">Click for details</span>
          </div>
        </div>
        {monthlyStats.length === 0 ? (
          <div className="text-center text-gray-500 py-4">No trend data available.</div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <RechartsLineChart 
              data={monthlyStats} 
              margin={{ top: 20, right: 30, left: 0, bottom: 5 }} 
              onClick={state => {
                if (state && state.activeLabel) {
                  const idx = monthlyStats.findIndex(m => `${m._id.month}/${m._id.year}` === state.activeLabel);
                  if (idx !== -1) setDrilldown({ type: 'month', label: state.activeLabel, count: monthlyStats[idx].count });
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={m => `${m._id.month}/${m._id.year}`} />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#3B82F6" name="Appointments" strokeWidth={2} />
            </RechartsLineChart>
          </ResponsiveContainer>
        )}
              </div>

      {/* Additional Analytics: Appointment Status Distribution */}
      {overview?.appointmentStatus && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Appointment Status Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <RechartsPieChart>
              <Pie 
                data={Object.entries(overview.appointmentStatus).map(([status, count]) => ({ status, count }))} 
                dataKey="count" 
                nameKey="status" 
                cx="50%" 
                cy="50%" 
                outerRadius={80} 
                label 
              >
                {Object.entries(overview.appointmentStatus).map((entry, idx) => (
                  <Cell key={`cell-status-${idx}`} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </RechartsPieChart>
          </ResponsiveContainer>
                </div>
          )}
        </>
      )}

      {/* Financial Reports Tab */}
      {activeTab === 'financial' && (
        <div className="space-y-6">
          {financialLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {/* Financial Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold text-green-600">
                        Ksh{financialReports.reduce((sum, r) => sum + (r.totals?.revenue ? Number(r.totals.revenue) : 0), 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-green-100">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                      <p className="text-2xl font-bold text-red-600">
                        Ksh{financialReports.reduce((sum, r) => sum + (r.totals?.expenses ? Number(r.totals.expenses) : 0), 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-red-100">
                      <TrendingDown className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Net Profit/Loss</p>
                      <p className={`text-2xl font-bold ${
                        (financialReports.reduce((sum, r) => sum + (r.totals?.revenue ? Number(r.totals.revenue) : 0), 0) - 
                         financialReports.reduce((sum, r) => sum + (r.totals?.expenses ? Number(r.totals.expenses) : 0), 0)) >= 0 
                        ? 'text-green-600' : 'text-red-600'
                      }`}>
                        Ksh{(financialReports.reduce((sum, r) => sum + (r.totals?.revenue ? Number(r.totals.revenue) : 0), 0) - 
                             financialReports.reduce((sum, r) => sum + (r.totals?.expenses ? Number(r.totals.expenses) : 0), 0)).toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-blue-100">
                      <DollarSign className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue vs Expenses</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsBarChart data={financialReports.map(r => ({
                      period: r.period,
                      Revenue: r.totals?.revenue ? Number(r.totals.revenue) : 0,
                      Expenses: r.totals?.expenses ? Number(r.totals.expenses) : 0
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`Ksh${value.toLocaleString()}`, 'Amount']} />
                      <Legend />
                      <Bar dataKey="Revenue" fill="#10B981" />
                      <Bar dataKey="Expenses" fill="#EF4444" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Profit/Loss Trend</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsLineChart data={financialReports.map(r => ({
                      period: r.period,
                      'Profit/Loss': (Number(r.totals?.revenue || 0) - Number(r.totals?.expenses || 0))
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`Ksh${value.toLocaleString()}`, 'Profit/Loss']} />
                      <Line type="monotone" dataKey="Profit/Loss" stroke="#3B82F6" strokeWidth={2} />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Financial Reports Table */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Reports</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-4">Type</th>
                        <th className="text-left py-2 px-4">Period</th>
                        <th className="text-left py-2 px-4">Revenue</th>
                        <th className="text-left py-2 px-4">Expenses</th>
                        <th className="text-left py-2 px-4">Profit/Loss</th>
                      </tr>
                    </thead>
                    <tbody>
                      {financialReports.map((report, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2 px-4 capitalize">{report.type}</td>
                          <td className="py-2 px-4">{report.period}</td>
                          <td className="py-2 px-4 text-green-600">Ksh{Number(report.totals?.revenue || 0).toLocaleString()}</td>
                          <td className="py-2 px-4 text-red-600">Ksh{Number(report.totals?.expenses || 0).toLocaleString()}</td>
                          <td className={`py-2 px-4 ${
                            (Number(report.totals?.revenue || 0) - Number(report.totals?.expenses || 0)) >= 0 
                            ? 'text-green-600' : 'text-red-600'
                          }`}>
                            Ksh{(Number(report.totals?.revenue || 0) - Number(report.totals?.expenses || 0)).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Budget Analytics Tab */}
      {activeTab === 'budget' && (
        <div className="space-y-6">
          {financialLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {/* Budget Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Allocated</p>
                      <p className="text-2xl font-bold text-blue-600">
                        Ksh{budgets.reduce((sum, b) => sum + (Number(b.allocated) || 0), 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-blue-100">
                      <Target className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Spent</p>
                      <p className="text-2xl font-bold text-red-600">
                        Ksh{budgets.reduce((sum, b) => sum + (Number(b.spent) || 0), 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-red-100">
                      <TrendingDown className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Net Balance</p>
                      <p className="text-2xl font-bold text-green-600">
                        Ksh{(budgets.reduce((sum, b) => sum + (Number(b.allocated) || 0), 0) - 
                             budgets.reduce((sum, b) => sum + (Number(b.spent) || 0), 0)).toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-green-100">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Budget Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Allocated vs Spent by Department</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsBarChart data={budgets.map(b => ({
                      department: b.department?.name || 'Unknown',
                      Allocated: Number(b.allocated) || 0,
                      Spent: Number(b.spent) || 0
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="department" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`Ksh${value.toLocaleString()}`, 'Amount']} />
                      <Legend />
                      <Bar dataKey="Allocated" fill="#3B82F6" />
                      <Bar dataKey="Spent" fill="#EF4444" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Budget Utilization</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={budgets.map(b => ({
                          name: b.department?.name || 'Unknown',
                          value: b.allocated ? ((b.spent / b.allocated) * 100) : 0
                        }))}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label
                      >
                        {budgets.map((b, idx) => (
                          <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Budget Table */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Budget Details</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-4">Department</th>
                        <th className="text-left py-2 px-4">Year</th>
                        <th className="text-left py-2 px-4">Allocated</th>
                        <th className="text-left py-2 px-4">Spent</th>
                        <th className="text-left py-2 px-4">Utilization</th>
                        <th className="text-left py-2 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {budgets.map((budget, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2 px-4">{budget.department?.name || 'Unknown'}</td>
                          <td className="py-2 px-4">{budget.year}</td>
                          <td className="py-2 px-4 text-blue-600">Ksh{Number(budget.allocated || 0).toLocaleString()}</td>
                          <td className="py-2 px-4 text-red-600">Ksh{Number(budget.spent || 0).toLocaleString()}</td>
                          <td className="py-2 px-4">{budget.allocated ? ((budget.spent / budget.allocated) * 100).toFixed(1) : 0}%</td>
                          <td className="py-2 px-4 capitalize">{budget.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Financial Analytics (Billing) Tab */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          {financialLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {/* Billing Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Bills</p>
                      <p className="text-2xl font-bold text-blue-600">{bills.length}</p>
                    </div>
                    <div className="p-3 rounded-full bg-blue-100">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Paid Bills</p>
                      <p className="text-2xl font-bold text-green-600">
                        {bills.filter(b => b.status === 'paid').length}
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-green-100">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Unpaid Bills</p>
                      <p className="text-2xl font-bold text-red-600">
                        {bills.filter(b => b.status === 'unpaid').length}
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-red-100">
                      <TrendingDown className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold text-green-600">
                        Ksh{bills.reduce((sum, b) => sum + (Number(b.amount) || 0), 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-green-100">
                      <DollarSign className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Billing Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Bill Status Distribution</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={[
                          { name: 'Paid', value: bills.filter(b => b.status === 'paid').length },
                          { name: 'Unpaid', value: bills.filter(b => b.status === 'unpaid').length },
                          { name: 'Overdue', value: bills.filter(b => b.status === 'overdue').length },
                          { name: 'Cancelled', value: bills.filter(b => b.status === 'cancelled').length }
                        ]}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label
                      >
                        {[
                          { name: 'Paid', value: bills.filter(b => b.status === 'paid').length },
                          { name: 'Unpaid', value: bills.filter(b => b.status === 'unpaid').length },
                          { name: 'Overdue', value: bills.filter(b => b.status === 'overdue').length },
                          { name: 'Cancelled', value: bills.filter(b => b.status === 'cancelled').length }
                        ].map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue by Status</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsBarChart data={[
                      { status: 'Paid', revenue: bills.filter(b => b.status === 'paid').reduce((sum, b) => sum + (Number(b.amount) || 0), 0) },
                      { status: 'Unpaid', revenue: bills.filter(b => b.status === 'unpaid').reduce((sum, b) => sum + (Number(b.amount) || 0), 0) },
                      { status: 'Overdue', revenue: bills.filter(b => b.status === 'overdue').reduce((sum, b) => sum + (Number(b.amount) || 0), 0) }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="status" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`Ksh${value.toLocaleString()}`, 'Revenue']} />
                      <Bar dataKey="revenue" fill="#10B981" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Billing Table */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Bills</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-4">Patient</th>
                        <th className="text-left py-2 px-4">Amount</th>
                        <th className="text-left py-2 px-4">Status</th>
                        <th className="text-left py-2 px-4">Due Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bills.slice(0, 10).map((bill, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2 px-4">{bill.patient?.firstName} {bill.patient?.lastName}</td>
                          <td className="py-2 px-4 text-green-600">Ksh{Number(bill.amount || 0).toLocaleString()}</td>
                          <td className="py-2 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              bill.status === 'paid' ? 'bg-green-100 text-green-800' :
                              bill.status === 'unpaid' ? 'bg-yellow-100 text-yellow-800' :
                              bill.status === 'overdue' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {bill.status}
                            </span>
                          </td>
                          <td className="py-2 px-4">{bill.dueDate ? new Date(bill.dueDate).toLocaleDateString() : 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
            </div>
      )}

      {/* Drilldown Modal */}
      {drilldown && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={() => setDrilldown(null)}>
              <X className="h-5 w-5" />
            </button>
            {renderDrilldown()}
          </div>
        </div>
      )}
    </div>
  );
};

export default Stats; 