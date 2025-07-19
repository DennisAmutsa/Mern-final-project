import axios from 'axios';
import { API_BASE_URL } from './api';

// Create a centralized axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('🚀 Making request to:', config.url);
    console.log('🔑 Token available:', !!token);
    console.log('📋 Request method:', config.method?.toUpperCase());
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Authorization header added');
    } else {
      console.log('⚠️ No token found in localStorage');
    }
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ Response received:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ Response error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      data: error.response?.data
    });
    
    if (error.response?.status === 401) {
      console.log('🔒 Unauthorized - clearing token and redirecting to login');
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient; 