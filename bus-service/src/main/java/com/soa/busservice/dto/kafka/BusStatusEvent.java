package com.soa.busservice.dto.kafka;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Outgoing Kafka event for bus status changes (bus.status.events topic).
 * Notifies other services of bus status transitions.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BusStatusEvent {
    
    private String busId;
    private String oldStatus;
    private String newStatus;
    private LocalDateTime timestamp;
}
