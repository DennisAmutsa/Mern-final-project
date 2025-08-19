import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Heart, Lock } from 'lucide-react';
import MaintenancePage from './MaintenancePage';
import apiClient from '../config/axios';
import toast from 'react-hot-toast';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suspendedAccount, setSuspendedAccount] = useState(null);
  const [lockedAccount, setLockedAccount] = useState(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [maintenanceInfo, setMaintenanceInfo] = useState(null);
  const [checkingMaintenance, setCheckingMaintenance] = useState(true);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  // Check maintenance mode on component mount
  useEffect(() => {
    const checkMaintenanceMode = async () => {
      try {
        const response = await apiClient.get('/api/maintenance/status');
        if (response.data.maintenanceMode) {
          setMaintenanceInfo(response.data);
        }
      } catch (error) {
        console.error('Error checking maintenance mode:', error);
      } finally {
        setCheckingMaintenance(false);
      }
    };

    checkMaintenanceMode();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    
    // Clear failed attempts if username changes (user might be trying different account)
    if (e.target.name === 'username' && failedAttempts > 0) {
      setFailedAttempts(0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuspendedAccount(null); // Clear any previous suspended account error
    setLockedAccount(null); // Clear any previous locked account error

    // Check maintenance mode status before attempting login
    let maintenanceMode = false;
    try {
      const maintenanceResponse = await apiClient.get('/api/maintenance/status');
      maintenanceMode = maintenanceResponse.data.maintenanceMode;
      
      if (maintenanceMode) {
        console.log('🔧 Maintenance mode is enabled - IT users can still login');
        // Don't block login - let the backend handle the maintenance mode logic
        // IT users should be able to login even during maintenance
      }
    } catch (error) {
      console.error('Error checking maintenance status:', error);
      // Continue with login if maintenance check fails
    }

    const result = await login(formData.username, formData.password);
    
    if (result.success) {
      setFailedAttempts(0); // Reset failed attempts on successful login
      navigate(result.dashboardPath);
    } else if (result.type === 'ACCOUNT_SUSPENDED') {
      setSuspendedAccount(result);
    } else if (result.type === 'ACCOUNT_LOCKED') {
      setLockedAccount(result);
    } else if (result.type === 'MAINTENANCE_MODE') {
      // Handle maintenance mode error from login attempt
      toast.error(
        <div>
          <div className="font-bold text-orange-600 mb-2">🔧 System Under Maintenance</div>
          <div className="text-sm text-gray-700 mb-2">{result.message}</div>
          {result.estimatedDuration && (
            <div className="text-xs text-gray-600">
              ⏱️ Estimated Duration: {result.estimatedDuration}
            </div>
          )}
          <div className="text-xs text-blue-600 mt-1">
            📧 Contact: epicedgecreative@gmail.com
          </div>
        </div>,
        {
          duration: 8000,
          style: {
            background: '#fef3c7',
            border: '1px solid #fbbf24',
            color: '#d97706',
            minWidth: '350px'
          }
        }
      );
    } else if (result.type === 'LOGIN_FAILED') {
      // Extract attempt count from message
      const attemptMatch = result.message?.match(/Failed login attempt (\d+) of 4/);
      if (attemptMatch) {
        setFailedAttempts(parseInt(attemptMatch[1]));
      }
    }
    
    setLoading(false);
  };

  // Show loading while checking maintenance mode
  if (checkingMaintenance) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking system status...</p>
        </div>
      </div>
    );
  }

  // Don't show maintenance page immediately - let users see login form and handle maintenance during login

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
              <Heart className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Hospital Management System
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Good Health and Well-being
          </p>
          <p className="mt-2 text-lg font-medium text-gray-900">
            Sign in to your account
          </p>
        </div>

        {/* Maintenance Status Indicator */}
        {maintenanceInfo && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-orange-800">
                    System Maintenance Notice
                  </h3>
                  <p className="text-sm text-orange-700 mt-1">
                    {maintenanceInfo.message || 'System is currently under maintenance. Please try again later.'}
                  </p>
                  {maintenanceInfo.estimatedDuration && (
                    <p className="text-xs text-orange-600 mt-1">
                      Estimated Duration: {maintenanceInfo.estimatedDuration}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  setCheckingMaintenance(true);
                  apiClient.get('/api/maintenance/status')
                    .then(response => {
                      if (!response.data.maintenanceMode) {
                        setMaintenanceInfo(null);
                        toast.success('Maintenance mode has been disabled. You can now login!');
                      } else {
                        setMaintenanceInfo(response.data);
                        toast.info('System is still under maintenance. Please try again later.');
                      }
                    })
                    .catch(error => {
                      console.error('Error checking maintenance status:', error);
                      toast.error('Failed to check maintenance status');
                    })
                    .finally(() => {
                      setCheckingMaintenance(false);
                    });
                }}
                disabled={checkingMaintenance}
                className="flex items-center space-x-1 px-3 py-1 text-xs bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
              >
                <svg className={`w-3 h-3 ${checkingMaintenance ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Check Again</span>
              </button>
            </div>
          </div>
        )}

        {/* Login Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username or Email
              </label>
              <div className="mt-1">
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Enter your username or email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`appearance-none relative block w-full px-3 py-2 pr-10 border placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:z-10 sm:text-sm ${
                    failedAttempts > 0 
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="Enter your password"
                                  />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              
              {/* Failed Attempts Indicator */}
              {failedAttempts > 0 && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4].map((attempt) => (
                          <div
                            key={attempt}
                            className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                              attempt <= failedAttempts 
                                ? 'bg-red-500' 
                                : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-red-700 font-medium">
                        {failedAttempts} of 4 failed attempts
                      </span>
                    </div>
                    {failedAttempts >= 3 && (
                      <span className="text-xs text-orange-700 font-medium">
                        ⚠️ Account will be locked on next failed attempt
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                  Forgot your password?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Lock className="h-5 w-5 mr-2" />
                    Sign in
                  </>
                )}
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
                  Register here
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Suspended Account Warning */}
        {suspendedAccount && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-lg">🚫</span>
                </div>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-red-800">
                  Account Suspended
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{suspendedAccount.message}</p>
                </div>
                {suspendedAccount.supportContact && (
                  <div className="mt-3 text-sm">
                    <div className="bg-white border border-red-200 rounded p-3">
                      <p className="text-red-800 font-medium">Need Help?</p>
                      <p className="text-red-700 mt-1">
                        Contact IT Support: 
                        <a 
                          href={`mailto:${suspendedAccount.supportContact}`}
                          className="ml-1 text-blue-600 hover:text-blue-800 underline"
                        >
                          {suspendedAccount.supportContact}
                        </a>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Locked Account Warning */}
        {lockedAccount && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 text-lg">🔒</span>
                </div>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-orange-800">
                  Account Locked
                </h3>
                <div className="mt-2 text-sm text-orange-700">
                  <p>{lockedAccount.message}</p>
                </div>
                {lockedAccount.supportContact && (
                  <div className="mt-3 text-sm">
                    <div className="bg-white border border-orange-200 rounded p-3">
                      <p className="text-orange-800 font-medium">Need Help?</p>
                      <p className="text-orange-700 mt-1">
                        Contact IT Support: 
                        <a 
                          href={`mailto:${lockedAccount.supportContact}`}
                          className="ml-1 text-blue-600 hover:text-blue-800 underline"
                        >
                          {lockedAccount.supportContact}
                        </a>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login; 