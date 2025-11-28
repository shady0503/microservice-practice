import axios from 'axios';
import { API_BASE_URL } from '../config/api.config';

export const getUserTickets = async (userId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/tickets`, {
            params: { userId }
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching user tickets:", error);
        throw error;
    }
};
