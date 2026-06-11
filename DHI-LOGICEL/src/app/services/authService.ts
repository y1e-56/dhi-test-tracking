import api from './api';
import { mapUserFromBackend, mapUserToBackend } from '../utils/mappers';
import { User } from '../types';

export interface LoginResponse {
  token: string;
  user: User;
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await api.post('/auth/login', { email, password });
    const { token, user } = response.data;
    const mappedUser = mapUserFromBackend(user);
    localStorage.setItem('token', token);
    localStorage.setItem('currentUser', JSON.stringify(mappedUser));
    return { token, user: mappedUser };
  },

  async register(userData: Partial<User> & { password: string }): Promise<User> {
    const payload = mapUserToBackend(userData);
    const response = await api.post('/auth/register', payload);
    return mapUserFromBackend(response.data.user);
  },

  async getProfile(): Promise<User> {
    const response = await api.get('/auth/profile');
    return mapUserFromBackend(response.data);
  },

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
  },

  getCurrentUser(): User | null {
    const stored = localStorage.getItem('currentUser');
    return stored ? JSON.parse(stored) : null;
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  },
};
