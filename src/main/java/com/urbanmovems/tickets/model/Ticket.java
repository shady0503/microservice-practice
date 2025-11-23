package com.urbanmovems.tickets.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "tickets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "trajet_id", nullable = false)
    private Long trajetId;

    @Column(nullable = false)
    private Integer quantity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TicketStatus status;

    @Embedded
    private Price price;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * Marque le ticket comme payé
     */
    public void markAsPaid() {
        this.status = TicketStatus.PAID;
        this.paidAt = LocalDateTime.now();
        this.expiresAt = null; // Plus d'expiration une fois payé
    }

    /**
     * Marque le ticket comme annulé
     */
    public void markAsCancelled() {
        this.status = TicketStatus.CANCELLED;
        this.expiresAt = null;
    }

    /**
     * Marque le ticket comme expiré
     */
    public void markAsExpired() {
        this.status = TicketStatus.EXPIRED;
    }

    /**
     * Vérifie si le ticket peut être payé
     */
    public boolean canBePaid() {
        return status == TicketStatus.RESERVED &&
                (expiresAt == null || expiresAt.isAfter(LocalDateTime.now()));
    }

    /**
     * Vérifie si le ticket peut être annulé
     */
    public boolean canBeCancelled() {
        return status == TicketStatus.RESERVED;
    }

    /**
     * Vérifie si le ticket est expiré
     */
    public boolean isExpired() {
        return status == TicketStatus.RESERVED &&
                expiresAt != null &&
                expiresAt.isBefore(LocalDateTime.now());
    }
}