package com.urbanmovems.tickets.service;

import com.urbanmovems.tickets.dto.request.PaymentRequest;
import com.urbanmovems.tickets.dto.request.PaymentWebhook;
import com.urbanmovems.tickets.dto.response.PaymentResult;

import java.util.UUID;

public interface PaymentService {

    /**
     * Initie un paiement pour un ticket
     */
    PaymentResult initiatePayment(UUID ticketId, PaymentRequest request, UUID idempotencyKey);

    /**
     * Traite un webhook de confirmation de paiement
     */
    void processWebhook(PaymentWebhook webhook);
}