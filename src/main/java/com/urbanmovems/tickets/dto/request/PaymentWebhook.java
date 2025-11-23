package com.urbanmovems.tickets.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class PaymentWebhook {

    @NotBlank(message = "L'ID de paiement ne peut pas être vide")
    private String paymentId;

    @NotNull(message = "L'ID du ticket ne peut pas être nul")
    private UUID ticketId;

    @NotBlank(message = "Le statut ne peut pas être vide")
    private String status; // SUCCESS ou FAILED

    private String transactionId;
    private String errorCode;
    private LocalDateTime timestamp;
}