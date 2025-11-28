import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { Button } from "@/components/ui/button";
import { User, LogOut } from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    // Helper to get display name
    const getDisplayName = () => {
        if (!user) return "";
        // Check for UserResponse structure from backend
        if (user.user) {
            return user.user.firstName || user.user.email;
        }
        // Fallback for direct user object
        return user.firstName || user.email;
    };

    return (
        <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
            <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
                <Link to="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                    UrbanMoveMS
                </Link>

                <div className="flex items-center gap-4">
                    {user ? (
                        <>
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <User className="h-4 w-4 text-primary" />
                                </div>
                                <span className="hidden sm:inline-block">
                                    {getDisplayName()}
                                </span>
                            </div>
                            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10">
                                <LogOut className="h-4 w-4" />
                                <span className="hidden sm:inline">Déconnexion</span>
                            </Button>
                        </>
                    ) : (
                        <>
                            <Link to="/login">
                                <Button variant="ghost" size="sm">Se connecter</Button>
                            </Link>
                            <Link to="/signup">
                                <Button size="sm" className="rounded-full">Créer un compte</Button>
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;