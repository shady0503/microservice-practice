import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketService } from '@/services/api/ticket.service';

export function useCreateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ticketData) => ticketService.createTicket(ticketData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
}

export function usePayTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ticketId) => ticketService.payTicket(ticketId),
    onSuccess: (_, ticketId) => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
}

export function useCancelTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ticketId) => ticketService.cancelTicket(ticketId),
    onSuccess: (_, ticketId) => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
}

export function useTicketById(ticketId) {
  return useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: () => ticketService.getTicket(ticketId),
    enabled: !!ticketId,
    refetchInterval: 10000, // Refetch every 10 seconds for real-time updates
  });
}

export function useUserTickets(userId) {
  return useQuery({
    queryKey: ['tickets', 'user', userId],
    queryFn: () => ticketService.getUserTickets(userId),
    enabled: !!userId,
  });
}

export function useTicketsByStatus(status) {
  return useQuery({
    queryKey: ['tickets', 'status', status],
    queryFn: () => ticketService.getTicketsByStatus(status),
    enabled: !!status,
  });
}
