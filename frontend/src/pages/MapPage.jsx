import React, { useState, useEffect, useRef, useContext } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, Tooltip, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { TRAJET_API_URL, WS_URL } from '../config/api.config';
import { 
    Search, 
    MapPin, 
    Navigation, 
    Bus as BusIcon, 
    ArrowLeft, 
    Clock, 
    Crosshair, 
    Loader2, 
    Users,
    Wifi,
    WifiOff,
    Navigation2,
    Ticket,
    Circle,
    Square,
    Map as MapIcon,
    AlertCircle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import TicketPurchaseModal from './TicketPurchaseModal';
import { motion, AnimatePresence } from 'framer-motion';
import 'leaflet/dist/leaflet.css';

// --- UTILS ---

const formatBusName = (fullName) => {
    if (!fullName) return "Bus";
    const parts = fullName.split('-');
    return parts.length > 1 ? `${parts[parts.length - 1]}` : fullName;
};

// Normalize line ref (e.g. "L6" -> "6", "06" -> "6") for comparison
const normalizeLineRef = (ref) => {
    if (!ref) return "";
    return ref.toString().replace(/^L0?/, '').replace(/^0+/, '').trim().toUpperCase();
};

// --- ICONS ---

const createBusIcon = (heading = 0, color = '#2563eb', opacity = 1) => {
    return new L.DivIcon({
        className: 'custom-bus-icon',
        html: `
            <div style="position: relative; width: 40px; height: 40px; opacity: ${opacity};">
                <div style="
                    transform: rotate(${heading}deg); 
                    transition: transform 0.5s ease;
                    background-color: ${color}; 
                    width: 36px; 
                    height: 36px; 
                    border-radius: 50%; 
                    border: 3px solid white; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                ">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="3 11 22 2 13 21 11 13 3 11"/>
                    </svg>
                </div>
            </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20]
    });
};

const createPinIcon = (color) => new L.DivIcon({
    className: 'custom-pin',
    html: `<div style="color: ${color}; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3" fill="white"/></svg>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
});

// --- SUB-COMPONENTS ---

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
                if (layer.getBounds().isValid()) { bounds.extend(layer.getBounds()); hasPoints = true; }
            } catch (e) {}
        }
        if (walkingPaths) walkingPaths.flat().forEach(pt => { if (pt) bounds.extend(pt); });
        
        if (hasPoints && bounds.isValid()) map.fitBounds(bounds, { padding: [80, 80], maxZoom: 15 });
    }, [geometry, start, end, walkingPaths, map]);
    return null;
};

