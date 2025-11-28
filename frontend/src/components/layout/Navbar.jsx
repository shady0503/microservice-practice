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
                                <User className="h-4 w-4" />
                                <span>{user.username || user.email}</span>
                            </div>
                            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
                                <LogOut className="h-4 w-4" />
                                Logout
                            </Button>
                        </>
                    ) : (
                        <>
                            <Link to="/login">
                                <Button variant="ghost" size="sm">Login</Button>
                            </Link>
                            <Link to="/signup">
                                <Button size="sm" className="rounded-full">Sign Up</Button>
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
