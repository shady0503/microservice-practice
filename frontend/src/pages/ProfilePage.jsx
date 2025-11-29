import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getUserTickets } from '../services/ticket.service';
import { updateUserProfile, changePassword, deleteAccount } from '../services/user.service';
import { 
    User, Mail, Phone, Shield, Edit2, Save, X, Key, Trash2, 
    LogOut, CreditCard, Ticket, AlertTriangle, CheckCircle, Loader2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const ProfilePage = () => {
    const { user, logout, login } = useContext(AuthContext); // Assuming login updates context
    const navigate = useNavigate();
    
    const [activeTab, setActiveTab] = useState('GENERAL'); // GENERAL, SECURITY
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    // Form States
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phoneNumber: '',
        email: ''
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Stats State
    const [stats, setStats] = useState({ tickets: 0, spent: 0 });

    useEffect(() => {
        if (user) {
            const u = user.user || user;
            setFormData({
                firstName: u.firstName || '',
                lastName: u.lastName || '',
                phoneNumber: u.phoneNumber || '',
                email: u.email || ''
            });
            fetchStats(u.uuid || user.uuid);
        }
    }, [user]);

    const fetchStats = async (uuid) => {
        if (!uuid) return;
        try {
            const tickets = await getUserTickets(uuid);
            const paidTickets = tickets.filter(t => t.status === 'PAID');
            setStats({
                tickets: paidTickets.length,
                spent: paidTickets.reduce((acc, t) => acc + (t.price?.amount || 0), 0) / 100
            });
        } catch (e) {
            console.error("Failed to load stats", e);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const userId = (user.user || user).id;
            const updatedUserResponse = await updateUserProfile(userId, { // Catch the response
                firstName: formData.firstName,
                lastName: formData.lastName,
                phoneNumber: formData.phoneNumber
            });
            
            // UPDATE THE CONTEXT HERE
            updateUser(updatedUserResponse); 

            setIsEditing(false);
            setSuccessMsg('Profil mis à jour avec succès !');
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Erreur lors de la mise à jour.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setErrorMsg("Les nouveaux mots de passe ne correspondent pas.");
            setIsLoading(false);
            return;
        }

        try {
            await changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            setSuccessMsg('Mot de passe modifié avec succès.');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Erreur lors du changement de mot de passe.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if(!confirm("Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.")) return;
        
        try {
            const userId = (user.user || user).id;
            await deleteAccount(userId);
            logout();
            navigate('/');
        } catch (err) {
            setErrorMsg("Impossible de supprimer le compte.");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pt-24 pb-12 px-4">
            <div className="container mx-auto max-w-4xl">
                
                {/* Header Profile Card */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-8">
                    <div className="h-32 bg-gradient-to-r from-primary to-blue-600 relative">
                        <div className="absolute -bottom-12 left-8">
                            <div className="w-24 h-24 bg-white rounded-full p-1 shadow-lg">
                                <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-slate-400 text-2xl font-bold">
                                    {(formData.firstName[0] || 'U').toUpperCase()}{(formData.lastName[0] || 'M').toUpperCase()}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="pt-16 pb-6 px-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">{formData.firstName} {formData.lastName}</h1>
                            <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                                <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {formData.email}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> {(user?.user || user)?.role || 'USER'}</span>
                            </div>
                        </div>
                        <div className="flex gap-4 text-center">
                            <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="text-xl font-bold text-primary">{stats.tickets}</div>
                                <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Voyages</div>
                            </div>
                            <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="text-xl font-bold text-emerald-600">{stats.spent} <span className="text-xs">DH</span></div>
                                <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Dépensé</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    <button 
                        onClick={() => setActiveTab('GENERAL')}
                        className={`px-6 py-2.5 rounded-full font-medium text-sm transition-all ${
                            activeTab === 'GENERAL' 
                                ? 'bg-primary text-white shadow-md' 
                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                    >
                        Informations
                    </button>
                    <button 
                        onClick={() => setActiveTab('SECURITY')}
                        className={`px-6 py-2.5 rounded-full font-medium text-sm transition-all ${
                            activeTab === 'SECURITY' 
                                ? 'bg-primary text-white shadow-md' 
                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                    >
                        Sécurité
                    </button>
                </div>

                {/* Messages */}
                <AnimatePresence>
                    {successMsg && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-6 p-4 bg-green-50 text-green-700 rounded-xl border border-green-200 flex items-center gap-3">
                            <CheckCircle className="w-5 h-5" /> {successMsg}
                        </motion.div>
                    )}
                    {errorMsg && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5" /> {errorMsg}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Content Area */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8">
                    
                    {/* --- GENERAL TAB --- */}
                    {activeTab === 'GENERAL' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <User className="w-5 h-5 text-primary" /> Informations Personnelles
                                </h2>
                                {!isEditing ? (
                                    <Button variant="outline" onClick={() => setIsEditing(true)} className="gap-2">
                                        <Edit2 className="w-4 h-4" /> Modifier
                                    </Button>
                                ) : (
                                    <div className="flex gap-2">
                                        <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={isLoading} className="text-slate-500">
                                            <X className="w-4 h-4 mr-2" /> Annuler
                                        </Button>
                                        <Button onClick={handleUpdateProfile} disabled={isLoading} className="gap-2">
                                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Enregistrer
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Prénom</label>
                                    <input 
                                        type="text" 
                                        disabled={!isEditing}
                                        value={formData.firstName}
                                        onChange={e => setFormData({...formData, firstName: e.target.value})}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nom</label>
                                    <input 
                                        type="text" 
                                        disabled={!isEditing}
                                        value={formData.lastName}
                                        onChange={e => setFormData({...formData, lastName: e.target.value})}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                                        <input 
                                            type="email" 
                                            disabled={true} // Email usually not editable directly
                                            value={formData.email}
                                            className="w-full p-3 pl-10 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Téléphone</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                                        <input 
                                            type="tel" 
                                            disabled={!isEditing}
                                            value={formData.phoneNumber}
                                            onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                                            className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* --- SECURITY TAB --- */}
                    {activeTab === 'SECURITY' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div className="mb-8">
                                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
                                    <Key className="w-5 h-5 text-primary" /> Changer le mot de passe
                                </h2>
                                <form onSubmit={handleChangePassword} className="max-w-md space-y-4">
                                    <input 
                                        type="password" 
                                        placeholder="Mot de passe actuel"
                                        value={passwordData.currentPassword}
                                        onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                                        required
                                    />
                                    <input 
                                        type="password" 
                                        placeholder="Nouveau mot de passe"
                                        value={passwordData.newPassword}
                                        onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                                        required
                                    />
                                    <input 
                                        type="password" 
                                        placeholder="Confirmer le nouveau mot de passe"
                                        value={passwordData.confirmPassword}
                                        onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                                        required
                                    />
                                    <Button type="submit" disabled={isLoading} className="w-full">
                                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Mettre à jour le mot de passe'}
                                    </Button>
                                </form>
                            </div>

                            <div className="pt-8 border-t border-slate-200">
                                <h2 className="text-xl font-bold text-red-600 flex items-center gap-2 mb-2">
                                    <AlertTriangle className="w-5 h-5" /> Zone de danger
                                </h2>
                                <p className="text-sm text-slate-500 mb-4">
                                    La suppression de votre compte est irréversible. Toutes vos données, y compris l'historique de vos billets, seront effacées.
                                </p>
                                <Button variant="destructive" onClick={handleDeleteAccount} className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 shadow-none">
                                    <Trash2 className="w-4 h-4 mr-2" /> Supprimer mon compte
                                </Button>
                            </div>
                        </motion.div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default ProfilePage;