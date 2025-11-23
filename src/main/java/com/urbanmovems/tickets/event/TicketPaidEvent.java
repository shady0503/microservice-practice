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
public class TicketPaidEvent {
    private UUID ticketId;
    private UUID userId;
    private Long trajetId;
    private String transactionId;
    private Integer amount;
    private String currency;
    private LocalDateTime paidAt;
}