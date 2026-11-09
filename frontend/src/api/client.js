import axios from 'axios';

// Dynamically resolve API URL in production on Render or local Vite dev server
const rawUrl = import.meta.env.VITE_API_URL;
const baseURL = rawUrl
  ? (rawUrl.endsWith('/api') ? rawUrl : `${rawUrl.replace(/\/+$/, '')}/api`)
  : '/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('propassist_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Response interceptor to handle 401 unauthenticated
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-redirect if we are checking /me or public routes
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/chat') && !window.location.pathname.startsWith('/call')) {
        localStorage.removeItem('propassist_token');
        localStorage.removeItem('propassist_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
