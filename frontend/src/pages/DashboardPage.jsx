import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getUserTickets } from '../services/ticket.service';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Map, Ticket, TrendingUp, Leaf, Wallet, ArrowRight, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";

const StatCard = ({ icon: Icon, label, value, color, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all"
    >
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-4`}>
            <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="text-3xl font-bold text-slate-800 mb-1">{value}</div>
        <div className="text-sm text-slate-500 font-medium">{label}</div>
    </motion.div>
);

const RecentTicket = ({ line, date, price, status }) => (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-white hover:shadow-sm transition-all cursor-pointer">
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                {line}
            </div>
            <div>
                <div className="font-bold text-slate-800">Bus Line {line}</div>
                <div className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {date}
                </div>
            </div>
        </div>
        <div className="text-right">
            <div className="font-bold text-slate-800">{price} MAD</div>
            <div className={`text-xs font-bold px-2 py-1 rounded-full ${status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                {status}
            </div>
        </div>
    </div>
);

const DashboardPage = () => {
    const { user } = useContext(AuthContext);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (user?.uuid) {
                try {
                    const data = await getUserTickets(user.uuid);
                    setTickets(data);
                } catch (e) {
                    console.error("Failed to fetch tickets", e);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchData();
    }, [user]);

    // Calculate Stats
    const totalTrips = tickets.length;
    const co2Saved = (totalTrips * 0.4).toFixed(1); // Approx 0.4kg per trip
    const moneySaved = (totalTrips * 25).toFixed(0); // Approx 25 MAD saved vs Taxi

    const stats = [
        { icon: Ticket, label: "Total Trips", value: totalTrips.toString(), color: "bg-blue-500", delay: 0.1 },
        { icon: Leaf, label: "CO2 Saved", value: `${co2Saved} kg`, color: "bg-green-500", delay: 0.2 },
        { icon: Wallet, label: "Money Saved", value: `${moneySaved} MAD`, color: "bg-purple-500", delay: 0.3 },
    ];

    const recentTickets = tickets.slice(0, 3).map(t => {
        const dateStr = t.paidAt || t.createdAt;
        const date = dateStr ? new Date(dateStr) : new Date();

        return {
            line: t.metadata?.lineRef || "Bus",
            date: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
            price: (t.price.amount / 100).toFixed(2),
            status: t.status
        };
    });

    return (
        <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 pt-40">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-20">
                    <div>
                        <motion.h1
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-3xl md:text-4xl font-bold text-slate-900"
                        >
                            Welcome back, <span className="text-primary">{user?.firstName || 'Traveler'}</span>! 👋
                        </motion.h1>
                        <p className="text-slate-500 mt-2">Ready to explore the city today?</p>
                    </div>
                    <Link to="/map">
                        <Button className="h-12 px-8 text-lg rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                            <Map className="w-5 h-5 mr-2" />
                            Browse Buses
                        </Button>
                    </Link>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {stats.map((stat, idx) => (
                        <StatCard key={idx} {...stat} />
                    ))}
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Recent Activity Column */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-primary" />
                                Recent Activity
                            </h2>
                            <Button variant="ghost" className="text-primary hover:bg-primary/5">View All</Button>
                        </div>
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                            {loading ? (
                                <div className="text-center py-8 text-slate-400">Loading activity...</div>
                            ) : recentTickets.length > 0 ? (
                                recentTickets.map((ticket, idx) => (
                                    <RecentTicket key={idx} {...ticket} />
                                ))
                            ) : (
                                <div className="text-center py-8 text-slate-400">No recent activity found.</div>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions / Promo Column */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-slate-800">Quick Actions</h2>
                        <div className="bg-gradient-to-br from-primary to-blue-600 p-6 rounded-3xl shadow-lg text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full" />
                            <div className="relative z-10">
                                <h3 className="text-2xl font-bold mb-2">Plan a new Trip</h3>
                                <p className="text-blue-100 mb-6 text-sm">Find the best routes and save time on your daily commute.</p>
                                <Link to="/map">
                                    <Button variant="secondary" className="w-full bg-white text-primary hover:bg-blue-50 border-0">
                                        Start Planning <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                            <h3 className="font-bold text-slate-800 mb-4">My Account</h3>
                            <div className="space-y-2">
                                <Link to="/profile">
                                    <Button variant="outline" className="w-full justify-start">Profile Settings</Button>
                                </Link>
                                <Link to="/history">
                                    <Button variant="outline" className="w-full justify-start">Ticket History</Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;