import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and user data on unauthorized
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const login = (email, password) => {
  return api.post('/token', { username: email, password });
};

export const register = (email, password) => {
  return api.post('/users', { email, password });
};

export const getEmissionsAnalytics = (startDate, endDate, timeframe) => {
  return api.get('/emissions/analytics', {
    params: {
      start_date: startDate,
      end_date: endDate,
      timeframe
    }
  });
};

export const addEmissionsData = (data) => {
  return api.post('/emissions', data);
};

export const getEmissionsData = () => {
  return api.get('/emissions');
};

export default api; 