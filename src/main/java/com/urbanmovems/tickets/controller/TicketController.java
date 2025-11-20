package com.urbanmovems.tickets.controller;

import com.urbanmovems.tickets.dto.request.TicketRequest;
import com.urbanmovems.tickets.dto.request.PaymentRequest;
import com.urbanmovems.tickets.dto.response.PaymentResult;
import com.urbanmovems.tickets.dto.response.TicketResponse;
import com.urbanmovems.tickets.model.TicketStatus;
import com.urbanmovems.tickets.service.IdempotencyService;
import com.urbanmovems.tickets.service.PaymentService;
import com.urbanmovems.tickets.service.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tickets")
@RequiredArgsConstructor
@Slf4j
public class TicketController {

    private final TicketService ticketService;
    private final PaymentService paymentService;
    private final IdempotencyService idempotencyService;

    @GetMapping
    public ResponseEntity<List<TicketResponse>> getAllTickets(
            @RequestParam(required = false) UUID userId,
            @RequestParam(required = false) TicketStatus status,
            @RequestParam(required = false) Long trajetId) {

        log.debug("GET /api/v1/tickets - userId: {}, status: {}, trajetId: {}", userId, status, trajetId);

        List<TicketResponse> tickets;

        if (userId != null) {
            tickets = ticketService.getTicketsByUserId(userId);
        } else if (status != null) {
            tickets = ticketService.getTicketsByStatus(status);
        } else if (trajetId != null) {
            tickets = ticketService.getTicketsByTrajetId(trajetId);
        } else {
            tickets = ticketService.getAllTickets();
        }

        return ResponseEntity.ok(tickets);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TicketResponse> getTicketById(@PathVariable UUID id) {
        log.debug("GET /api/v1/tickets/{}", id);
        TicketResponse ticket = ticketService.getTicketById(id);
        return ResponseEntity.ok(ticket);
    }

    @PostMapping
    public ResponseEntity<TicketResponse> createTicket(
            @Valid @RequestBody TicketRequest request,
            @RequestHeader("Idempotency-Key") UUID idempotencyKey) {

        log.info("POST /api/v1/tickets - Idempotency-Key: {}", idempotencyKey);

        return idempotencyService.executeIdempotent(
                idempotencyKey,
                "/api/v1/tickets",
                "POST",
                () -> {
                    TicketResponse ticket = ticketService.createTicket(request, idempotencyKey);
                    return ResponseEntity.status(HttpStatus.CREATED).body(ticket);
                });
    }

    @PostMapping("/{id}/pay")
    public ResponseEntity<PaymentResult> payTicket(
            @PathVariable UUID id,
            @Valid @RequestBody PaymentRequest request,
            @RequestHeader("Idempotency-Key") UUID idempotencyKey) {

        log.info("POST /api/v1/tickets/{}/pay - Idempotency-Key: {}", id, idempotencyKey);

        return idempotencyService.executeIdempotent(
                idempotencyKey,
                "/api/v1/tickets/" + id + "/pay",
                "POST",
                () -> {
                    PaymentResult result = paymentService.initiatePayment(id, request, idempotencyKey);
                    return ResponseEntity.ok(result);
                });
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<TicketResponse> cancelTicket(@PathVariable UUID id) {
        log.info("POST /api/v1/tickets/{}/cancel", id);
        TicketResponse ticket = ticketService.cancelTicket(id);
        return ResponseEntity.ok(ticket);
    }
}