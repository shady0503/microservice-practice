import React, { useState, useEffect, useRef, useContext } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { TRAJET_API_URL, WS_URL } from '../config/api.config';
import { Search, MapPin, Navigation, Bus as BusIcon, Menu, ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import TicketPurchaseModal from './TicketPurchaseModal';
import 'leaflet/dist/leaflet.css';

// --- Custom Icons ---
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

// --- Helper: Map Click Handler ---
const LocationSelector = ({ mode, onSelect }) => {
    useMapEvents({
        click(e) {
            if (mode) {
                onSelect(e.latlng);
            }
        },
    });
    return null;
};

// --- Helper: Fit Bounds ---
const FitBounds = ({ geometry }) => {
    const map = useMap();
    useEffect(() => {
        if (geometry) {
            const geoJson = JSON.parse(geometry);
            const layer = L.geoJSON(geoJson);
            const bounds = layer.getBounds();
            if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [50, 50] });
            }
        }
    }, [geometry, map]);
    return null;
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
    const [busPositions, setBusPositions] = useState({}); // { busId: { ...data } }

    const wsRef = useRef(null);

    // --- Search Logic ---
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

    // --- Select Route Logic ---
    const handleSelectRoute = async (route) => {
        setSelectedRoute(route);
        setSidebarMode('DETAILS');
        setBusPositions({}); // Clear old buses

        // Fetch Geometry
        try {
            const res = await axios.get(`${TRAJET_API_URL}/lines/${route.lineRef}/complete`);
            // Find specific route direction match (simplified logic here)
            const matchedRoute = res.data.routes.find(r => r.id === route.routeId) || res.data.routes[0];
            setRouteGeometry(matchedRoute.geometry);
        } catch (e) {
            console.error("Failed to load geometry", e);
        }
    };

    // --- WebSocket Logic ---
    useEffect(() => {
        if (!selectedRoute) return;

        // Open WS Connection
        wsRef.current = new WebSocket(WS_URL);

        wsRef.current.onopen = () => {
            console.log("WS Connected");
        };

        wsRef.current.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.type === 'GPS_UPDATE') {
                    const payload = message.payload;
                    // Filter buses by current line
                    // The payload might use lineNumber or busMatricule containing the line
                    // Adjust matching logic based on exact API response
                    const lineRef = payload.lineNumber || (payload.lineCode) || "";
                    
                    if (lineRef === selectedRoute.lineRef) {
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
            <div className="absolute left-4 top-20 bottom-4 w-[400px] z-[1000] flex flex-col gap-4">
                
                {/* Search Card */}
                {sidebarMode === 'SEARCH' && (
                    <div className="bg-white/90 backdrop-blur-md shadow-xl rounded-2xl p-6 flex flex-col gap-4 border border-white/20">
                        <h1 className="text-xl font-bold text-slate-800">Plan your trip</h1>
                        
                        <div className="space-y-3">
                            <div className="flex gap-2">
                                <Button 
                                    variant={selectionMode === 'START' ? "default" : "outline"}
                                    className="flex-1 justify-start gap-2"
                                    onClick={() => setSelectionMode(selectionMode === 'START' ? null : 'START')}
                                >
                                    <MapPin className="w-4 h-4 text-green-600" />
                                    {searchPoints.start ? "Start Set" : "Click Map for Start"}
                                </Button>
                            </div>
                            <div className="flex gap-2">
                                <Button 
                                    variant={selectionMode === 'END' ? "default" : "outline"}
                                    className="flex-1 justify-start gap-2"
                                    onClick={() => setSelectionMode(selectionMode === 'END' ? null : 'END')}
                                >
                                    <MapPin className="w-4 h-4 text-red-600" />
                                    {searchPoints.end ? "Dest Set" : "Click Map for Dest"}
                                </Button>
                            </div>
                            <Button className="w-full bg-primary hover:bg-primary/90" onClick={handleSearch}>
                                <Search className="w-4 h-4 mr-2" /> Find Routes
                            </Button>
                        </div>

                        {/* Results List */}
                        <div className="flex-1 overflow-y-auto pr-2 space-y-2 max-h-[400px]">
                            {routes.map((route, idx) => (
                                <div 
                                    key={idx} 
                                    onClick={() => handleSelectRoute(route)}
                                    className="p-4 bg-white rounded-xl border hover:border-primary hover:shadow-md cursor-pointer transition-all group"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded text-sm">
                                                Line {route.lineRef}
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
                    </div>
                )}

                {/* Details Card */}
                {sidebarMode === 'DETAILS' && selectedRoute && (
                    <div className="bg-white/90 backdrop-blur-md shadow-xl rounded-2xl p-0 flex flex-col border border-white/20 overflow-hidden h-full max-h-[600px]">
                        <div className="p-4 bg-primary text-white">
                            <button onClick={() => { setSidebarMode('SEARCH'); setBusPositions({}); setRouteGeometry(null); }} className="flex items-center gap-2 text-sm hover:underline mb-2">
                                <ArrowLeft className="w-4 h-4" /> Back to results
                            </button>
                            <h2 className="text-2xl font-bold">Line {selectedRoute.lineRef}</h2>
                            <p className="text-white/80 text-sm truncate">{selectedRoute.lineName}</p>
                        </div>

                        <div className="p-4 flex-1 overflow-y-auto">
                            <div className="flex justify-between items-center mb-6 bg-slate-50 p-3 rounded-lg border">
                                <div>
                                    <div className="text-xs text-slate-500 uppercase font-bold">Total Fare</div>
                                    <div className="text-xl font-bold text-slate-800">{selectedRoute.price} MAD</div>
                                </div>
                                <Button onClick={() => setIsTicketModalOpen(true)}>
                                    Buy Ticket
                                </Button>
                            </div>

                            <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                                <span className="relative flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                </span>
                                Live Buses ({Object.keys(busPositions).length})
                            </h3>
                            
                            <div className="space-y-2">
                                {Object.values(busPositions).length === 0 ? (
                                    <p className="text-sm text-slate-400 italic text-center py-4">Waiting for GPS signal...</p>
                                ) : (
                                    Object.values(busPositions).map(bus => (
                                        <div key={bus.busId} className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                                    <BusIcon className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-sm">{bus.busMatricule || "Unknown"}</div>
                                                    <div className="text-xs text-slate-500">{bus.speed?.toFixed(1)} km/h</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Map */}
            <MapContainer 
                center={[33.9716, -6.8498]} 
                zoom={13} 
                className="w-full h-full z-0"
                zoomControl={false}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
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

                {/* Route Geometry */}
                {routeGeometry && (
                    <>
                        <FitBounds geometry={routeGeometry} />
                        <Polyline 
                            positions={(() => {
                                // Simple GeoJSON LineString parser
                                try {
                                    const geo = JSON.parse(routeGeometry);
                                    // Handle MultiLineString vs LineString logic if needed, 
                                    // defaulting to simple coordinate flip [lon, lat] -> [lat, lon]
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
                            weight={5} 
                            opacity={0.7} 
                        />
                    </>
                )}

                {/* Live Bus Markers */}
                {Object.values(busPositions).map(bus => (
                    <Marker 
                        key={bus.busId}
                        position={[bus.latitude, bus.longitude]} 
                        icon={busIcon}
                    >
                        <Popup>
                            <div className="font-sans">
                                <b>{bus.busMatricule}</b><br/>
                                Speed: {bus.speed?.toFixed(1)} km/h
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            {/* Ticket Modal */}
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