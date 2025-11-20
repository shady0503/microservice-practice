package com.urbanmovems.tickets.service;

import com.urbanmovems.tickets.event.TicketCancelledEvent;
import com.urbanmovems.tickets.event.TicketPaidEvent;
import com.urbanmovems.tickets.event.TicketPurchasedEvent;

public interface EventPublisher {

    /**
     * Publie un événement d'achat de ticket
     */
    void publishTicketPurchased(TicketPurchasedEvent event);

    /**
     * Publie un événement de paiement de ticket
     */
    void publishTicketPaid(TicketPaidEvent event);

    /**
     * Publie un événement d'annulation de ticket
     */
    void publishTicketCancelled(TicketCancelledEvent event);
}