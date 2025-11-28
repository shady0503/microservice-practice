import React, { useState, useEffect, useRef, useContext } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { TRAJET_API_URL, WS_URL } from '../config/api.config';
import { Search, MapPin, Navigation, Bus as BusIcon, ArrowLeft, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import TicketPurchaseModal from './TicketPurchaseModal';
import 'leaflet/dist/leaflet.css';

// --- Icons ---
const busIcon = new L.DivIcon({
    className: 'custom-bus-icon',
    html: `<div style="background-color: #2563eb; width: 32px; height: 32px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.3);"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="17" cy="18" r="2"/></svg></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
});

const startIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

const endIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

// --- Map Components ---
const LocationSelector = ({ mode, onSelect }) => {
    useMapEvents({
        click(e) {
            if (mode) onSelect(e.latlng);
        },
    });
    return null;
};

const FitBounds = ({ geometry }) => {
    const map = useMap();
    useEffect(() => {
        if (geometry) {
            try {
                const geoJson = JSON.parse(geometry);
                const layer = L.geoJSON(geoJson);
                const bounds = layer.getBounds();
                if (bounds.isValid()) {
                    map.fitBounds(bounds, { padding: [50, 50] });
                }
            } catch (e) {
                console.error("Invalid GeoJSON for bounds");
            }
        }
    }, [geometry, map]);
    return null;
};

// --- Helpers ---
const calculateEstimatedArrival = (busLat, busLon, targetLat, targetLon, speedKmh) => {
    if (!busLat || !targetLat) return "N/A";
    
    // Haversine Distance
    const R = 6371; // Earth radius km
    const dLat = (targetLat - busLat) * Math.PI / 180;
    const dLon = (targetLon - busLon) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(busLat * Math.PI / 180) * Math.cos(targetLat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distanceKm = R * c;

    // Time = Distance / Speed
    const speed = speedKmh > 0 ? speedKmh : 25; // Default assumption if stopped
    const timeHours = distanceKm / speed;
    const timeMinutes = Math.round(timeHours * 60);

    if (timeMinutes < 1) return "< 1 min";
    return `~${timeMinutes} min`;
};

const DashboardPage = () => {
    const { user } = useContext(AuthContext);
    
    // UI State
    const [sidebarMode, setSidebarMode] = useState('SEARCH'); // SEARCH, DETAILS
    const [selectionMode, setSelectionMode] = useState(null); // 'START', 'END'
    const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

    // Data State
    const [searchPoints, setSearchPoints] = useState({ start: null, end: null });
    const [routes, setRoutes] = useState([]);
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [routeGeometry, setRouteGeometry] = useState(null);
    const [busPositions, setBusPositions] = useState({});

    const wsRef = useRef(null);

    // Search Logic
    const handleSearch = async () => {
        if (!searchPoints.start || !searchPoints.end) return;
        try {
            const { lat: fromLat, lng: fromLon } = searchPoints.start;
            const { lat: toLat, lng: toLon } = searchPoints.end;
            
            const response = await axios.get(`${TRAJET_API_URL}/search`, {
                params: { fromLat, fromLon, toLat, toLon }
            });
            setRoutes(response.data);
        } catch (error) {
            console.error("Search failed:", error);
        }
    };

    // Select Route Logic
    const handleSelectRoute = async (route) => {
        setSelectedRoute(route);
        setSidebarMode('DETAILS');
        setBusPositions({}); 

        try {
            const res = await axios.get(`${TRAJET_API_URL}/lines/${route.lineRef}/complete`);
            const matchedRoute = res.data.routes.find(r => r.id === route.routeId) || res.data.routes[0];
            if(matchedRoute) setRouteGeometry(matchedRoute.geometry);
        } catch (e) {
            console.error("Failed to load geometry", e);
        }
    };

    // WebSocket Logic
    useEffect(() => {
        if (!selectedRoute) return;

        wsRef.current = new WebSocket(WS_URL);

        wsRef.current.onopen = () => console.log("WS Connected");

        wsRef.current.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.type === 'GPS_UPDATE') {
                    const payload = message.payload;
                    // Match flexible line code (e.g. "L32H" matches "32H")
                    const wsLineCode = payload.lineCode || payload.lineNumber || "";
                    const routeLineRef = selectedRoute.lineRef;
                    
                    if (wsLineCode.includes(routeLineRef) || routeLineRef.includes(wsLineCode)) {
                        setBusPositions(prev => ({
                            ...prev,
                            [payload.busId]: payload
                        }));
                    }
                }
            } catch (e) {
                console.error("WS Parse Error", e);
            }
        };

        return () => {
            if (wsRef.current) wsRef.current.close();
        };
    }, [selectedRoute]);

    return (
        <div className="relative w-full h-screen overflow-hidden bg-slate-100">
            {/* Sidebar */}
            <div className="absolute left-4 top-20 bottom-4 w-[400px] z-[1000] flex flex-col gap-4 pointer-events-none">
                <div className="bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl border border-white/20 overflow-hidden flex flex-col h-full pointer-events-auto">
                    
                    {/* Header */}
                    <div className="p-4 bg-primary text-white shrink-0">
                        {sidebarMode === 'DETAILS' ? (
                            <div>
                                <button 
                                    onClick={() => { setSidebarMode('SEARCH'); setBusPositions({}); setRouteGeometry(null); }} 
                                    className="flex items-center gap-2 text-sm hover:underline mb-2 opacity-90"
                                >
                                    <ArrowLeft className="w-4 h-4" /> Back
                                </button>
                                <h2 className="text-2xl font-bold">Line {selectedRoute.lineRef}</h2>
                                <p className="text-white/80 text-sm truncate">{selectedRoute.lineName}</p>
                            </div>
                        ) : (
                            <h1 className="text-xl font-bold">Plan your Trip</h1>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {sidebarMode === 'SEARCH' ? (
                            <>
                                <div className="space-y-3 p-1">
                                    <div className="flex gap-2">
                                        <Button 
                                            variant={selectionMode === 'START' ? "default" : "outline"}
                                            className={`flex-1 justify-start gap-2 ${selectionMode === 'START' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                                            onClick={() => setSelectionMode(selectionMode === 'START' ? null : 'START')}
                                        >
                                            <MapPin className={`w-4 h-4 ${selectionMode === 'START' ? 'text-white' : 'text-green-600'}`} />
                                            {searchPoints.start ? "Start Set" : "Select Start"}
                                        </Button>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button 
                                            variant={selectionMode === 'END' ? "default" : "outline"}
                                            className={`flex-1 justify-start gap-2 ${selectionMode === 'END' ? 'bg-red-600 hover:bg-red-700' : ''}`}
                                            onClick={() => setSelectionMode(selectionMode === 'END' ? null : 'END')}
                                        >
                                            <MapPin className={`w-4 h-4 ${selectionMode === 'END' ? 'text-white' : 'text-red-600'}`} />
                                            {searchPoints.end ? "Dest Set" : "Select Dest"}
                                        </Button>
                                    </div>
                                    <Button className="w-full" onClick={handleSearch} disabled={!searchPoints.start || !searchPoints.end}>
                                        <Search className="w-4 h-4 mr-2" /> Find Routes
                                    </Button>
                                </div>

                                <div className="space-y-2">
                                    {routes.length === 0 && searchPoints.start && searchPoints.end && (
                                        <p className="text-center text-sm text-slate-400 py-4">Click 'Find Routes' to see options</p>
                                    )}
                                    {routes.map((route, idx) => (
                                        <div 
                                            key={idx} 
                                            onClick={() => handleSelectRoute(route)}
                                            className="p-4 bg-white rounded-xl border hover:border-primary hover:shadow-md cursor-pointer transition-all group"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded text-sm">
                                                        {route.lineRef}
                                                    </span>
                                                    <span className="text-sm font-medium text-slate-600 truncate max-w-[150px]">
                                                        to {route.destinationStop}
                                                    </span>
                                                </div>
                                                <span className="font-bold text-slate-800">{route.price} MAD</span>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-slate-500">
                                                <span className="flex items-center gap-1"><Navigation className="w-3 h-3" /> {route.duration}</span>
                                                <span>•</span>
                                                <span>{route.stops} Stops</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border shadow-sm">
                                    <div>
                                        <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Ticket Fare</div>
                                        <div className="text-2xl font-bold text-primary">{selectedRoute.price} MAD</div>
                                    </div>
                                    <Button onClick={() => setIsTicketModalOpen(true)} className="shadow-lg hover:shadow-xl">
                                        Buy Ticket
                                    </Button>
                                </div>

                                <div>
                                    <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                                        <span className="relative flex h-2 w-2">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                        </span>
                                        Live Buses ({Object.keys(busPositions).length})
                                    </h3>
                                    
                                    <div className="space-y-3">
                                        {Object.values(busPositions).length === 0 ? (
                                            <p className="text-sm text-slate-400 italic text-center py-8 bg-slate-50 rounded-xl border border-dashed">
                                                Waiting for real-time data...
                                            </p>
                                        ) : (
                                            Object.values(busPositions).map(bus => (
                                                <div key={bus.busId} className="p-3 bg-white border rounded-xl shadow-sm hover:shadow-md transition-all">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                                                                <BusIcon className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-sm text-slate-800">{bus.busMatricule}</div>
                                                                <div className="text-xs text-slate-500 flex items-center gap-1">
                                                                    <span>{bus.speed?.toFixed(0)} km/h</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        {searchPoints.start && (
                                                            <div className="text-right">
                                                                <div className="flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-full">
                                                                    <Clock className="w-3 h-3" />
                                                                    {calculateEstimatedArrival(
                                                                        bus.latitude, bus.longitude, 
                                                                        searchPoints.start.lat, searchPoints.start.lng, 
                                                                        bus.speed
                                                                    )}
                                                                </div>
                                                                <div className="text-[10px] text-slate-400 mt-1">Estimated Arrival</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Map */}
            <MapContainer 
                center={[33.9716, -6.8498]} 
                zoom={13} 
                className="w-full h-full z-0"
                zoomControl={false}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />
                
                <LocationSelector 
                    mode={selectionMode} 
                    onSelect={(latlng) => {
                        if (selectionMode === 'START') setSearchPoints(p => ({ ...p, start: latlng }));
                        if (selectionMode === 'END') setSearchPoints(p => ({ ...p, end: latlng }));
                        setSelectionMode(null);
                    }} 
                />

                {searchPoints.start && <Marker position={searchPoints.start} icon={startIcon} />}
                {searchPoints.end && <Marker position={searchPoints.end} icon={endIcon} />}

                {routeGeometry && (
                    <>
                        <FitBounds geometry={routeGeometry} />
                        <Polyline 
                            positions={(() => {
                                try {
                                    const geo = JSON.parse(routeGeometry);
                                    if(geo.coordinates) {
                                        if (geo.type === 'MultiLineString') {
                                            return geo.coordinates.map(seg => seg.map(p => [p[1], p[0]]));
                                        }
                                        return geo.coordinates.map(p => [p[1], p[0]]);
                                    }
                                    return [];
                                } catch(e) { return [] }
                            })()}
                            color="#2563eb" 
                            weight={6} 
                            opacity={0.8} 
                        />
                    </>
                )}

                {Object.values(busPositions).map(bus => (
                    <Marker 
                        key={bus.busId}
                        position={[bus.latitude, bus.longitude]} 
                        icon={busIcon}
                    >
                        <Popup>
                            <div className="font-sans text-center">
                                <b className="text-primary">{bus.busMatricule}</b><br/>
                                <span className="text-xs">{bus.speed?.toFixed(1)} km/h</span>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            <TicketPurchaseModal 
                isOpen={isTicketModalOpen} 
                onClose={() => setIsTicketModalOpen(false)}
                route={selectedRoute}
                user={user}
            />
        </div>
    );
};

export default DashboardPage;