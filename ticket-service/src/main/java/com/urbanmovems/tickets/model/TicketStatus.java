package com.urbanmovems.tickets.model;

public enum TicketStatus {
    RESERVED,   // Ticket réservé, en attente de paiement
    PAID,       // Ticket payé et confirmé
    CANCELLED,  // Ticket annulé par l'utilisateur
    EXPIRED     // Ticket réservé mais non payé dans le délai
}