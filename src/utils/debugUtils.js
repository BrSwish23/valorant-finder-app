// Debug utilities for development-only logging
import API_CONFIG from '../config/apiConfig';

// Development-only console.log wrapper
export const debugLog = (...args) => {
  if (API_CONFIG.IS_DEVELOPMENT) {
    console.log(...args);
  }
};

// Development-only console.error wrapper
export const debugError = (...args) => {
  if (API_CONFIG.IS_DEVELOPMENT) {
    console.error(...args);
  }
};

// Development-only console.warn wrapper
export const debugWarn = (...args) => {
  if (API_CONFIG.IS_DEVELOPMENT) {
    console.warn(...args);
  }
};

// Check if debug mode is enabled
export const isDebugMode = () => API_CONFIG.IS_DEVELOPMENT; 