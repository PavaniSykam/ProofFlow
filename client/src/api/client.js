import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const pathname = window.location.pathname;
      const isPublicRoute = pathname === '/' || pathname === '/login';
      const isAuthProbe = error.config?.url?.includes('/auth/me');

      if (!isPublicRoute && !isAuthProbe) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
