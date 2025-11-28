import React, { useState, useEffect, useRef, useContext } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { TRAJET_API_URL, WS_URL } from '../config/api.config';
import { Search, MapPin, Navigation, Bus as BusIcon, ArrowLeft, Clock, Crosshair, Map as MapIcon, RotateCcw } from 'lucide-react';
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
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const endIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// --- Map Components ---
const LocationSelector = ({ mode, onSelect }) => {
    useMapEvents({
        click(e) { if (mode) onSelect(e.latlng); },
    });
    return null;
};

const FitBounds = ({ geometry, start, end }) => {
    const map = useMap();
    useEffect(() => {
        if (geometry) {
            try {
                const geoJson = JSON.parse(geometry);
                const layer = L.geoJSON(geoJson);
                const bounds = layer.getBounds();
                if (bounds.isValid()) map.fitBounds(bounds, { padding: [50, 50] });
            } catch (e) { console.error("Invalid GeoJSON"); }
        } else if (start && end) {
            const bounds = L.latLngBounds([start, end]);
            map.fitBounds(bounds, { padding: [100, 100] });
        }
    }, [geometry, start, end, map]);
    return null;
};

const MapPage = () => {
    const { user } = useContext(AuthContext);

    // UI State
    const [sidebarMode, setSidebarMode] = useState('SEARCH');
    const [selectionMode, setSelectionMode] = useState(null);
    const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
    const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);

    // Data State
    const [searchPoints, setSearchPoints] = useState({ start: null, end: null });
    const [routes, setRoutes] = useState([]);
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [routeGeometry, setRouteGeometry] = useState(null);
    const [busPositions, setBusPositions] = useState({});

    const wsRef = useRef(null);

    // Geolocation
    const handleUseMyLocation = () => {
        if (!navigator.geolocation) return alert("Geolocation not supported");
        navigator.geolocation.getCurrentPosition(
            (pos) => setSearchPoints(prev => ({ ...prev, start: { lat: pos.coords.latitude, lng: pos.coords.longitude } })),
            () => alert("Unable to retrieve location")
        );
    };

    // Route Search
    const handleSearch = async () => {
        if (!searchPoints.start || !searchPoints.end) return;
        setIsLoadingRoutes(true);
        try {
            const { lat: fromLat, lng: fromLon } = searchPoints.start;
            const { lat: toLat, lng: toLon } = searchPoints.end;
            const res = await axios.get(`${TRAJET_API_URL}/search`, { params: { fromLat, fromLon, toLat, toLon } });
            setRoutes(res.data);
        } catch (error) { console.error("Search failed:", error); }
        finally { setIsLoadingRoutes(false); }
    };

    // Select Route
    const handleSelectRoute = async (route) => {
        setSelectedRoute(route);
        setSidebarMode('DETAILS');
        // We DO NOT clear bus positions here anymore so we can see if matches happen immediately
        // setBusPositions({}); 
        try {
            const res = await axios.get(`${TRAJET_API_URL}/lines/${route.lineRef}/complete`);
            const matchedRoute = res.data.routes.find(r => r.id === route.routeId) || res.data.routes[0];
            if (matchedRoute) setRouteGeometry(matchedRoute.geometry);
        } catch (e) { console.error("Failed to load geometry", e); }
    };

    // WebSocket Logic (Global Connection + Filtering)
    useEffect(() => {
        // [FIX] Removed the "if (!selectedRoute) return;" check.
        // This allows the socket to connect as soon as the dashboard opens.

        wsRef.current = new WebSocket(WS_URL);

        wsRef.current.onopen = () => console.log("✅ WebSocket Connected to GPS Tracking");

        wsRef.current.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);

                if (message.type === 'GPS_UPDATE') {
                    const payload = message.payload;
                    // console.log("🚌 Bus Update:", payload.busMatricule, payload.lineNumber); // Uncomment for debugging

                    // 1. If NO route is selected, show ALL buses
                    if (!selectedRoute) {
                        setBusPositions(prev => ({ ...prev, [payload.busId]: payload }));
                        return;
                    }

                    // 2. If a route IS selected, check for match
                    const wsLineCode = payload.lineCode || payload.lineNumber || "";
                    const routeLineRef = selectedRoute.lineRef; // e.g. "7" or "32H"

                    // [FIX] Normalized Strict Matching
                    // Extract "32H" from "L32H" or "32H: ..."
                    const wsRef = wsLineCode.split(':')[0].trim();

                    // Matches if WS is "L7" and Route is "7", or "32H" === "32H"
                    const isMatch =
                        (wsRef === routeLineRef) ||
                        (wsRef === `L${routeLineRef}`) ||
                        (wsLineCode.includes(routeLineRef));

                    if (isMatch) {
                        setBusPositions(prev => ({ ...prev, [payload.busId]: payload }));
                    }
                }
            } catch (e) { console.error("WS Parse Error", e); }
        };

        wsRef.current.onerror = (e) => console.error("❌ WebSocket Error", e);

        return () => { if (wsRef.current) wsRef.current.close(); };
    }, [selectedRoute]); // Dependency ensures filter logic updates when route changes

    return (
        <div className="relative w-full h-screen overflow-hidden bg-slate-100">
            {/* Sidebar */}
            <div className="absolute left-4 top-20 bottom-4 w-[400px] z-[1000] flex flex-col gap-4 pointer-events-none">
                <div className="bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl border border-white/20 overflow-hidden flex flex-col h-full pointer-events-auto">
                    <div className="p-4 bg-primary text-primary-foreground shrink-0">
                        {sidebarMode === 'DETAILS' ? (
                            <div>
                                <button onClick={() => { setSidebarMode('SEARCH'); setBusPositions({}); setRouteGeometry(null); setSelectedRoute(null); }} className="flex items-center gap-2 text-sm hover:underline mb-2 opacity-90"><ArrowLeft className="w-4 h-4" /> Back</button>
                                <div className="flex items-baseline justify-between"><h2 className="text-2xl font-bold">Line {selectedRoute.lineRef}</h2><span className="text-sm bg-white/20 px-2 py-1 rounded">{selectedRoute.direction}</span></div>
                                <p className="text-white/80 text-sm truncate mt-1">{selectedRoute.lineName}</p>
                            </div>
                        ) : (<h1 className="text-xl font-bold">Plan your Trip</h1>)}
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {sidebarMode === 'SEARCH' ? (
                            <>
                                <div className="space-y-4 p-1 relative">
                                    <div className="absolute left-4 top-10 bottom-16 w-0.5 bg-slate-200 z-0"></div>
                                    <div className="space-y-2 relative z-10">
                                        <label className="text-xs font-semibold text-slate-500 uppercase ml-1">From</label>
                                        <div className="flex gap-2">
                                            <Button variant="outline" className={`flex-1 justify-start gap-2 bg-white ${selectionMode === 'START' ? 'ring-2 ring-green-500' : ''}`} onClick={() => setSelectionMode(selectionMode === 'START' ? null : 'START')}>
                                                <MapPin className="w-4 h-4 text-green-600" /> {searchPoints.start ? "Start Selected" : "Select Start"}
                                            </Button>
                                            <Button variant="secondary" size="icon" onClick={handleUseMyLocation}><Crosshair className="w-4 h-4" /></Button>
                                        </div>
                                    </div>
                                    <div className="flex justify-center -my-2 relative z-20"><Button size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-slate-100 border" onClick={() => setSearchPoints(p => ({ start: p.end, end: p.start }))}><RotateCcw className="w-3 h-3 text-slate-500" /></Button></div>
                                    <div className="space-y-2 relative z-10">
                                        <label className="text-xs font-semibold text-slate-500 uppercase ml-1">To</label>
                                        <div className="flex gap-2">
                                            <Button variant="outline" className={`flex-1 justify-start gap-2 bg-white ${selectionMode === 'END' ? 'ring-2 ring-red-500' : ''}`} onClick={() => setSelectionMode(selectionMode === 'END' ? null : 'END')}>
                                                <MapPin className="w-4 h-4 text-red-600" /> {searchPoints.end ? "Dest Selected" : "Select Destination"}
                                            </Button>
                                        </div>
                                    </div>
                                    <Button className="w-full h-12 text-lg shadow-md mt-4" onClick={handleSearch} disabled={!searchPoints.start || !searchPoints.end || isLoadingRoutes}>
                                        {isLoadingRoutes ? "Searching..." : <><Search className="w-4 h-4 mr-2" /> Find Routes</>}
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    {routes.map((route, idx) => (
                                        <div key={idx} onClick={() => handleSelectRoute(route)} className="p-4 bg-white rounded-xl border hover:border-primary hover:shadow-lg cursor-pointer transition-all">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-3"><span className="bg-primary text-primary-foreground font-bold px-3 py-1.5 rounded-lg">{route.lineRef}</span><div><div className="text-sm font-semibold">To {route.destinationStop}</div><div className="text-xs text-slate-500">From {route.originStop}</div></div></div>
                                                <span className="font-bold text-primary">{route.price} MAD</span>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs font-medium text-slate-500 bg-slate-50 p-2 rounded-lg">
                                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {route.duration}</span>
                                                <span className="w-px h-3 bg-slate-300"></span>
                                                <span className="flex items-center gap-1"><Navigation className="w-3 h-3" /> {route.stops} Stops</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm">
                                    <div><div className="text-xs text-slate-500 uppercase font-bold">Total Fare</div><div className="text-2xl font-bold text-primary">{selectedRoute.price} MAD</div></div>
                                    <Button onClick={() => setIsTicketModalOpen(true)} className="shadow-lg hover:shadow-xl px-6">Buy Ticket</Button>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2 text-sm uppercase tracking-wider"><span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span> Live Buses ({Object.keys(busPositions).length})</h3>
                                    <div className="space-y-3">
                                        {Object.values(busPositions).length === 0 ? <div className="text-sm text-slate-400 italic text-center py-8 bg-slate-50 rounded-xl border border-dashed"><BusIcon className="w-8 h-8 mx-auto mb-2 opacity-20" />Waiting for live bus data...</div> : Object.values(busPositions).map(bus => (
                                            <div key={bus.busId} className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100"><BusIcon className="w-5 h-5" /></div><div><div className="font-bold text-sm text-slate-800">{bus.busMatricule}</div><div className="text-xs text-slate-500 flex items-center gap-1"><span>{bus.speed?.toFixed(0)} km/h</span></div></div></div>
                                                    <div className="text-right"><div className="flex items-center gap-1 text-green-700 text-xs font-bold bg-green-100 px-2 py-1 rounded-full">Active</div></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <MapContainer center={[34.0227601, -6.8361348]} zoom={13} className="w-full h-full z-0" zoomControl={false}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
                <LocationSelector mode={selectionMode} onSelect={(latlng) => { if (selectionMode === 'START') setSearchPoints(p => ({ ...p, start: latlng })); if (selectionMode === 'END') setSearchPoints(p => ({ ...p, end: latlng })); setSelectionMode(null); }} />
                <FitBounds geometry={routeGeometry} start={searchPoints.start} end={searchPoints.end} />
                {searchPoints.start && <Marker position={searchPoints.start} icon={startIcon}><Popup>Start</Popup></Marker>}
                {searchPoints.end && <Marker position={searchPoints.end} icon={endIcon}><Popup>Destination</Popup></Marker>}
                {routeGeometry && <Polyline positions={(() => { try { const geo = JSON.parse(routeGeometry); return geo.coordinates ? (geo.type === 'MultiLineString' ? geo.coordinates.map(seg => seg.map(p => [p[1], p[0]])) : geo.coordinates.map(p => [p[1], p[0]])) : []; } catch (e) { return [] } })()} color="#2563eb" weight={6} opacity={0.8} />}
                {Object.values(busPositions).map(bus => (<Marker key={bus.busId} position={[bus.latitude, bus.longitude]} icon={busIcon}><Popup><div className="font-sans text-center"><b className="text-primary text-lg">{bus.busMatricule}</b><br /><span className="text-sm font-semibold">{bus.speed?.toFixed(1)} km/h</span></div></Popup></Marker>))}
            </MapContainer>

            {selectionMode && <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/80 text-white px-6 py-2 rounded-full z-[1100] font-medium flex items-center gap-2"><MapIcon className="w-4 h-4" /> Click map to select {selectionMode === 'START' ? 'Start' : 'Destination'}</div>}
            <TicketPurchaseModal isOpen={isTicketModalOpen} onClose={() => setIsTicketModalOpen(false)} route={selectedRoute} user={user} />
        </div>
    );
};

export default MapPage;
