import React, { useState, useEffect, useRef, useContext } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { TRAJET_API_URL, WS_URL } from '../config/api.config';
import { Search, MapPin, Navigation, Bus as BusIcon, ArrowLeft, Clock, Crosshair, Map as MapIcon, RotateCcw, Loader2 } from 'lucide-react';
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

// --- Hooks ---
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

// --- Components ---
const LocationSelector = ({ mode, onSelect }) => {
    useMapEvents({
        click(e) { if (mode) onSelect(e.latlng); },
    });
    return null;
};

const FitBounds = ({ geometry, start, end, walkingPaths }) => {
    const map = useMap();
    useEffect(() => {
        const bounds = L.latLngBounds([]);
        let hasPoints = false;

        if (start) { bounds.extend([start.lat, start.lng]); hasPoints = true; }
        if (end) { bounds.extend([end.lat, end.lng]); hasPoints = true; }

        if (geometry) {
            try {
                const geoJson = JSON.parse(geometry);
                const layer = L.geoJSON(geoJson);
                const geoBounds = layer.getBounds();
                if (geoBounds.isValid()) {
                    bounds.extend(geoBounds);
                    hasPoints = true;
                }
            } catch (e) { console.error("Invalid GeoJSON"); }
        }

        // Include walking paths in bounds
        if (walkingPaths && walkingPaths.length > 0) {
            walkingPaths.forEach(path => {
                if (path && path.length > 0) {
                    path.forEach(pt => bounds.extend(pt));
                    hasPoints = true;
                }
            });
        }

        if (hasPoints && bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [geometry, start, end, walkingPaths, map]);
    return null;
};

const AddressAutocomplete = ({ value, onChange, onSelect, placeholder, icon: Icon, rightElement }) => {
    const [suggestions, setSuggestions] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef(null);
    const debouncedValue = useDebounce(value, 500);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchAddress = async () => {
            if (!debouncedValue || debouncedValue.length < 3 || debouncedValue.includes(',')) {
                setSuggestions([]);
                return;
            }
            if (/^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(debouncedValue)) return;

            setLoading(true);
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(debouncedValue)}&countrycodes=ma&limit=5`);
                const data = await res.json();
                setSuggestions(data);
                setIsOpen(true);
            } catch (e) {
                console.error("Geocoding error", e);
            } finally {
                setLoading(false);
            }
        };

        if (document.activeElement === wrapperRef.current?.querySelector('input')) {
            fetchAddress();
        }
    }, [debouncedValue]);

    return (
        <div className="relative z-20" ref={wrapperRef}>
            <div className="relative">
                {Icon && <Icon className="absolute left-3 top-3 h-4 w-4 text-slate-400" />}
                <input
                    className="w-full h-10 pl-9 pr-10 rounded-md border border-input bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => {
                        onChange(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => value.length >= 3 && setIsOpen(true)}
                />
                <div className="absolute right-2 top-2">
                    {loading ? <Loader2 className="h-5 w-5 text-primary animate-spin" /> : rightElement}
                </div>
            </div>

            {isOpen && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-slate-100 max-h-60 overflow-y-auto py-1">
                    {suggestions.map((item, idx) => (
                        <button
                            key={idx}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 flex items-start gap-2"
                            onClick={() => {
                                onSelect({
                                    lat: parseFloat(item.lat),
                                    lng: parseFloat(item.lon),
                                    display_name: item.display_name
                                });
                                setIsOpen(false);
                            }}
                        >
                            <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                            <span className="truncate">{item.display_name}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const MapPage = () => {
    const { user } = useContext(AuthContext);

    // UI State
    const [sidebarMode, setSidebarMode] = useState('SEARCH');
    const [selectionMode, setSelectionMode] = useState(null);
    const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
    const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);

    // Data State
    const [searchInputs, setSearchInputs] = useState({ start: '', end: '' });
    const [searchPoints, setSearchPoints] = useState({ start: null, end: null });
    const [routes, setRoutes] = useState([]);
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [routeGeometry, setRouteGeometry] = useState(null);
    const [busPositions, setBusPositions] = useState({});
    
    // Visualization
    const [walkingPaths, setWalkingPaths] = useState([]); // Array of coordinate arrays

    const wsRef = useRef(null);

    // Helpers
    const geocode = async (address) => {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
            const data = await res.json();
            if (data && data.length > 0) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
            return null;
        } catch (e) { return null; }
    };

    // Helper to calculate nearest stop
    const findNearestStop = (point, stops) => {
        if (!point || !stops || stops.length === 0) return null;
        let nearest = null;
        let minDist = Infinity;

        stops.forEach(stop => {
            // Simple Euclidean distance for local calculations
            const d = Math.sqrt(Math.pow(stop.latitude - point.lat, 2) + Math.pow(stop.longitude - point.lng, 2));
            if (d < minDist) {
                minDist = d;
                nearest = stop;
            }
        });
        return nearest;
    };

    // Fetch Walking Route from OSRM
    const fetchWalkingRoute = async (start, end) => {
        if (!start || !end) return [];
        try {
            // OSRM expects lon,lat;lon,lat
            const url = `https://router.project-osrm.org/route/v1/foot/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
            const response = await axios.get(url);
            
            if (response.data.routes && response.data.routes.length > 0) {
                const coordinates = response.data.routes[0].geometry.coordinates;
                // Convert [lon, lat] to [lat, lon] for Leaflet
                return coordinates.map(coord => [coord[1], coord[0]]);
            }
            return [[start.lat, start.lng], [end.lat, end.lng]]; // Fallback straight line
        } catch (e) {
            console.error("Routing error:", e);
            return [[start.lat, start.lng], [end.lat, end.lng]]; // Fallback straight line
        }
    };

    const handleAddressSearch = async (type) => {
        const addr = searchInputs[type];
        if (!addr) return;
        const coords = await geocode(addr);
        if (coords) setSearchPoints(prev => ({ ...prev, [type]: coords }));
        else alert("Address not found");
    };

    const handleUseMyLocation = () => {
        if (!navigator.geolocation) return alert("Geolocation not supported");
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setSearchPoints(prev => ({ ...prev, start: coords }));
                setSearchInputs(prev => ({ ...prev, start: "My Location" }));
            },
            () => alert("Unable to retrieve location")
        );
    };

    useEffect(() => {
        if (searchPoints.start && (!searchInputs.start || searchInputs.start.includes(','))) 
            setSearchInputs(p => ({...p, start: `${searchPoints.start.lat.toFixed(4)}, ${searchPoints.start.lng.toFixed(4)}`}));
        if (searchPoints.end && (!searchInputs.end || searchInputs.end.includes(','))) 
            setSearchInputs(p => ({...p, end: `${searchPoints.end.lat.toFixed(4)}, ${searchPoints.end.lng.toFixed(4)}`}));
    }, [searchPoints]);

    const handleSearch = async () => {
        if (!searchPoints.start || !searchPoints.end) return;
        setIsLoadingRoutes(true);
        try {
            const res = await axios.get(`${TRAJET_API_URL}/search`, { 
                params: { 
                    fromLat: searchPoints.start.lat, 
                    fromLon: searchPoints.start.lng, 
                    toLat: searchPoints.end.lat, 
                    toLon: searchPoints.end.lng 
                } 
            });
            setRoutes(res.data);
        } catch (error) { console.error("Search failed:", error); }
        finally { setIsLoadingRoutes(false); }
    };

    const handleSelectRoute = async (route) => {
        setSelectedRoute(route);
        setSidebarMode('DETAILS');
        setBusPositions({}); 
        setWalkingPaths([]);
        
        try {
            const res = await axios.get(`${TRAJET_API_URL}/lines/${route.lineRef}/complete`);
            const matchedRoute = res.data.routes.find(r => r.id === route.routeId) || res.data.routes[0];
            
            if (matchedRoute) {
                setRouteGeometry(matchedRoute.geometry);
                
                // Calculate Real Walking Routes to Nearest Stops
                if (matchedRoute.stops && matchedRoute.stops.length > 0) {
                    const nearestStart = findNearestStop(searchPoints.start, matchedRoute.stops);
                    const nearestEnd = findNearestStop(searchPoints.end, matchedRoute.stops);
                    
                    const paths = [];
                    
                    if (nearestStart) {
                        const path1 = await fetchWalkingRoute(
                            searchPoints.start, 
                            { lat: nearestStart.latitude, lng: nearestStart.longitude }
                        );
                        paths.push(path1);
                    }
                    
                    if (nearestEnd) {
                        const path2 = await fetchWalkingRoute(
                            { lat: nearestEnd.latitude, lng: nearestEnd.longitude },
                            searchPoints.end
                        );
                        paths.push(path2);
                    }
                    
                    setWalkingPaths(paths);
                }
            }
        } catch (e) { console.error("Failed to load geometry/routes", e); }
    };

    useEffect(() => {
        wsRef.current = new WebSocket(WS_URL);
        wsRef.current.onopen = () => console.log("✅ WebSocket Connected");
        wsRef.current.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.type === 'GPS_UPDATE') {
                    const payload = message.payload;
                    if (!selectedRoute) {
                        setBusPositions(prev => ({ ...prev, [payload.busId]: payload }));
                        return;
                    }
                    const wsRef = (payload.lineCode || "").split(':')[0].trim();
                    const routeRef = selectedRoute.lineRef;
                    if (wsRef === routeRef || wsRef === `L${routeRef}` || payload.lineCode?.includes(routeRef)) {
                        setBusPositions(prev => ({ ...prev, [payload.busId]: payload }));
                    }
                }
            } catch (e) { console.error("WS Parse Error", e); }
        };
        return () => { if (wsRef.current) wsRef.current.close(); };
    }, [selectedRoute]);

    return (
        <div className="relative w-full h-screen overflow-hidden bg-slate-100">
            {/* Sidebar */}
            <div className="absolute left-4 top-20 bottom-4 w-[400px] z-[1000] flex flex-col gap-4 pointer-events-none">
                <div className="bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl border border-white/20 overflow-hidden flex flex-col h-full pointer-events-auto">
                    <div className="p-4 bg-primary text-primary-foreground shrink-0">
                        {sidebarMode === 'DETAILS' ? (
                            <div>
                                <button onClick={() => { setSidebarMode('SEARCH'); setBusPositions({}); setRouteGeometry(null); setSelectedRoute(null); setWalkingPaths([]); }} className="flex items-center gap-2 text-sm hover:underline mb-2 opacity-90"><ArrowLeft className="w-4 h-4" /> Back</button>
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
                                            <div className="flex-1">
                                                <AddressAutocomplete 
                                                    placeholder="Search start address..."
                                                    value={searchInputs.start}
                                                    onChange={(val) => setSearchInputs(p => ({...p, start: val}))}
                                                    onSelect={(loc) => {
                                                        setSearchInputs(p => ({...p, start: loc.display_name}));
                                                        setSearchPoints(p => ({...p, start: {lat: loc.lat, lng: loc.lng}}));
                                                    }}
                                                    icon={MapPin}
                                                    rightElement={
                                                        <button onClick={() => setSelectionMode(selectionMode === 'START' ? null : 'START')} className={`p-1 hover:bg-slate-100 rounded ${selectionMode === 'START' ? 'text-green-600' : 'text-slate-400'}`}>
                                                            <MapIcon className="w-4 h-4" />
                                                        </button>
                                                    }
                                                />
                                            </div>
                                            <Button variant="secondary" size="icon" onClick={handleUseMyLocation}><Crosshair className="w-4 h-4" /></Button>
                                        </div>
                                    </div>

                                    <div className="flex justify-center -my-2 relative z-20">
                                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-slate-100 border hover:bg-slate-200" onClick={() => {
                                            setSearchPoints(p => ({ start: p.end, end: p.start }));
                                            setSearchInputs(p => ({ start: p.end, end: p.start }));
                                        }}>
                                            <RotateCcw className="w-3 h-3 text-slate-500" />
                                        </Button>
                                    </div>

                                    <div className="space-y-2 relative z-10">
                                        <label className="text-xs font-semibold text-slate-500 uppercase ml-1">To</label>
                                        <div className="flex gap-2">
                                            <div className="flex-1">
                                                <AddressAutocomplete 
                                                    placeholder="Search destination..."
                                                    value={searchInputs.end}
                                                    onChange={(val) => setSearchInputs(p => ({...p, end: val}))}
                                                    onSelect={(loc) => {
                                                        setSearchInputs(p => ({...p, end: loc.display_name}));
                                                        setSearchPoints(p => ({...p, end: {lat: loc.lat, lng: loc.lng}}));
                                                    }}
                                                    icon={MapPin}
                                                    rightElement={
                                                        <button onClick={() => setSelectionMode(selectionMode === 'END' ? null : 'END')} className={`p-1 hover:bg-slate-100 rounded ${selectionMode === 'END' ? 'text-red-600' : 'text-slate-400'}`}>
                                                            <MapIcon className="w-4 h-4" />
                                                        </button>
                                                    }
                                                />
                                            </div>
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
                
                <LocationSelector mode={selectionMode} onSelect={(latlng) => { 
                    const str = `${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`;
                    if (selectionMode === 'START') { setSearchPoints(p => ({ ...p, start: latlng })); setSearchInputs(p => ({...p, start: str})); }
                    if (selectionMode === 'END') { setSearchPoints(p => ({ ...p, end: latlng })); setSearchInputs(p => ({...p, end: str})); }
                    setSelectionMode(null); 
                }} />
                
                <FitBounds geometry={routeGeometry} start={searchPoints.start} end={searchPoints.end} walkingPaths={walkingPaths} />
                
                {searchPoints.start && <Marker position={searchPoints.start} icon={startIcon}><Popup>Start: {searchInputs.start}</Popup></Marker>}
                {searchPoints.end && <Marker position={searchPoints.end} icon={endIcon}><Popup>Destination: {searchInputs.end}</Popup></Marker>}
                
                {/* Bus Route */}
                {routeGeometry && <Polyline positions={(() => { try { const geo = JSON.parse(routeGeometry); return geo.coordinates ? (geo.type === 'MultiLineString' ? geo.coordinates.map(seg => seg.map(p => [p[1], p[0]])) : geo.coordinates.map(p => [p[1], p[0]])) : []; } catch (e) { return [] } })()} color="#2563eb" weight={6} opacity={0.8} />}
                
                {/* Visual Links (Real Walking Paths) */}
                {walkingPaths.map((path, idx) => (
                    <Polyline key={`walk-${idx}`} positions={path} color="#64748b" weight={4} dashArray="10, 10" opacity={0.6} />
                ))}

                {/* Live Buses */}
                {Object.values(busPositions).map(bus => (<Marker key={bus.busId} position={[bus.latitude, bus.longitude]} icon={busIcon}><Popup><div className="font-sans text-center"><b className="text-primary text-lg">{bus.busMatricule}</b><br /><span className="text-sm font-semibold">{bus.speed?.toFixed(1)} km/h</span></div></Popup></Marker>))}
            </MapContainer>

            {selectionMode && <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/80 text-white px-6 py-2 rounded-full z-[1100] font-medium flex items-center gap-2"><MapIcon className="w-4 h-4" /> Click map to select {selectionMode === 'START' ? 'Start' : 'Destination'}</div>}
            <TicketPurchaseModal isOpen={isTicketModalOpen} onClose={() => setIsTicketModalOpen(false)} route={selectedRoute} user={user} />
        </div>
    );
};

export default MapPage;