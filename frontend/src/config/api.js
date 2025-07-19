// API Configuration
// Always use Render backend for both development and production
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://mern-final-project-bres.onrender.com';

const WS_BASE_URL = process.env.REACT_APP_WS_URL || 'https://mern-final-project-bres.onrender.com';

// For debugging - log the current API URL
console.log('🔧 API Configuration Debug:');
console.log('Current NODE_ENV:', process.env.NODE_ENV);
console.log('Current hostname:', window.location.hostname);
console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
console.log('Final API_BASE_URL:', API_BASE_URL);
console.log('Final WS_BASE_URL:', WS_BASE_URL);

export { API_BASE_URL, WS_BASE_URL }; 