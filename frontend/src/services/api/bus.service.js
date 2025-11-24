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
    // Fixed: Backend uses /buses/status/{status} not /buses/active
    const response = await busClient.get('/buses/status/ACTIVE');
    return response;
  },

  async getBusesByStatus(status) {
    // Added method to get buses by any status (ACTIVE or INACTIVE)
    const response = await busClient.get(`/buses/status/${status}`);
    return response;
  },

  async getAllBuses() {
    // Added method to get all buses
    const response = await busClient.get('/buses');
    return response;
  },

  async getBusByNumber(busNumber) {
    // Added method to get bus by number
    const response = await busClient.get(`/buses/number/${busNumber}`);
    return response;
  },
};
