import { API_CONFIG } from '@/config/api.config';

export class GPSTrackingService {
  constructor() {
    this.ws = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  connect(ticketId) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    const wsUrl = `${API_CONFIG.WS_TRACKING}?ticketId=${ticketId}`;
    console.log('Connecting to GPS tracking:', wsUrl);

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('GPS tracking WebSocket connected');
      this.reconnectAttempts = 0;
      this.notifyListeners('connected', { connected: true });
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('GPS update received:', data);
        this.notifyListeners('location', data);
      } catch (error) {
        console.error('Error parsing GPS data:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.notifyListeners('error', error);
    };

    this.ws.onclose = () => {
      console.log('GPS tracking WebSocket closed');
      this.notifyListeners('disconnected', { connected: false });
      this.attemptReconnect(ticketId);
    };
  }

  attemptReconnect(ticketId) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

      console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

      setTimeout(() => {
        this.connect(ticketId);
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
      this.notifyListeners('error', { message: 'Failed to reconnect to GPS tracking' });
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
    this.reconnectAttempts = 0;
  }

  addListener(id, callback) {
    this.listeners.set(id, callback);
  }

  removeListener(id) {
    this.listeners.delete(id);
  }

  notifyListeners(event, data) {
    this.listeners.forEach((callback) => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Error in GPS listener:', error);
      }
    });
  }

  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected. Cannot send message:', message);
    }
  }
}

// Singleton instance
export const gpsTrackingService = new GPSTrackingService();
