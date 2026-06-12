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
    if (response.data && response.data.success === true && response.data.hasOwnProperty('data')) {
      return response.data.data;
    }
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    // Standardize error message extraction
    const backendError = error.response?.data?.error?.message || error.response?.data?.error || error.message;
    return Promise.reject(new Error(backendError));
  }
);

export default api;
