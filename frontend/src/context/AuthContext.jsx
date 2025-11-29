import React, { createContext, useState, useEffect } from 'react';
import * as authService from '../services/auth.service';
import { getStableUuid } from '../lib/uuidHelper';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (userStr) {
            try {
                const parsedUser = JSON.parse(userStr);
                // Ensure we have the stable UUID for ticket service interactions
                const userId = parsedUser.id || (parsedUser.user && parsedUser.user.id);
                const enrichedUser = {
                    ...parsedUser,
                    uuid: getStableUuid(userId)
                };
                setUser(enrichedUser);
            } catch (e) {
                console.error("Failed to parse user from local storage", e);
                localStorage.removeItem("user");
            }
        }
        setLoading(false);
    }, []);

    const updateUser = (userData) => {
        // Merge existing user data with new data
        const updatedUser = { ...user, ...userData };
        
        // Handle the structure mismatch (sometimes user is nested in user.user)
        if (updatedUser.user) {
            updatedUser.user = { ...updatedUser.user, ...userData };
        }

        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
    };


    const handleAuthSuccess = (response) => {
        if (response) {
            // Extract the actual user object properties
            // The backend returns { accessToken, refreshToken, user: { id, email... } }
            const userData = response.user || response;
            const uuid = getStableUuid(userData.id);
            
            const enrichedUser = {
                ...response,
                uuid
            };
            
            localStorage.setItem("user", JSON.stringify(enrichedUser));
            localStorage.setItem("accessToken", response.accessToken); // Store token separately if needed for interceptors
            setUser(enrichedUser);
            return enrichedUser;
        }
        return null;
    };

    const login = async (credentials) => {
        const response = await authService.login(credentials);
        return handleAuthSuccess(response);
    };

    const register = async (userData) => {
        const response = await authService.register(userData);
        // Auto-login after registration
        return handleAuthSuccess(response);
    };

    const logout = () => {
        authService.logout();
        setUser(null);
        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading, updateUser }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};