import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  MousePointer, 
  Clock, 
  AlertTriangle, 
  TrendingUp,
  Eye,
  Activity,
  Target,
  RefreshCw
} from 'lucide-react';
import apiClient from '../config/axios';
import { fetchRealClarityData, getRealTimeAnalytics } from '../utils/clarityAPI';

const ClarityAnalytics = () => {
  const [analytics, setAnalytics] = useState({
    pageViews: 0,
    sessions: 0,
    clicks: 0,
    averageSessionTime: 0,
    topPages: [],
    userActions: [],
    performance: {},
    errors: []
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');
  const [activeTab, setActiveTab] = useState('overview');
  const [dataSource, setDataSource] = useState('clarity'); // 'clarity' or 'internal'

  // Fetch real analytics data from Microsoft Clarity API
  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Try to get data from Microsoft Clarity API first
      let clarityTimeRange = '1d';
      if (timeRange === '7d') clarityTimeRange = '3d'; // Clarity max is 3 days
      else if (timeRange === '30d') clarityTimeRange = '3d';
      
      const clarityData = await fetchRealClarityData(clarityTimeRange);
      
      if (clarityData && clarityData.pageViews > 0) {
        // Use Clarity data if available
        setAnalytics(clarityData);
        setDataSource('clarity');
        console.log('📊 Using Microsoft Clarity API data');
      } else {
        // Fallback to our own tracking data
        const response = await apiClient.get(`/api/it/real-time-analytics?timeRange=${timeRange}`);
        
        if (response.data) {
          setAnalytics(response.data);
          setDataSource('internal');
          console.log('📊 Using our own tracking data (fallback)');
        } else {
          throw new Error('No data received from analytics API');
        }
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      
      // Final fallback to empty data
      const fallbackData = {
        pageViews: 0,
        sessions: 0,
        clicks: 0,
        averageSessionTime: 0,
        topPages: [],
        userActions: [],
        performance: { averageLoadTime: 0, slowestPages: [] },
        errors: []
      };
      
      setAnalytics(fallbackData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const getTrendColor = (trend) => {
    if (trend.startsWith('+')) return 'text-green-600';
    if (trend.startsWith('-')) return 'text-red-600';
    return 'text-gray-600';
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="animate-spin h-5 w-5 text-blue-600" />
          <span className="text-gray-600">Loading analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
                  <div>
            <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
            <p className="text-gray-600">
              {dataSource === 'clarity' 
                ? 'Microsoft Clarity API data' 
                : 'Internal tracking data (fallback)'
              }
            </p>
            <div className="flex items-center space-x-2 mt-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-600 font-medium">
                {dataSource === 'clarity' ? 'Clarity API' : 'Internal Data'}
              </span>
            </div>
          </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <button
            onClick={fetchAnalytics}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', icon: BarChart3 },
            { id: 'pages', name: 'Page Analytics', icon: Eye },
            { id: 'actions', name: 'User Actions', icon: Activity },
            { id: 'performance', name: 'Performance', icon: TrendingUp },
            { id: 'errors', name: 'Errors', icon: AlertTriangle }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Eye className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Page Views</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.pageViews}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Sessions</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.sessions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MousePointer className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Clicks</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.clicks}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Session</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.averageSessionTime}m</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Page Analytics Tab */}
      {activeTab === 'pages' && (
        <div className="bg-white rounded-lg shadow border">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Most Visited Pages</h3>
            <p className="text-gray-600">Pages with highest engagement in the IT Dashboard</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {analytics.topPages.map((page, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{page.name}</p>
                      <p className="text-sm text-gray-500">{page.views} views</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{page.percentage}%</p>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${page.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* User Actions Tab */}
      {activeTab === 'actions' && (
        <div className="bg-white rounded-lg shadow border">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">User Actions</h3>
            <p className="text-gray-600">Most performed actions by IT staff</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {analytics.userActions.map((action, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Target className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{action.action}</p>
                      <p className="text-sm text-gray-500">{action.count} times</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${getTrendColor(action.trend)}`}>
                      {action.trend}
                    </p>
                    <p className="text-sm text-gray-500">vs previous period</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Load Time</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.performance.averageLoadTime}s</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Performance Score</p>
                <p className="text-3xl font-bold text-green-600">85%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow border">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Slowest Loading Pages</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {analytics.performance.slowestPages.map((page, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-medium text-red-600">{index + 1}</span>
                      </div>
                      <p className="font-medium text-gray-900">{page.page}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-red-600">{page.loadTime}s</p>
                      <p className="text-sm text-gray-500">load time</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Errors Tab */}
      {activeTab === 'errors' && (
        <div className="bg-white rounded-lg shadow border">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Error Tracking</h3>
            <p className="text-gray-600">Issues detected in the IT Dashboard</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {analytics.errors.map((error, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{error.type}</p>
                      <p className="text-sm text-gray-500">{error.count} occurrences</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(error.severity)}`}>
                      {error.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClarityAnalytics;
