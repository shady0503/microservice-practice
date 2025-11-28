import { AUTH_API_URL } from "../config/api.config";

export const login = async (credentials) => {
    try {
        const response = await fetch(`${AUTH_API_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(credentials),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || data.error || "Login failed");
        }

        return data;
    } catch (error) {
        throw error;
    }
};

export const register = async (userData) => {
    try {
        const response = await fetch(`${AUTH_API_URL}/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(userData),
        });

        const data = await response.json();

        if (!response.ok) {
            // Handle Spring Boot validation errors (map) or simple error messages
            if (data.status === 400 && typeof data === 'object') {
                 // Convert field errors to a single string if necessary, or pass object
                 throw new Error(Object.values(data).join(', ') || "Registration failed");
            }
            throw new Error(data.message || "Registration failed");
        }

        return data;
    } catch (error) {
        throw error;
    }
};

export const logout = () => {
    localStorage.removeItem("user");
};

export const getCurrentUser = () => {
    const userStr = localStorage.getItem("user");
    if (userStr) return JSON.parse(userStr);
    return null;
};