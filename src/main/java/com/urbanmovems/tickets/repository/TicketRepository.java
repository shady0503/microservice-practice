package com.urbanmovems.tickets.repository;

import com.urbanmovems.tickets.model.Ticket;
import com.urbanmovems.tickets.model.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, UUID> {

    /**
     * Trouve tous les tickets d'un utilisateur
     */
    List<Ticket> findByUserId(UUID userId);

    /**
     * Trouve tous les tickets d'un trajet
     */
    List<Ticket> findByTrajetId(Long trajetId);

    /**
     * Trouve tous les tickets par statut
     */
    List<Ticket> findByStatus(TicketStatus status);

    /**
     * Trouve tous les tickets d'un utilisateur avec un statut spécifique
     */
    List<Ticket> findByUserIdAndStatus(UUID userId, TicketStatus status);

    /**
     * Trouve tous les tickets expirés à traiter
     */
    @Query("SELECT t FROM Ticket t WHERE t.status = 'RESERVED' AND t.expiresAt < :now")
    List<Ticket> findExpiredTickets(@Param("now") LocalDateTime now);

    /**
     * Compte le nombre de tickets réservés/payés pour un trajet
     */
    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.trajetId = :trajetId AND t.status IN ('RESERVED', 'PAID')")
    Long countActiveTicketsByTrajet(@Param("trajetId") Long trajetId);
}