package com.urbanmovems.tickets.dto.response;

import com.urbanmovems.tickets.model.Ticket;
import com.urbanmovems.tickets.model.TicketStatus;
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
public class TicketResponse {

    private UUID id;
    private UUID userId;
    private Long trajetId;
    private Integer quantity;
    private TicketStatus status;
    private PriceDTO price;
    private LocalDateTime paidAt;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static TicketResponse fromTicket(Ticket ticket) {
        return TicketResponse.builder()
                .id(ticket.getId())
                .userId(ticket.getUserId())
                .trajetId(ticket.getTrajetId())
                .quantity(ticket.getQuantity())
                .status(ticket.getStatus())
                .price(PriceDTO.fromPrice(ticket.getPrice()))
                .paidAt(ticket.getPaidAt())
                .expiresAt(ticket.getExpiresAt())
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt())
                .build();
    }
}