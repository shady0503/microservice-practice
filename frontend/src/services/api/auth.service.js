import createApiClient from './client';
import { API_CONFIG } from '@/config/api.config';

const authClient = createApiClient(API_CONFIG.USER_SERVICE);

export const authService = {
  async login(email, password) {
    const response = await authClient.post('/auth/login', { email, password });
    return response;
  },

  async register(userData) {
    const response = await authClient.post('/auth/register', userData);
    return response;
  },

  async getCurrentUser() {
    const response = await authClient.get('/users/me');
    return response;
  },
};
