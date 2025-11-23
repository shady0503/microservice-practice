package com.urbanmovems.tickets.service.impl;

import com.urbanmovems.tickets.dto.request.PaymentRequest;
import com.urbanmovems.tickets.dto.request.PaymentWebhook;
import com.urbanmovems.tickets.dto.response.PaymentResult;
import com.urbanmovems.tickets.dto.response.PriceDTO;
import com.urbanmovems.tickets.event.TicketPaidEvent;
import com.urbanmovems.tickets.exception.TicketNotFoundException;
import com.urbanmovems.tickets.exception.TicketNotPayableException;
import com.urbanmovems.tickets.model.Payment;
import com.urbanmovems.tickets.model.PaymentStatus;
import com.urbanmovems.tickets.model.Ticket;
import com.urbanmovems.tickets.repository.PaymentRepository;
import com.urbanmovems.tickets.repository.TicketRepository;
import com.urbanmovems.tickets.service.EventPublisher;
import com.urbanmovems.tickets.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Random;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class MockPaymentService implements PaymentService {

    private final TicketRepository ticketRepository;
    private final PaymentRepository paymentRepository;
    private final EventPublisher eventPublisher;

    @Value("${payment.mock.enabled:true}")
    private boolean mockEnabled;

    @Value("${payment.mock.webhook-delay-ms:2000}")
    private long webhookDelayMs;

    @Value("${payment.mock.success-rate:0.95}")
    private double successRate;

    private final Random random = new Random();

    @Override
    @Transactional
    public PaymentResult initiatePayment(UUID ticketId, PaymentRequest request, UUID idempotencyKey) {
        log.info("Initiating payment for ticket: {}", ticketId);

        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new TicketNotFoundException("Ticket avec l'ID " + ticketId + " non trouvé"));

        if (!ticket.canBePaid()) {
            throw new TicketNotPayableException(
                    "Le ticket ne peut pas être payé. Statut actuel: " + ticket.getStatus());
        }

        // Créer l'enregistrement de paiement
        Payment payment = Payment.builder()
                .ticketId(ticketId)
                .paymentMethod(request.getPaymentMethod())
                .provider(mockEnabled ? "MOCK" : "STRIPE")
                .status(PaymentStatus.PENDING)
                .amount(ticket.getPrice().getAmount())
                .currency(ticket.getPrice().getCurrency())
                .build();

        Payment savedPayment = paymentRepository.save(payment);
        log.info("Payment record created with ID: {}", savedPayment.getId());

        // Simuler l'appel webhook asynchrone (mock uniquement)
        if (mockEnabled) {
            simulateWebhookAsync(savedPayment.getId().toString(), ticketId);
        }

        return PaymentResult.builder()
                .paymentId(savedPayment.getId().toString())
                .status("PENDING")
                .ticketId(ticketId)
                .amount(PriceDTO.fromPrice(ticket.getPrice()))
                .message("Paiement en cours de traitement")
                .build();
    }

    @Async
    protected void simulateWebhookAsync(String paymentId, UUID ticketId) {
        try {
            // Attendre un délai pour simuler le traitement
            Thread.sleep(webhookDelayMs);

            // Simuler succès/échec basé sur le taux de succès
            boolean success = random.nextDouble() < successRate;

            PaymentWebhook webhook = PaymentWebhook.builder()
                    .paymentId(paymentId)
                    .ticketId(ticketId)
                    .status(success ? "SUCCESS" : "FAILED")
                    .transactionId(success ? "txn_" + UUID.randomUUID().toString().substring(0, 8) : null)
                    .errorCode(success ? null : "INSUFFICIENT_FUNDS")
                    .timestamp(LocalDateTime.now())
                    .build();

            processWebhook(webhook);
        } catch (InterruptedException e) {
            log.error("Error simulating webhook", e);
            Thread.currentThread().interrupt();
        }
    }

    @Override
    @Transactional
    public void processWebhook(PaymentWebhook webhook) {
        log.info("Processing payment webhook for ticket: {}", webhook.getTicketId());

        Ticket ticket = ticketRepository.findById(webhook.getTicketId())
                .orElseThrow(() -> new TicketNotFoundException(
                        "Ticket avec l'ID " + webhook.getTicketId() + " non trouvé"));

        Payment payment = paymentRepository.findById(UUID.fromString(webhook.getPaymentId()))
                .orElseThrow(() -> new RuntimeException("Payment not found: " + webhook.getPaymentId()));

        if ("SUCCESS".equals(webhook.getStatus())) {
            // Paiement réussi
            payment.markAsSuccess(webhook.getTransactionId());
            ticket.markAsPaid();

            ticketRepository.save(ticket);
            paymentRepository.save(payment);

            log.info("Payment successful for ticket: {}", ticket.getId());

            // Publier l'événement
            TicketPaidEvent event = TicketPaidEvent.builder()
                    .ticketId(ticket.getId())
                    .userId(ticket.getUserId())
                    .trajetId(ticket.getTrajetId())
                    .transactionId(webhook.getTransactionId())
                    .amount(ticket.getPrice().getAmount())
                    .currency(ticket.getPrice().getCurrency())
                    .paidAt(ticket.getPaidAt())
                    .build();

            eventPublisher.publishTicketPaid(event);
        } else {
            // Paiement échoué
            payment.markAsFailed(webhook.getErrorCode(), "Payment failed");
            paymentRepository.save(payment);

            log.warn("Payment failed for ticket: {} with error: {}", ticket.getId(), webhook.getErrorCode());
        }
    }
}