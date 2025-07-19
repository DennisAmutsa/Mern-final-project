// API Configuration
// Use environment variable if available, otherwise fall back to default
const isDevelopment = process.env.NODE_ENV === 'development' && window.location.hostname === 'localhost';

// Check for environment variable first
const API_BASE_URL = process.env.REACT_APP_API_URL || (
  isDevelopment 
    ? 'http://localhost:5000' // Use local backend only in development
    : 'https://mern-final-project-bres.onrender.com' // Use Render backend in production
);

const WS_BASE_URL = process.env.REACT_APP_WS_URL || (
  isDevelopment
    ? 'http://localhost:5000'
    : 'https://mern-final-project-bres.onrender.com'
);

// For debugging - log the current API URL
console.log('Current NODE_ENV:', process.env.NODE_ENV);
console.log('Current hostname:', window.location.hostname);
console.log('Is development:', isDevelopment);
console.log('Current API_BASE_URL:', API_BASE_URL);

export { API_BASE_URL, WS_BASE_URL }; 