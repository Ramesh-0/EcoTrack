/**
 * Environment variable loader for React
 * This helps load environment variables explicitly as React's environment
 * variables are limited to those with REACT_APP_ prefix and must be loaded at build time
 */

// Environment variable loader utility
// This handles environment variables and provides fallbacks for development

// Hardcoded API keys for testing - in production, these would come from environment variables
const devKeys = {
  REACT_APP_CLIMAQ_API_KEY: process.env.REACT_APP_CLIMAQ_API_KEY || '5XY8P8ZVQ91GV6GPDFPB6WPBWM',
  REACT_APP_API_URL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
};

/**
 * Get an environment variable with a fallback
 * @param {string} key - The environment variable key
 * @param {string} defaultValue - Default value if not found
 * @returns {string} The environment variable value or default
 */
export const getEnv = (key, defaultValue = '') => {
  // Use process.env in production, fallback to devKeys in development
  if (process.env.NODE_ENV === 'production') {
    return process.env[key] || defaultValue;
  }
  
  // In development, use our devKeys object with hardcoded values for testing
  return devKeys[key] || process.env[key] || defaultValue;
};

/**
 * Check if required environment variables are set
 * @param {Array<string>} requiredKeys - List of required keys
 * @returns {boolean} True if all required keys are set
 */
export const checkRequiredEnv = (requiredKeys = []) => {
  let allKeysPresent = true;
  
  requiredKeys.forEach(key => {
    const value = getEnv(key);
    if (!value) {
      console.error(`Missing required environment variable: ${key}`);
      allKeysPresent = false;
    }
  });
  
  return allKeysPresent;
};

export default {
  getEnv,
  checkRequiredEnv
}; 