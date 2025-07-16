const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const API_URL = API_BASE_URL;

// Configure axios defaults
import axios from 'axios';

axios.defaults.baseURL = API_BASE_URL;

export default axios; 