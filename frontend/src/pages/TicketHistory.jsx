import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../config/api.config';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const TicketHistory = () => {
    const { user } = useContext(AuthContext);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const fetchTickets = async () => {
            try {
                // Assuming the API endpoint allows filtering by user ID in query params
                const res = await axios.get(`${API_BASE_URL}/tickets`, {
                    params: { userId: user.id } 
                });
                setTickets(res.data);
            } catch (e) {
                console.error("Failed to load tickets", e);
            } finally {
                setLoading(false);
            }
        };
        fetchTickets();
    }, [user]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'PAID': return 'bg-green-100 text-green-700 border-green-200';
            case 'RESERVED': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'CANCELLED': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    if (loading) return <div className="p-8 text-center">Loading history...</div>;

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <h1 className="text-2xl font-bold mb-6 text-slate-800">My Tickets</h1>
            <div className="grid gap-4">
                {tickets.length === 0 ? (
                    <p className="text-slate-500">No tickets found.</p>
                ) : (
                    tickets.map(ticket => (
                        <div key={ticket.id} className="bg-white p-4 rounded-lg shadow-sm border flex justify-between items-center">
                            <div>
                                <div className="text-xs text-slate-400 mb-1">ID: {ticket.id}</div>
                                <div className="font-semibold text-lg">
                                    {ticket.price?.amount / 100} {ticket.price?.currency} 
                                    <span className="text-slate-400 font-normal text-sm ml-2">x{ticket.quantity}</span>
                                </div>
                                <div className="text-sm text-slate-500 mt-1">
                                    {new Date(ticket.createdAt).toLocaleString()}
                                </div>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(ticket.status)}`}>
                                {ticket.status}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default TicketHistory;