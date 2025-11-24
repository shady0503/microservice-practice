import { useEffect, useState, useCallback } from 'react';
import { gpsTrackingService } from '@/services/websocket/gps-tracking.service';

export function useGPSTracking(ticketId) {
  const [location, setLocation] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);

  const handleEvent = useCallback((event, data) => {
    switch (event) {
      case 'connected':
        setConnected(true);
        setError(null);
        break;

      case 'disconnected':
        setConnected(false);
        break;

      case 'location':
        setLocation(data);
        setError(null);
        break;

      case 'error':
        setError(data);
        break;

      default:
        console.warn('Unknown GPS event:', event);
    }
  }, []);

  useEffect(() => {
    if (!ticketId) return;

    const listenerId = `gps-tracking-${ticketId}`;

    // Add listener
    gpsTrackingService.addListener(listenerId, handleEvent);

    // Connect
    gpsTrackingService.connect(ticketId);

    // Cleanup
    return () => {
      gpsTrackingService.removeListener(listenerId);
      gpsTrackingService.disconnect();
    };
  }, [ticketId, handleEvent]);

  return {
    location,
    connected,
    error,
    isTracking: connected && location !== null,
  };
}
