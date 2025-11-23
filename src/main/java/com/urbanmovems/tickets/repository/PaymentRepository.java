package com.urbanmovems.tickets.repository;

import com.urbanmovems.tickets.model.Payment;
import com.urbanmovems.tickets.model.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    /**
     * Trouve tous les paiements d'un ticket
     */
    List<Payment> findByTicketId(UUID ticketId);

    /**
     * Trouve un paiement par transaction ID
     */
    Optional<Payment> findByTransactionId(String transactionId);

    /**
     * Trouve tous les paiements par statut
     */
    List<Payment> findByStatus(PaymentStatus status);

    /**
     * Trouve le dernier paiement d'un ticket
     */
    Optional<Payment> findFirstByTicketIdOrderByCreatedAtDesc(UUID ticketId);
}