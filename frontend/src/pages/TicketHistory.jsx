import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { API_BASE_URL, TRAJET_API_URL } from '../config/api.config';
import { Loader2, Ticket, Calendar, Route as RouteIcon } from 'lucide-react';

const TicketHistory = () => {
    const { user } = useContext(AuthContext);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        
        const fetchHistory = async () => {
            try {
                // 1. Fetch Tickets
                const res = await axios.get(`${API_BASE_URL}/tickets`, {
                    params: { userId: user.uuid } 
                });
                
                const rawTickets = res.data;

                // 2. Fetch Route Info for each ticket (Hydration)
                // We use Promise.all to fetch route details in parallel
                const enrichedTickets = await Promise.all(rawTickets.map(async (t) => {
                    try {
                        // Fetch route details from Trajet Service using the ticket's trajetId
                        const routeRes = await axios.get(`${TRAJET_API_URL}/lines/routes/${t.trajetId}`);
                        return { ...t, routeInfo: routeRes.data };
                    } catch (e) {
                        return { ...t, routeInfo: { name: "Unknown Route", line: { ref: "?" } } };
                    }
                }));

                setTickets(enrichedTickets);
            } catch (e) {
                console.error("Failed to load history", e);
            } finally {
                setLoading(false);
            }
        };
        
        fetchHistory();
    }, [user]);

    const getStatusStyle = (status) => {
        switch (status) {
            case 'PAID': return 'bg-green-100 text-green-700 border-green-200';
            case 'RESERVED': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'CANCELLED': return 'bg-red-100 text-red-700 border-red-200';
            case 'EXPIRED': return 'bg-gray-100 text-gray-500 border-gray-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary"/></div>;

    return (
        <div className="min-h-screen bg-slate-50 pt-20 pb-10">
            <div className="container mx-auto px-4 max-w-3xl">
                <h1 className="text-3xl font-bold mb-8 text-slate-800 flex items-center gap-3">
                    <Ticket className="h-8 w-8 text-primary" />
                    My Trips & Tickets
                </h1>
                
                <div className="space-y-4">
                    {tickets.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-dashed">
                            <p className="text-slate-500 text-lg">No tickets found.</p>
                            <p className="text-sm text-slate-400">Book your first trip on the dashboard!</p>
                        </div>
                    ) : (
                        tickets.map(ticket => (
                            <div key={ticket.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyle(ticket.status)}`}>
                                                {ticket.status}
                                            </span>
                                            <span className="text-xs text-slate-400 font-mono">#{ticket.id.substring(0,8)}</span>
                                        </div>
                                        
                                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                            <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded">Line {ticket.routeInfo?.line?.ref || "?"}</span>
                                            {ticket.routeInfo?.name || "Route details unavailable"}
                                        </h3>
                                        
                                        <div className="flex items-center gap-4 text-sm text-slate-500 mt-2">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4" />
                                                {new Date(ticket.createdAt).toLocaleDateString()}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                {new Date(ticket.createdAt).toLocaleTimeString()}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-primary">
                                            {ticket.price?.amount / 100} <span className="text-sm font-normal text-slate-500">{ticket.price?.currency}</span>
                                        </div>
                                        <div className="text-sm text-slate-400 mt-1">
                                            x{ticket.quantity} Ticket{ticket.quantity > 1 ? 's' : ''}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default TicketHistory;