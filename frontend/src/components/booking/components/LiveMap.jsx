import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { motion } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom bus icon
const busIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="blue" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M8 6v6"></path>
      <path d="M15 6v6"></path>
      <path d="M2 12h19.6"></path>
      <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"></path>
      <circle cx="7" cy="18" r="2"></circle>
      <circle cx="17" cy="18" r="2"></circle>
    </svg>
  `),
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

export function LiveMap({ busPosition, route, stops = [], className = '' }) {
  const mapRef = useRef(null);

  const defaultCenter = busPosition
    ? [busPosition.lat, busPosition.lon]
    : [33.9716, -6.8498]; // Default to Rabat

  useEffect(() => {
    if (mapRef.current && busPosition) {
      mapRef.current.flyTo([busPosition.lat, busPosition.lon], 15, {
        duration: 1.5,
      });
    }
  }, [busPosition]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`rounded-lg overflow-hidden shadow-lg ${className}`}
    >
      <MapContainer
        center={defaultCenter}
        zoom={13}
        style={{ height: '100%', width: '100%', minHeight: '400px' }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Bus marker */}
        {busPosition && (
          <Marker position={[busPosition.lat, busPosition.lon]} icon={busIcon}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">Bus Location</p>
                <p className="text-xs text-gray-600">
                  Lat: {busPosition.lat.toFixed(6)}
                  <br />
                  Lon: {busPosition.lon.toFixed(6)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Route polyline */}
        {route && route.length > 0 && (
          <Polyline positions={route} color="blue" weight={4} opacity={0.7} />
        )}

        {/* Stop markers */}
        {stops.map((stop, index) => (
          <Marker key={index} position={[stop.lat, stop.lon]}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{stop.name}</p>
                {stop.eta && <p className="text-xs text-gray-600">ETA: {stop.eta}</p>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </motion.div>
  );
}
