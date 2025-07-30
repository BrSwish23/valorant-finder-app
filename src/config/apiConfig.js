// Valorant API Configuration
// API calls now go through dedicated Node.js backend

const isDevelopment = process.env.NODE_ENV === 'development';
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const API_CONFIG = {
  // Backend API endpoints
  BACKEND_BASE_URL: isDevelopment && isLocalhost 
    ? 'http://localhost:3001' // Local development backend
    : 'https://valorant-finder-backend.onrender.com', // Production backend on Render
  
  // Environment detection
  IS_DEVELOPMENT: isDevelopment && isLocalhost,
  
  // API endpoints
  VALIDATE_PROFILE_ENDPOINT: '/api/valorant/validate-profile',
  TEST_ENDPOINT: '/api/valorant/test',
  HEALTH_ENDPOINT: '/health',
  
  // Legacy config (for reference)
  API_BASE_URL: 'https://api.henrikdev.xyz/valorant/v2',
  VALORANT_API_KEY: 'HDEV-f1588d35-627e-4c94-8bc9-8d967b3d2f88' // Only used in fallback scenarios
};

export default API_CONFIG; 