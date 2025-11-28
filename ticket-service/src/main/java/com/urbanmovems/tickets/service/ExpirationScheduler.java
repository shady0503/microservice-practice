package com.urbanmovems.tickets.service;

import com.urbanmovems.tickets.service.IdempotencyService;
import com.urbanmovems.tickets.service.TicketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ExpirationScheduler {

    private final TicketService ticketService;
    private final IdempotencyService idempotencyService;

    /**
     * Marque les tickets expirés toutes les 5 minutes
     */
    @Scheduled(fixedDelay = 300000) // 5 minutes
    public void markExpiredTickets() {
        log.info("Running scheduled task: mark expired tickets");
        try {
            ticketService.markExpiredTickets();
        } catch (Exception e) {
            log.error("Error marking expired tickets", e);
        }
    }

    /**
     * Nettoie les enregistrements d'idempotence expirés toutes les heures
     */
    @Scheduled(fixedDelay = 3600000) // 1 heure
    public void cleanupIdempotencyRecords() {
        log.info("Running scheduled task: cleanup idempotency records");
        try {
            idempotencyService.cleanupExpiredRecords();
        } catch (Exception e) {
            log.error("Error cleaning up idempotency records", e);
        }
    }
}