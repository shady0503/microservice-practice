import createApiClient from './client';
import { API_CONFIG } from '@/config/api.config';
import { v4 as uuidv4 } from 'uuid';

// Install uuid if needed: npm install uuid
// For now, use crypto.randomUUID() as fallback
const generateIdempotencyKey = () => {
  try {
    return uuidv4();
  } catch {
    return crypto.randomUUID();
  }
};

const ticketClient = createApiClient(API_CONFIG.TICKET_SERVICE);

export const ticketService = {
  async createTicket(ticketData) {
    const response = await ticketClient.post('/tickets', ticketData, {
      headers: {
        'Idempotency-Key': generateIdempotencyKey(),
      },
    });
    return response;
  },

  async getTicket(ticketId) {
    const response = await ticketClient.get(`/tickets/${ticketId}`);
    return response;
  },

  async getUserTickets(userId) {
    const response = await ticketClient.get(`/tickets?userId=${userId}`);
    return response;
  },

  async getTicketsByStatus(status) {
    const response = await ticketClient.get(`/tickets?status=${status}`);
    return response;
  },

  async payTicket(ticketId) {
    const response = await ticketClient.post(`/tickets/${ticketId}/pay`, {}, {
      headers: {
        'Idempotency-Key': generateIdempotencyKey(),
      },
    });
    return response;
  },

  async cancelTicket(ticketId) {
    const response = await ticketClient.post(`/tickets/${ticketId}/cancel`);
    return response;
  },
};
