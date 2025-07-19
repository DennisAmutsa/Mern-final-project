// API Configuration
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://mern-final-project-bres.onrender.com' // Use Render backend URL in production
  : 'http://localhost:5000'; // Use local backend in development

const WS_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://mern-final-project-bres.onrender.com'
  : 'http://localhost:5000';

export { API_BASE_URL, WS_BASE_URL }; 