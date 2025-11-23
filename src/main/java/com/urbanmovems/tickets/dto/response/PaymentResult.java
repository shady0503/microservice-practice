package com.urbanmovems.tickets.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentResult {

    private String paymentId;
    private String status;
    private UUID ticketId;
    private PriceDTO amount;
    private String message;
    private String transactionId;
}