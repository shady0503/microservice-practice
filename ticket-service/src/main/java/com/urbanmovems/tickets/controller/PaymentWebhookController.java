package com.urbanmovems.tickets.controller;

import com.urbanmovems.tickets.dto.request.PaymentWebhook;
import com.urbanmovems.tickets.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@Slf4j
public class PaymentWebhookController {

    private final PaymentService paymentService;

    @PostMapping("/webhook")
    public ResponseEntity<Map<String, String>> handleWebhook(@Valid @RequestBody PaymentWebhook webhook) {
        log.info("Received payment webhook for ticket: {}", webhook.getTicketId());

        try {
            paymentService.processWebhook(webhook);
            return ResponseEntity.ok(Map.of("status", "processed"));
        } catch (Exception e) {
            log.error("Error processing webhook", e);
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage()));
        }
    }
}