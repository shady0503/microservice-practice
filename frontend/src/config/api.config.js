export const API_CONFIG = {
  USER_SERVICE: import.meta.env.VITE_USER_SERVICE_URL || 'http://localhost:8081/api',
  BUS_SERVICE: import.meta.env.VITE_BUS_SERVICE_URL || 'http://localhost:8080/api',
  TICKET_SERVICE: import.meta.env.VITE_TICKET_SERVICE_URL || 'http://localhost:8080/api/v1',
  ROUTE_SERVICE: import.meta.env.VITE_ROUTE_SERVICE_URL || 'http://localhost:8082/api',
  WS_TRACKING: import.meta.env.VITE_WS_TRACKING_URL || 'ws://localhost:8080/ws/gps-tracking',
};

export const API_TIMEOUT = 10000; // 10 seconds
