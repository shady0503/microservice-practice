import createApiClient from './client';
import { API_CONFIG } from '@/config/api.config';

const userClient = createApiClient(API_CONFIG.USER_SERVICE);

export const userService = {
  async getUserById(id) {
    const response = await userClient.get(`/users/${id}`);
    return response;
  },

  async getAllUsers() {
    const response = await userClient.get('/users/admin/all');
    return response;
  },

  async updateUser(id, data) {
    const response = await userClient.put(`/users/${id}`, data);
    return response;
  },

  async deleteUser(id) {
    const response = await userClient.delete(`/users/${id}`);
    return response;
  },

  async updateUserRole(userId, role) {
    const response = await userClient.put(`/users/admin/${userId}/role`, { role });
    return response;
  },

  async changePassword(currentPassword, newPassword) {
    const response = await userClient.post('/users/change-password', {
      currentPassword,
      newPassword,
    });
    return response;
  },
};
