import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { API_BASE_URL, TRAJET_API_URL } from '../config/api.config';
import { 
    Loader2, 
    Ticket, 
    Calendar, 
    Clock, 
    MapPin, 
    Bus, 
    CheckCircle, 
    XCircle, 
    AlertCircle, 
    Filter,
    ChevronRight,
    QrCode
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";

const TicketHistory = () => {
    const { user } = useContext(AuthContext);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [filter, setFilter] = useState('ALL'); // ALL, PAID, RESERVED, CANCELLED

    useEffect(() => {
        if (!user) return;
        const fetchHistory = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/tickets`, { params: { userId: user.uuid } });
                
                // Enhance tickets with route info if missing
                const enrichedTickets = await Promise.all(res.data.map(async (t) => {
                    const metadata = t.metadata || {};
                    return {
                        ...t,
                        lineRef: metadata.lineRef || "Bus",
                        lineName: metadata.lineName || "Ligne Urbaine",
                        origin: metadata.origin || "Station Départ",
                        destination: metadata.destination || "Station Arrivée"
                    };
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

    const filteredTickets = tickets.filter(t => {
        if (filter === 'ALL') return true;
        return t.status === filter;
    });

    const getStatusConfig = (status) => {
        switch (status) {
            case 'PAID': return { color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: CheckCircle, label: 'Payé' };
            case 'RESERVED': return { color: 'text-amber-600 bg-amber-50 border-amber-200', icon: Clock, label: 'Réservé' };
            case 'CANCELLED': return { color: 'text-red-600 bg-red-50 border-red-200', icon: XCircle, label: 'Annulé' };
            default: return { color: 'text-slate-600 bg-slate-50 border-slate-200', icon: AlertCircle, label: status };
        }
    };

    // Group tickets by date
    const groupedTickets = filteredTickets.reduce((groups, ticket) => {
        const date = new Date(ticket.createdAt).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
        if (!groups[date]) groups[date] = [];
        groups[date].push(ticket);
        return groups;
    }, {});

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-slate-50">
            <div className="text-center">
                <Loader2 className="animate-spin h-10 w-10 text-primary mx-auto mb-4" />
                <p className="text-slate-500 font-medium">Chargement de vos tickets...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 pt-24 pb-12 px-4">
            <div className="container mx-auto max-w-3xl">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                            <Ticket className="h-8 w-8 text-primary" /> 
                            Mes Tickets
                        </h1>
                        <p className="text-slate-500 mt-1">Consultez l'historique de vos déplacements.</p>
                    </div>
                    
                    <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                        {['ALL', 'PAID', 'RESERVED', 'CANCELLED'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                    filter === f 
                                        ? 'bg-slate-900 text-white shadow-sm' 
                                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                            >
                                {f === 'ALL' ? 'TOUS' : f === 'PAID' ? 'PAYÉS' : f === 'RESERVED' ? 'RÉSERVÉS' : 'ANNULÉS'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Ticket List */}
                <div className="space-y-8">
                    {Object.keys(groupedTickets).length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Ticket className="w-8 h-8 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900">Aucun ticket trouvé</h3>
                            <p className="text-slate-500">Vous n'avez pas encore de tickets dans cette catégorie.</p>
                        </div>
                    ) : Object.entries(groupedTickets).map(([date, tickets]) => (
                        <div key={date}>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 pl-2 border-l-4 border-primary/20">
                                {date}
                            </h3>
                            <div className="grid gap-4">
                                {tickets.map((ticket, idx) => {
                                    const status = getStatusConfig(ticket.status);
                                    const StatusIcon = status.icon;
                                    
                                    return (
                                        <motion.div 
                                            key={ticket.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            onClick={() => setSelectedTicket(ticket)}
                                            className="group bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-primary/20 transition-all cursor-pointer relative overflow-hidden"
                                        >
                                            <div className="flex justify-between items-center relative z-10">
                                                <div className="flex items-center gap-5">
                                                    {/* Line Number Box */}
                                                    <div className="flex flex-col items-center justify-center w-14 h-14 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 font-bold text-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                        {ticket.lineRef.replace(/^L0?/, '')}
                                                        <Bus className="w-3 h-3 mt-1 opacity-50" />
                                                    </div>

                                                    {/* Info */}
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-bold text-slate-800 text-lg">
                                                                {ticket.price?.amount / 100} <span className="text-sm font-medium text-slate-400">MAD</span>
                                                            </span>
                                                            <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${status.color}`}>
                                                                <StatusIcon className="w-3 h-3" /> {status.label}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                                            <span className="font-medium text-slate-700">{ticket.origin}</span>
                                                            <span className="text-slate-300">•</span>
                                                            <span>{ticket.destination}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <div className="text-xs font-medium text-slate-400 mb-1 flex items-center justify-end gap-1">
                                                        <Clock className="w-3 h-3" /> 
                                                        {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                    <div className="bg-slate-50 p-2 rounded-lg text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                        <ChevronRight className="w-5 h-5" />
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Ticket Detail Modal */}
            <AnimatePresence>
                {selectedTicket && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedTicket(null)}>
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }} 
                            animate={{ scale: 1, opacity: 1, y: 0 }} 
                            exit={{ scale: 0.9, opacity: 0, y: 20 }} 
                            className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl relative" 
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Decorative Header */}
                            <div className="bg-slate-900 h-32 relative overflow-hidden flex flex-col justify-center items-center text-white">
                                <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                                <div className="z-10 font-bold text-2xl tracking-widest">URBAN MOVE</div>
                                <div className="z-10 text-slate-400 text-xs uppercase tracking-widest mt-1">Ticket Officiel</div>
                            </div>

                            <div className="px-8 pb-8 -mt-10 relative z-20">
                                {/* Ticket Card */}
                                <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 text-center">
                                    <div className="mb-6 border-b border-dashed border-slate-200 pb-6">
                                        <div className="text-xs font-bold text-slate-400 uppercase mb-2">Scan à la montée</div>
                                        <div className="p-3 border-2 border-slate-900 rounded-xl inline-block bg-white">
                                            <QRCodeSVG value={selectedTicket.qrCodeData || selectedTicket.id} size={160} />
                                        </div>
                                        <div className="mt-2 font-mono text-xs text-slate-400">{selectedTicket.id.split('-')[0]}...</div>
                                    </div>

                                    <div className="space-y-4 text-left">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-slate-500">Ligne</span>
                                            <span className="font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded">{selectedTicket.lineRef}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-slate-500">Date</span>
                                            <span className="font-medium text-slate-900">{new Date(selectedTicket.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-slate-500">Prix</span>
                                            <span className="font-bold text-primary text-lg">{selectedTicket.price?.amount / 100} MAD</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-slate-500">Statut</span>
                                            <span className={`text-xs font-bold px-2 py-1 rounded ${getStatusConfig(selectedTicket.status).color}`}>
                                                {getStatusConfig(selectedTicket.status).label}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <Button className="w-full mt-6 h-12 rounded-xl text-lg shadow-lg" onClick={() => setSelectedTicket(null)}>Fermer</Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TicketHistory;