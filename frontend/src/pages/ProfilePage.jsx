import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { User, Mail, Phone, Shield } from 'lucide-react';

const ProfilePage = () => {
    const { user } = useContext(AuthContext);
    const userData = user?.user || user;

    return (
        <div className="min-h-screen bg-slate-50 pt-24 pb-12 px-4">
            <div className="container mx-auto max-w-2xl">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="h-32 bg-gradient-to-r from-primary to-blue-600 relative">
                        <div className="absolute -bottom-12 left-8">
                            <div className="w-24 h-24 bg-white rounded-full p-1 shadow-lg">
                                <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                                    <User className="w-12 h-12" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="pt-16 pb-8 px-8">
                        <h1 className="text-2xl font-bold text-slate-800">{userData?.firstName} {userData?.lastName}</h1>
                        <span className="text-slate-500 flex items-center gap-1 mt-1">
                            <Shield className="w-3 h-3" /> {userData?.role || 'User'}
                        </span>
                        <div className="mt-8 space-y-6">
                            <div className="grid gap-1">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email</label>
                                <div className="flex items-center gap-3 text-slate-700 font-medium bg-slate-50 p-3 rounded-lg">
                                    <Mail className="w-5 h-5 text-primary opacity-70" />
                                    {userData?.email}
                                </div>
                            </div>
                            <div className="grid gap-1">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phone</label>
                                <div className="flex items-center gap-3 text-slate-700 font-medium bg-slate-50 p-3 rounded-lg">
                                    <Phone className="w-5 h-5 text-primary opacity-70" />
                                    {userData?.phoneNumber || "Not provided"}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;