// API Configuration
// Force production URL when not in development
const isDevelopment = process.env.NODE_ENV === 'development' && window.location.hostname === 'localhost';
const API_BASE_URL = isDevelopment 
  ? 'http://localhost:5000' // Use local backend only in development
  : 'https://mern-final-project-bres.onrender.com'; // Always use Render backend in production

const WS_BASE_URL = isDevelopment
  ? 'http://localhost:5000'
  : 'https://mern-final-project-bres.onrender.com';

// For debugging - log the current API URL
console.log('Current NODE_ENV:', process.env.NODE_ENV);
console.log('Current hostname:', window.location.hostname);
console.log('Is development:', isDevelopment);
console.log('Current API_BASE_URL:', API_BASE_URL);

export { API_BASE_URL, WS_BASE_URL }; 