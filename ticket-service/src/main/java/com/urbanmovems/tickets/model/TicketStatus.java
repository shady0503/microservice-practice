package com.urbanmovems.tickets.model;

public enum TicketStatus {
    RESERVED,   // Réservé, en attente de paiement
    PAID,       // Payé, valide pour voyager
    USED,       // Scanné/Validé à bord (Non remboursable)
    CANCELLED,  // Annulé
    EXPIRED     // Expiré
}