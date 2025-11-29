import React, { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { getUserTickets } from '../services/ticket.service';
import { BUS_API_URL, TRAJET_API_URL } from '../config/api.config';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    Map as MapIcon, 
    Ticket, 
    TrendingUp, 
    Wallet, 
    ArrowRight, 
    Clock, 
    Calendar,
    ChevronRight,
    Bus,
    Route as RouteIcon,
    Star
} from 'lucide-react';
import { Button } from "@/components/ui/button";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

const StatCard = ({ icon: Icon, label, value, subtext, colorClass }) => (
    <motion.div
        variants={itemVariants}
        className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 group"
    >
        <div className="flex items-start justify-between">
            <div>
                <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
                <h3 className="text-3xl font-bold text-slate-800 tracking-tight group-hover:scale-105 transition-transform origin-left">
                    {value}
                </h3>
            </div>
            <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10 group-hover:bg-opacity-20 transition-colors`}>
                <Icon className={`w-6 h-6 ${colorClass.replace('bg-', 'text-')}`} />
            </div>
        </div>
        {subtext && (
            <div className="mt-4 flex items-center text-xs font-medium text-slate-500 bg-slate-50 w-fit px-2 py-1 rounded-full">
                {subtext}
            </div>
        )}
    </motion.div>
);

const TripCard = ({ line, date, price, status, origin, destination }) => (
    <motion.div 
        variants={itemVariants}
        className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 bg-white rounded-2xl border border-slate-100 hover:border-primary/20 hover:shadow-lg transition-all cursor-pointer relative overflow-hidden"
    >
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-bottom" />
        
        <div className="flex items-center gap-5">
            <div className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 group-hover:bg-primary/5 transition-colors">
                <Bus className="w-6 h-6 text-slate-400 group-hover:text-primary transition-colors" />
                <span className="text-[10px] font-bold text-slate-600 mt-1">{line}</span>
            </div>
            
            <div className="space-y-1">
                <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-slate-900">{origin || 'Station Départ'}</h4>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                    <h4 className="font-semibold text-slate-900">{destination || 'Station Arrivée'}</h4>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded">
                        <Calendar className="w-3 h-3" /> {date}
                    </span>
                    <span className={`px-2 py-0.5 rounded font-medium ${
                        status === 'PAID' ? 'bg-green-100 text-green-700' : 
                        status === 'RESERVED' ? 'bg-amber-100 text-amber-700' : 
                        status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                        'bg-slate-100 text-slate-600'
                    }`}>
                        {status === 'PAID' ? 'Payé' : status === 'RESERVED' ? 'Réservé' : status === 'CANCELLED' ? 'Annulé' : status}
                    </span>
                </div>
            </div>
        </div>

        <div className="mt-4 sm:mt-0 flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end pl-14 sm:pl-0">
            <div className="text-right">
                <div className="text-lg font-bold text-primary">{price} <span className="text-xs text-slate-400 font-normal">MAD</span></div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Par billet</div>
            </div>
            <Button variant="ghost" size="icon" className="text-slate-300 group-hover:text-primary transition-colors">
                <ChevronRight className="w-5 h-5" />
            </Button>
        </div>
    </motion.div>
);

const DashboardPage = () => {
    const { user } = useContext(AuthContext);
    
    // Application Data State
    const [tickets, setTickets] = useState([]);
    const [activeBusesCount, setActiveBusesCount] = useState(0);
    const [linesCount, setLinesCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAllData = async () => {
            if (user?.uuid) {
                try {
                    // 1. Fetch User Tickets (Ticket Service)
                    const ticketsData = await getUserTickets(user.uuid);
                    setTickets(ticketsData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));

                    // 2. Fetch Active Buses (Bus Service)
                    // Note: Assuming endpoint allows CORS or is proxied. 
                    // Using direct URL from config, falling back to 0 if fails.
                    try {
                        const busesRes = await axios.get(BUS_API_URL);
                        // Filter for active/moving buses if status field exists, else count all
                        const active = busesRes.data.filter(b => b.status === 'ACTIVE' || b.status === 'EN_SERVICE').length;
                        setActiveBusesCount(active > 0 ? active : busesRes.data.length);
                    } catch (err) {
                        console.warn("Bus service unreachable:", err);
                    }

                    // 3. Fetch Available Lines (Trajet Service)
                    try {
                        const linesRes = await axios.get(`${TRAJET_API_URL}/lines`);
                        setLinesCount(linesRes.data.length);
                    } catch (err) {
                        console.warn("Trajet service unreachable:", err);
                    }

                } catch (e) {
                    console.error("Global fetch error", e);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchAllData();
    }, [user]);

    // --- Statistics Logic ---
    
    // 1. Total Spend
    const totalSpent = tickets
        .filter(t => t.status === 'PAID')
        .reduce((sum, t) => sum + (t.price?.amount || 0), 0) / 100;

    // 2. Favorite Line Calculation
    const getFavoriteLine = () => {
        if (tickets.length === 0) return "N/A";
        const lineCounts = {};
        tickets.forEach(t => {
            const line = t.metadata?.lineRef;
            if (line) lineCounts[line] = (lineCounts[line] || 0) + 1;
        });
        const favorite = Object.keys(lineCounts).reduce((a, b) => lineCounts[a] > lineCounts[b] ? a : b, null);
        return favorite ? `Ligne ${favorite}` : "N/A";
    };

    // 3. Recent Activity Formatting
    const recentTickets = tickets.slice(0, 4).map(t => {
        const dateStr = t.paidAt || t.createdAt;
        const dateObj = dateStr ? new Date(dateStr) : new Date();
        return {
            id: t.id,
            line: t.metadata?.lineRef || "?",
            origin: t.metadata?.origin || "Départ",
            destination: t.metadata?.destination || "Arrivée",
            date: dateObj.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) + ' • ' + dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute:'2-digit' }),
            price: (t.price.amount / 100).toFixed(2),
            status: t.status
        };
    });

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Bonjour";
        if (hour < 18) return "Bon après-midi";
        return "Bonsoir";
    };

    return (
        <div className="min-h-screen bg-slate-50/50 pt-20 pb-12">
            <div className="bg-primary h-64 absolute top-0 left-0 right-0 z-0" />
            
            <div className="container mx-auto px-4 relative z-10 max-w-6xl">
                {/* Header Banner */}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10 pt-6 text-white"
                >
                    <div>
                        <div className="text-blue-200 font-medium mb-1 flex items-center gap-2 capitalize">
                            <Clock className="w-4 h-4" /> {new Date().toLocaleDateString('fr-FR', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                            {getGreeting()}, <span className="text-blue-200">{user?.firstName || 'Voyageur'}</span>
                        </h1>
                        <p className="text-blue-100/80 mt-2 max-w-lg text-lg">
                            Prêt à explorer la ville ? Voici l'état du réseau en temps réel.
                        </p>
                    </div>
                    
                    <Link to="/map">
                        <Button className="h-14 px-8 bg-white text-primary hover:bg-blue-50 hover:scale-105 transition-all rounded-full font-bold shadow-2xl border-0 text-base">
                            <MapIcon className="w-5 h-5 mr-2" />
                            Réserver un trajet
                        </Button>
                    </Link>
                </motion.div>

                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-8"
                >
                    {/* Stats Row - Utilizing multiple microservices data */}
                    <div className="grid grid-cols-1 pt-8 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <StatCard 
                            icon={Wallet} 
                            label="Dépenses Totales" 
                            value={`${totalSpent.toFixed(2)} DH`} 
                            subtext="Depuis l'inscription"
                            colorClass="bg-blue-500" 
                        />
                        <StatCard 
                            icon={Bus} 
                            label="Bus en Circulation" 
                            value={activeBusesCount} 
                            subtext="En temps réel"
                            colorClass="bg-emerald-500" 
                        />
                        <StatCard 
                            icon={RouteIcon} 
                            label="Lignes Disponibles" 
                            value={linesCount} 
                            subtext="Réseau actif"
                            colorClass="bg-violet-500" 
                        />
                        {/* <StatCard 
                            icon={Star} 
                            label="Votre Habitude" 
                            value={getFavoriteLine()} 
                            subtext="Trajet fréquent"
                            colorClass="bg-amber-500" 
                        /> */}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Feed: Recent Activity */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-slate-400" />
                                    Activité Récente
                                </h2>
                                <Link to="/history">
                                    <Button variant="link" className="text-primary h-auto p-0 hover:no-underline hover:opacity-80">
                                        Voir l'historique complet <ArrowRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </Link>
                            </div>

                            <div className="space-y-4">
                                {loading ? (
                                    <div className="bg-white p-12 rounded-2xl border border-slate-100 text-center">
                                        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                                        <p className="text-slate-400">Chargement de vos données...</p>
                                    </div>
                                ) : recentTickets.length > 0 ? (
                                    recentTickets.map((ticket) => (
                                        <TripCard key={ticket.id} {...ticket} />
                                    ))
                                ) : (
                                    <motion.div 
                                        variants={itemVariants}
                                        className="bg-white p-12 rounded-2xl border border-slate-100 border-dashed text-center"
                                    >
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Ticket className="w-8 h-8 text-slate-300" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-slate-900">Aucun trajet</h3>
                                        <p className="text-slate-500 mb-6">Vous n'avez pas encore effectué de voyage.</p>
                                        <Link to="/map">
                                            <Button variant="outline">Planifier mon premier trajet</Button>
                                        </Link>
                                    </motion.div>
                                )}
                            </div>
                        </div>

                        {/* Sidebar: Quick Actions */}
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-slate-800">Découvrir</h2>
                            
                            {/* Promo Card */}
                            <motion.div 
                                variants={itemVariants}
                                className="bg-gradient-to-br from-violet-600 to-indigo-600 p-6 rounded-3xl shadow-xl text-white relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                                <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-xl -ml-10 -mb-10 pointer-events-none" />
                                
                                <div className="relative z-10">
                                    <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center mb-4">
                                        <MapIcon className="w-5 h-5 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-2">Carte Interactive</h3>
                                    <p className="text-violet-100 mb-6 text-sm leading-relaxed">
                                        Suivez les bus en temps réel et trouvez l'itinéraire le plus rapide.
                                    </p>
                                    <Link to="/map">
                                        <Button className="w-full bg-white text-violet-600 hover:bg-violet-50 font-bold border-0 shadow-lg">
                                            Ouvrir la carte
                                        </Button>
                                    </Link>
                                </div>
                            </motion.div>

                            {/* Menu Card */}
                            <motion.div 
                                variants={itemVariants}
                                className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
                            >
                                <div className="p-4 border-b border-slate-50 bg-slate-50/50">
                                    <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wider">Raccourcis</h3>
                                </div>
                                <div className="p-2">
                                    <Link to="/profile">
                                        <Button variant="ghost" className="w-full justify-start h-12 text-slate-600 hover:text-primary hover:bg-slate-50">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center mr-3 text-slate-500">
                                                <TrendingUp className="w-4 h-4" />
                                            </div>
                                            Mon Profil
                                        </Button>
                                    </Link>
                                    <Link to="/history">
                                        <Button variant="ghost" className="w-full justify-start h-12 text-slate-600 hover:text-primary hover:bg-slate-50">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center mr-3 text-slate-500">
                                                <Ticket className="w-4 h-4" />
                                            </div>
                                            Mes Tickets
                                        </Button>
                                    </Link>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default DashboardPage;