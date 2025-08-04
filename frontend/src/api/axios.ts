import axios from 'axios';
import { getToken, removeToken } from '../utils/token';

const api = axios.create({
  baseURL: 'http://13.204.111.241:3003'
});

// Attach JWT to all requests
api.interceptors.request.use(config => {
  const token = getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 (JWT expired/invalid)
api.interceptors.response.use(
  res => res,
  err => {
    const token = getToken();
    if (err.response?.status === 401 && token) {
      removeToken();
      localStorage.removeItem('user');
      window.location.href = '/';
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('sessionExpired'));
      }, 100);
    }
    // If no token (e.g., login page), just reject the error
    return Promise.reject(err);
  }
);

export default api; 