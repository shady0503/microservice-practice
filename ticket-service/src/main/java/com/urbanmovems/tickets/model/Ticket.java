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
    
    @Column(name = "scanned_at")
    private LocalDateTime scannedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public void markAsPaid() {
        this.status = TicketStatus.PAID;
        this.paidAt = LocalDateTime.now();
        this.expiresAt = null;
    }

    public void markAsCancelled() {
        this.status = TicketStatus.CANCELLED;
        this.expiresAt = null;
    }

    public void markAsExpired() {
        this.status = TicketStatus.EXPIRED;
    }
    
    public void markAsScanned() {
        if (this.status != TicketStatus.PAID) {
            throw new IllegalStateException("Ticket invalide pour le scan (Statut: " + this.status + ")");
        }
        this.status = TicketStatus.USED;
        this.scannedAt = LocalDateTime.now();
    }

    public boolean canBePaid() {
        return status == TicketStatus.RESERVED &&
                (expiresAt == null || expiresAt.isAfter(LocalDateTime.now()));
    }

    public boolean canBeCancelled() {
        // Impossible to cancel if already USED (Scanned) or EXPIRED
        boolean isPayableOrPaid = (status == TicketStatus.RESERVED || status == TicketStatus.PAID);
        boolean isNotExpired = (expiresAt == null || expiresAt.isAfter(LocalDateTime.now()));
        return isPayableOrPaid && isNotExpired;
    }
    
    public boolean isExpired() {
        return status == TicketStatus.RESERVED &&
                expiresAt != null &&
                expiresAt.isBefore(LocalDateTime.now());
    }
}