import createApiClient from './client';
import { API_CONFIG } from '@/config/api.config';

const routeClient = createApiClient(API_CONFIG.ROUTE_SERVICE);

export const routeService = {
  async searchRoutes({ fromLat, fromLon, toLat, toLon, date }) {
    const params = new URLSearchParams({
      fromLat: fromLat.toString(),
      fromLon: fromLon.toString(),
      toLat: toLat.toString(),
      toLon: toLon.toString(),
    });

    if (date) {
      params.append('date', date);
    }

    const response = await routeClient.get(`/search?${params.toString()}`);
    return response;
  },

  async getRouteById(routeId) {
    const response = await routeClient.get(`/routes/${routeId}`);
    return response;
  },
};
