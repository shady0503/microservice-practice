import { AUTH_API_URL } from "../config/api.config";

export const login = async (credentials) => {
    const response = await fetch(`${AUTH_API_URL}/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Login failed");
    }

    return response.json();
};

export const register = async (userData) => {
    const response = await fetch(`${AUTH_API_URL}/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Registration failed");
    }

    return response.json();
};

export const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
};

export const getCurrentUser = () => {
    return JSON.parse(localStorage.getItem("user"));
};
