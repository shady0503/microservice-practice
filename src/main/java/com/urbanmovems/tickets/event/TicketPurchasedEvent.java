package com.urbanmovems.tickets.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketPurchasedEvent {
    private UUID ticketId;
    private UUID userId;
    private Long trajetId;
    private Integer quantity;
    private Integer priceAmount;
    private String priceCurrency;
    private LocalDateTime purchasedAt;
    private LocalDateTime expiresAt;
}