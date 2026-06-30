import axios, { AxiosError, AxiosInstance } from 'axios';

const hostname = window.location.hostname;
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || `http://${hostname}:5000/api`;

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur de requête : ajoute automatiquement le JWT
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

// Intercepteur de réponse : gestion globale des erreurs (401 = déconnexion auto)
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
      // Redirection si on n'est pas déjà sur la page login
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export function getErrorMessage(error: AxiosError<{ message?: string }>): string {
  if (error.response?.data?.message) return error.response.data.message;
  if (error.message === 'Network Error') return 'Erreur réseau : vérifiez que le backend est démarré';
  return error.message || 'Erreur inconnue';
}

export default api;
