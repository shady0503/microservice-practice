import React, { createContext, useState, useEffect } from 'react';
import * as authService from '../services/auth.service';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
            setUser(currentUser);
        }
        setLoading(false);
    }, []);

    const login = async (credentials) => {
        const response = await authService.login(credentials);
        if (response) {
            localStorage.setItem("user", JSON.stringify(response));
            // Assuming response contains token, if it's separate, handle it.
            // For now, assuming response is the user object or contains token + user
            // If response has token: localStorage.setItem("token", response.token);
            setUser(response);
        }
        return response;
    };

    const register = async (userData) => {
        return await authService.register(userData);
    };

    const logout = () => {
        authService.logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
