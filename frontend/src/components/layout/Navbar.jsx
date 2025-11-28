import React, { useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { Button } from "@/components/ui/button";
import { User, LogOut, Ticket, Map, LayoutDashboard } from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const isHomePage = location.pathname === '/';

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const getDisplayName = () => {
        if (!user) return "";
        const u = user.user || user;
        return u.firstName || u.email;
    };

    return (
        <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/60 shadow-sm">
            <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-lg">U</div>
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">UrbanMove</span>
                </Link>

                <div className="flex items-center gap-4">
                    {user ? (
                        isHomePage ? (
                            <Link to="/dashboard"><Button className="gap-2">Go to Dashboard <LayoutDashboard className="w-4 h-4" /></Button></Link>
                        ) : (
                            <>
                                <Link to="/dashboard"><Button variant="ghost" size="sm" className="gap-2"><LayoutDashboard className="w-4 h-4" /> Dashboard</Button></Link>
                                <Link to="/map"><Button variant="ghost" size="sm" className="gap-2"><Map className="w-4 h-4" /> Map</Button></Link>
                                <Link to="/history"><Button variant="ghost" size="sm" className="gap-2"><Ticket className="w-4 h-4" /> Tickets</Button></Link>
                                <Link to="/profile">
                                    <div className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200 cursor-pointer">
                                        <span className="text-sm font-medium text-slate-700 hidden sm:block">{getDisplayName()}</span>
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary"><User className="h-4 w-4" /></div>
                                    </div>
                                </Link>
                                <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-400 hover:text-red-500 hover:bg-red-50"><LogOut className="h-4 w-4" /></Button>
                            </>
                        )
                    ) : (
                        <>
                            <Link to="/login"><Button variant={isHomePage ? "default" : "ghost"} size="sm">Login</Button></Link>
                            {!isHomePage && <Link to="/signup"><Button size="sm" className="rounded-full px-6">Sign Up</Button></Link>}
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;