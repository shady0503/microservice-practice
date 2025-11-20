package com.urbanmovems.tickets.service.impl;

import com.urbanmovems.tickets.event.TicketCancelledEvent;
import com.urbanmovems.tickets.event.TicketPaidEvent;
import com.urbanmovems.tickets.event.TicketPurchasedEvent;
import com.urbanmovems.tickets.service.EventPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class KafkaEventPublisher implements EventPublisher {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${kafka.topics.ticket-purchased:ticket.purchased}")
    private String ticketPurchasedTopic;

    @Value("${kafka.topics.ticket-paid:ticket.paid}")
    private String ticketPaidTopic;

    @Value("${kafka.topics.ticket-cancelled:ticket.cancelled}")
    private String ticketCancelledTopic;

    @Value("${kafka.enabled:true}")
    private boolean kafkaEnabled;

    @Override
    public void publishTicketPurchased(TicketPurchasedEvent event) {
        if (!kafkaEnabled) {
            log.debug("Kafka disabled, skipping event publication: {}", event);
            return;
        }

        try {
            kafkaTemplate.send(ticketPurchasedTopic, event.getTicketId().toString(), event);
            log.info("Published TicketPurchasedEvent for ticket: {}", event.getTicketId());
        } catch (Exception e) {
            log.error("Error publishing TicketPurchasedEvent", e);
        }
    }

    @Override
    public void publishTicketPaid(TicketPaidEvent event) {
        if (!kafkaEnabled) {
            log.debug("Kafka disabled, skipping event publication: {}", event);
            return;
        }

        try {
            kafkaTemplate.send(ticketPaidTopic, event.getTicketId().toString(), event);
            log.info("Published TicketPaidEvent for ticket: {}", event.getTicketId());
        } catch (Exception e) {
            log.error("Error publishing TicketPaidEvent", e);
        }
    }

    @Override
    public void publishTicketCancelled(TicketCancelledEvent event) {
        if (!kafkaEnabled) {
            log.debug("Kafka disabled, skipping event publication: {}", event);
            return;
        }

        try {
            kafkaTemplate.send(ticketCancelledTopic, event.getTicketId().toString(), event);
            log.info("Published TicketCancelledEvent for ticket: {}", event.getTicketId());
        } catch (Exception e) {
            log.error("Error publishing TicketCancelledEvent", e);
        }
    }
}