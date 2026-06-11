import api from './api';
import { mapUserFromBackend, mapUserToBackend } from '../utils/mappers';
import { User } from '../types';

export const userService = {
  async getAll(): Promise<User[]> {
    const response = await api.get('/auth/users');
    return response.data.map(mapUserFromBackend);
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
