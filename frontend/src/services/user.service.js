import axios from 'axios';
import { USER_API_URL } from '../config/api.config';

const getAuthHeader = () => {
    const token = localStorage.getItem('accessToken');
    return { headers: { Authorization: `Bearer ${token}` } };
};

export const getUserProfile = async () => {
    try {
        const response = await axios.get(`${USER_API_URL}/me`, getAuthHeader());
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const updateUserProfile = async (userId, data) => {
    try {
        const response = await axios.put(`${USER_API_URL}/${userId}`, data, getAuthHeader());
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const changePassword = async (data) => {
    try {
        await axios.post(`${USER_API_URL}/change-password`, data, getAuthHeader());
    } catch (error) {
        throw error;
    }
};

export const deleteAccount = async (userId) => {
    try {
        await axios.delete(`${USER_API_URL}/${userId}`, getAuthHeader());
    } catch (error) {
        throw error;
    }
};