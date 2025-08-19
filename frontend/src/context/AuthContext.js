import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../config/axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Set up apiClient interceptor for authentication
  useEffect(() => {
    if (token) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete apiClient.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const response = await apiClient.get('/api/auth/profile');
          setUser(response.data.user);
        } catch (error) {
          console.error('Auth check failed:', error);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = async (username, password) => {
    try {
      const response = await apiClient.post('/api/auth/login', {
        username,
        password
      });

      const { token: newToken, user: userData } = response.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      
      toast.success('Login successful!');
      return { success: true, dashboardPath: getDashboardPath(userData.role) };
    } catch (error) {
      const errorData = error.response?.data;
      
      // Handle suspended account specially
      if (errorData?.type === 'ACCOUNT_SUSPENDED') {
        const suspendedMessage = (
          <div>
            <div className="font-bold text-red-600 mb-2">🚫 Account Suspended</div>
            <div className="text-sm text-gray-700 mb-2">{errorData.message}</div>
            {errorData.supportContact && (
              <div className="text-xs text-blue-600">
                📧 Contact: {errorData.supportContact}
              </div>
            )}
          </div>
        );
        
        toast.error(suspendedMessage, {
          duration: 8000, // Show longer for suspended accounts
          style: {
            background: '#fee2e2',
            border: '1px solid #fca5a5',
            color: '#dc2626',
            minWidth: '350px'
          }
        });
        
        return { 
          success: false, 
          error: errorData.error,
          type: 'ACCOUNT_SUSPENDED',
          message: errorData.message,
          supportContact: errorData.supportContact
        };
      }

      // Handle locked account specially
      if (errorData?.type === 'ACCOUNT_LOCKED') {
        const lockedMessage = (
          <div>
            <div className="font-bold text-orange-600 mb-2">🔒 Account Locked</div>
            <div className="text-sm text-gray-700 mb-2">{errorData.message}</div>
            {errorData.supportContact && (
              <div className="text-xs text-blue-600">
                📧 Contact: {errorData.supportContact}
              </div>
            )}
          </div>
        );
        
        toast.error(lockedMessage, {
          duration: 8000, // Show longer for locked accounts
          style: {
            background: '#fef3c7',
            border: '1px solid #fbbf24',
            color: '#d97706',
            minWidth: '350px'
          }
        });
        
        return { 
          success: false, 
          error: errorData.error,
          type: 'ACCOUNT_LOCKED',
          message: errorData.message,
          supportContact: errorData.supportContact
        };
      }

      // Handle maintenance mode specially
      if (errorData?.type === 'MAINTENANCE_MODE') {
        const maintenanceMessage = (
          <div>
            <div className="font-bold text-orange-600 mb-2">🔧 System Under Maintenance</div>
            <div className="text-sm text-gray-700 mb-2">{errorData.message}</div>
            {errorData.estimatedDuration && (
              <div className="text-xs text-gray-600">
                ⏱️ Estimated Duration: {errorData.estimatedDuration}
              </div>
            )}
            <div className="text-xs text-blue-600 mt-1">
              📧 Contact: epicedgecreative@gmail.com
            </div>
          </div>
        );
        
        toast.error(maintenanceMessage, {
          duration: 10000, // Show longer for maintenance mode
          style: {
            background: '#fef3c7',
            border: '1px solid #fbbf24',
            color: '#d97706',
            minWidth: '350px'
          }
        });
        
        return { 
          success: false, 
          error: errorData.error,
          type: 'MAINTENANCE_MODE',
          message: errorData.message,
          estimatedDuration: errorData.estimatedDuration,
          activatedAt: errorData.activatedAt
        };
      }

      // Handle system lock specially
      if (errorData?.type === 'SYSTEM_LOCK') {
        const systemLockMessage = (
          <div>
            <div className="font-bold text-red-600 mb-2">🔒 System Locked</div>
            <div className="text-sm text-gray-700 mb-2">{errorData.message}</div>
            <div className="text-xs text-red-600 mb-2">
              Complete system lockdown is in effect
            </div>
            {errorData.emergencyContact && (
              <div className="text-xs text-blue-600">
                📧 Emergency Contact: {errorData.emergencyContact}
              </div>
            )}
          </div>
        );
        
        toast.error(systemLockMessage, {
          duration: 12000, // Show longer for system lock (more severe)
          style: {
            background: '#fee2e2',
            border: '1px solid #ef4444',
            color: '#dc2626',
            minWidth: '350px'
          }
        });
        
        return { 
          success: false, 
          error: errorData.error,
          type: 'SYSTEM_LOCK',
          message: errorData.message,
          emergencyContact: errorData.emergencyContact,
          activatedAt: errorData.activatedAt
        };
      }
      
      // Handle failed login attempts with attempt count
      if (errorData?.message && errorData.message.includes('Failed login attempt')) {
        const attemptMessage = (
          <div>
            <div className="font-bold text-red-600 mb-2">❌ Login Failed</div>
            <div className="text-sm text-gray-700 mb-2">{errorData.message}</div>
            <div className="text-xs text-orange-600 mt-1">
              ⚠️ Account will be locked after 4 failed attempts
            </div>
          </div>
        );
        
        toast.error(attemptMessage, {
          duration: 6000,
          style: {
            background: '#fee2e2',
            border: '1px solid #fca5a5',
            color: '#dc2626',
            minWidth: '350px'
          }
        });
        
        return { 
          success: false, 
          error: errorData.error,
          message: errorData.message,
          type: 'LOGIN_FAILED'
        };
      }
      
      // Handle other errors normally
      const message = errorData?.error || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await apiClient.post('/api/auth/register', userData);
      
      toast.success('Registration successful! You can now login.');
      return { success: true };
    } catch (error) {
      const errorData = error.response?.data;
      
      // Handle system lock specially
      if (errorData?.type === 'SYSTEM_LOCK') {
        const systemLockMessage = (
          <div>
            <div className="font-bold text-red-600 mb-2">🔒 System Locked</div>
            <div className="text-sm text-gray-700 mb-2">{errorData.message}</div>
            <div className="text-xs text-red-600 mb-2">
              Registration is disabled during system lockdown
            </div>
            {errorData.emergencyContact && (
              <div className="text-xs text-blue-600">
                📧 Emergency Contact: {errorData.emergencyContact}
              </div>
            )}
          </div>
        );
        
        toast.error(systemLockMessage, {
          duration: 12000,
          style: {
            background: '#fee2e2',
            border: '1px solid #ef4444',
            color: '#dc2626',
            minWidth: '350px'
          }
        });
        
        return { 
          success: false, 
          error: errorData.error,
          type: 'SYSTEM_LOCK',
          message: errorData.message,
          emergencyContact: errorData.emergencyContact
        };
      }
      
      const message = errorData?.error || 'Registration failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete apiClient.defaults.headers.common['Authorization'];
    toast.success('Logged out successfully');
    // Redirect to homepage instead of login
    window.location.href = '/';
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await apiClient.put('/api/auth/profile', profileData);
      setUser(response.data.user);
      toast.success('Profile updated successfully!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Profile update failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await apiClient.put('/api/auth/change-password', {
        currentPassword,
        newPassword
      });
      toast.success('Password changed successfully!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Password change failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return user.permissions?.includes(permission) || false;
  };

  const hasRole = (role) => {
    if (!user) return false;
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    return user.role === role;
  };

  const getDashboardPath = (role) => {
    switch (role) {
      case 'admin':
        return '/admin-dashboard';
      case 'doctor':
        return '/doctor-dashboard';
      case 'nurse':
        return '/nurse-dashboard';
      case 'receptionist':
        return '/receptionist-dashboard';
      case 'pharmacist':
        return '/pharmacist-dashboard';
      case 'lab_technician':
        return '/lab-technician-dashboard';
      case 'it':
        return '/it-dashboard';
      case 'user':
      case 'patient':
      case 'staff':
      default:
        return '/user-dashboard';
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    hasPermission,
    hasRole,
    getDashboardPath,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 