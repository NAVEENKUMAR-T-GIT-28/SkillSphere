import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Request interceptor - add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - unwrap backend success envelope and handle 401
api.interceptors.response.use(
  (response) => {
    // If backend response has standard envelope { success: true, data: ... }
    if (response.data && response.data.success === true && Object.prototype.hasOwnProperty.call(response.data, 'data')) {
      return {
        data: response.data.data,
        meta: response.data.meta || {}
      };
    }
    return response.data;
  },
  (error) => {
    const config = error.config;
    
    // Auth error handling
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject(new Error('Session expired'));
    }

    if (!config) {
      const backendError = error.response?.data?.error?.message || error.response?.data?.error || error.response?.data?.message || error.message;
      return Promise.reject(new Error(backendError));
    }

    config._retryCount = config._retryCount || 0;
    const status = error.response?.status;

    let shouldRetry = false;
    let maxRetries = 0;

    if (!error.response) {
      // Network failure
      shouldRetry = true;
      maxRetries = 2;
    } else if (status >= 500) {
      // Server error
      shouldRetry = true;
      maxRetries = 1;
    } else if (status === 400 || status === 403 || status === 404) {
      // Explicit NO RETRY for client errors
      shouldRetry = false;
    }

    if (shouldRetry && config._retryCount < maxRetries) {
      config._retryCount += 1;
      // Exponential backoff
      return new Promise((resolve) => {
        setTimeout(() => resolve(api(config)), 500 * config._retryCount);
      });
    }

    // Standardize error message extraction
    const backendError = error.response?.data?.error?.message || error.response?.data?.error || error.response?.data?.message || error.message;
    return Promise.reject(new Error(backendError));
  }
);

export default api;
