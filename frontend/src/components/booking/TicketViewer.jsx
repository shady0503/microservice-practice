import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const TicketViewer = ({ ticket, bus }) => {
  const [busLocation, setBusLocation] = useState({ lat: bus.latitude, lng: bus.longitude });

  useEffect(() => {
    // Connect to Real-time GPS WebSocket
    const ws = new WebSocket('ws://localhost:8080/ws/gps-tracking');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'GPS_UPDATE' && data.payload.busId === bus.id) {
        setBusLocation({ 
          lat: data.payload.latitude, 
          lng: data.payload.longitude 
        });
      }
    };

    return () => ws.close();
  }, [bus.id]);

  return (
    <div className="p-6 max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
      {/* Ticket Card */}
      <div className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100 flex flex-col items-center text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
        <h2 className="text-2xl font-bold mb-2 text-gray-800">Billet Urbain</h2>
        <div className="text-sm text-gray-500 mb-6">ID: {ticket.id.split('-')[0]}</div>
        
        <div className="bg-white p-4 rounded-xl border-2 border-dashed border-gray-300 mb-6">
          <QRCodeSVG value={`UM:${ticket.id}`} size={180} />
        </div>
        
        <div className="w-full space-y-3 text-left">
          <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-500">Statut</span>
            <span className="text-green-600 font-bold uppercase">{ticket.status}</span>
          </div>
          <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-500">Bus</span>
            <span className="font-bold">{bus.busNumber}</span>
          </div>
        </div>
      </div>

      {/* Live Tracking Map */}
      <div className="bg-gray-100 rounded-3xl overflow-hidden shadow-inner h-[500px] relative">
        <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur px-3 py-1 rounded-full shadow text-xs font-bold flex items-center gap-2">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          LIVE TRACKING
        </div>
        <MapContainer center={[busLocation.lat, busLocation.lng]} zoom={14} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
            {/* Simple marker logic - assumes Leaflet CSS/Images are handled globally or via CDN in index.html */}
            <Marker position={[busLocation.lat, busLocation.lng]}>
              <Popup>Bus {bus.busNumber}</Popup>
            </Marker>
        </MapContainer>
      </div>
    </div>
  );
};

export default TicketViewer;