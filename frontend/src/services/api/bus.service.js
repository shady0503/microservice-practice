import createApiClient from './client';
import { API_CONFIG } from '@/config/api.config';

const busClient = createApiClient(API_CONFIG.BUS_SERVICE);

export const busService = {
  async getBusesByLine(lineRef) {
    const response = await busClient.get(`/buses/line/${lineRef}`);
    return response;
  },

  async getBusById(busId) {
    const response = await busClient.get(`/buses/${busId}`);
    return response;
  },

  async getActiveBuses() {
    const response = await busClient.get('/buses/active');
    return response;
  },
};
