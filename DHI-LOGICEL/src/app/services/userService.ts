import api from './api';
import { mapUserFromBackend, mapUserToBackend } from '../utils/mappers';
import { User, UserFilters } from '../types';

export const userService = {
  async getAll(): Promise<User[]> {
    const response = await api.get('/auth/users');
    return response.data.map(mapUserFromBackend);
  },

  async listPaginated(filters: UserFilters = {}): Promise<{ data: User[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.recherche) params.append('recherche', filters.recherche);
    if (filters.role) params.append('role', filters.role);
    if (filters.bloque) params.append('bloque', filters.bloque);
    if (filters.includeSupprimes) params.append('includeSupprimes', filters.includeSupprimes);
    const qs = params.toString();
    const response = await api.get(`/auth/users${qs ? `?${qs}` : ''}`);
    const result = response.data;
    if (result.data) {
      return { data: result.data.map(mapUserFromBackend), pagination: result.pagination };
    }
    return { data: result.map(mapUserFromBackend), pagination: { page: 1, limit: result.length, total: result.length, totalPages: 1 } };
  },

  async create(user: Partial<User> & { password: string }): Promise<User> {
    const payload = mapUserToBackend(user);
    const response = await api.post('/auth/register', payload);
    return mapUserFromBackend(response.data.user);
  },

  async block(id: string): Promise<void> {
    await api.patch(`/auth/users/${id}/block`);
  },

  async unblock(id: string): Promise<void> {
    await api.patch(`/auth/users/${id}/unblock`);
  },

  async softDelete(id: string): Promise<void> {
    await api.patch(`/auth/users/${id}/soft-delete`);
  },

  async restore(id: string): Promise<void> {
    await api.patch(`/auth/users/${id}/restore`);
  },
};