const AddressAutocomplete = ({ value, onChange, onSelect, placeholder, icon: Icon, rightElement }) => {
    const [suggestions, setSuggestions] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    
    useEffect(() => {
        if (!value || value.length < 3 || /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(value)) {
            setSuggestions([]); return;
        }
        const timer = setTimeout(async () => {
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&countrycodes=ma&limit=5`);
                setSuggestions(await res.json());
                setIsOpen(true);
            } catch (e) {}
        }, 500);
        return () => clearTimeout(timer);
    }, [value]);

    return (
        <div className="relative z-[5000]" ref={wrapperRef}>
            <div className="relative flex items-center">
                <div className="absolute left-3 text-slate-400">{Icon}</div>
                <input
                    className="w-full h-12 pl-10 pr-10 rounded-lg bg-slate-50 border-0 focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium placeholder:text-slate-400"
                    placeholder={placeholder}
                    value={value}
                    onChange={e => { onChange(e.target.value); setIsOpen(true); }}
                    onFocus={() => value.length >= 3 && setIsOpen(true)}
                />
                <div className="absolute right-2">{rightElement}</div>
            </div>
            <AnimatePresence>
                {isOpen && suggestions.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 max-h-60 overflow-y-auto py-1 z-[5001]">
                        {suggestions.map((item, idx) => (
                            <button key={idx} className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 flex items-start gap-3"
                                onClick={() => { onSelect({ lat: parseFloat(item.lat), lng: parseFloat(item.lon), display_name: item.display_name }); setIsOpen(false); }}>
                                <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                <span className="truncate text-slate-700">{item.display_name}</span>
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- MAIN PAGE ---

const MapPage = () => {
    const { user } = useContext(AuthContext);
    const [sidebarMode, setSidebarMode] = useState('SEARCH');
    const [selectionMode, setSelectionMode] = useState(null);
    const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
    const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    
    // Search State
    const [searchInputs, setSearchInputs] = useState({ start: '', end: '' });
    const [searchPoints, setSearchPoints] = useState({ start: null, end: null });
    const [routes, setRoutes] = useState([]);
    
    // Selection State
    const [selectedRoute, setSelectedRoute] = useState(null);
    const selectedRouteRef = useRef(null); 
    
    const [routeGeometry, setRouteGeometry] = useState(null);
    const [routeStops, setRouteStops] = useState([]); 
    const [busPositions, setBusPositions] = useState({});
    const [walkingPaths, setWalkingPaths] = useState([]);
    const [selectedBusForTicket, setSelectedBusForTicket] = useState(null);

    const wsRef = useRef(null);

    // Helpers
    const getDistance = (p1, p2) => {
        if (!p1 || !p2) return Infinity;
        const lat1 = p1.lat || p1.latitude || p1[0];
        const lng1 = p1.lng || p1.longitude || p1[1];
        const lat2 = p2.lat || p2.latitude || p2[0];
        const lng2 = p2.lng || p2.longitude || p2[1];
        return L.latLng(lat1, lng1).distanceTo(L.latLng(lat2, lng2));
    };

    const findNearestStop = (point, stops) => {
        if (!point || !stops?.length) return null;
        let nearest = null, minDist = Infinity;
        stops.forEach(stop => {
            const d = getDistance(point, stop);
            if (d < minDist) { minDist = d; nearest = stop; }
        });
        return nearest;
    };

    // --- ETA LOGIC ---
    const calculateEtaToUser = (bus) => {
        if (!searchPoints.start || routeStops.length === 0) return { text: bus.estimatedArrival || "--", status: "unknown", minutes: Infinity };

        const userStartStop = findNearestStop(searchPoints.start, routeStops);
        if (!userStartStop) return { text: "Station inconnue", status: "unknown", minutes: Infinity };

        const clean = (n) => n?.toLowerCase().trim().replace(/stop\s+/g, '') || "";
        
        // Find bus's next stop index
        const busNextStopIndex = routeStops.findIndex(s => clean(s.name) === clean(bus.nextStop));
        
        if (busNextStopIndex === -1) return { text: bus.estimatedArrival || "En route", status: "ok", minutes: 99 }; 
        
        const userStopIndex = routeStops.findIndex(s => s.id === userStartStop.id);

        // CASE: Bus has passed the user
        if (userStopIndex < busNextStopIndex) {
            return { text: "Déjà passé", status: "passed", minutes: -1 };
        }
        
        // Calculate Distance
        let distanceMeters = 0;
        
        // 1. Distance Bus -> Next Stop
        distanceMeters += getDistance(
            [bus.latitude, bus.longitude], 
            [routeStops[busNextStopIndex].latitude, routeStops[busNextStopIndex].longitude]
        );

        // 2. Distance Next Stop -> User Stop
        for (let i = busNextStopIndex; i < userStopIndex; i++) {
            if (routeStops[i+1]) {
                distanceMeters += getDistance(routeStops[i], routeStops[i+1]);
            }
        }

        const speedKmH = Math.max(bus.speed || 30, 10); // Minimum 10km/h for estimation
        const speedMs = speedKmH / 3.6;
        const minutes = Math.ceil((distanceMeters / speedMs) / 60);

        if (minutes <= 0) return { text: "< 1 min", status: "ok", minutes: 0 };

        return { text: `${minutes} min`, status: "ok", minutes };
    };

    const handleMapSelect = (latlng) => {
        const str = `${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`;
        if (selectionMode === 'START') {
            setSearchPoints(p => ({ ...p, start: latlng }));
            setSearchInputs(p => ({ ...p, start: str }));
        } else if (selectionMode === 'END') {
            setSearchPoints(p => ({ ...p, end: latlng }));
            setSearchInputs(p => ({ ...p, end: str }));
        }
        setSelectionMode(null);
    };

    const handleUseMyLocation = () => {
        if (!navigator.geolocation) return alert("Géolocalisation non supportée");
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setSearchPoints(prev => ({ ...prev, start: coords }));
                setSearchInputs(prev => ({ ...prev, start: "Ma position" }));
                setIsLocating(false);
            },
            (err) => {
                console.error(err);
                alert("Impossible de récupérer la position");
                setIsLocating(false);
            }
        );
    };

    const handleSearch = async () => {
        if (!searchPoints.start || !searchPoints.end) return;
        setIsLoadingRoutes(true);
        try {
            const res = await axios.get(`${TRAJET_API_URL}/search`, { 
                params: { fromLat: searchPoints.start.lat, fromLon: searchPoints.start.lng, toLat: searchPoints.end.lat, toLon: searchPoints.end.lng } 
            });
            setRoutes(res.data);
        } catch (e) { console.error("Search failed:", e); } 
        finally { setIsLoadingRoutes(false); }
    };

    const handleSelectRoute = async (route) => {
        setSelectedRoute(route);
        selectedRouteRef.current = route;
        setSidebarMode('DETAILS');
        setBusPositions({}); 
        setWalkingPaths([]); 
        setRouteStops([]);
        
        try {
            const res = await axios.get(`${TRAJET_API_URL}/lines/${route.lineRef}/complete`);
            const matchedRoute = res.data.routes.find(r => r.id === route.routeId) || res.data.routes[0];
            
            if (matchedRoute) {
                setRouteGeometry(matchedRoute.geometry);
                setRouteStops(matchedRoute.stops || []);
                
                if (searchPoints.start && searchPoints.end) {
                    const nStart = findNearestStop(searchPoints.start, matchedRoute.stops);
                    const nEnd = findNearestStop(searchPoints.end, matchedRoute.stops);
                    const paths = [];
                    if (nStart) paths.push([[searchPoints.start.lat, searchPoints.start.lng], [nStart.latitude, nStart.longitude]]);
                    if (nEnd) paths.push([[nEnd.latitude, nEnd.longitude], [searchPoints.end.lat, searchPoints.end.lng]]);
                    setWalkingPaths(paths);
                }
            }
        } catch (e) { console.error("Route load failed", e); }
    };

    const handleBuyTicket = (bus = null) => {
        setSelectedBusForTicket(bus);
        setIsTicketModalOpen(true);
    };

    useEffect(() => {
        const connectWs = () => {
            if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
                return;
            }

            const ws = new WebSocket(WS_URL);
            wsRef.current = ws;
            
            ws.onopen = () => setIsConnected(true);
            
            ws.onclose = () => {
                setIsConnected(false);
                setTimeout(connectWs, 3000); 
            };

            ws.onerror = (err) => {
                // Suppress console spam for expected disconnects
                ws.close();
            };

            ws.onmessage = (e) => {
                try {
                    const msg = JSON.parse(e.data);
                    if (msg.type === 'GPS_UPDATE') {
                        const pl = msg.payload;
                        const currentRoute = selectedRouteRef.current;
                        
                        if (currentRoute) {
                            const busLine = normalizeLineRef(pl.lineNumber);
                            const routeLine = normalizeLineRef(currentRoute.lineRef);
                            
                            // STRICT matching to avoid L6 showing on L306
                            if (busLine === routeLine) {
                                setBusPositions(prev => ({ ...prev, [pl.busId]: pl }));
                            }
                        }
                    }
                } catch (err) {}
            };
        };

        connectWs();

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, []); 

    useEffect(() => {
        selectedRouteRef.current = selectedRoute;
    }, [selectedRoute]);

    const getRoutePositions = (geo) => {
        try {
            const j = JSON.parse(geo);
            return j.type === 'MultiLineString' ? j.coordinates.map(l => l.map(p => [p[1], p[0]])) : j.coordinates.map(p => [p[1], p[0]]);
        } catch { return []; }
    };

    // Sort buses for display: Active (low ETA) first, Passed last
    const sortedBuses = Object.values(busPositions).sort((a, b) => {
        const etaA = calculateEtaToUser(a);
        const etaB = calculateEtaToUser(b);
        
        // Passed buses go to bottom
        if (etaA.status === 'passed' && etaB.status !== 'passed') return 1;
        if (etaA.status !== 'passed' && etaB.status === 'passed') return -1;
        
        // Then sort by time
        return etaA.minutes - etaB.minutes;
    });

    return (
        <div className="relative w-full h-screen overflow-hidden bg-slate-100">
            {/* Floating Sidebar */}
            <div className="absolute left-0 top-16 bottom-0 w-full sm:w-[420px] z-[1000] pointer-events-none p-4 flex flex-col">
                <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex-1 bg-white/90 backdrop-blur-xl shadow-2xl rounded-3xl border border-white/50 overflow-hidden flex flex-col pointer-events-auto">
                    
                    {/* Header */}
                    <div className="p-6 pb-4">
                        <div className="flex justify-between items-center mb-4">
                            {sidebarMode === 'DETAILS' ? (
                                <button onClick={() => { setSidebarMode('SEARCH'); setBusPositions({}); setRouteGeometry(null); setSelectedRoute(null); }} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-medium">
                                    <ArrowLeft className="w-5 h-5" /> Retour
                                </button>
                            ) : (
                                <h1 className="text-xl font-bold text-slate-800">Trajet</h1>
                            )}
                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />} {isConnected ? 'LIVE' : 'OFFLINE'}
                            </div>
                        </div>

                        {sidebarMode === 'DETAILS' && selectedRoute && (
                            <div>
                                <div className="flex items-baseline gap-3">
                                    <h2 className="text-3xl font-extrabold text-primary">{selectedRoute.lineRef}</h2>
                                    <span className="text-sm font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{selectedRoute.direction}</span>
                                </div>
                                <p className="text-sm text-slate-500 truncate mt-1">{selectedRoute.lineName}</p>
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6 scrollbar-hide">
                        {sidebarMode === 'SEARCH' ? (
                            <>
                                {/* Improved Form */}
                                <div className="bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
                                    <div className="relative">
                                        <div className="absolute left-6 top-10 bottom-10 w-0.5 border-l-2 border-dashed border-slate-200 z-0"></div>
                                        <div className="p-2 space-y-4">
                                            <AddressAutocomplete 
                                                placeholder="Point de départ"
                                                value={searchInputs.start}
                                                onChange={(val) => setSearchInputs(p => ({...p, start: val}))}
                                                onSelect={(loc) => {
                                                    setSearchInputs(p => ({...p, start: loc.display_name}));
                                                    setSearchPoints(p => ({...p, start: {lat: loc.lat, lng: loc.lng}}));
                                                }}
                                                icon={<Circle className="w-3 h-3 text-green-500 fill-current" />}
                                                rightElement={
                                                    <button onClick={() => setSelectionMode(selectionMode === 'START' ? null : 'START')} className={`p-2 hover:bg-slate-100 rounded-lg transition ${selectionMode === 'START' ? 'text-primary bg-primary/10' : 'text-slate-400'}`}>
                                                        <Crosshair className="w-4 h-4" />
                                                    </button>
                                                }
                                            />
                                            <AddressAutocomplete 
                                                placeholder="Destination"
                                                value={searchInputs.end}
                                                onChange={(val) => setSearchInputs(p => ({...p, end: val}))}
                                                onSelect={(loc) => {
                                                    setSearchInputs(p => ({...p, end: loc.display_name}));
                                                    setSearchPoints(p => ({...p, end: {lat: loc.lat, lng: loc.lng}}));
                                                }}
                                                icon={<Square className="w-3 h-3 text-red-500 fill-current" />}
                                                rightElement={
                                                    <button onClick={() => setSelectionMode(selectionMode === 'END' ? null : 'END')} className={`p-2 hover:bg-slate-100 rounded-lg transition ${selectionMode === 'END' ? 'text-primary bg-primary/10' : 'text-slate-400'}`}>
                                                        <Crosshair className="w-4 h-4" />
                                                    </button>
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <Button variant="secondary" onClick={handleUseMyLocation} disabled={isLocating} className="h-12 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl">
                                        {isLocating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Navigation2 className="w-4 h-4 mr-2" />} 
                                        {isLocating ? "Localisation..." : "Ma position"}
                                    </Button>
                                    <Button onClick={handleSearch} disabled={!searchPoints.start || !searchPoints.end || isLoadingRoutes} className="h-12 rounded-xl shadow-lg shadow-primary/20">
                                        {isLoadingRoutes ? <Loader2 className="w-4 h-4 animate-spin" /> : "Rechercher"}
                                    </Button>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Résultats</h3>
                                    {routes.map((route, idx) => (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                                            key={idx} onClick={() => handleSelectRoute(route)} 
                                            className="group bg-white p-4 rounded-2xl border border-slate-100 hover:border-primary/30 shadow-sm hover:shadow-md cursor-pointer transition-all"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-slate-900 text-white font-bold px-3 py-1.5 rounded-lg text-lg min-w-[3rem] text-center group-hover:bg-primary transition-colors">
                                                        {route.lineRef}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-slate-800">Vers {route.destinationStop}</div>
                                                        <div className="text-xs text-slate-500">De {route.originStop}</div>
                                                    </div>
                                                </div>
                                                <div className="font-bold text-primary">{route.price} MAD</div>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs font-medium text-slate-500 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                                                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {route.duration}</span>
                                                <span className="w-px h-3 bg-slate-300"></span>
                                                <span className="flex items-center gap-1.5"><BusIcon className="w-3.5 h-3.5" /> {route.stops} Arrêts</span>
                                            </div>
                                        </motion.div>
                                    ))}
                                    {routes.length === 0 && !isLoadingRoutes && (
                                        <div className="text-center py-10 text-slate-400">
                                            <MapIcon className="w-10 h-10 mx-auto mb-2 opacity-20" />
                                            <p className="text-sm">Entrez votre trajet pour voir les résultats</p>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Route Details & Action */}
                                <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10" />
                                    <div className="flex justify-between items-center mb-4 relative z-10">
                                        <div>
                                            <div className="text-xs font-bold text-slate-400 uppercase">Tarif unitaire</div>
                                            <div className="text-3xl font-bold">{selectedRoute.price} <span className="text-sm text-slate-400">MAD</span></div>
                                        </div>
                                        <Button onClick={() => { setSelectedBusForTicket(null); setIsTicketModalOpen(true); }} className="bg-white text-slate-900 hover:bg-slate-100 font-bold rounded-xl h-10 px-6">
                                            <Ticket className="w-4 h-4 mr-2" /> Acheter
                                        </Button>
                                    </div>
                                </div>

                                {/* Live Buses List */}
                                <div>
                                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                        Bus en circulation ({Object.keys(busPositions).length})
                                    </h3>
                                    
                                    <div className="space-y-3 pb-4">
                                        {sortedBuses.length === 0 ? (
                                            <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200">
                                                <BusIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                                <p className="text-sm text-slate-500">Recherche de bus à proximité...</p>
                                            </div>
                                        ) : sortedBuses.map(bus => {
                                            const eta = calculateEtaToUser(bus);
                                            const isPassed = eta.status === 'passed';
                                            
                                            return (
                                                <motion.div 
                                                    layout
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    key={bus.busId} 
                                                    className={`p-4 rounded-2xl border shadow-sm transition-all ${
                                                        isPassed 
                                                            ? 'bg-slate-50 border-slate-200 opacity-60 grayscale-[0.5]' 
                                                            : 'bg-white border-slate-100 hover:shadow-md'
                                                    }`}
                                                >
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs border ${isPassed ? 'bg-slate-200 text-slate-500' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                                                {formatBusName(bus.busMatricule)}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-slate-800 text-sm">
                                                                    <span className={`${isPassed ? 'text-slate-500' : 'text-emerald-600'} mr-2`}>
                                                                        {eta.text}
                                                                    </span>
                                                                    <span className="text-slate-400 font-normal text-xs">
                                                                        {isPassed ? '' : ' avant l\'arrivée'}
                                                                    </span>
                                                                </div>
                                                                <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                                    <Navigation className="w-3 h-3" /> Vers {bus.nextStop || '...'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex gap-2 mb-3">
                                                        <div className="flex-1 bg-slate-50 rounded-lg p-2 flex items-center justify-center gap-2 text-xs font-medium text-slate-600">
                                                            <div className={`w-1.5 h-1.5 rounded-full ${isPassed ? 'bg-slate-400' : 'bg-blue-500'}`}></div> {bus.speed?.toFixed(0)} km/h
                                                        </div>
                                                        <div className="flex-1 bg-slate-50 rounded-lg p-2 flex items-center justify-center gap-2 text-xs font-medium text-slate-600">
                                                            <Users className="w-3 h-3" /> {bus.occupancy || 0}/{bus.capacity || 50}
                                                        </div>
                                                    </div>

                                                    <Button 
                                                        size="sm" 
                                                        variant={isPassed ? "ghost" : "outline"} 
                                                        disabled={isPassed}
                                                        className={`w-full h-9 text-xs font-semibold ${isPassed ? 'bg-slate-100 text-slate-400' : 'hover:bg-slate-50 border-slate-200'}`}
                                                        onClick={() => { setSelectedBusForTicket(bus); setIsTicketModalOpen(true); }}
                                                    >
                                                        {isPassed ? "Bus déjà passé" : "Réserver ce bus"}
                                                    </Button>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Map */}
            <MapContainer center={[34.0227601, -6.8361348]} zoom={13} className="w-full h-full z-0" zoomControl={false}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution='&copy; OpenStreetMap' />
                <LocationSelector mode={selectionMode} onSelect={handleMapSelect} />
                <FitBounds geometry={routeGeometry} start={searchPoints.start} end={searchPoints.end} walkingPaths={walkingPaths} />
                
                {/* Markers */}
                {searchPoints.start && <Marker position={searchPoints.start} icon={createPinIcon('#10b981')}><Popup>Départ</Popup></Marker>}
                {searchPoints.end && <Marker position={searchPoints.end} icon={createPinIcon('#ef4444')}><Popup>Destination</Popup></Marker>}
                
                {walkingPaths.map((path, idx) => (
                    <Polyline key={idx} positions={path} color="#64748b" weight={4} dashArray="8, 12" opacity={0.6} />
                ))}

                {routeGeometry && (
                    <>
                        <Polyline positions={getRoutePositions(routeGeometry)} color="white" weight={8} opacity={0.8} />
                        <Polyline positions={getRoutePositions(routeGeometry)} color="#2563eb" weight={5} opacity={0.9} />
                    </>
                )}
                
                {routeStops.map((stop, idx) => (
                    <CircleMarker key={idx} center={[stop.latitude, stop.longitude]} radius={3} pathOptions={{ color: 'white', fillColor: '#2563eb', fillOpacity: 1, weight: 1 }}>
                        <Tooltip direction="top" offset={[0, -5]} opacity={1} className="font-bold text-xs shadow-sm border-0">{stop.name}</Tooltip>
                    </CircleMarker>
                ))}

                {/* Live Buses */}
                {Object.values(busPositions).map(bus => {
                    const isPassed = calculateEtaToUser(bus).status === 'passed';
                    return (
                        <Marker 
                            key={bus.busId} 
                            position={[bus.latitude, bus.longitude]} 
                            icon={createBusIcon(bus.heading || 0, isPassed ? '#94a3b8' : '#2563eb', isPassed ? 0.6 : 1)}
                            zIndexOffset={isPassed ? 0 : 1000}
                        >
                            <Popup>
                                <div className="text-center min-w-[140px] p-1 font-sans">
                                    <div className="font-bold text-base text-slate-800 mb-1">{formatBusName(bus.busMatricule)}</div>
                                    <div className="text-xs text-slate-500 mb-2">Vers {bus.nextStop}</div>
                                    
                                    {isPassed && <div className="text-xs text-red-500 font-bold mb-2 uppercase border border-red-200 bg-red-50 rounded px-1">Bus Passé</div>}
                                    
                                    <div className="flex justify-center gap-2 mb-3">
                                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">{bus.speed?.toFixed(0)} km/h</span>
                                    </div>
                                    {!isPassed && <Button size="sm" className="w-full h-8 text-xs" onClick={() => { setSelectedBusForTicket(bus); setIsTicketModalOpen(true); }}>Acheter Ticket</Button>}
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>

            {/* Selection Overlay */}
            <AnimatePresence>
                {selectionMode && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                        className="absolute top-6 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur text-white px-6 py-3 rounded-full z-[1100] font-medium flex items-center gap-3 shadow-2xl border border-white/10">
                        <MapIcon className="w-5 h-5 text-blue-400 animate-pulse" /> 
                        <span>Cliquez sur la carte pour : <span className="font-bold text-blue-300">{selectionMode === 'START' ? 'Le Départ' : 'La Destination'}</span></span>
                        <button onClick={() => setSelectionMode(null)} className="ml-2 hover:text-red-400 transition-colors">✕</button>
                    </motion.div>
                )}
            </AnimatePresence>
            
            <TicketPurchaseModal isOpen={isTicketModalOpen} onClose={() => setIsTicketModalOpen(false)} route={selectedRoute} user={user} bus={selectedBusForTicket} />
        </div>
    );
};

export default MapPage;