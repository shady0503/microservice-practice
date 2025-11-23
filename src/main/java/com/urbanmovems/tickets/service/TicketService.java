package com.urbanmovems.tickets.service;

import com.urbanmovems.tickets.dto.request.TicketRequest;
import com.urbanmovems.tickets.dto.response.TicketResponse;
import com.urbanmovems.tickets.model.TicketStatus;

import java.util.List;
import java.util.UUID;

public interface TicketService {

    /**
     * Crée un nouveau ticket (réservation)
     */
    TicketResponse createTicket(TicketRequest request, UUID idempotencyKey);

    /**
     * Récupère un ticket par ID
     */
    TicketResponse getTicketById(UUID ticketId);

    /**
     * Liste tous les tickets
     */
    List<TicketResponse> getAllTickets();

    /**
     * Liste les tickets d'un utilisateur
     */
    List<TicketResponse> getTicketsByUserId(UUID userId);

    /**
     * Liste les tickets par statut
     */
    List<TicketResponse> getTicketsByStatus(TicketStatus status);

    /**
     * Liste les tickets d'un trajet
     */
    List<TicketResponse> getTicketsByTrajetId(Long trajetId);

    /**
     * Annule un ticket
     */
    TicketResponse cancelTicket(UUID ticketId);

    /**
     * Marque les tickets expirés
     */
    void markExpiredTickets();
}