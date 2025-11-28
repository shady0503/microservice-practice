import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { API_BASE_URL, TRAJET_API_URL } from '../config/api.config';
import { Loader2, Ticket, Calendar, Clock, ExternalLink } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';

const TicketHistory = () => {
    const { user } = useContext(AuthContext);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState(null);

    useEffect(() => {
        if (!user) return;
        const fetchHistory = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/tickets`, { params: { userId: user.uuid } });
                const enrichedTickets = await Promise.all(res.data.map(async (t) => {
                    try {
                        const routeRes = await axios.get(`${TRAJET_API_URL}/lines/routes/${t.trajetId}`);
                        return { ...t, routeInfo: routeRes.data };
                    } catch (e) {
                        return { ...t, routeInfo: { name: "Route details unavailable", line: { ref: "?" } } };
                    }
                }));
                setTickets(enrichedTickets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
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
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary"/></div>;

    return (
        <div className="min-h-screen bg-slate-50 pt-24 pb-12">
            <div className="container mx-auto px-4 max-w-4xl">
                <h1 className="text-3xl font-bold mb-8 text-slate-900 flex items-center gap-3"><Ticket className="h-8 w-8 text-primary" /> Trip History</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tickets.map(ticket => (
                        <div key={ticket.id} onClick={() => setSelectedTicket(ticket)} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden">
                            <div className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-bold uppercase rounded-bl-lg border-b border-l ${getStatusStyle(ticket.status)}`}>{ticket.status}</div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-lg border border-blue-100">{ticket.routeInfo?.line?.ref}</div>
                                <div className="flex-1 min-w-0"><h3 className="font-bold text-slate-800 truncate">{ticket.routeInfo?.name}</h3></div>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                                <Calendar className="w-3 h-3" /> {new Date(ticket.createdAt).toLocaleDateString()}
                                <Clock className="w-3 h-3 ml-2" /> {new Date(ticket.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </div>
                            <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                                <div className="text-lg font-bold text-slate-900">{ticket.price?.amount / 100} <span className="text-xs font-normal text-slate-400">{ticket.price?.currency}</span></div>
                                <span className="text-xs text-primary font-medium flex items-center gap-1 group-hover:underline">View <ExternalLink className="w-3 h-3" /></span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <AnimatePresence>
                {selectedTicket && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedTicket(null)}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                            <div className="bg-slate-900 p-6 text-center relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
                                <h3 className="text-white font-bold text-xl mb-1">UrbanMove Ticket</h3>
                            </div>
                            <div className="p-8 flex flex-col items-center">
                                <div className="p-4 border-4 border-slate-900 rounded-xl mb-6 bg-white"><QRCodeSVG value={selectedTicket.id} size={180} /></div>
                                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg w-full"><span className="text-sm text-slate-500">Ticket ID</span><span className="text-xs font-mono font-medium">{selectedTicket.id.split('-')[0]}...</span></div>
                            </div>
                            <div className="bg-slate-50 p-4 text-center border-t border-slate-100"><button className="text-slate-500 text-sm hover:text-slate-800" onClick={() => setSelectedTicket(null)}>Close</button></div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TicketHistory;